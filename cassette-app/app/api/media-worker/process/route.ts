/**
 * POST /api/media-worker/process
 * Inline media worker job processing (directly in API route)
 * Processes PENDING MediaAssets: YouTube → WebM → MP3 → R2 → READY
 */

import { NextRequest, NextResponse } from "next/server";
import { mkdirSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { prisma } from "@/app/lib/prisma";

// Import worker modules
import {
  validateYouTubeVideo,
  downloadYouTubeAudio,
  getAudioDuration,
} from "@/app/services/media-worker/youtube";

import {
  convertToMP3,
  validateMP3,
  calculateChecksum,
  getFileSize,
} from "@/app/services/media-worker/ffmpeg";

import { createR2ClientFromEnv } from "@/app/services/media-worker/storage";

// Configuration
const CONFIG = {
  maxConcurrent: 1, // Process sequentially in API
  tempDir:
    process.env.TEMP_DIR ||
    join(process.cwd(), ".temp/cassette-media-processing"),
  targetBitrate: parseInt(process.env.TARGET_BITRATE_KBPS || "128", 10),
  logLevel: process.env.LOG_LEVEL || "info",
};

// Logging helper
function log(level: string, message: string, data?: unknown) {
  console.log(`[media-worker] [${level.toUpperCase()}] ${message}`, data || "");
}

/**
 * Verify worker authorization
 */
function verifyWorkerSecret(request: NextRequest): boolean {
  const secret = request.headers.get("x-worker-secret");
  const expectedSecret = process.env.MEDIA_WORKER_SECRET;

  if (!expectedSecret) {
    log("warn", "MEDIA_WORKER_SECRET not configured");
    return true; // Allow if not configured
  }

  return secret === expectedSecret;
}

/**
 * Get pending jobs ready for processing
 */
async function getPendingJobs(limit: number) {
  const now = new Date();

  const jobs = await prisma.mediaAsset.findMany({
    where: {
      OR: [
        { status: "PENDING" },
        {
          status: "FAILED",
          nextAttemptAt: { lte: now },
        },
      ],
    },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  return jobs;
}

/**
 * Update job status
 */
async function updateJobStatus(jobId: string, status: string): Promise<void> {
  await prisma.mediaAsset.update({
    where: { id: jobId },
    data: { status },
  });
}

/**
 * Complete a job
 */
async function completeJob(
  jobId: string,
  storageKey: string,
  fileSize: number,
  checksum: string,
  bitrate: number
): Promise<void> {
  await prisma.mediaAsset.update({
    where: { id: jobId },
    data: {
      status: "READY",
      storageKey,
      fileSize,
      checksum,
      bitrate,
      mimeType: "audio/mpeg",
      processedAt: new Date(),
    },
  });
}

/**
 * Fail a job with error details
 */
async function failJob(
  jobId: string,
  error: string,
  errorDetails?: string
): Promise<void> {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: jobId },
    select: { attemptCount: true },
  });

  const newAttemptCount = (asset?.attemptCount || 0) + 1;
  const maxRetries = parseInt(process.env.MAX_RETRIES || "5", 10);

  if (newAttemptCount < maxRetries) {
    // Exponential backoff: 2^n minutes
    const backoffMinutes = Math.pow(2, newAttemptCount - 1);
    const nextAttempt = new Date(Date.now() + backoffMinutes * 60 * 1000);

    await prisma.mediaAsset.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        error,
        errorDetails,
        attemptCount: newAttemptCount,
        nextAttemptAt: nextAttempt,
      },
    });
  } else {
    await prisma.mediaAsset.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        error,
        errorDetails: `${errorDetails || ""} (Max retries exceeded)`,
        attemptCount: newAttemptCount,
      },
    });
  }
}

/**
 * Lock a job for processing
 */
async function lockJob(jobId: string): Promise<boolean> {
  try {
    const result = await prisma.mediaAsset.updateMany({
      where: {
        id: jobId,
        status: { in: ["PENDING", "FAILED"] },
      },
      data: {
        status: "VALIDATING",
        lastAttemptAt: new Date(),
      },
    });

    return result.count > 0;
  } catch (error) {
    log("warn", "Failed to lock job", { jobId, error: String(error) });
    return false;
  }
}

/**
 * Clean up temp directory
 */
function cleanupJobDir(jobDir: string): void {
  try {
    if (existsSync(jobDir)) {
      rmSync(jobDir, { recursive: true, force: true });
      log("debug", "Cleaned up temp dir", { jobDir });
    }
  } catch (error) {
    log("warn", "Cleanup failed", { error: String(error) });
  }
}

/**
 * Process a single media job
 */
