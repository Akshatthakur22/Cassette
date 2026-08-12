import { NextRequest, NextResponse } from "next/server";
import { searchYouTubeTrack } from "@/app/lib/youtube";
import { checkRateLimit } from "@/app/lib/rate-limit";

export async function GET(request: NextRequest) {
  // Rate limiting: 30 searches per IP per minute
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const rateLimitKey = `search:${ip}`;

  if (!checkRateLimit(rateLimitKey, 30, 60000)) {
    return NextResponse.json(
      { error: "Too many searches. Please try again in a moment." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.trim();
  const artist = searchParams.get("artist")?.trim();

  if (!title) {
    return NextResponse.json({ error: "title query param required" }, { status: 400 });
  }

  try {
    const results = await searchYouTubeTrack(title, artist ?? undefined);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
