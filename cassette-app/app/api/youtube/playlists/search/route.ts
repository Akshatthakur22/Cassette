import { NextRequest, NextResponse } from "next/server";
import { searchPlaylists } from "@/app/lib/youtube";

/**
 * GET /api/youtube/playlists/search?q=query
 * Search for YouTube playlists by name
 */
export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const playlists = await searchPlaylists(query);

    return NextResponse.json({
      ok: true,
      count: playlists.length,
      playlists,
    });
  } catch (error) {
    console.error("Playlist search error:", error);
    return NextResponse.json(
      { error: "Failed to search playlists" },
      { status: 500 }
    );
  }
}
