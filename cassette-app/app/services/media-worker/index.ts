/**
 * Media Processing Worker Service
 * Can run as:
 * 1. Background service within Next.js (via cron job or manual trigger)
 * 2. Standalone Node.js script
 * 3. Scheduled task on Vercel (using cron)
 *
 * Polls for PENDING media assets and processes them:
 * YouTube → Download → Convert to MP3 → Upload to R2 → Mark READY
 */

import { mkdirSync, existsSync, rmSync } from "fs";
import { join } from "path";

import {
  getPendingJobs,
  lockJob,
  updateJobStatus,
  completeJob,
  failJob,
  cleanupExpiredJobs,
} from "./database";

import {
  validateYouTubeVideo,
  downloadYouTubeAudio,
  getAudioDuration,
} from "./youtube";

import {
  convertToMP3,
  validateMP3,
  calculateChecksum,
  getFileSize,
} from "./ffmpeg";

import { R2Client, createR2ClientFromEnv } from "@/app/services/media-worker/storage";

// Configuration
const CONFIG = {
  maxConcurrent: parseInt(process.env.MAX_CONCURRENT_DOWNLOADS || "3", 10),
  tempDir:
    process.env.TEMP_DIR ||
    join(process.cwd(), ".temp/cassette-media-processing"),
  pollInterval: parseInt(process.env.POLL_INTERVAL_SEC || "5", 10) * 1000,
  workerId: process.env.WORKER_ID || `worker-${Date.now()}`,
  logLevel: process.env.LOG_LEVEL || "info",
  targetBitrate: parseInt(process.env.TARGET_BITRATE_KBPS || "128", 10),
};

// State
let processingCount = 0;
let isRunning = false;
let r2Client: R2Client | null = null;

// ─── Logging ────────────────────────────────────────────────────────────────

const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLogLevel =
  logLevels[CONFIG.logLevel as keyof typeof logLevels] || 1;

function log(level: string, message: string, data?: unknown) {
  const levelValue = logLevels[level as keyof typeof logLevels] || 1;
  if (levelValue >= currentLogLevel) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data || "");
  }
}

// ─── R2 Client ──────────────────────────────────────────────────────────────

function initR2Client(): R2Client | null {
  if (r2Client) {
    return r2Client;
  }

  try {
    r2Client = createR2ClientFromEnv();
    log("info", "[initR2Client] R2 client initialized");
    return r2Client;
  } catch (error) {
    log("warn", "[initR2Client] R2 not configured", { error: String(error) });
    return null;
  }
}

// ─── Processing ─────────────────────────────────────────────────────────────

/**
 * Process a single media job
 */
async function processJob(jobId: string, videoId: string) {
  if (processingCount >= CONFIG.maxConcurrent) {
    return;
  }

  processingCount++;
  log("info", "[processJob] Starting", { jobId, videoId });

  try {
    // Lock the job
    const locked = await lockJob(jobId, CONFIG.workerId);
    if (!locked) {
      log("warn", "[processJob] Failed to lock job", { jobId });
      processingCount--;
      return;
    }

    // Create temp directory
    const jobDir = join(CONFIG.tempDir, jobId);
    mkdirSync(jobDir, { recursive: true });

    // Step 1: Validate YouTube video
    log("info", "[processJob] Validating YouTube video", { videoId });
    await updateJobStatus(jobId, "VALIDATING");

    const validation = await validateYouTubeVideo(videoId);
    if (!validation.valid) {
      log("warn", "[processJob] Validation failed", {
        videoId,
        error: validation.error,
      });
      await failJob(jobId, validation.error || "validation failed");
      cleanupJobDir(jobDir);
      processingCount--;
      return;
    }

    // Step 2: Download audio
    log("info", "[processJob] Downloading audio", { videoId });
    await updateJobStatus(jobId, "DOWNLOADING");

    const downloadResult = await downloadYouTubeAudio(videoId, jobDir);
    if (!downloadResult.success) {
      log("warn", "[processJob] Download failed", {
        error: downloadResult.error,
      });
      await failJob(jobId, downloadResult.error || "download failed");
      cleanupJobDir(jobDir);
      processingCount--;
      return;
    }

    const audioPath = downloadResult.filePath!;

    // Step 3: Convert to MP3
    log("info", "[processJob] Converting to MP3", { videoId });
    await updateJobStatus(jobId, "CONVERTING");

    const mp3Path = join(jobDir, "output.mp3");
    const convertResult = await convertToMP3(
      audioPath,
      mp3Path,
      CONFIG.targetBitrate
    );

    if (!convertResult.success) {
      log("warn", "[processJob] Conversion failed", {
        error: convertResult.error,
      });
      await failJob(jobId, convertResult.error || "conversion failed");
      cleanupJobDir(jobDir);
      processingCount--;
      return;
    }

    // Step 4: Validate MP3
    const mp3Validation = await validateMP3(mp3Path);
    if (!mp3Validation.valid) {
      log("warn", "[processJob] MP3 validation failed", {
        error: mp3Validation.error,
      });
      await failJob(jobId, mp3Validation.error || "mp3 validation failed");
      cleanupJobDir(jobDir);
      processingCount--;
      return;
    }

    // Step 5: Calculate checksum and file size
    const checksum = calculateChecksum(mp3Path);
    const fileSize = getFileSize(mp3Path);
    log("info", "[processJob] File validated", { checksum, fileSize });

    // Step 6: Upload to R2
    log("info", "[processJob] Uploading to R2", { jobId });
    await updateJobStatus(jobId, "UPLOADING");

    const r2 = initR2Client();
    let storageKey = `media-assets/${jobId}.mp3`;

    if (r2) {
      const uploadResult = await r2.uploadMP3(mp3Path, jobId);
      if (!uploadResult.success) {
        log("warn", "[processJob] R2 upload failed", {
          error: uploadResult.error,
        });
        await failJob(jobId, "R2 upload failed", uploadResult.error);
        cleanupJobDir(jobDir);
        processingCount--;
        return;
      }
    } else {
      log("warn", "[processJob] R2 not configured, skipping upload");
      if (process.env.NODE_ENV === "production") {
        await failJob(jobId, "R2 storage not configured");
        cleanupJobDir(jobDir);
        processingCount--;
        return;
      }
    }

    // Step 7: Mark as complete
    await completeJob(jobId, storageKey, fileSize, checksum, CONFIG.targetBitrate);

    log("info", "[processJob] Job completed successfully", { jobId });

    // Cleanup
    cleanupJobDir(jobDir);
  } catch (error) {
    log("error", "[processJob] Unexpected error", {
      jobId,
      error: String(error),
    });
    await failJob(jobId, "unexpected error", String(error));
  }

  processingCount--;
}

