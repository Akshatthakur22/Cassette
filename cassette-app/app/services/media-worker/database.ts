/**
 * Database layer for media worker
 * Handles job querying and status updates
 */

import { prisma } from "@/app/lib/prisma";
import { MediaAssetStatus } from "@/app/lib/types";

/**
 * Get pending jobs ready for processing
 */
export async function getPendingJobs(limit: number) {
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
    select: {
      id: true,
      provider: true,
      providerTrackId: true,
      title: true,
      artist: true,
      status: true,
      attemptCount: true,
    },
  });

  return jobs;
}

/**
 * Try to lock a job for processing
 */
export async function lockJob(
  jobId: string,
  workerId: string
): Promise<boolean> {
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
    console.error("[lockJob] Error:", error);
    return false;
  }
}

/**
 * Update job status
 */
export async function updateJobStatus(
  jobId: string,
  status: MediaAssetStatus
): Promise<void> {
  await prisma.mediaAsset.update({
    where: { id: jobId },
    data: { status },
  });
}

/**
 * Mark job as complete
 */
export async function completeJob(
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
      processedAt: new Date(),
    },
  });
}

/**
 * Mark job as failed
 */
export async function failJob(
  jobId: string,
  error: string,
  errorDetails?: string
): Promise<void> {
  const attemptCount = await prisma.mediaAsset.findUnique({
    where: { id: jobId },
    select: { attemptCount: true },
  });

  const newAttemptCount = (attemptCount?.attemptCount || 0) + 1;
  const maxRetries = parseInt(process.env.MAX_RETRIES || "5", 10);

  if (newAttemptCount < maxRetries) {
    // Calculate backoff delay (exponential: 2^n minutes)
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
    // Max retries exceeded
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
 * Cleanup expired jobs
 */
export async function cleanupExpiredJobs(): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await prisma.mediaAsset.deleteMany({
    where: {
      status: "FAILED",
      createdAt: { lt: thirtyDaysAgo },
    },
  });

  return result.count;
}
