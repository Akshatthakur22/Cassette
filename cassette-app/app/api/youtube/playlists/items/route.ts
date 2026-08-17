import { NextRequest, NextResponse } from "next/server";
import { fetchPlaylistItems } from "@/app/lib/youtube";
import { parseISO8601Duration } from "@/app/lib/youtube-enhanced";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.YOUTUBE_API_KEY;

/**
 * Batch fetch video durations from YouTube API
 * Groups up to 50 video IDs per request for efficient quota usage
 */
async function batchFetchDurations(videoIds: string[]): Promise<Record<string, number>> {
  if (videoIds.length === 0) return {};

  const durations: Record<string, number> = {};

  // Fetch in batches of 50 (YouTube API limit)
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const params = new URLSearchParams({
      part: "contentDetails",
      id: batch.join(","),
      key: API_KEY!,
    });

    try {
      const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`, {
        headers: { "User-Agent": "Cassette/2.0" },
      });

      if (!response.ok) {
        console.error(`Duration fetch error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      (data.items || []).forEach((item: any) => {
        if (item.id && item.contentDetails?.duration) {
          durations[item.id] = parseISO8601Duration(item.contentDetails.duration);
        }
      });
    } catch (error) {
      console.error("Error fetching durations:", error);
    }
  }

  return durations;
}

/**
 * GET /api/youtube/playlists/items?playlistId=ID
 * Fetch all items from a YouTube playlist with efficient batch duration fetching
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

    // Extract all video IDs and batch fetch durations (single/few API calls instead of 24)
    const videoIds = items.map((item) => item.videoId);
    const durations = await batchFetchDurations(videoIds);

    // Attach durations to items
    const itemsWithDuration = items.map((item) => ({
      ...item,
      durationSec: durations[item.videoId] || null,
    }));

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
