/**
 * POST /api/debug/fix-tape
 * Fix the test tape by replacing FAILED tracks with READY ones
 */

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST() {
  try {
    const TAPE_ID = "cmt8gz2aa000cqt5r198vs4il";

    console.log(`[fix-tape] Starting fix for tape ${TAPE_ID}`);

    // Get 4 READY songs
    const readySongs = await prisma.mediaAsset.findMany({
      where: { status: "READY" },
      select: { id: true, title: true },
      take: 4,
    });

    if (readySongs.length < 4) {
      return NextResponse.json(
        { error: "Not enough READY songs available" },
        { status: 400 }
      );
    }

    // Delete old tracks
    await prisma.tapeTrack.deleteMany({
      where: { tapeId: TAPE_ID },
    });

    console.log(`[fix-tape] Deleted old tracks`);

    // Create new tracks
    const newTracks = await Promise.all(
      readySongs.map((song, idx) => {
        const side = idx < 2 ? "A" : "B";
        const position = idx < 2 ? idx : idx - 2;

        return prisma.tapeTrack.create({
          data: {
            tapeId: TAPE_ID,
            title: song.title,
            providerTrackId: song.id,
            mediaAssetId: song.id,  // Direct reference to media asset
            side: side as "A" | "B",
            position,
            provider: "media_asset",  // Mark as media asset, not youtube
          },
        });
      })
    );

    console.log(`[fix-tape] Created ${newTracks.length} new tracks`);

    return NextResponse.json({
      success: true,
      message: "Tape fixed with READY songs",
      tapeId: TAPE_ID,
      tracksUpdated: newTracks.length,
      tracks: newTracks.map((t) => ({
        id: t.id,
        title: t.title,
        side: t.side,
      })),
    });
  } catch (error) {
    console.error("[fix-tape] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
