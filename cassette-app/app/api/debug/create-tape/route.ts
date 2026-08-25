/**
 * POST /api/debug/create-tape
 * Create a new cassette tape with tracks
 * Used for testing and demo purposes
 */

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      senderName,
      recipientName,
      relationship = "best_friend",
      style = "classic",
      visibility = "public",
      title,
      dedication,
      tracks = [],
    } = body;

    if (!senderName || tracks.length === 0) {
      return NextResponse.json(
        { error: "senderName and tracks required" },
        { status: 400 }
      );
    }

    console.log(`[create-tape] Creating tape with ${tracks.length} tracks`);

    // Create tape
    const tape = await prisma.tape.create({
      data: {
        publicId: nanoid(),
        draftToken: nanoid(),
        senderName,
        recipientName: recipientName || undefined,
        relationship,
        style,
        visibility,
        status: "published",
        title: title || undefined,
        dedication: dedication || undefined,
        tracks: {
          create: tracks.map((track: any, idx: number) => ({
            title: track.title,
            provider: track.provider || "youtube",
            providerTrackId: track.providerTrackId,
            mediaAssetId: track.mediaAssetId,
            side: track.side || (idx < Math.ceil(tracks.length / 2) ? "A" : "B"),
            position: track.position !== undefined ? track.position : idx % 2,
          })),
        },
      },
      include: {
        tracks: {
          select: {
            id: true,
            title: true,
            side: true,
            providerTrackId: true,
          },
        },
      },
    });

    console.log(
      `[create-tape] Created tape ${tape.id} with ${tape.tracks.length} tracks`
    );

    return NextResponse.json({
      success: true,
      tapeId: tape.id,
      publicId: tape.publicId,
      tracksCount: tape.tracks.length,
      tracks: tape.tracks,
      shareUrl: `/t/${tape.publicId}`,
      message: `Cassette "${title}" created successfully!`,
    });
  } catch (error) {
    console.error("[create-tape] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
