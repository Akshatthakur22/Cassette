/**
 * POST /api/media-assets/retry
 * Retry a failed MediaAsset by resetting it to PENDING status
 * Allows manual retry of failed audio downloads
 *
 * Request body:
 * {
 *   mediaAssetId: string  (required) - ID of the failed MediaAsset
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   message: string
 *   mediaAssetId: string
 *   newStatus: string
 *   error?: string (if failed)
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { triggerMediaAssetProcessing } from "@/app/lib/media-asset";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { mediaAssetId } = body;

    // Validate input
    if (!mediaAssetId || typeof mediaAssetId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid mediaAssetId provided",
        },
        { status: 400 }
      );
    }

    console.log(`[MEDIA_ASSETS_RETRY] Processing retry request for: ${mediaAssetId}`);

    // Fetch the MediaAsset
    const mediaAsset = await prisma.mediaAsset.findUnique({
      where: { id: mediaAssetId },
      select: {
        id: true,
        status: true,
        title: true,
        error: true,
        attemptCount: true,
      },
    });

    if (!mediaAsset) {
      console.warn(`[MEDIA_ASSETS_RETRY] MediaAsset not found: ${mediaAssetId}`);
      return NextResponse.json(
        {
          success: false,
          error: "MediaAsset not found",
        },
        { status: 404 }
      );
    }

    // Check if asset can be retried
    if (mediaAsset.status !== "FAILED") {
      console.warn(
        `[MEDIA_ASSETS_RETRY] Cannot retry non-FAILED asset: ${mediaAssetId} (status: ${mediaAsset.status})`
      );
      return NextResponse.json(
        {
          success: false,
          error: `Cannot retry asset with status "${mediaAsset.status}". Only FAILED assets can be retried.`,
        },
        { status: 400 }
      );
    }

    // Check if max retries exceeded
    const maxRetries = parseInt(process.env.MAX_RETRIES || "5", 10);
    if (mediaAsset.attemptCount >= maxRetries) {
      console.warn(
        `[MEDIA_ASSETS_RETRY] Max retries exceeded: ${mediaAssetId} (attempts: ${mediaAsset.attemptCount}/${maxRetries})`
      );
      return NextResponse.json(
        {
          success: false,
          error: `Maximum retries (${maxRetries}) exceeded for this asset. Manual intervention required.`,
        },
        { status: 400 }
      );
    }

    console.log(
      `[MEDIA_ASSETS_RETRY] Resetting asset to PENDING: ${mediaAssetId} (previous attempts: ${mediaAsset.attemptCount})`
    );

    // Reset asset to PENDING
    const updatedAsset = await prisma.mediaAsset.update({
      where: { id: mediaAssetId },
      data: {
        status: "PENDING",
        error: null,
        errorDetails: null,
        // Keep attemptCount for exponential backoff
        // nextAttemptAt is handled by worker based on attemptCount
      },
    });

    console.log(`[MEDIA_ASSETS_RETRY] Asset reset to PENDING: ${mediaAssetId}`);

    // Trigger worker immediately
    const triggerResult = await triggerMediaAssetProcessing(mediaAssetId);

    if (triggerResult) {
      console.log(`[MEDIA_ASSETS_RETRY] Worker trigger successful: ${mediaAssetId}`);
    } else {
      console.warn(`[MEDIA_ASSETS_RETRY] Worker trigger failed (but asset was reset): ${mediaAssetId}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Asset reset to PENDING status and worker triggered",
        mediaAssetId: updatedAsset.id,
        newStatus: updatedAsset.status,
        title: updatedAsset.title,
        previousAttempts: mediaAsset.attemptCount,
        workerTriggered: triggerResult,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[MEDIA_ASSETS_RETRY] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to retry asset: ${String(error)}`,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/media-assets/retry
 * Get list of all retryable failed assets
 *
 * Query params:
 * - limit: number (default: 50) - how many to return
 * - offset: number (default: 0) - pagination offset
 *
 * Response:
 * {
 *   success: boolean
 *   retryable: Array<{
 *     id: string
 *     title: string
 *     error: string
 *     attemptCount: number
 *     maxRetries: number
 *   }>
 *   total: number
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

    const maxRetries = parseInt(process.env.MAX_RETRIES || "5", 10);

    console.log(`[MEDIA_ASSETS_RETRY] Fetching retryable assets: limit=${limit}, offset=${offset}`);

    // Get all retryable failed assets
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
      skip: offset,
      take: limit,
    });

    const total = await prisma.mediaAsset.count({
      where: {
        status: "FAILED",
        attemptCount: { lt: maxRetries },
      },
    });

    console.log(`[MEDIA_ASSETS_RETRY] Found ${retryable.length} retryable assets (total: ${total})`);

    return NextResponse.json(
      {
        success: true,
        retryable: retryable.map((asset) => ({
          id: asset.id,
          title: asset.title,
          videoId: asset.providerTrackId,
          error: asset.error,
          attemptCount: asset.attemptCount,
          maxRetries,
          readyForRetry: !asset.nextAttemptAt || asset.nextAttemptAt <= new Date(),
          nextRetryAt: asset.nextAttemptAt,
        })),
        total,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[MEDIA_ASSETS_RETRY] Error fetching retryable assets:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch retryable assets: ${String(error)}`,
      },
      { status: 500 }
    );
  }
}
