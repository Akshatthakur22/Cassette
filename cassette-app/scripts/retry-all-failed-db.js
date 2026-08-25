#!/usr/bin/env node

/**
 * Retry All Failed Songs (Database Direct)
 * Resets all FAILED assets to PENDING status directly in database
 * Triggers worker for each batch
 * Does not require API endpoint to be available
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function triggerWorker() {
  const baseUrl = "https://cassette-share.vercel.app";
  const url = `${baseUrl}/api/media-worker/process`;
  const secret = process.env.MEDIA_WORKER_SECRET || "";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-worker-secret": secret,
      },
      body: JSON.stringify({
        trigger: "retry_batch",
      }),
    });

    return {
      ok: response.ok,
      status: response.status,
      text: await response.text(),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
    };
  }
}

async function main() {
  console.log("=".repeat(80));
  console.log("RETRY ALL FAILED SONGS (DIRECT DATABASE)");
  console.log("=".repeat(80));
  console.log(`Started: ${new Date().toISOString()}\n`);

  try {
    const maxRetries = parseInt(process.env.MAX_RETRIES || "5", 10);

    // Get all retryable failed assets
    console.log("📝 Step 1: Finding all retryable FAILED assets...");
    console.log("-".repeat(80));

    const retryable = await prisma.mediaAsset.findMany({
      where: {
        status: "FAILED",
        attemptCount: { lt: maxRetries },
      },
      select: {
        id: true,
        title: true,
        providerTrackId: true,
        error: true,
        attemptCount: true,
      },
      orderBy: [{ attemptCount: "asc" }, { createdAt: "asc" }],
    });

    console.log(`Found ${retryable.length} retryable failed assets\n`);

    if (retryable.length === 0) {
      console.log("✅ No failed assets to retry!");
      await prisma.$disconnect();
      return;
    }

    // Group by error
    const errorGroups = {};
    retryable.forEach((asset) => {
      const error = asset.error || "Unknown";
      if (!errorGroups[error]) {
        errorGroups[error] = [];
      }
      errorGroups[error].push(asset);
    });

    console.log("Failures grouped by error:");
    Object.entries(errorGroups).forEach(([error, assets]) => {
      console.log(`  ${error}: ${assets.length} songs`);
      assets.slice(0, 2).forEach((asset) => {
        console.log(`    - "${asset.title.substring(0, 50)}" (attempts: ${asset.attemptCount})`);
      });
      if (assets.length > 2) {
        console.log(`    ... and ${assets.length - 2} more`);
      }
    });

    console.log("\n📝 Step 2: Resetting all failed assets to PENDING...");
    console.log("-".repeat(80));

    // Reset all to PENDING
    const updateResult = await prisma.mediaAsset.updateMany({
      where: {
        status: "FAILED",
        attemptCount: { lt: maxRetries },
      },
      data: {
        status: "PENDING",
        error: null,
        errorDetails: null,
      },
    });

    console.log(`✓ Reset ${updateResult.count} assets to PENDING\n`);

    console.log("📝 Step 3: Triggering worker to process retried assets...");
    console.log("-".repeat(80));

    const triggerResult = await triggerWorker();
    console.log(`Worker endpoint: https://cassette-share.vercel.app/api/media-worker/process`);
    console.log(`Status: ${triggerResult.status}`);
    console.log(`Response: ${triggerResult.text}`);

    if (triggerResult.ok) {
      console.log(`✓ Worker trigger successful\n`);
    } else {
      console.log(
        `⚠️  Worker trigger returned non-200 status\n` +
        `   Assets have been reset to PENDING\n` +
        `   Worker will pick them up in next polling cycle\n`
      );
    }

    console.log("📝 Step 4: Waiting for worker to process...");
    console.log("-".repeat(80));
    console.log(
      "This may take several minutes. Waiting for status changes...\n"
    );

    // Poll for completion
    const startTime = Date.now();
    const maxWaitMs = 5 * 60 * 1000; // 5 minutes
    const pollIntervalMs = 10000; // 10 seconds

    let processedCount = 0;
    let readyCount = 0;
    let failedCount = 0;

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

      const stats = await prisma.mediaAsset.groupBy({
        by: ["status"],
        where: {
          id: { in: retryable.map((a) => a.id) },
        },
        _count: true,
      });

      const statusMap = {};
      stats.forEach((s) => {
        statusMap[s.status] = s._count;
      });

      const newReady = statusMap["READY"] || 0;
      const newFailed = statusMap["FAILED"] || 0;
      const newProcessing =
        (statusMap["VALIDATING"] || 0) +
        (statusMap["DOWNLOADING"] || 0) +
        (statusMap["CONVERTING"] || 0) +
        (statusMap["UPLOADING"] || 0);
      const newPending = statusMap["PENDING"] || 0;

      const elapsed = Math.round((Date.now() - startTime) / 1000);

      if (newReady > readyCount || newFailed > failedCount) {
        console.log(`[${elapsed}s] Ready: ${newReady}, Failed: ${newFailed}, Processing: ${newProcessing}, Pending: ${newPending}`);
        readyCount = newReady;
        failedCount = newFailed;
      }

      // Terminal condition: all done (no more pending or processing)
      if (newPending + newProcessing === 0) {
        break;
      }
    }

    console.log("\n📊 Final Results");
    console.log("-".repeat(80));

    const finalStats = await prisma.mediaAsset.groupBy({
      by: ["status"],
      where: {
        id: { in: retryable.map((a) => a.id) },
      },
      _count: true,
    });

    const finalMap = {};
    finalStats.forEach((s) => {
      finalMap[s.status] = s._count;
    });

    const finalReady = finalMap["READY"] || 0;
    const finalFailed = finalMap["FAILED"] || 0;
    const finalProcessing =
      (finalMap["VALIDATING"] || 0) +
      (finalMap["DOWNLOADING"] || 0) +
      (finalMap["CONVERTING"] || 0) +
      (finalMap["UPLOADING"] || 0);
    const finalPending = finalMap["PENDING"] || 0;

    console.log(`Total retried: ${retryable.length}`);
    console.log(`✅ Now READY: ${finalReady}`);
    console.log(`❌ Still FAILED: ${finalFailed}`);
    console.log(`⏳ Still processing: ${finalProcessing}`);
    console.log(`⏸️  Still pending: ${finalPending}`);

    if (finalFailed > 0) {
      console.log("\n❌ Songs that still failed:");
      const stillFailed = await prisma.mediaAsset.findMany({
        where: {
          id: { in: retryable.map((a) => a.id) },
          status: "FAILED",
        },
        select: {
          title: true,
          error: true,
          attemptCount: true,
        },
      });

      stillFailed.forEach((asset) => {
        console.log(`  - "${asset.title.substring(0, 50)}"`);
        console.log(`    Error: ${asset.error}`);
        console.log(`    Attempts: ${asset.attemptCount}`);
      });
    }

    console.log("\n" + "=".repeat(80));
    console.log(`✅ Retry batch complete at ${new Date().toISOString()}`);
    console.log(`   ${finalReady} songs now ready, ${finalFailed} still failing`);
    console.log("=".repeat(80));

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Error:", error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
