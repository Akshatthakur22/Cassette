/**
 * POST /api/media-assets/upload
 * Fast-track upload endpoint for direct MP3 uploads
 * Bypasses background worker - files are immediately available for playback
 * Useful for: manual downloads, user-provided files, testing
 * 
 * Request: multipart/form-data
 * Fields:
 *   - file: MP3 audio file (required, max 50MB)
 *   - title: Song title (required)
 *   - artist: Artist name (optional)
 *   - durationSec: Duration in seconds (optional, auto-detected if not provided)
 * 
 * Response:
 * {
 *   success: boolean
 *   mediaAssetId: string
 *   title: string
 *   playbackUrl: string (presigned URL for immediate playback)
 *   storageKey: string
 *   fileSize: number
 *   status: "READY"
 *   error?: string (if failed)
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { prisma } from "@/app/lib/prisma";
import { createR2ClientFromEnv } from "@/app/services/media-worker/storage";
import { validateMP3, calculateChecksum, getFileSize } from "@/app/services/media-worker/ffmpeg";
import { getAudioDuration } from "@/app/services/media-worker/youtube";
import { nanoid } from "nanoid";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const TEMP_DIR = "/tmp/cassette-direct-upload";

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;

  try {
    console.log("[DIRECT_UPLOAD] Starting direct MP3 upload...");

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const artist = formData.get("artist") as string;
    const durationSecStr = formData.get("durationSec") as string;

    // Validation
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
        },
        { status: 400 }
      );
    }

    if (!file.type.includes("audio") && !file.name.endsWith(".mp3")) {
      return NextResponse.json(
        { success: false, error: "File must be an MP3 audio file" },
        { status: 400 }
      );
    }

    console.log(`[DIRECT_UPLOAD] File: ${file.name} (${file.size} bytes)`);
    console.log(`[DIRECT_UPLOAD] Title: ${title}`);

    // Create temp file
    const tempFileName = `${nanoid()}.mp3`;
    tempFilePath = join(TEMP_DIR, tempFileName);

    const buffer = await file.arrayBuffer();
    await writeFile(tempFilePath, Buffer.from(buffer));

    console.log(`[DIRECT_UPLOAD] Temp file created: ${tempFilePath}`);

    // Validate MP3
    console.log("[DIRECT_UPLOAD] Validating MP3 file...");
    const mp3Validation = await validateMP3(tempFilePath);

    if (!mp3Validation.valid) {
      console.error("[DIRECT_UPLOAD] MP3 validation failed:", mp3Validation.error);
      return NextResponse.json(
        {
          success: false,
          error: `Invalid MP3 file: ${mp3Validation.error}`,
        },
        { status: 400 }
      );
    }

    // Calculate duration
    let durationSec = parseInt(durationSecStr || "0", 10);
    if (durationSec <= 0 && mp3Validation.duration) {
      durationSec = mp3Validation.duration;
    }
    if (durationSec <= 0) {
      durationSec = getAudioDuration(tempFilePath);
    }

    console.log(`[DIRECT_UPLOAD] Duration: ${durationSec}s`);

    // Calculate checksum and file size
    const checksum = calculateChecksum(tempFilePath);
    const fileSize = getFileSize(tempFilePath);

    console.log(`[DIRECT_UPLOAD] Checksum: ${checksum}`);
    console.log(`[DIRECT_UPLOAD] File size: ${fileSize} bytes`);

    // Create MediaAsset in database (status: READY immediately)
    const mediaAssetId = nanoid();
    const storageKey = `media-assets/${mediaAssetId}.mp3`;

    console.log(`[DIRECT_UPLOAD] Creating MediaAsset: ${mediaAssetId}`);

    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        id: mediaAssetId,
        provider: "manual",
        providerTrackId: `manual-${mediaAssetId}`,
        title,
        artist: artist || null,
        durationSec,
        status: "READY", // Immediately ready
        storageKey,
        fileSize,
        checksum,
        bitrate: 128,
        mimeType: "audio/mpeg",
        processedAt: new Date(),
        attemptCount: 0,
      },
    });

    console.log(`[DIRECT_UPLOAD] MediaAsset created: ${mediaAsset.id}`);

    // Upload to R2
    console.log("[DIRECT_UPLOAD] Uploading to R2...");
    const r2 = createR2ClientFromEnv();

    if (!r2) {
      console.error("[DIRECT_UPLOAD] R2 not configured");
      return NextResponse.json(
        { success: false, error: "R2 storage not configured" },
        { status: 500 }
      );
    }

    try {
      const uploadResult = await r2.uploadMP3(tempFilePath, mediaAssetId);

      if (!uploadResult.success) {
        console.error("[DIRECT_UPLOAD] R2 upload failed:", uploadResult.error);
        // Delete MediaAsset since upload failed
        await prisma.mediaAsset.delete({ where: { id: mediaAssetId } });

        return NextResponse.json(
          { success: false, error: `R2 upload failed: ${uploadResult.error}` },
          { status: 500 }
        );
      }

      console.log("[DIRECT_UPLOAD] R2 upload successful");

      // Get presigned playback URL
      const { getSignedPlaybackUrl } = require("@/lib/storage/R2Service");
      const r2Service = getSignedPlaybackUrl ? 
        await getSignedPlaybackUrl(storageKey, 3600) : 
        { url: null };

      const playbackUrl = r2Service?.url || 
        `https://cassette-share.vercel.app/api/media-assets/${mediaAssetId}/stream`;

      console.log("[DIRECT_UPLOAD] Upload complete");

      return NextResponse.json(
        {
          success: true,
          mediaAssetId,
          title,
          artist: artist || null,
          playbackUrl,
          storageKey,
          fileSize,
          durationSec,
          status: "READY",
          message: "File uploaded and ready to play immediately",
        },
        { status: 201 }
      );
    } catch (r2Error) {
      console.error("[DIRECT_UPLOAD] R2 operation failed:", r2Error);
      // Delete MediaAsset since upload failed
      await prisma.mediaAsset.delete({ where: { id: mediaAssetId } });

      return NextResponse.json(
        { success: false, error: `R2 error: ${String(r2Error)}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[DIRECT_UPLOAD] Error:", error);
    return NextResponse.json(
      { success: false, error: `Upload failed: ${String(error)}` },
      { status: 500 }
    );
  } finally {
    // Cleanup temp file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
        console.log("[DIRECT_UPLOAD] Temp file cleaned up");
      } catch (cleanupError) {
        console.warn("[DIRECT_UPLOAD] Cleanup error:", cleanupError);
      }
    }
  }
}

/**
 * GET /api/media-assets/upload
 * Get upload status and requirements
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      status: "available",
      endpoint: "/api/media-assets/upload",
      method: "POST",
      contentType: "multipart/form-data",
      maxFileSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
      requirements: {
        file: "MP3 audio file (required)",
        title: "Song title (required)",
        artist: "Artist name (optional)",
        durationSec: "Duration in seconds (optional, auto-detected if missing)",
      },
      example: {
        curl: `curl -X POST http://localhost:3000/api/media-assets/upload \\
  -F "file=@song.mp3" \\
  -F "title=Song Title" \\
  -F "artist=Artist Name"`,
      },
    },
    { status: 200 }
  );
}
