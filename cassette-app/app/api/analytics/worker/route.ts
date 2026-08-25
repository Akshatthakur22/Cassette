/**
 * GET /api/analytics/worker
 * Worker pipeline metrics and statistics
 * Tracks success rates, processing times, error patterns, R2 storage
 * 
 * Query params:
 * - period: "1h" | "24h" | "7d" | "all" (default: "24h")
 * - format: "json" | "csv" (default: "json")
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

interface MetricsResponse {
  period: string;
  generatedAt: string;
  summary: {
    totalAssets: number;
    ready: number;
    failed: number;
    processing: number;
    pending: number;
    successRate: number;
    failureRate: number;
  };
  timings: {
    avgTimeToReady: number;
    avgTimeToFailure: number;
    fastest: number;
    slowest: number;
  };
  errors: Array<{
    error: string;
    count: number;
    percentage: number;
    examples: string[];
  }>;
  storage: {
    totalFiles: number;
    totalBytes: number;
    totalMB: number;
    avgFileSize: number;
    avgFileSizeMB: number;
  };
  retries: {
    totalAttempts: number;
    avgAttemptsPerAsset: number;
    zeroAttempts: number;
    oneAttempt: number;
    twoOrMore: number;
  };
  trend: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

async function calculateMetrics(periodMs: number): Promise<MetricsResponse> {
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
  const completedAssets = assets.filter(
    (a) => a.status === "READY" || a.status === "FAILED"
  );
  const successfulAssets = assets.filter((a) => a.status === "READY");
  const failedAssets = assets.filter((a) => a.status === "FAILED");

  const timings = {
    avgTimeToReady: 0,
    avgTimeToFailure: 0,
    fastest: 0,
    slowest: 0,
  };

  if (successfulAssets.length > 0) {
    const times = successfulAssets
      .map((a) => {
        if (!a.processedAt || !a.createdAt) return 0;
        return a.processedAt.getTime() - a.createdAt.getTime();
      })
      .filter((t) => t > 0);

    if (times.length > 0) {
      timings.avgTimeToReady = Math.round(times.reduce((a, b) => a + b) / times.length / 1000); // Convert to seconds
      timings.fastest = Math.min(...times) / 1000;
      timings.slowest = Math.max(...times) / 1000;
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
      timings.avgTimeToFailure = Math.round(times.reduce((a, b) => a + b) / times.length / 1000);
    }
  }

  // Error patterns
  const errorMap: Record<string, { count: number; examples: Set<string> }> = {};
  failedAssets.forEach((a) => {
    const error = a.error || "Unknown error";
    if (!errorMap[error]) {
      errorMap[error] = { count: 0, examples: new Set() };
    }
    errorMap[error].count += 1;
    if (errorMap[error].examples.size < 3) {
      errorMap[error].examples.add(a.id);
    }
  });

  const errors = Object.entries(errorMap)
    .map(([error, data]) => ({
      error,
      count: data.count,
      percentage:
        failed > 0 ? Math.round((data.count / failed) * 100) : 0,
      examples: Array.from(data.examples),
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
  const statusCounts: Record<string, number> = {
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
    period:
      periodMs === 3600000
        ? "1 hour"
        : periodMs === 86400000
          ? "24 hours"
          : periodMs === 604800000
            ? "7 days"
            : "all time",
    generatedAt: new Date().toISOString(),
    summary: {
      totalAssets,
      ready,
      failed,
      processing,
      pending,
      successRate,
      failureRate,
    },
    timings,
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "24h";
    const format = searchParams.get("format") || "json";

    // Convert period to milliseconds
    let periodMs = 86400000; // 24h default
    if (period === "1h") {
      periodMs = 3600000;
    } else if (period === "7d") {
      periodMs = 604800000;
    } else if (period === "all") {
      periodMs = 365 * 24 * 3600 * 1000; // 1 year
    }

    console.log(`[WORKER_ANALYTICS] Calculating metrics for period: ${period}`);

    const metrics = await calculateMetrics(periodMs);

    if (format === "csv") {
      // Return CSV format
      const csv = [
        "Worker Pipeline Metrics",
        `Period,${metrics.period}`,
        `Generated,${metrics.generatedAt}`,
        "",
        "Summary",
        `Total Assets,${metrics.summary.totalAssets}`,
        `Ready,${metrics.summary.ready}`,
        `Failed,${metrics.summary.failed}`,
        `Processing,${metrics.summary.processing}`,
        `Pending,${metrics.summary.pending}`,
        `Success Rate,${metrics.summary.successRate}%`,
        `Failure Rate,${metrics.summary.failureRate}%`,
        "",
        "Processing Times (seconds)",
        `Avg Time to Ready,${metrics.timings.avgTimeToReady}`,
        `Avg Time to Failure,${metrics.timings.avgTimeToFailure}`,
        `Fastest,${metrics.timings.fastest}`,
        `Slowest,${metrics.timings.slowest}`,
        "",
        "Storage",
        `Total Files,${metrics.storage.totalFiles}`,
        `Total Size (MB),${metrics.storage.totalMB}`,
        `Avg File Size (MB),${metrics.storage.avgFileSizeMB}`,
        "",
        "Top Errors",
        ...metrics.errors
          .slice(0, 10)
          .map((e) => `${e.error},${e.count} (${e.percentage}%)`),
        "",
        "Retry Statistics",
        `Total Attempts,${metrics.retries.totalAttempts}`,
        `Avg Attempts per Asset,${metrics.retries.avgAttemptsPerAsset}`,
        `Zero Attempts,${metrics.retries.zeroAttempts}`,
        `One Attempt,${metrics.retries.oneAttempt}`,
        `Two or More,${metrics.retries.twoOrMore}`,
      ].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="worker-metrics-${period}.csv"`,
        },
      });
    }

    // Return JSON (default)
    return NextResponse.json(metrics, { status: 200 });
  } catch (error) {
    console.error("[WORKER_ANALYTICS] Error:", error);
    return NextResponse.json(
      {
        error: `Failed to calculate metrics: ${String(error)}`,
      },
      { status: 500 }
    );
  }
}
