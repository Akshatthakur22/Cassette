/**
 * Worker Pipeline Logger
 * Structured logging for media asset processing pipeline
 * Captures timing, status transitions, errors, and metrics
 */

interface LogEntry {
  timestamp: string;
  mediaAssetId: string;
  status: string;
  stage: string;
  message: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

interface StageMetrics {
  stage: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
}

class WorkerLogger {
  private logs: LogEntry[] = [];
  private stageMetrics: Map<string, StageMetrics> = new Map();
  private sessionId: string;

  constructor() {
    this.sessionId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log a stage start
   */
  stageStart(mediaAssetId: string, stage: string): void {
    const key = `${mediaAssetId}:${stage}`;
    this.stageMetrics.set(key, {
      stage,
      startTime: Date.now(),
      success: false,
    });

    this.log(mediaAssetId, stage, "STARTED", `Starting ${stage} stage`);
  }

  /**
   * Log a stage completion
   */
  stageComplete(
    mediaAssetId: string,
    stage: string,
    durationMs: number
  ): void {
    const key = `${mediaAssetId}:${stage}`;
    const metrics = this.stageMetrics.get(key);

    if (metrics) {
      metrics.endTime = Date.now();
      metrics.duration = durationMs;
      metrics.success = true;
    }

    this.log(mediaAssetId, stage, "COMPLETED", `Completed in ${durationMs}ms`, {
      durationMs,
    });
  }

  /**
   * Log a stage failure
   */
  stageFailed(
    mediaAssetId: string,
    stage: string,
    error: string,
    durationMs?: number
  ): void {
    const key = `${mediaAssetId}:${stage}`;
    const metrics = this.stageMetrics.get(key);

    if (metrics) {
      metrics.endTime = Date.now();
      metrics.duration = durationMs || metrics.endTime - metrics.startTime;
      metrics.success = false;
      metrics.error = error;
    }

    this.log(
      mediaAssetId,
      stage,
      "FAILED",
      `Failed: ${error}`,
      { error, durationMs }
    );
  }

  /**
   * Log a message
   */
  log(
    mediaAssetId: string,
    stage: string,
    status: string,
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      mediaAssetId,
      status,
      stage,
      message,
      metadata,
    };

    this.logs.push(entry);

    // Also log to console
    console.log(
      `[${entry.status}] [${stage}] ${mediaAssetId}: ${message}`
    );
  }

  /**
   * Get metrics for a specific asset
   */
  getAssetMetrics(mediaAssetId: string): {
    totalTime: number;
    stages: StageMetrics[];
  } {
    const stages = Array.from(this.stageMetrics.values()).filter(
      (m) => m.stage.includes(mediaAssetId)
    );

    const stageMetrics = Array.from(this.stageMetrics.entries())
      .filter(([key]) => key.startsWith(mediaAssetId))
      .map(([, m]) => m);

    const totalTime = Math.max(
      0,
      ...stageMetrics.map((m) => m.duration || 0)
    );

    return { totalTime, stages: stageMetrics };
  }

  /**
   * Get summary metrics
   */
  getSummary(): {
    totalAssets: number;
    successful: number;
    failed: number;
    totalTime: number;
    avgTimePerAsset: number;
    errors: Record<string, number>;
  } {
    const assetIds = new Set<string>();
    const errors: Record<string, number> = {};
    let totalDuration = 0;
    let successful = 0;
    let failed = 0;

    this.stageMetrics.forEach((metrics) => {
      const parts = metrics.stage.split(":");
      const assetId = parts[0];
      assetIds.add(assetId);

      if (metrics.success) {
        successful++;
      } else {
        failed++;
      }

      if (metrics.error) {
        errors[metrics.error] = (errors[metrics.error] || 0) + 1;
      }

      if (metrics.duration) {
        totalDuration += metrics.duration;
      }
    });

    const totalAssets = assetIds.size;

    return {
      totalAssets,
      successful,
      failed,
      totalTime: totalDuration,
      avgTimePerAsset: totalAssets > 0 ? totalDuration / totalAssets : 0,
      errors,
    };
  }

  /**
   * Export logs as JSON
   */
  exportJSON(): object {
    return {
      sessionId: this.sessionId,
      generatedAt: new Date().toISOString(),
      logs: this.logs,
      summary: this.getSummary(),
    };
  }

  /**
   * Export logs as CSV
   */
  exportCSV(): string {
    const headers = ["Timestamp", "MediaAssetId", "Status", "Stage", "Message", "Error"];
    const rows = this.logs.map((entry) => [
      entry.timestamp,
      entry.mediaAssetId,
      entry.status,
      entry.stage,
      entry.message,
      entry.error || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) =>
            typeof cell === "string" && cell.includes(",")
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          )
          .join(",")
      ),
    ].join("\n");

    return csv;
  }

  /**
   * Clear logs
   */
  clear(): void {
    this.logs = [];
    this.stageMetrics.clear();
  }
}

// Export singleton instance
export const workerLogger = new WorkerLogger();

/**
 * Performance monitoring helper
 */
export function measureStage<T>(
  mediaAssetId: string,
  stage: string,
  fn: () => Promise<T> | T
): Promise<T> {
  workerLogger.stageStart(mediaAssetId, stage);
  const startTime = Date.now();

  return Promise.resolve(fn())
    .then((result) => {
      const duration = Date.now() - startTime;
      workerLogger.stageComplete(mediaAssetId, stage, duration);
      return result;
    })
    .catch((error) => {
      const duration = Date.now() - startTime;
      workerLogger.stageFailed(
        mediaAssetId,
        stage,
        String(error),
        duration
      );
      throw error;
    });
}

/**
 * Utility to create detailed error report
 */
export function createErrorReport(
  mediaAssetId: string,
  stage: string,
  error: string,
  details?: Record<string, unknown>
): object {
  return {
    mediaAssetId,
    stage,
    error,
    timestamp: new Date().toISOString(),
    details,
    metrics: workerLogger.getAssetMetrics(mediaAssetId),
  };
}
