/**
 * GET /api/debug/media-assets
 * Debug endpoint to see all media assets and their statuses
 */

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    // Get status counts
    const stats = await prisma.mediaAsset.groupBy({
      by: ["status"],
      _count: true,
    });

    // Get samples of each status
    const ready = await prisma.mediaAsset.findMany({
      where: { status: "READY" },
      select: { id: true, title: true, storageKey: true },
      take: 10,
    });

    const failed = await prisma.mediaAsset.findMany({
      where: { status: "FAILED" },
      select: { id: true, title: true, error: true },
      take: 3,
    });

    const pending = await prisma.mediaAsset.findMany({
      where: { status: "PENDING" },
      select: { id: true, title: true },
      take: 3,
    });

    return NextResponse.json({
      summary: stats,
      ready: {
        count: ready.length,
        samples: ready,
      },
      failed: {
        count: failed.length,
        samples: failed,
      },
      pending: {
        count: pending.length,
        samples: pending,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
