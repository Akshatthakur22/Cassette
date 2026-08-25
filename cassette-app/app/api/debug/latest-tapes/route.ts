/**
 * GET /api/debug/latest-tapes
 * Get the latest created tapes
 */

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const tapes = await prisma.tape.findMany({
      where: { status: "published", visibility: "public" },
      select: {
        id: true,
        publicId: true,
        title: true,
        senderName: true,
        dedication: true,
        createdAt: true,
        _count: {
          select: { tracks: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      count: tapes.length,
      tapes: tapes.map((tape) => ({
        ...tape,
        trackCount: tape._count.tracks,
        url: `/t/${tape.publicId}`,
        shareUrl: `http://localhost:3000/t/${tape.publicId}`,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
