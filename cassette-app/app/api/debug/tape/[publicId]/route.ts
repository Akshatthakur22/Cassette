import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params;

    // Test database connection
    const dbConnected = await prisma.$queryRaw`SELECT 1 as result`
      .then(() => true)
      .catch((err) => {
        console.error("DB connection test failed:", err);
        return false;
      });

    // Try to find the tape
    const tape = await prisma.tape.findUnique({
      where: { publicId },
      include: {
        tracks: { orderBy: [{ side: "asc" }, { position: "asc" }] },
      },
    });

    return NextResponse.json({
      debug: {
        timestamp: new Date().toISOString(),
        publicId,
        dbConnected,
        env: {
          DATABASE_URL_exists: !!process.env.DATABASE_URL,
          NODE_ENV: process.env.NODE_ENV,
          NEXT_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN,
        },
        tape: tape
          ? {
              id: tape.id,
              publicId: tape.publicId,
              status: tape.status,
              title: tape.title,
              senderName: tape.senderName,
              trackCount: tape.tracks.length,
              createdAt: tape.createdAt,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Debug route error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
