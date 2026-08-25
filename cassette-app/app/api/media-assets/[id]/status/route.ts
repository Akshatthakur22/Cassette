/**
 * GET /api/media-assets/[id]/status
 * Returns the current processing status of a MediaAsset
 * Used for client-side polling during track processing
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(
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
        error: true,
        attemptCount: true,
        fileSize: true,
        storageKey: true,
        processedAt: true,
        durationSec: true,
      },
    });

    if (!asset) {
      return NextResponse.json(
        { error: "Media asset not found" },
        { status: 404 }
      );
    }

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

    const progress = progressMap[asset.status] || 0;

    return NextResponse.json({
      id: asset.id,
      status: asset.status,
      error: asset.error,
      progress,
      attemptCount: asset.attemptCount,
      fileSize: asset.fileSize,
      storageKey: asset.storageKey,
      processedAt: asset.processedAt,
      durationSec: asset.durationSec,
    });
  } catch (error) {
    console.error("[media-assets status] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}
