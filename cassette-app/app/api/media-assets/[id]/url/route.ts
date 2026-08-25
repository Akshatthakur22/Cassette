/**
 * GET /api/media-assets/[id]/url
 * Returns a signed/public URL for playing a processed media asset
 * Only returns URL if status is READY
 * Frontend uses this to get playback URL from R2 storage
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getR2Service } from "@/lib/storage/R2Service";

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
        storageKey: true,
        durationSec: true,
      },
    });

    if (!asset) {
      return NextResponse.json(
        { error: "Media asset not found" },
        { status: 404 }
      );
    }

    if (asset.status !== "READY") {
      return NextResponse.json(
        { error: `Media asset is not ready (status: ${asset.status})` },
        { status: 400 }
      );
    }

    if (!asset.storageKey) {
      return NextResponse.json(
        { error: "Storage key not available" },
        { status: 500 }
      );
    }

    try {
      // Try to get presigned URL (1 hour expiration)
      const r2Service = getR2Service();
      const urlResult = await r2Service.getSignedPlaybackUrl(asset.storageKey, 3600);

      if (!urlResult.success || !urlResult.url) {
        // Fallback to public URL if presigned URL fails
        const publicUrl = r2Service.getPublicUrl(asset.storageKey);
        return NextResponse.json({
          id: asset.id,
          url: publicUrl,
          durationSec: asset.durationSec,
          expiresIn: null, // Public URL doesn't expire
        });
      }

      return NextResponse.json({
        id: asset.id,
        url: urlResult.url,
        durationSec: asset.durationSec,
        expiresAt: urlResult.expiresAt,
        expiresIn: 3600,
      });
    } catch (error) {
      console.error("[media-assets url] R2 error:", error);

      // Fallback: Try public URL
      const r2PublicUrl = process.env.R2_PUBLIC_BASE_URL;
      if (r2PublicUrl) {
        const publicUrl = `${r2PublicUrl}/${asset.storageKey}`;
        return NextResponse.json({
          id: asset.id,
          url: publicUrl,
          durationSec: asset.durationSec,
          expiresIn: null,
        });
      }

      return NextResponse.json(
        { error: "Failed to generate playback URL" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[media-assets url] Error:", error);
    return NextResponse.json(
      { error: "Failed to get playback URL" },
      { status: 500 }
    );
  }
}
