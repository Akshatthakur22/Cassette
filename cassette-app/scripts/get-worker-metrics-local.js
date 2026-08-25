#!/usr/bin/env node

/**
 * Get Worker Pipeline Metrics (Local)
 * Directly queries database for metrics without needing API
 * Usage: node scripts/get-worker-metrics-local.js [period]
 * 
 * Periods: 1h, 24h (default), 7d, all
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function calculateMetrics(periodMs) {
  const now = new Date();
  const periodStart = new Date(now.getTime() - periodMs);

  // Get all assets in period
  const assets = await prisma.mediaAsset.findMany({
    where: {
      createdAt: {
        gte: periodStart,
      },
    },
    select: {
      id: true,
      status: true,
      error: true,
      attemptCount: true,
      fileSize: true,
      createdAt: true,
      processedAt: true,
      title: true,
    },
  });

  const totalAssets = assets.length;
  const ready = assets.filter((a) => a.status === "READY").length;
  const failed = assets.filter((a) => a.status === "FAILED").length;
  const processing = assets.filter(
    (a) =>
      ["VALIDATING", "DOWNLOADING", "CONVERTING", "UPLOADING"].includes(
        a.status
      )
  ).length;
  const pending = assets.filter((a) => a.status === "PENDING").length;

  const successRate =
    totalAssets > 0 ? Math.round((ready / totalAssets) * 100) : 0;
  const failureRate =
    totalAssets > 0 ? Math.round((failed / totalAssets) * 100) : 0;

  // Calculate timings
  const successfulAssets = assets.filter((a) => a.status === "READY");
  const failedAssets = assets.filter((a) => a.status === "FAILED");

  let avgTimeToReady = 0;
  let avgTimeToFailure = 0;
  let fastest = 0;
  let slowest = 0;

  if (successfulAssets.length > 0) {
    const times = successfulAssets
      .map((a) => {
        if (!a.processedAt || !a.createdAt) return 0;
        return a.processedAt.getTime() - a.createdAt.getTime();
      })
      .filter((t) => t > 0);

    if (times.length > 0) {
      avgTimeToReady = Math.round(times.reduce((a, b) => a + b) / times.length / 1000);
      fastest = Math.min(...times) / 1000;
      slowest = Math.max(...times) / 1000;
    }
  }

  if (failedAssets.length > 0) {
    const times = failedAssets
      .map((a) => {
        if (!a.processedAt || !a.createdAt) return 0;
        return a.processedAt.getTime() - a.createdAt.getTime();
      })
      .filter((t) => t > 0);

    if (times.length > 0) {
      avgTimeToFailure = Math.round(times.reduce((a, b) => a + b) / times.length / 1000);
    }
  }

  // Error patterns
  const errorMap = {};
  failedAssets.forEach((a) => {
    const error = a.error || "Unknown error";
    if (!errorMap[error]) {
      errorMap[error] = { count: 0, examples: [] };
    }
    errorMap[error].count += 1;
    if (errorMap[error].examples.length < 3) {
      errorMap[error].examples.push(a.id);
    }
  });

  const errors = Object.entries(errorMap)
    .map(([error, data]) => ({
      error,
      count: data.count,
      percentage:
        failed > 0 ? Math.round((data.count / failed) * 100) : 0,
      examples: data.examples,
    }))
    .sort((a, b) => b.count - a.count);

  // Storage metrics
  const readyAssets = assets.filter((a) => a.status === "READY");
  const totalBytes = readyAssets.reduce((sum, a) => sum + (a.fileSize || 0), 0);
  const totalMB = totalBytes / 1024 / 1024;
  const avgFileSize = readyAssets.length > 0 ? totalBytes / readyAssets.length : 0;

  // Retry statistics
  const totalAttempts = assets.reduce((sum, a) => sum + a.attemptCount, 0);
  const avgAttemptsPerAsset =
    totalAssets > 0
      ? parseFloat((totalAttempts / totalAssets).toFixed(2))
      : 0;
  const zeroAttempts = assets.filter((a) => a.attemptCount === 0).length;
  const oneAttempt = assets.filter((a) => a.attemptCount === 1).length;
  const twoOrMore = assets.filter((a) => a.attemptCount >= 2).length;

  // Trend
  const statusCounts = {
    READY: 0,
    FAILED: 0,
    PENDING: 0,
    VALIDATING: 0,
    DOWNLOADING: 0,
    CONVERTING: 0,
    UPLOADING: 0,
    EXPIRED: 0,
  };

  assets.forEach((a) => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  });

  const trend = Object.entries(statusCounts)
    .map(([status, count]) => ({
      status,
      count,
      percentage:
        totalAssets > 0
          ? parseFloat(((count / totalAssets) * 100).toFixed(1))
          : 0,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    summary: {
      totalAssets,
      ready,
      failed,
      processing,
      pending,
      successRate,
      failureRate,
    },
    timings: {
      avgTimeToReady,
      avgTimeToFailure,
      fastest,
      slowest,
    },
    errors,
    storage: {
      totalFiles: readyAssets.length,
      totalBytes,
      totalMB: parseFloat(totalMB.toFixed(2)),
      avgFileSize: parseFloat(avgFileSize.toFixed(0)),
      avgFileSizeMB: parseFloat((avgFileSize / 1024 / 1024).toFixed(2)),
    },
    retries: {
      totalAttempts,
      avgAttemptsPerAsset,
      zeroAttempts,
      oneAttempt,
      twoOrMore,
    },
    trend,
  };
}

async function main() {
  const period = process.argv[2] || "24h";

  console.log("=".repeat(80));
  console.log(`WORKER PIPELINE METRICS (${period})`);
  console.log("=".repeat(80));
  console.log("");

  try {
    let periodMs = 86400000; // 24h default
    if (period === "1h") {
      periodMs = 3600000;
    } else if (period === "7d") {
      periodMs = 604800000;
    } else if (period === "all") {
      periodMs = 365 * 24 * 3600 * 1000; // 1 year
    }

    const metrics = await calculateMetrics(periodMs);

    console.log("📊 SUMMARY");
    console.log("-".repeat(80));
    console.log(`Total Assets: ${metrics.summary.totalAssets}`);
    console.log(`✅ Ready: ${metrics.summary.ready} (${metrics.summary.successRate}%)`);
    console.log(`❌ Failed: ${metrics.summary.failed} (${metrics.summary.failureRate}%)`);
    console.log(`⏳ Processing: ${metrics.summary.processing}`);
    console.log(`⏸️  Pending: ${metrics.summary.pending}`);

    console.log("\n⏱️  PROCESSING TIMES");
    console.log("-".repeat(80));
    console.log(`Avg Time to Ready: ${metrics.timings.avgTimeToReady}s`);
    console.log(`Avg Time to Failure: ${metrics.timings.avgTimeToFailure}s`);
    console.log(`Fastest: ${metrics.timings.fastest.toFixed(1)}s`);
    console.log(`Slowest: ${metrics.timings.slowest.toFixed(1)}s`);

    console.log("\n💾 STORAGE");
    console.log("-".repeat(80));
    console.log(`Total Files: ${metrics.storage.totalFiles}`);
    console.log(`Total Size: ${metrics.storage.totalMB.toFixed(2)} MB`);
    console.log(`Avg File Size: ${metrics.storage.avgFileSizeMB.toFixed(2)} MB`);

    if (metrics.errors.length > 0) {
      console.log("\n❌ TOP ERRORS");
      console.log("-".repeat(80));
      metrics.errors.slice(0, 5).forEach((err, idx) => {
        console.log(
          `${idx + 1}. ${err.error} (${err.count} occurrences, ${err.percentage}%)`
        );
      });
    }

    console.log("\n🔄 RETRY STATISTICS");
    console.log("-".repeat(80));
    console.log(`Total Attempts: ${metrics.retries.totalAttempts}`);
    console.log(`Avg Attempts per Asset: ${metrics.retries.avgAttemptsPerAsset}`);
    console.log(`Zero Attempts: ${metrics.retries.zeroAttempts}`);
    console.log(`One Attempt: ${metrics.retries.oneAttempt}`);
    console.log(`Two or More: ${metrics.retries.twoOrMore}`);

    console.log("\n📈 STATUS DISTRIBUTION");
    console.log("-".repeat(80));
    metrics.trend.forEach((item) => {
      const bar = "█".repeat(Math.round(item.percentage / 5));
      console.log(
        `${item.status.padEnd(12)} │ ${String(item.count).padStart(3)} │ ${String(
          item.percentage
        ).padStart(5)}% │ ${bar}`
      );
    });

    console.log("\n" + "=".repeat(80));
    console.log(`Generated: ${new Date().toISOString()}`);
    console.log("=".repeat(80));

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Error:", error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
