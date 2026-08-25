/**
 * POST /api/media-assets/bulk-upload
 * 
 * Endpoint for bulk downloading songs from CSV
 * Called by scripts/bulk-download-songs.js
 * 
 * This endpoint:
 * 1. Checks if song already exists in database
 * 2. Creates new MediaAsset if needed
 * 3. Triggers background worker to download & upload to R2
 * 4. Returns media asset ID immediately (for progress tracking)
 * 
 * Request body:
 * {
 *   videoId: string,        // YouTube video ID
 *   title: string,          // Song title
 *   artist?: string,        // Artist/channel name
 *   durationSec?: number,   // Duration in seconds
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   mediaAssetId: string,
 *   status: "PENDING" | "READY",
 *   message: string,
 *   fileSize?: number,      // Only if already READY
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import {
  createMediaAsset,
  findExistingMediaAsset,
  triggerMediaAssetProcessing,
} from "@/app/lib/media-asset";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoId, title, artist, durationSec } = body;

    // ──── VALIDATION ────────────────────────────────────────────────────
    if (!videoId || !title) {
      return NextResponse.json(
        { 
          error: "Missing required fields: videoId, title",
          success: false 
        },
        { status: 400 }
      );
    }

    // ──── CHECK FOR DUPLICATES ──────────────────────────────────────────
    const existing = await findExistingMediaAsset(videoId);
    
    if (existing) {
      // Song already in database - return existing record
      return NextResponse.json(
        {
          success: true,
          mediaAssetId: existing.id,
          status: existing.status,
          message: `Song already in database (status: ${existing.status})`,
          fileSize: existing.fileSize,
        },
        { status: 200 }
      );
    }

    // ──── CREATE NEW MEDIA ASSET ────────────────────────────────────────
    const mediaAsset = await createMediaAsset(
      videoId,
      title.substring(0, 200),
      artist?.substring(0, 100) || null,
      durationSec || 0
    );

    console.log("[bulk-upload] Created MediaAsset:", {
      mediaAssetId: mediaAsset.id,
      videoId,
      title,
      artist,
      durationSec,
    });

    // ──── TRIGGER IMMEDIATE PROCESSING ──────────────────────────────────
    // Try to trigger worker immediately, but don't fail if it doesn't work
    triggerMediaAssetProcessing(mediaAsset.id).catch((err) => {
      console.warn("[bulk-upload] Worker trigger failed, will retry later:", err);
    });

    // ──── RETURN SUCCESS ────────────────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        mediaAssetId: mediaAsset.id,
        status: "PENDING",
        message: "Song queued for processing",
        fileSize: 0,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("[bulk-upload] Error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false 
      },
      { status: 500 }
    );
  }
}
