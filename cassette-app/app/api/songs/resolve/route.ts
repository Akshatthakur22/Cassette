import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { downloadYouTubeAudio } from "@/app/lib/downloader";
import { audioFileExists } from "@/lib/storage/audio-storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { videoId, title, artist, thumbnailUrl, durationSec } = body;

    if (!videoId || typeof videoId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_VIDEO_ID",
            message: "videoId is required and must be a valid string",
          },
        },
        { status: 400 }
      );
    }

    const sanitizedId = videoId.trim().replace(/[^a-zA-Z0-9_-]/g, "");
    if (!sanitizedId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_VIDEO_ID",
            message: "Invalid YouTube videoId format",
          },
        },
        { status: 400 }
      );
    }

    // 1. Check database for existing song record
    let song = await prisma.song.findUnique({
      where: { videoId: sanitizedId },
    });

    // 2. Check if already ready and audio file actually exists on storage
    if (song && song.status === "READY") {
      let exists = await audioFileExists(sanitizedId, "mp3");
      if (!exists) exists = await audioFileExists(sanitizedId, "m4a");
      if (!exists) exists = await audioFileExists(sanitizedId, "webm");
      if (!exists) exists = await audioFileExists(sanitizedId, "opus");

      if (exists) {
        // Track play / access
        prisma.song
          .update({
            where: { id: song.id },
            data: {
              downloadCount: { increment: 1 },
              lastPlayedAt: new Date(),
            },
          })
          .catch(() => {});

        return NextResponse.json({
          success: true,
          cached: true,
          song: {
            id: song.id,
            videoId: song.videoId,
            title: song.title,
            artist: song.artist,
            thumbnailUrl: song.thumbnailUrl,
            durationSec: song.durationSec,
            audioUrl: `/api/audio/${sanitizedId}`,
            status: song.status,
          },
        });
      }

      console.warn(
        `[SongResolver] Record was READY but audio file was missing on disk for ${sanitizedId}. Re-downloading.`
      );
    }

    // 3. Create or mark as DOWNLOADING
    song = await prisma.song.upsert({
      where: { videoId: sanitizedId },
      update: {
        status: "DOWNLOADING",
        errorMessage: null,
      },
      create: {
        videoId: sanitizedId,
        title: title || "Audio Track",
        artist: artist || "YouTube",
        thumbnailUrl:
          thumbnailUrl || `https://i.ytimg.com/vi/${sanitizedId}/hqdefault.jpg`,
        durationSec: typeof durationSec === "number" ? durationSec : null,
        status: "DOWNLOADING",
      },
    });

    // 4. Execute download
    try {
      const result = await downloadYouTubeAudio(sanitizedId, {
        title: title || song.title,
        artist: artist || song.artist || undefined,
        thumbnailUrl: thumbnailUrl || song.thumbnailUrl || undefined,
        durationSec: durationSec || song.durationSec || undefined,
      });

      // 5. Update DB to READY
      const updatedSong = await prisma.song.update({
        where: { id: song.id },
        data: {
          title: result.title,
          artist: result.artist,
          thumbnailUrl: result.thumbnailUrl,
          durationSec: result.durationSec || song.durationSec,
          audioUrl: result.audioUrl,
          audioPath: result.audioUrl,
          mimeType: result.mimeType,
          fileSizeBytes: result.fileSizeBytes,
          status: "READY",
          downloadCount: { increment: 1 },
          lastPlayedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        cached: false,
        song: {
          id: updatedSong.id,
          videoId: updatedSong.videoId,
          title: updatedSong.title,
          artist: updatedSong.artist,
          thumbnailUrl: updatedSong.thumbnailUrl,
          durationSec: updatedSong.durationSec,
          audioUrl: updatedSong.audioUrl,
          status: updatedSong.status,
        },
      });
    } catch (downloadErr) {
      console.error(`[SongResolver] Download failed for ${sanitizedId}:`, downloadErr);

      await prisma.song.update({
        where: { id: song.id },
        data: {
          status: "FAILED",
          errorMessage: String(downloadErr),
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "AUDIO_RESOLUTION_FAILED",
            message: "Unable to extract audio stream for this track.",
            details: String(downloadErr),
          },
        },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("[SongResolver] Fatal API error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error resolving song.",
        },
      },
      { status: 500 }
    );
  }
}
