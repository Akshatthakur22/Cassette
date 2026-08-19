/**
 * Voice message upload handler
 * Stores audio blob to filesystem and creates track record
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { nanoid } from "nanoid";
import { unlink, writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    console.log("[voice-messages/upload] POST request received");

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const tapeId = formData.get("tapeId") as string;

    console.log("[voice-messages/upload] Form data parsed:", {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      filetype: file?.type,
      tapeId,
    });

    if (!file || !tapeId) {
      console.error("[voice-messages/upload] Missing file or tapeId");
      return NextResponse.json(
        { error: "Missing file or tapeId" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      console.error("[voice-messages/upload] File too large:", file.size);
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 413 }
      );
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    console.log("[voice-messages/upload] Buffer created:", buffer.byteLength);

    // Get audio duration - prefer exact duration sent by client
    const clientDurationStr = formData.get("duration") as string | null;
    let duration: number;
    if (clientDurationStr && !isNaN(Number(clientDurationStr)) && Number(clientDurationStr) > 0) {
      duration = Math.min(300, Math.max(1, Math.round(Number(clientDurationStr))));
      console.log("[voice-messages/upload] Using client duration:", duration);
    } else {
      duration = await estimateAudioDuration(buffer);
      console.log("[voice-messages/upload] Using fallback estimated duration:", duration);
    }

    // Get tape to find next track position
    const tape = await prisma.tape.findUnique({
      where: { id: tapeId },
      select: { tracks: { select: { position: true, side: true } } },
    });

    if (!tape) {
      console.error("[voice-messages/upload] Tape not found:", tapeId);
      return NextResponse.json(
        { error: "Tape not found" },
        { status: 404 }
      );
    }

    console.log("[voice-messages/upload] Tape found, current tracks:", tape.tracks.length);

    // Find last position on Side A
    const sideATracks = tape.tracks.filter((t) => t.side === "A");
    const nextPosition = sideATracks.length;

    // Create track record first to get ID
    const trackId = nanoid();
    console.log("[voice-messages/upload] Creating track:", {
      trackId,
      tapeId,
      position: nextPosition,
      duration,
    });

    const existingVoiceTrack = await prisma.tapeTrack.findFirst({
      where: { tapeId, provider: "voice" },
      select: {
        id: true,
        providerTrackId: true,
        side: true,
        position: true,
      },
    });

    // Save audio file to public folder if writable (local dev), otherwise fallback to base64 Data URL (Vercel serverless)
    const filename = `${trackId}.webm`;
    let fileUrl = `/voice-recordings/${filename}`;
    const mimeType = file.type || "audio/webm";
    const base64Data = `data:${mimeType};base64,${Buffer.from(buffer).toString("base64")}`;

    try {
      const voiceDir = join(process.cwd(), "public", "voice-recordings");
      await mkdir(voiceDir, { recursive: true });
      const filepath = join(voiceDir, filename);

      if (existingVoiceTrack?.providerTrackId && existingVoiceTrack.providerTrackId !== trackId && !existingVoiceTrack.providerTrackId.startsWith("data:")) {
        const previousPath = join(voiceDir, `${existingVoiceTrack.providerTrackId}.webm`);
        try {
          await unlink(previousPath);
        } catch {
          // Ignore cleanup failures
        }
      }

      await writeFile(filepath, Buffer.from(buffer));
      console.log("[voice-messages/upload] Audio file saved to disk:", filepath);
    } catch (fsError) {
      console.warn("[voice-messages/upload] Disk write skipped (serverless read-only environment), using base64 data URL:", fsError);
      fileUrl = base64Data;
    }

    const providerTrackId = fileUrl.startsWith("data:") ? fileUrl : trackId;

    const voiceTrackData = {
      tapeId,
      side: existingVoiceTrack?.side ?? "A",
      position: existingVoiceTrack?.position ?? nextPosition,
      title: `Voice Recording - ${new Date().toLocaleTimeString()}`,
      artist: "You",
      provider: "voice",
      providerTrackId,
      durationSec: duration,
      thumbnailUrl: null,
      personalNote: null,
    };

    const track = existingVoiceTrack
      ? await prisma.tapeTrack.update({
          where: { id: existingVoiceTrack.id },
          data: voiceTrackData,
        })
      : await prisma.tapeTrack.create({
          data: {
            id: trackId,
            ...voiceTrackData,
          },
        });

    await prisma.tape.update({
      where: { id: tapeId },
      data: {
        voiceMessageUrl: fileUrl,
        voiceMessageSize: file.size,
        voiceMessageDuration: duration,
        voiceMessageMimeType: file.type || "audio/webm",
      },
    });

    console.log("[voice-messages/upload] Track created successfully");

    return NextResponse.json({
      success: true,
      trackId: track.id,
      title: track.title,
      duration: track.durationSec,
      url: fileUrl,
    });
  } catch (error) {
    console.error("[voice-messages/upload] Error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Estimate audio duration from buffer
 */
async function estimateAudioDuration(buffer: ArrayBuffer): Promise<number> {
  try {
    // Try to parse WebM duration from header
    const byteArray = new Uint8Array(buffer);
    
    // Look for common WebM element patterns
    let estimatedDuration = 0;
    
    // Check for "Segment" element and duration info
    for (let i = 0; i < Math.min(buffer.byteLength, 1000); i++) {
      // Look for VarInt pattern that might be duration
      if (byteArray[i] === 0x44 && byteArray[i + 1] === 0x89) {
        // Found Duration element, next bytes are the duration value
        try {
          const durationBytes = byteArray.slice(i + 2, i + 10);
          let duration = 0;
          for (let j = 0; j < durationBytes.length; j++) {
            duration = (duration << 8) | durationBytes[j];
          }
          estimatedDuration = Math.round(duration / 1000000000); // Convert nanoseconds to seconds
          if (estimatedDuration > 0 && estimatedDuration < 3600) {
            return estimatedDuration;
          }
        } catch {
          // Continue searching
        }
      }
    }
    
    // Fallback: estimate from file size (WebM Opus typically ~16kbps or higher)
    // Most voice recordings are 32-128 kbps
    const estimatedBitrate = 64000; // 64 kbps (conservative estimate)
    const fileSizeInBits = buffer.byteLength * 8;
    const calculatedDuration = Math.round(fileSizeInBits / estimatedBitrate) || 180; // Default 3 min if calc fails
    console.log("[estimateAudioDuration] Using fallback calculation:", {
      bufferSize: buffer.byteLength,
      estimatedBitrate,
      calculatedDuration,
    });
    return calculatedDuration;
  } catch (error) {
    console.error("[estimateAudioDuration] Error:", error);
    // Default to 3 minutes if estimation fails
    return 180;
  }
}
