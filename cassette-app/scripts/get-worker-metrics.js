#!/usr/bin/env node

/**
 * Get Worker Pipeline Metrics
 * Queries the analytics endpoint to show worker performance metrics
 * Usage: node scripts/get-worker-metrics.js [period] [format]
 * 
 * Periods: 1h, 24h (default), 7d, all
 * Formats: json (default), csv
 */

async function main() {
  const period = process.argv[2] || "24h";
  const format = process.argv[3] || "json";

  console.log("=".repeat(80));
  console.log(`WORKER PIPELINE METRICS (${period})`);
  console.log("=".repeat(80));
  console.log("");

  try {
    const url = new URL("https://cassette-share.vercel.app/api/analytics/worker");
    url.searchParams.set("period", period);
    url.searchParams.set("format", format);

    console.log(`Fetching metrics from: ${url.toString()}\n`);

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error(`❌ Failed to fetch metrics: ${response.status}`);
      const text = await response.text();
      console.error(text.substring(0, 200));
      process.exit(1);
    }

    const contentType = response.headers.get("content-type");

    if (format === "csv" || contentType?.includes("csv")) {
      const csv = await response.text();
      console.log(csv);
    } else {
      const metrics = await response.json();
      displayMetrics(metrics);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

function displayMetrics(metrics) {
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
    console.log(`${item.status.padEnd(12)} │ ${String(item.count).padStart(3)} │ ${String(item.percentage).padStart(5)}% │ ${bar}`);
  });

  console.log("\n" + "=".repeat(80));
  console.log(`Generated: ${metrics.generatedAt}`);
  console.log("=".repeat(80));
}

main();
