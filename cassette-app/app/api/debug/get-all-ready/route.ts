/**
 * GET /api/debug/get-all-ready
 * Get all READY songs for creating tapes
 */

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const skip = parseInt(url.searchParams.get("skip") || "0");
    const search = url.searchParams.get("search");

    let query: any = { status: "READY" };

    if (search) {
      query.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.mediaAsset.count({
      where: query,
    });

    const songs = await prisma.mediaAsset.findMany({
      where: query,
      select: { id: true, title: true, storageKey: true, durationSec: true },
      skip,
      take: Math.min(limit, 100), // Cap at 100 per request
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      count: songs.length,
      total: totalCount,
      limit,
      skip,
      hasMore: skip + songs.length < totalCount,
      songs,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
