import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { nanoid } from "nanoid";

/**
 * POST /api/upload-voice-recording
 * Upload and process voice recordings
 * 
 * Expected body:
 * - FormData with:
 *   - audio: File blob (webm/mp4/wav)
 *   - tapeId: string (tape ID)
 */

const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "audio/webm",
  "audio/mp4",
  "audio/wav",
  "audio/ogg",
  "audio/mpeg",
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const tapeId = formData.get("tapeId") as string | null;

    // Validation
    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    if (!tapeId) {
      return NextResponse.json(
        { error: "No tape ID provided" },
        { status: 400 }
      );
    }

    // Check file size
    if (audioFile.size > MAX_AUDIO_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_AUDIO_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      );
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.some((type) => audioFile.type.startsWith(type))) {
      return NextResponse.json(
        { error: `Unsupported audio format: ${audioFile.type}` },
        { status: 415 }
      );
    }

    // Verify tape exists
    const tape = await prisma.tape.findUnique({
      where: { id: tapeId },
      select: { id: true },
    });

    if (!tape) {
      return NextResponse.json(
        { error: "Tape not found" },
        { status: 404 }
      );
    }

    // Get the highest position for side A
    const lastTrack = await prisma.tapeTrack.findFirst({
      where: { tapeId: tapeId, side: "A" },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const nextPosition = (lastTrack?.position ?? -1) + 1;

    // Create track entry in database
    const trackId = nanoid();
    
    const track = await prisma.tapeTrack.create({
      data: {
        id: trackId,
        tapeId: tapeId,
        title: `Voice Recording - ${new Date().toLocaleTimeString()}`,
        artist: "You",
        provider: "voice",
        providerTrackId: trackId,
        side: "A",
        position: nextPosition,
        durationSec: await estimateAudioDuration(audioFile),
      },
    });

    return NextResponse.json({
      success: true,
      trackId: track.id,
      title: track.title,
      duration: track.durationSec,
    });
  } catch (error) {
    console.error("Voice recording upload error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to upload voice recording" },
      { status: 500 }
    );
  }
}

/**
 * Estimate audio duration from file
 * This is a rough estimation; ideally use a library like audio-metadata or ffmpeg
 */
async function estimateAudioDuration(audioFile: File): Promise<number> {
  try {
    // Fallback: estimate based on file size and bitrate
    // For more accurate duration, you'd need to use a library or decode the audio
    // Average bitrate ~128kbps for compressed audio
    const fileSizeInBits = audioFile.size * 8;
    const avgBitrate = 128000;
    return Math.round(fileSizeInBits / avgBitrate);
  } catch (error) {
    console.warn("Could not estimate audio duration:", error);
    
    // Fallback estimate (assume 128kbps)
    const fileSizeInBits = audioFile.size * 8;
    const avgBitrate = 128000;
    return Math.round(fileSizeInBits / avgBitrate);
  }
}
