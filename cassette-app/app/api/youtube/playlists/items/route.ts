import { NextRequest, NextResponse } from "next/server";
import { fetchPlaylistItems, getVideoDuration } from "@/app/lib/youtube";

/**
 * GET /api/youtube/playlists/items?playlistId=ID
 * Fetch all items from a YouTube playlist
 */
export async function GET(request: NextRequest) {
  try {
    const playlistId = request.nextUrl.searchParams.get("playlistId");

    if (!playlistId || playlistId.trim().length === 0) {
      return NextResponse.json(
        { error: "Query parameter 'playlistId' is required" },
        { status: 400 }
      );
    }

    const items = await fetchPlaylistItems(playlistId, 24);

    if (items.length === 0) {
      return NextResponse.json(
        { error: "No items found in playlist or invalid playlist ID" },
        { status: 404 }
      );
    }

    // Fetch durations for all videos (batch is more efficient but we'll do sequential for now)
    const itemsWithDuration = await Promise.all(
      items.map(async (item) => ({
        ...item,
        durationSec: await getVideoDuration(item.videoId),
      }))
    );

    return NextResponse.json({
      ok: true,
      playlistId,
      count: itemsWithDuration.length,
      items: itemsWithDuration,
    });
  } catch (error) {
    console.error("Playlist items fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist items" },
      { status: 500 }
    );
  }
}
