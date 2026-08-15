/**
 * Enhanced YouTube Engine v2
 * - Search with deduplication (prevents duplicate API calls)
 * - Batch duration fetching (efficient quota usage)
 * - Smart caching (24-hour in-memory cache)
 */

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.YOUTUBE_API_KEY;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory search result cache
let searchResultsCache = new Map<string, { results: any[]; timestamp: number }>();
const CACHE_EXPIRY = 1 * 60 * 60 * 1000; // 1 hour client-side cache

// Track in-progress searches to prevent duplicate API calls
let searchInProgress = new Map<string, Promise<any>>();

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
 * ─── Search YouTube with deduplication
 * Prevents multiple concurrent identical searches from wasting quota
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
    console.error("YOUTUBE_API_KEY not configured");
    return [];
  }

  // Check in-memory cache first
  const cacheKey = `track:${title}|${artist || ""}`;
  const cached = searchResultsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    console.debug(`Cache hit for: "${title}"`);
    return cached.results;
  }

  // Deduplicate: if identical search is in progress, wait for it
  const searchKey = `search:${title}|${artist || ""}`;
  if (searchInProgress.has(searchKey)) {
    console.debug(`Dedup: waiting for in-progress search: "${title}"`);
    return await searchInProgress.get(searchKey)!;
  }

  try {
    const query = artist ? `${title} ${artist}` : title;
    const searchPromise = performSearch(query);
    searchInProgress.set(searchKey, searchPromise);

    const data = await searchPromise;

    if (!data.items || data.items.length === 0) {
      console.debug(`No YouTube results for: "${query}"`);
      return [];
    }

    // Extract video IDs for batch duration lookup
    const videoIds = data.items
      .filter((item: any) => item.id?.videoId)
      .map((item: any) => item.id.videoId);

    let durations: Record<string, number> = {};
    if (videoIds.length > 0) {
      durations = await batchFetchDurations(videoIds);
    }

    const results = data.items
      .filter((item: any) => item.id?.videoId)
      .map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet?.title || "Untitled",
        channelTitle: item.snippet?.channelTitle,
        thumbnailUrl:
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url,
        durationSec: durations[item.id.videoId] || defaultDurationFallback(item.snippet?.title),
      }));

    // Cache results
    searchResultsCache.set(cacheKey, { results, timestamp: Date.now() });

    return results;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error searching YouTube:", {
      error: errorMsg,
      query: artist ? `${title} ${artist}` : title,
    });
    return [];
  } finally {
    searchInProgress.delete(searchKey);
  }
}

/**
 * ─── Perform YouTube search API call
 */
