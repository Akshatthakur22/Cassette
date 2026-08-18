/**
 * Delete voice message
 */

import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { join } from "path";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { tapeId } = await request.json();

    if (!tapeId) {
      return NextResponse.json({ error: "Missing tapeId" }, { status: 400 });
    }

    const tape = await prisma.tape.findUnique({
      where: { id: tapeId },
      select: { voiceMessageUrl: true },
    });
    const voiceTrack = await prisma.tapeTrack.findFirst({
      where: { tapeId, provider: "voice" },
      select: {
        id: true,
        providerTrackId: true,
        side: true,
      },
    });

    if (!tape?.voiceMessageUrl && !voiceTrack) {
      return NextResponse.json(
        { error: "No voice message found" },
        { status: 404 }
      );
    }

    // Delete file from filesystem. Prefer the stored URL, then fall back to the voice track ID.
    const filename =
      tape?.voiceMessageUrl?.split("/").pop() ??
      (voiceTrack?.providerTrackId ? `${voiceTrack.providerTrackId}.webm` : null);
    const filepath = filename
      ? join(process.cwd(), "public", "voice-recordings", filename)
      : null;

    if (filepath) {
      try {
        await unlink(filepath);
      } catch {
        // File might not exist, continue.
      }
    }

    if (voiceTrack) {
      await prisma.tapeTrack.deleteMany({
        where: { tapeId, provider: "voice" },
      });

      const remainingTracks = await prisma.tapeTrack.findMany({
        where: { tapeId, side: voiceTrack.side },
        orderBy: { position: "asc" },
      });

      await Promise.all(
        remainingTracks.map((track, index) =>
          prisma.tapeTrack.update({
            where: { id: track.id },
            data: { position: index },
          })
        )
      );
    }

    // Clear database record
    await prisma.tape.update({
      where: { id: tapeId },
      data: {
        voiceMessageUrl: null,
        voiceMessageSize: null,
        voiceMessageDuration: null,
        voiceMessageMimeType: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Voice delete error:", error);
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}
