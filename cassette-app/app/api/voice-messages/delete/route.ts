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

    if (!tape?.voiceMessageUrl) {
      return NextResponse.json(
        { error: "No voice message found" },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    const filename = tape.voiceMessageUrl.split("/").pop();
    const filepath = join(process.cwd(), "public", "voice-messages", filename!);

    try {
      await unlink(filepath);
    } catch {
      // File might not exist, continue
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
