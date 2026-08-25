#!/usr/bin/env node

/**
 * Retry All Failed Songs Script
 * Fetches all retryable FAILED assets and retries them via the retry endpoint
 * Used to recover from previous failures (e.g., yt-dlp issues)
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("=".repeat(80));
  console.log("RETRY ALL FAILED SONGS");
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
        nextAttemptAt: true,
      },
      orderBy: [{ attemptCount: "asc" }, { createdAt: "asc" }],
    });

    console.log(`Found ${retryable.length} retryable failed assets\n`);

    if (retryable.length === 0) {
      console.log("✅ No failed assets to retry!");
      await prisma.$disconnect();
      return;
    }

    // Group by error to see failure patterns
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
        console.log(`    - "${asset.title}" (attempts: ${asset.attemptCount})`);
      });
      if (assets.length > 2) {
        console.log(`    ... and ${assets.length - 2} more`);
      }
    });

    console.log("\n📝 Step 2: Retrying all failed assets...");
    console.log("-".repeat(80));

    const baseUrl = "https://cassette-share.vercel.app";
    const retryEndpoint = `${baseUrl}/api/media-assets/retry`;

    let successCount = 0;
    let failureCount = 0;
    const results = [];

    for (let i = 0; i < retryable.length; i++) {
      const asset = retryable[i];
      const progress = `[${i + 1}/${retryable.length}]`;

      try {
        const response = await fetch(retryEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mediaAssetId: asset.id,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          successCount++;
          console.log(
            `${progress} ✓ "${asset.title.substring(0, 40)}" retried (attempt ${asset.attemptCount + 1})`
          );
          results.push({
            id: asset.id,
            status: "retried",
            title: asset.title,
          });
        } else {
          failureCount++;
          console.log(
            `${progress} ✗ Failed to retry: ${result.error || "Unknown error"}`
          );
          results.push({
            id: asset.id,
            status: "retry_failed",
            title: asset.title,
            error: result.error,
          });
        }
      } catch (error) {
        failureCount++;
        console.log(`${progress} ✗ Error: ${error.message}`);
        results.push({
          id: asset.id,
          status: "error",
          title: asset.title,
          error: error.message,
        });
      }

      // Rate limiting - be nice to the server
      if (i < retryable.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log("\n📊 Step 3: Summary");
    console.log("-".repeat(80));

    console.log(`Total assets: ${retryable.length}`);
    console.log(`Successfully retried: ${successCount}`);
    console.log(`Retry endpoint errors: ${failureCount}`);
    console.log(`Success rate: ${((successCount / retryable.length) * 100).toFixed(1)}%`);

    // Show what to expect
    console.log("\n⏳ Next steps:");
    console.log("  1. Worker will process retried assets in background");
    console.log("  2. Each song typically takes 1-5 minutes to complete");
    console.log("  3. Run the analysis script to see final results:");
    console.log("     node scripts/analyze-media-assets.js");

    console.log("\n" + "=".repeat(80));
    console.log(`✅ Retry batch complete at ${new Date().toISOString()}`);
    console.log("=".repeat(80));

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Error:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
