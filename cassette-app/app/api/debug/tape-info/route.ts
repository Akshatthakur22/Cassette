/**
 * GET /api/debug/tape-info?publicId=xxxxx
 * Debug endpoint to check tape details
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const publicId = req.nextUrl.searchParams.get("publicId");

    if (!publicId) {
      return NextResponse.json({ error: "publicId required" }, { status: 400 });
    }

    const tape = await prisma.tape.findUnique({
      where: { publicId },
      include: {
        tracks: {
          select: {
            id: true,
            title: true,
            providerTrackId: true,
            side: true,
          },
        },
      },
    });

    if (!tape) {
      return NextResponse.json({ error: "Tape not found" }, { status: 404 });
    }

    // Get status of each track
    const trackStatuses = await Promise.all(
      tape.tracks.map(async (track) => {
        const asset = await prisma.mediaAsset.findUnique({
          where: { id: track.providerTrackId },
          select: { status: true, error: true, storageKey: true },
        });
        return {
          ...track,
          assetStatus: asset?.status,
          assetError: asset?.error,
          hasStorage: !!asset?.storageKey,
        };
      })
    );

    return NextResponse.json({
      tape: {
        id: tape.id,
        publicId: tape.publicId,
        status: tape.status,
        trackCount: tape.tracks.length,
      },
      tracks: trackStatuses,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