/**
 * Clean up temp directory
 */
function cleanupJobDir(jobDir: string): void {
  try {
    if (existsSync(jobDir)) {
      rmSync(jobDir, { recursive: true, force: true });
      log("debug", "[cleanupJobDir] Cleaned up", { jobDir });
    }
  } catch (error) {
    log("warn", "[cleanupJobDir] Cleanup failed", { error: String(error) });
  }
}

// ─── Main Processing Loop ───────────────────────────────────────────────────

/**
 * Poll and process jobs
 */
export async function pollAndProcessJobs(): Promise<void> {
  if (!isRunning) return;

  try {
    const jobs = await getPendingJobs(CONFIG.maxConcurrent - processingCount);

    if (jobs.length > 0) {
      log("info", "[pollJobs] Found pending jobs", {
        count: jobs.length,
        processing: processingCount,
      });

      jobs.forEach((job: any) => {
        const videoId = job.providerTrackId; // For YouTube provider
        processJob(job.id, videoId).catch((error) => {
          log("error", "[pollJobs] Job error", {
            jobId: job.id,
            error: String(error),
          });
        });
      });
    }

    // Periodic cleanup
    if (Math.random() < 0.01) {
      try {
        const deleted = await cleanupExpiredJobs();
        if (deleted > 0) {
          log("info", "[cleanup] Removed expired jobs", { count: deleted });
        }
      } catch (error) {
        log("warn", "[cleanup] Failed", { error: String(error) });
      }
    }
  } catch (error) {
    log("error", "[pollJobs] Error", { error: String(error) });
  }

  if (isRunning) {
    setTimeout(pollAndProcessJobs, CONFIG.pollInterval);
  }
}

// ─── Lifecycle ──────────────────────────────────────────────────────────────

/**
 * Start the worker
 */
export async function startWorker(): Promise<void> {
  if (isRunning) return;

  log("info", "[startWorker] Starting worker", {
    workerId: CONFIG.workerId,
    maxConcurrent: CONFIG.maxConcurrent,
  });

  isRunning = true;
  mkdirSync(CONFIG.tempDir, { recursive: true });

  await pollAndProcessJobs();
}

/**
 * Stop the worker gracefully
 */
export async function stopWorker(): Promise<void> {
  log("info", "[stopWorker] Stopping worker");

  isRunning = false;

  // Wait for in-flight jobs
  let waited = 0;
  while (processingCount > 0 && waited < 30000) {
    log("info", "[stopWorker] Waiting for jobs", {
      processing: processingCount,
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    waited += 1000;
  }

  if (r2Client) {
    await r2Client.close();
  }

  log("info", "[stopWorker] Worker stopped");
}

/**
 * Check worker status
 */
export function getWorkerStatus() {
  return {
    isRunning,
    processingCount,
    workerId: CONFIG.workerId,
  };
}
