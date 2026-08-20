import { NextRequest, NextResponse } from "next/server";
import { downloadYouTubeAudio } from "@/app/lib/downloader";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { videoId } = body;

    if (!videoId || typeof videoId !== "string") {
      return NextResponse.json(
        { error: "videoId is required" },
        { status: 400 }
      );
    }

    const result = await downloadYouTubeAudio(videoId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/download] Error downloading audio:", error);
    return NextResponse.json(
      { error: "Failed to download audio", details: String(error) },
      { status: 500 }
    );
  }
}
