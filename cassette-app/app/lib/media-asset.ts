/**
 * Trigger immediate processing of a newly created MediaAsset
 * Calls the media-worker API endpoint to start processing right away
 * (instead of waiting for the next polling cycle)
 */
export async function triggerMediaAssetProcessing(mediaAssetId: string) {
  try {
    // CRITICAL: Always use production domain for worker trigger
    // This ensures new songs can be processed even when deployed to preview URLs
    // Production URL must be publicly accessible without auth
    let baseUrl = "https://cassette-share.vercel.app";
    
    // Override with explicit env var if set (for self-hosted deployments)
    if (process.env.WORKER_TRIGGER_URL) {
      baseUrl = process.env.WORKER_TRIGGER_URL;
    } else if (process.env.NEXT_PUBLIC_DOMAIN) {
      baseUrl = process.env.NEXT_PUBLIC_DOMAIN;
    }

    const url = `${baseUrl}/api/media-worker/process`;
    const secret = process.env.MEDIA_WORKER_SECRET || "";
    
    console.log(`[WORKER TRIGGER] 🚀 Starting download for MediaAsset: ${mediaAssetId}`);
    console.log(`[WORKER TRIGGER] Calling worker endpoint: ${url}`);

    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-worker-secret": secret,
      },
      body: JSON.stringify({
        trigger: "manual",
        mediaAssetId, // Optional: prioritize this specific asset
      }),
    });

    const responseText = await response.text();
    console.log(`[WORKER TRIGGER] Response status: ${response.status}, body: ${responseText}`);

    if (!response.ok) {
      console.error(
        `[WORKER TRIGGER] ❌ Worker endpoint returned ${response.status}: ${responseText}`
      );
      return false;
    }

    console.log(`[WORKER TRIGGER] ✅ Successfully triggered download for ${mediaAssetId}`);
    return true;
  } catch (error) {
    console.error(`[WORKER TRIGGER] ❌ Fatal error:`, error);
    // Don't throw - worker will pick it up in next polling cycle
    return false;
  }
}

/**
 * Media Asset utilities and helpers
 * Handles MediaAsset creation, status tracking, and error handling
 */

import { prisma } from "./prisma";
import type { MediaAssetStatus } from "./types";

/**
 * Create a new MediaAsset for a YouTube video
 * Returns the created MediaAsset record
 */
export async function createMediaAsset(
  videoId: string,
  title: string,
  artist: string | null,
  durationSec: number
) {
  return await prisma.mediaAsset.create({
    data: {
      provider: "youtube",
      providerTrackId: videoId,
      title,
      artist,
      durationSec,
      status: "PENDING",
      attemptCount: 0,
    },
  });
}

/**
 * Get MediaAsset by ID with full details
 */
export async function getMediaAsset(id: string) {
  return await prisma.mediaAsset.findUnique({
    where: { id },
  });
}

/**
 * Get MediaAsset status for status polling
 * Returns minimal data needed for frontend polling
 */
export async function getMediaAssetStatus(id: string) {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      error: true,
      attemptCount: true,
      fileSize: true,
      storageKey: true,
    },
  });

  if (!asset) return null;

  // Calculate progress percentage based on status
  const progressMap: Record<string, number> = {
    PENDING: 10,
    VALIDATING: 15,
    DOWNLOADING: 35,
    CONVERTING: 65,
    UPLOADING: 90,
    READY: 100,
    FAILED: 0,
    EXPIRED: 0,
  };

  return {
    id: asset.id,
    status: asset.status,
    error: asset.error,
    progress: progressMap[asset.status] || 0,
    fileSize: asset.fileSize,
    storageKey: asset.storageKey,
  };
}

/**
 * Check if a MediaAsset exists for a given YouTube video
 * Used for duplicate prevention - checks for any non-expired record
 */
export async function findExistingMediaAsset(videoId: string) {
  return await prisma.mediaAsset.findFirst({
    where: {
      provider: "youtube",
      providerTrackId: videoId,
      // Accept any active status, including READY or failed that can be retried
      status: { 
        in: ["PENDING", "VALIDATING", "DOWNLOADING", "CONVERTING", "UPLOADING", "READY"]
      },
    },
  });
}

/**
 * Mark MediaAsset as failed with error details
 */
export async function markMediaAssetFailed(
  id: string,
  error: string,
  errorDetails?: string,
  nextRetryDelay?: number
) {
  const nextAttemptAt = nextRetryDelay
    ? new Date(Date.now() + nextRetryDelay)
    : null;

  return await prisma.mediaAsset.update({
    where: { id },
    data: {
      status: "FAILED",
      error,
      errorDetails,
      nextAttemptAt,
    },
  });
}