async function processJob(jobId: string, videoId: string): Promise<void> {
  log("info", "Processing job", { jobId, videoId });

  try {
    // Lock the job
    const locked = await lockJob(jobId);
    if (!locked) {
      log("warn", "Failed to lock job", { jobId });
      return;
    }

    // Create temp directory
    const jobDir = join(CONFIG.tempDir, jobId);
    mkdirSync(jobDir, { recursive: true });

    // Step 1: Validate YouTube video
    log("info", "Validating YouTube video", { videoId });
    await updateJobStatus(jobId, "VALIDATING");

    const validation = await validateYouTubeVideo(videoId);
    if (!validation.valid) {
      log("warn", "Validation failed", { videoId, error: validation.error });
      await failJob(jobId, validation.error || "validation failed");
      cleanupJobDir(jobDir);
      return;
    }

    // Step 2: Download audio
    log("info", "Downloading audio", { videoId });
    await updateJobStatus(jobId, "DOWNLOADING");

    const downloadResult = await downloadYouTubeAudio(videoId, jobDir);
    if (!downloadResult.success) {
      log("warn", "Download failed", { error: downloadResult.error });
      await failJob(jobId, downloadResult.error || "download failed");
      cleanupJobDir(jobDir);
      return;
    }

    const audioPath = downloadResult.filePath!;

    // Step 3: Convert to MP3
    log("info", "Converting to MP3", { videoId });
    await updateJobStatus(jobId, "CONVERTING");

    const mp3Path = join(jobDir, "output.mp3");
    const convertResult = await convertToMP3(
      audioPath,
      mp3Path,
      CONFIG.targetBitrate
    );

    if (!convertResult.success) {
      log("warn", "Conversion failed", { error: convertResult.error });
      await failJob(jobId, convertResult.error || "conversion failed");
      cleanupJobDir(jobDir);
      return;
    }

    // Step 4: Validate MP3
    const mp3Validation = await validateMP3(mp3Path);
    if (!mp3Validation.valid) {
      log("warn", "MP3 validation failed", { error: mp3Validation.error });
      await failJob(jobId, mp3Validation.error || "mp3 validation failed");
      cleanupJobDir(jobDir);
      return;
    }

    // Step 5: Calculate checksum and file size
    const checksum = calculateChecksum(mp3Path);
    const fileSize = getFileSize(mp3Path);
    log("info", "File validated", { checksum, fileSize });

    // Step 6: Upload to R2
    log("info", "Uploading to R2", { jobId });
    await updateJobStatus(jobId, "UPLOADING");

    const r2 = createR2ClientFromEnv();
    let storageKey = `media-assets/${jobId}.mp3`;

    if (r2) {
      const uploadResult = await r2.uploadMP3(mp3Path, jobId);
      if (!uploadResult.success) {
        log("warn", "R2 upload failed", { error: uploadResult.error });
        await failJob(jobId, "R2 upload failed", uploadResult.error);
        cleanupJobDir(jobDir);
        return;
      }
      await r2.close();
    } else {
      log("warn", "R2 not configured, skipping upload");
      if (process.env.NODE_ENV === "production") {
        await failJob(jobId, "R2 storage not configured");
        cleanupJobDir(jobDir);
        return;
      }
    }

    // Step 7: Mark as complete
    await completeJob(jobId, storageKey, fileSize, checksum, CONFIG.targetBitrate);

    log("info", "Job completed successfully", { jobId });

    // Cleanup
    cleanupJobDir(jobDir);
  } catch (error) {
    log("error", "Unexpected error", { jobId, error: String(error) });
    await failJob(jobId, "unexpected error", String(error));
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    if (!verifyWorkerSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get optional job limit from query
    const limit = request.nextUrl.searchParams.get("limit");
    const jobLimit = limit ? parseInt(limit, 10) : 3;

    log("info", "Processing triggered", { jobLimit });

    // Ensure temp directory exists
    mkdirSync(CONFIG.tempDir, { recursive: true });

    // Get pending jobs
    const jobs = await getPendingJobs(jobLimit);

    if (jobs.length > 0) {
      log("info", "Found pending jobs", { count: jobs.length });

      // Process jobs sequentially
      for (const job of jobs) {
        const videoId = job.providerTrackId; // For YouTube provider
        await processJob(job.id, videoId);
      }
    } else {
      log("info", "No pending jobs");
    }

    return NextResponse.json(
      {
        success: true,
        message: "Media worker processing completed",
        jobsProcessed: jobs.length,
      },
      { status: 200 }
    );
  } catch (error) {
    log("error", "Worker error", { error: String(error) });
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/media-worker/process
 * Check worker status
 */
export async function GET(request: NextRequest) {
  try {
    if (!verifyWorkerSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      status: "ok",
      message: "Media worker is available",
      endpoint: "/api/media-worker/process",
      method: "POST",
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
