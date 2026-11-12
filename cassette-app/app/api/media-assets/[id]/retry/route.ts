/**
 * POST /api/media-assets/[id]/retry
 * Retry a failed media asset processing job
 * Resets status to PENDING and schedules next attempt with exponential backoff
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { scheduleMediaAssetProcessing } from "@/app/lib/media-asset";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mediaAssetId } = await params;

    if (!mediaAssetId || typeof mediaAssetId !== "string") {
      return NextResponse.json(
        { error: "Invalid media asset ID" },
        { status: 400 }
      );
    }

    const asset = await prisma.mediaAsset.findUnique({
      where: { id: mediaAssetId },
      select: {
        id: true,
        status: true,
        attemptCount: true,
      },
    });

    if (!asset) {
      return NextResponse.json(
        { error: "Media asset not found" },
        { status: 404 }
      );
    }

    const maxRetries = parseInt(process.env.MAX_RETRIES || "3", 10);

    if (asset.status !== "FAILED" || asset.attemptCount >= maxRetries) {
      return NextResponse.json(
        {
          error: `Cannot retry: status is ${asset.status}. Max retries (${maxRetries}) may have been exceeded.`,
        },
        { status: 400 }
      );
    }

    // An explicit user retry should start now, not wait for the automatic
    // exponential backoff used for worker failures.
    const updated = await prisma.mediaAsset.update({
      where: { id: mediaAssetId },
      data: {
        status: "PENDING",
        nextAttemptAt: null,
        error: null,
        errorDetails: null,
      },
      select: {
        id: true,
        status: true,
        attemptCount: true,
        nextAttemptAt: true,
      },
    });

    console.log("[media-assets retry] Starting retry:", {
      mediaAssetId,
      attemptCount: updated.attemptCount,
    });

    scheduleMediaAssetProcessing(mediaAssetId);

    return NextResponse.json({
      ok: true,
      id: updated.id,
      status: updated.status,
      attemptCount: updated.attemptCount,
      nextAttemptAt: updated.nextAttemptAt,
    });

  } catch (error) {
    console.error("[media-assets retry] Error:", error);
    return NextResponse.json(
      { error: "Failed to schedule retry" },
      { status: 500 }
    );
  }
}