/**
 * Mark MediaAsset as ready for playback
 */
export async function markMediaAssetReady(
  id: string,
  storageKey: string,
  fileSize: number,
  checksum: string,
  bitrate: number = 128
) {
  return await prisma.mediaAsset.update({
    where: { id },
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
 * Update MediaAsset status during processing
 */
export async function updateMediaAssetStatus(
  id: string,
  status: MediaAssetStatus
) {
  return await prisma.mediaAsset.update({
    where: { id },
    data: {
      status,
      lastAttemptAt: new Date(),
    },
  });
}

/**
 * Get user-friendly error message for a failed MediaAsset
 * Maps technical errors to cassette-specific messages
 */
export function getUserFriendlyError(asset: { error: string | null; status: string }): string {
  if (asset.status === "FAILED" && asset.error) {
    // Map technical errors to user-friendly messages
    const errorMap: Record<string, string> = {
      // Copyright & Rights
      "copyright": "This track is protected by copyright and cannot be added to your cassette. Try searching for the song differently.",
      "music licensing": "This track has music licensing restrictions. Please choose a different version or song.",
      "rights holder": "The rights holder has restricted this content. Please try another version.",
      
      // Video Status
      "video not found": "This video is no longer available. Please choose another track.",
      "deleted": "This video has been deleted. Please try another track.",
      "unavailable": "This video is currently unavailable. Please try another track.",
      
      // Geo & Age Restrictions
      "geo-restricted": "This video is not available in your region. Please choose another track.",
      "geo restricted": "This video is not available in your region. Please choose another track.",
      "restricted playback": "This video's owner restricted playback from third-party apps.",
      "age restricted": "This video is age-restricted and cannot be processed.",
      "age-restricted": "This video is age-restricted and cannot be processed.",
      
      // Technical Issues
      "network timeout": "Network error while downloading. Please try again.",
      "network error": "Network error while downloading. Please try again.",
      "connection timeout": "Network error. Please try again.",
      "conversion failed": "Failed to process this audio. Please try again.",
      "upload failed": "Failed to store the audio file. Please try again.",
      "no audio": "This video does not contain an audio track. Please choose another track.",
      "audio track": "No suitable audio track found. Please choose another track.",
      
      // Duration Issues
      "too short": "This track is too short for a cassette (minimum 20 seconds).",
      "too long": "This track exceeds the 15-minute cassette limit. Please choose a shorter version.",
    };

    // Check for matching error patterns (case-insensitive)
    const lowerError = asset.error.toLowerCase();
    for (const [pattern, message] of Object.entries(errorMap)) {
      if (lowerError.includes(pattern)) {
        return message;
      }
    }

    // Fallback to generic message
    return "Failed to prepare this audio. Please try again.";
  }

  return "Unable to process this track.";
}

/**
 * Get human-readable status label for UI
 */
export function getStatusLabel(status: MediaAssetStatus): string {
  const labels: Record<MediaAssetStatus, string> = {
    PENDING: "Queued...",
    VALIDATING: "Checking...",
    DOWNLOADING: "Downloading...",
    CONVERTING: "Converting...",
    UPLOADING: "Uploading...",
    READY: "Ready ✓",
    FAILED: "Failed",
    EXPIRED: "Expired",
  };

  return labels[status] || "Processing...";
}

/**
 * Calculate exponential backoff delay for retries
 * Formula: baseDelay * 2^attemptCount, capped at maxDelay
 */
export function calculateBackoffDelay(
  attemptCount: number,
  baseDelayMs: number = 60000, // 1 minute
  maxDelayMs: number = 3600000 // 1 hour
): number {
  const delay = baseDelayMs * Math.pow(2, Math.min(attemptCount, 5)); // Cap at 2^5
  return Math.min(delay, maxDelayMs);
}

/**
 * Determine if a MediaAsset should be retried
 */
export function shouldRetry(
  status: MediaAssetStatus,
  attemptCount: number,
  maxRetries: number = 3
): boolean {
  return status === "FAILED" && attemptCount < maxRetries;
}

/**
 * Clean up expired MediaAssets (older than 30 days, status FAILED or EXPIRED)
 * Called periodically by worker or scheduled job
 */
export async function cleanupExpiredMediaAssets() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const cleaned = await prisma.mediaAsset.deleteMany({
    where: {
      AND: [
        { createdAt: { lt: thirtyDaysAgo } },
        {
          OR: [
            { status: "FAILED" },
            { status: "EXPIRED" },
          ],
        },
      ],
    },
  });

  return cleaned.count;
}