async function performSearch(query: string): Promise<any> {
  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    q: query,
    maxResults: "10",
    key: API_KEY!,
  });

  const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`, {
    headers: { "User-Agent": "Cassette/2.0" },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error(`YouTube search error: ${response.status}`, { query });
    if (errorBody) console.error("Error details:", errorBody);
    return { items: [] };
  }

  return await response.json();
}

/**
 * ─── Batch fetch video durations (efficient quota usage)
 * Groups up to 50 video IDs per request
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
 * ─── Parse ISO 8601 duration to seconds
 * E.g., "PT3M45S" => 225, "PT1H30M" => 5400
 */
export function parseISO8601Duration(duration: string): number {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/;
  const matches = duration.match(regex);

  if (!matches) return 0;

  const hours = parseInt(matches[1] || "0", 10);
  const minutes = parseInt(matches[2] || "0", 10);
  const seconds = Math.round(parseFloat(matches[3] || "0"));

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * ─── Estimate duration from title (fallback)
 */
function defaultDurationFallback(title: string): number {
  const timePatterns = [
    /(\d+):(\d+):(\d+)/,  // HH:MM:SS
    /(\d+):(\d+)/,         // MM:SS
    /(\d+)\s*m\s*(\d+)\s*s/i,  // 3m 45s
    /(\d+)\s*min/i,        // 3 min
  ];

  for (const pattern of timePatterns) {
    const match = title.match(pattern);
    if (match) {
      if (pattern === timePatterns[0] && match[1]) {
        return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);
      } else if (pattern === timePatterns[1] && match[1] && match[2]) {
        return parseInt(match[1]) * 60 + parseInt(match[2]);
      } else if (pattern === timePatterns[2] && match[1] && match[2]) {
        return parseInt(match[1]) * 60 + parseInt(match[2]);
      } else if (pattern === timePatterns[3] && match[1]) {
        return parseInt(match[1]) * 60;
      }
    }
  }

  return 180; // Default to 3 minutes
}

/**
 * ─── Search for YouTube playlists by query
 */
export async function searchPlaylists(query: string): Promise<YoutubePlaylist[]> {
  if (!API_KEY) {
    console.error("YOUTUBE_API_KEY not configured");
    return [];
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
      headers: { "User-Agent": "Cassette/2.0" },
    });

    if (!response.ok) {
      console.error(`YouTube API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return [];
    }

    // Get detailed info for each playlist
    const playlistIds = data.items
      .map((item: any) => item.id.playlistId)
      .filter(Boolean)
      .join(",");

    if (!playlistIds) return [];

    const detailsParams = new URLSearchParams({
      part: "contentDetails,snippet",
      id: playlistIds,
      key: API_KEY,
    });

    const detailsResponse = await fetch(
      `${YOUTUBE_API_BASE}/playlists?${detailsParams}`,
      {
        headers: { "User-Agent": "Cassette/2.0" },
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
 * ─── Fetch all items from a YouTube playlist
 */
export async function fetchPlaylistItemsEnhanced(
  playlistId: string,
  maxResults = 24
): Promise<YoutubePlaylistItem[]> {
  if (!API_KEY) {
    console.error("YOUTUBE_API_KEY not configured");
    return [];
  }

  try {
    const items: YoutubePlaylistItem[] = [];
    let pageToken: string | undefined;
    let position = 0;
    const videoIds: string[] = [];

    // Fetch playlist items
    while (position < maxResults && (!pageToken || pageToken)) {
      const params = new URLSearchParams({
        part: "snippet,contentDetails",
        playlistId,
        maxResults: Math.min(50, maxResults - position).toString(),
        key: API_KEY,
        ...(pageToken && { pageToken }),
      });

      const response = await fetch(`${YOUTUBE_API_BASE}/playlistItems?${params}`, {
        headers: { "User-Agent": "Cassette/2.0" },
      });

      if (!response.ok) {
        console.error(`YouTube API error: ${response.status} ${response.statusText}`);
        break;
      }

      const data = await response.json();

      if (!data.items) break;

      for (const item of data.items) {
        if (position >= maxResults) break;

        const videoId = item.contentDetails?.videoId;
        if (!videoId) continue;

        videoIds.push(videoId);
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
      if (!pageToken || position >= maxResults) break;
    }

    // Batch fetch all durations at once
    if (videoIds.length > 0) {
      const durations = await batchFetchDurations(videoIds);
      items.forEach((item) => {
        item.durationSec = durations[item.videoId];
      });
    }

    return items;
  } catch (error) {
    console.error("Error fetching playlist items:", error);
    return [];
  }
}

/**
 * ─── Get video duration in seconds
 */
export async function getVideoDurationEnhanced(videoId: string): Promise<number | null> {
  if (!API_KEY || !videoId || videoId === "undefined") {
    return null;
  }

  try {
    const params = new URLSearchParams({
      part: "contentDetails",
      id: videoId,
      key: API_KEY,
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`, {
      headers: { "User-Agent": "Cassette/2.0" },
    });

    if (!response.ok) {
      console.warn(`Duration fetch failed for ${videoId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const item = data.items?.[0];

    if (!item?.contentDetails?.duration) {
      return null;
    }

    return parseISO8601Duration(item.contentDetails.duration);
  } catch (error) {
    console.error("Error fetching video duration:", error);
    return null;
  }
}

/**
 * ─── Clear search cache (for testing)
 */
export function clearSearchCache() {
  searchResultsCache.clear();
}
