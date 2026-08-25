#!/usr/bin/env node

/**
 * Media Asset Analysis Script (JavaScript)
 * Analyzes the status distribution of all MediaAssets in the database
 * Used for end-to-end verification of the YouTube-to-R2 pipeline
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("=".repeat(80));
  console.log("CASSETTE MEDIA ASSET ANALYSIS REPORT");
  console.log("=".repeat(80));
  console.log(`Generated: ${new Date().toISOString()}\n`);

  try {
    // Get total count
    const totalCount = await prisma.mediaAsset.count();
    console.log(`📊 TOTAL MEDIA ASSETS: ${totalCount}\n`);

    // Get status distribution
    console.log("1️⃣  STATUS DISTRIBUTION");
    console.log("-".repeat(80));

    const statuses = [
      "PENDING",
      "VALIDATING",
      "DOWNLOADING",
      "CONVERTING",
      "UPLOADING",
      "READY",
      "FAILED",
      "EXPIRED",
    ];
    const statusCounts = [];

    for (const status of statuses) {
      const count = await prisma.mediaAsset.count({
        where: { status },
      });
      statusCounts.push({
        status,
        count,
        percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
      });
    }

    // Sort by count descending
    statusCounts.sort((a, b) => b.count - a.count);

    statusCounts.forEach((sc) => {
      const bar = "█".repeat(
        Math.round((sc.count / Math.max(1, totalCount)) * 40)
      );
      console.log(
        `${sc.status.padEnd(12)} │ ${String(sc.count).padStart(4)} │ ${String(
          sc.percentage
        ).padStart(3)}% │ ${bar}`
      );
    });

    console.log("\n2️⃣  READY (SUCCESSFULLY UPLOADED TO R2)");
    console.log("-".repeat(80));

    const readyAssets = await prisma.mediaAsset.findMany({
      where: { status: "READY" },
      select: {
        id: true,
        title: true,
        providerTrackId: true,
        storageKey: true,
        fileSize: true,
        bitrate: true,
        processedAt: true,
      },
      orderBy: { processedAt: "desc" },
    });

    console.log(`Found ${readyAssets.length} successfully processed assets:\n`);
    readyAssets.forEach((asset, idx) => {
      const sizeKB = asset.fileSize ? Math.round(asset.fileSize / 1024) : 0;
      console.log(`${String(idx + 1).padStart(2)}. [${asset.id}]`);
      console.log(`    Title: ${asset.title}`);
      console.log(`    Video ID: ${asset.providerTrackId}`);
      console.log(
        `    Storage: ${asset.storageKey || "N/A"} (${sizeKB}KB)`
      );
      console.log(
        `    Completed: ${
          asset.processedAt
            ? new Date(asset.processedAt).toISOString()
            : "N/A"
        }`
      );
      console.log("");
    });

    console.log("\n3️⃣  FAILED ASSETS ANALYSIS");
    console.log("-".repeat(80));

    const failedAssets = await prisma.mediaAsset.findMany({
      where: { status: "FAILED" },
      select: {
        id: true,
        title: true,
        providerTrackId: true,
        error: true,
        errorDetails: true,
        attemptCount: true,
        nextAttemptAt: true,
      },
      orderBy: { attemptCount: "desc" },
    });

    console.log(`Found ${failedAssets.length} failed assets:\n`);

    // Group by error message
    const errorGroups = {};

    failedAssets.forEach((asset) => {
      const error = asset.error || "Unknown error";
      if (!errorGroups[error]) {
        errorGroups[error] = {
          error,
          count: 0,
          examples: [],
        };
      }
      errorGroups[error].count += 1;
      if (errorGroups[error].examples.length < 3) {
        errorGroups[error].examples.push({
          id: asset.id,
          title: asset.title,
          videoId: asset.providerTrackId,
          attemptCount: asset.attemptCount,
        });
      }
    });

    // Sort by count
    const sortedErrors = Object.values(errorGroups).sort(
      (a, b) => b.count - a.count
    );

    sortedErrors.forEach((group, idx) => {
      console.log(
        `${String(idx + 1).padStart(2)}. [${group.count} assets] ${group.error}`
      );
      group.examples.forEach((ex) => {
        console.log(
          `    - "${ex.title}" (${ex.videoId}, attempts: ${ex.attemptCount})`
        );
      });
      console.log("");
    });

    console.log("\n4️⃣  PENDING / IN-PROGRESS ASSETS");
    console.log("-".repeat(80));

    const processingStatuses = [
      "PENDING",
      "VALIDATING",
      "DOWNLOADING",
      "CONVERTING",
      "UPLOADING",
    ];
    const processingAssets = await prisma.mediaAsset.findMany({
      where: {
        status: { in: processingStatuses },
      },
      select: {
        id: true,
        status: true,
        title: true,
        providerTrackId: true,
        attemptCount: true,
        lastAttemptAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    console.log(`Found ${processingAssets.length} in-progress assets:\n`);

    if (processingAssets.length > 0) {
      processingAssets.slice(0, 10).forEach((asset, idx) => {
        const lastAttempt = asset.lastAttemptAt
          ? new Date(asset.lastAttemptAt).toISOString()
          : "Never";
        console.log(
          `${String(idx + 1).padStart(2)}. [${asset.status}] "${asset.title}"`
        );
        console.log(
          `    ID: ${asset.id} | Video: ${asset.providerTrackId} | Attempts: ${asset.attemptCount}`
        );
        console.log(`    Last attempt: ${lastAttempt}`);
      });
      if (processingAssets.length > 10) {
        console.log(`\n    ... and ${processingAssets.length - 10} more`);
      }
    }

    console.log("\n5️⃣  DATABASE INTEGRITY CHECKS");
    console.log("-".repeat(80));

    // Check for orphaned records (READY but no storageKey)
    const orphanedReady = await prisma.mediaAsset.count({
      where: {
        status: "READY",
        storageKey: null,
      },
    });

    console.log(
      `✓ Orphaned READY records (status READY but no storageKey): ${orphanedReady}`
    );

    // Check for records in conversion but stale (>30 minutes)
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    const staleValidating = await prisma.mediaAsset.count({
      where: {
        status: "VALIDATING",
        lastAttemptAt: { lt: thirtyMinutesAgo },
      },
    });

    console.log(
      `✓ Stale VALIDATING records (>30 min old): ${staleValidating}`
    );

    // Check for missing R2 files for READY status
    const readyWithoutStorage = await prisma.mediaAsset.count({
      where: {
        status: "READY",
        OR: [{ storageKey: null }, { storageKey: "" }],
      },
    });

    console.log(`✓ READY records without R2 storage key: ${readyWithoutStorage}`);

    console.log("\n6️⃣  SUMMARY STATISTICS");
    console.log("-".repeat(80));

    const successRate =
      totalCount > 0 ? Math.round((readyAssets.length / totalCount) * 100) : 0;
    const failureRate = totalCount > 0 ? 100 - successRate : 0;

    console.log(
      `✓ Success Rate: ${successRate}% (${readyAssets.length}/${totalCount} ready)`
    );
    console.log(
      `✓ Failure Rate: ${failureRate}% (${failedAssets.length}/${totalCount} failed)`
    );
    console.log(
      `✓ Processing Rate: ${processingAssets.length} assets in-progress`
    );
    console.log(
      `✓ Retry Eligible: ${
        failedAssets.filter((a) => a.attemptCount < 5).length
      } FAILED assets can be retried`
    );

    const avgAttempts =
      totalCount > 0
        ? (
            await prisma.mediaAsset.aggregate({
              _avg: { attemptCount: true },
            })
          )._avg.attemptCount || 0
        : 0;

    console.log(`✓ Average Attempts per Asset: ${avgAttempts.toFixed(1)}`);

    console.log("\n" + "=".repeat(80));
    console.log("END OF REPORT");
    console.log("=".repeat(80));

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Error during analysis:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
