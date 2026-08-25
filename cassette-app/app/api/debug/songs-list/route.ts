/**
 * GET /api/debug/songs-list
 * Get list of all songs in database with stats
 */

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "READY";
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const skip = parseInt(url.searchParams.get("skip") || "0");

    // Get songs
    const songs = await prisma.mediaAsset.findMany({
      where: { status },
      select: {
        id: true,
        title: true,
        artist: true,
        durationSec: true,
        fileSize: true,
        storageKey: true,
        status: true,
      },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
    });

    // Get stats by status
    const stats = await prisma.mediaAsset.groupBy({
      by: ["status"],
      _count: true,
    });

    // Calculate total storage
    const storageStats = await prisma.mediaAsset.aggregate({
      where: { status: "READY" },
      _sum: {
        fileSize: true,
      },
    });

    const totalBytes = storageStats._sum.fileSize || 0;
    const totalGB = (totalBytes / 1024 / 1024 / 1024).toFixed(2);

    return NextResponse.json({
      pagination: {
        skip,
        limit,
        returned: songs.length,
        total: stats.find((s) => s.status === status)?._count || 0,
      },
      stats: {
        byStatus: stats,
        totalStorageGB: parseFloat(totalGB),
      },
      songs,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
