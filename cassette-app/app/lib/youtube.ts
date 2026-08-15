/**
 * YouTube API utilities for searching playlists and fetching playlist items
 * Uses YouTube Data API v3
 */

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.YOUTUBE_API_KEY;

// Cache expiration: 24 hours
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

export interface YoutubePlaylist {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  channelTitle?: string;
  itemCount: number;
}

export interface YoutubePlaylistItem {
  videoId: string;
  title: string;
  channelTitle?: string;
  thumbnail?: string;
  position: number;
  durationSec?: number;
}

/**
 * Search for YouTube videos (tracks) by title and optional artist
 */
export async function searchYouTubeTrack(
  title: string,
  artist?: string
): Promise<
  Array<{
    videoId: string;
    title: string;
    channelTitle?: string;
    thumbnailUrl?: string;
    durationSec?: number;
  }>
> {
  if (!API_KEY) {
    throw new Error("YOUTUBE_API_KEY not configured");
  }

  try {
    const query = artist ? `${title} ${artist}` : title;
    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      q: query,
      maxResults: "10",
      key: API_KEY,
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`, {
      headers: {
        "User-Agent": "Cassette/1.0",
      },
    });

    if (!response.ok) {
      console.error(`YouTube API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return [];
    }

    // Extract video IDs for duration lookup
    const videoIds = data.items
      .filter((item: any) => item.id?.videoId)
      .map((item: any) => item.id.videoId)
      .join(",");

    let durations: Record<string, number> = {};

    if (videoIds) {
      const detailsParams = new URLSearchParams({
        part: "contentDetails",
        id: videoIds,
        key: API_KEY,
      });

      const detailsResponse = await fetch(
        `${YOUTUBE_API_BASE}/videos?${detailsParams}`,
        {
          headers: {
            "User-Agent": "Cassette/1.0",
          },
        }
      );

      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json();
        durations = {};
        (detailsData.items || []).forEach((item: any) => {
          const videoId = item.id;
          const duration = item.contentDetails?.duration;
          if (videoId && duration) {
            durations[videoId] = parseISO8601Duration(duration);
          }
        });
      }
    }

    return data.items
      .filter((item: any) => item.id?.videoId)
      .map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet?.title || "Untitled",
        channelTitle: item.snippet?.channelTitle,
        thumbnailUrl:
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url,
        durationSec: durations[item.id.videoId],
      }));
  } catch (error) {
    console.error("Error searching YouTube tracks:", error);
    return [];
  }
}

/**
 * Search for YouTube playlists by query
 */
export async function searchPlaylists(query: string): Promise<YoutubePlaylist[]> {
  if (!API_KEY) {
    throw new Error("YOUTUBE_API_KEY not configured");
  }

  try {
    const params = new URLSearchParams({
      part: "snippet",
      type: "playlist",
      q: query,
      maxResults: "10",
      key: API_KEY,
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`, {
      headers: {
        "User-Agent": "Cassette/1.0",
      },
    });

    if (!response.ok) {
      console.error(`YouTube API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return [];
    }

    // Get detailed info (including item count) for each playlist
    const playlistIds = data.items.map((item: any) => item.id.playlistId).join(",");
    const detailsParams = new URLSearchParams({
      part: "contentDetails,snippet",
      id: playlistIds,
      key: API_KEY,
    });

    const detailsResponse = await fetch(
      `${YOUTUBE_API_BASE}/playlists?${detailsParams}`,
      {
        headers: {
          "User-Agent": "Cassette/1.0",
        },
      }
    );

    if (!detailsResponse.ok) {
      console.error(
        `YouTube API details error: ${detailsResponse.status} ${detailsResponse.statusText}`
      );
      return [];
    }

    const detailsData = await detailsResponse.json();

    return (detailsData.items || []).map((item: any) => ({
      id: item.id,
      title: item.snippet?.title || "Untitled Playlist",
      description: item.snippet?.description,
      thumbnail:
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url,
      channelTitle: item.snippet?.channelTitle,
      itemCount: item.contentDetails?.itemCount || 0,
    }));
  } catch (error) {
    console.error("Error searching playlists:", error);
    return [];
  }
}

/**
 * Fetch all items from a YouTube playlist
 * Note: Limited to first 24 tracks to match the tape's 12 per side limit
 */
export async function fetchPlaylistItems(
  playlistId: string,
  maxResults = 24
): Promise<YoutubePlaylistItem[]> {
  if (!API_KEY) {
    throw new Error("YOUTUBE_API_KEY not configured");
  }

  try {
    const items: YoutubePlaylistItem[] = [];
    let pageToken: string | undefined;
    let position = 0;

    // Fetch items page by page
    while (position < maxResults && (!pageToken || pageToken)) {
      const params = new URLSearchParams({
        part: "snippet,contentDetails",
        playlistId,
        maxResults: Math.min(50, maxResults - position).toString(),
        key: API_KEY,
        ...(pageToken && { pageToken }),
      });

      const response = await fetch(`${YOUTUBE_API_BASE}/playlistItems?${params}`, {
        headers: {
          "User-Agent": "Cassette/1.0",
        },
      });

      if (!response.ok) {
        console.error(`YouTube API error: ${response.status} ${response.statusText}`);
        break;
      }

      const data = await response.json();

      if (!data.items) {
        break;
      }

      for (const item of data.items) {
        if (position >= maxResults) break;

        const videoId = item.contentDetails?.videoId;
        if (!videoId) continue;

        items.push({
          videoId,
          title: item.snippet?.title || "Untitled",
          channelTitle: item.snippet?.channelTitle,
          thumbnail:
            item.snippet?.thumbnails?.medium?.url ||
            item.snippet?.thumbnails?.default?.url,
          position,
        });

        position++;
      }

      pageToken = data.nextPageToken;
      if (!pageToken || position >= maxResults) {
        break;
      }
    }

    return items;
  } catch (error) {
    console.error("Error fetching playlist items:", error);
    return [];
  }
}

/**
 * Get video duration in seconds
 */
export async function getVideoDuration(videoId: string): Promise<number | null> {
  if (!API_KEY) {
    throw new Error("YOUTUBE_API_KEY not configured");
  }

  try {
    const params = new URLSearchParams({
      part: "contentDetails",
      id: videoId,
      key: API_KEY,
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`, {
      headers: {
        "User-Agent": "Cassette/1.0",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const item = data.items?.[0];

    if (!item?.contentDetails?.duration) {
      return null;
    }

    // Parse ISO 8601 duration (e.g., "PT3M45S" => 225 seconds)
    return parseISO8601Duration(item.contentDetails.duration);
  } catch (error) {
    console.error("Error fetching video duration:", error);
    return null;
  }
}

/**
 * Parse ISO 8601 duration to seconds
 * E.g., "PT3M45S" => 225
 */
function parseISO8601Duration(duration: string): number {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = duration.match(regex);

  if (!matches) return 0;

  const hours = parseInt(matches[1] || "0", 10);
  const minutes = parseInt(matches[2] || "0", 10);
  const seconds = parseInt(matches[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}
