/**
 * Hardened YouTube Engine v3 for CASSETTE
 * - Query normalization (strips noise tokens, labels, brackets)
 * - Automatic query broadening fallback if 0 results
 * - Preflight playability validation (status.embeddable check)
 * - Minimum duration bounds (filters out Shorts <60s and sets >900s)
 * - In-memory + PostgreSQL persistent caching (YoutubeSearchCache)
 * - Batch duration & embeddability queries
 */

import { prisma } from "@/app/lib/prisma";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.YOUTUBE_API_KEY;

// In-memory cache for ultra-fast repeated queries in the same process (1 hour)
const inMemorySearchCache = new Map<string, { results: any[]; timestamp: number }>();
const IN_MEMORY_CACHE_EXPIRY = 60 * 60 * 1000;

// Track in-progress searches to deduplicate simultaneous requests
const searchInProgress = new Map<string, Promise<any>>();

export interface YoutubeTrackResult {
  videoId: string;
  title: string;
  channelTitle?: string;
  thumbnailUrl?: string;
  durationSec?: number;
}

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
 * ─── Query Normalizer
 * Cleans user queries by stripping brackets, tags, and extraneous keywords
 */
export function normalizeQuery(title: string, artist?: string): string {
  let cleanedTitle = title
    .replace(/\[(?:official|music|video|audio|lyrics|hd|4k|remastered|explicit|clean|visualizer).*?\]/gi, "")
    .replace(/\((?:official|music|video|audio|lyrics|hd|4k|remastered|explicit|clean|visualizer).*?\)/gi, "")
    .replace(/\b(?:ft\.|feat\.|featuring)\s+[^,\-\(\)\[\]]+/gi, "")
    .replace(/["'“”]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  let cleanedArtist = artist
    ? artist
        .replace(/\b(?:ft\.|feat\.|featuring)\s+[^,\-\(\)\[\]]+/gi, "")
        .replace(/["'“”]/g, "")
        .replace(/\s+/g, " ")
        .trim()
    : "";

  if (cleanedArtist && !cleanedTitle.toLowerCase().includes(cleanedArtist.toLowerCase())) {
    return `${cleanedTitle} ${cleanedArtist}`.trim();
  }

  return cleanedTitle || title.trim();
}

/**
 * ─── Search YouTube with normalization, persistent caching, and playability validation
 */
export async function searchYouTubeTrack(
  title: string,
  artist?: string
): Promise<YoutubeTrackResult[]> {
  if (!API_KEY) {
    console.error("[YouTube API] YOUTUBE_API_KEY not configured");
    return [];
  }

  const rawKey = `${title.trim()}|${(artist || "").trim()}`.toLowerCase();
  const normalizedQuery = normalizeQuery(title, artist);

  // 1. Check in-memory cache
  const inMemory = inMemorySearchCache.get(rawKey);
  if (inMemory && Date.now() - inMemory.timestamp < IN_MEMORY_CACHE_EXPIRY) {
    return inMemory.results;
  }

  // 2. Check Database Persistent Cache
  try {
    const cachedDb = await prisma.youtubeSearchCache.findUnique({
      where: { query: rawKey },
    });

    if (cachedDb && cachedDb.expiresAt > new Date()) {
      const result: YoutubeTrackResult[] = [
        {
          videoId: cachedDb.videoId,
          title: cachedDb.title,
          channelTitle: cachedDb.channelTitle,
          thumbnailUrl: cachedDb.thumbnailUrl,
          durationSec: cachedDb.durationSec ?? undefined,
        },
      ];
      inMemorySearchCache.set(rawKey, { results: result, timestamp: Date.now() });
      return result;
    }
  } catch (e) {
    // Database cache miss or transient error — continue to live API
  }

  // 3. Deduplicate in-progress searches
  if (searchInProgress.has(rawKey)) {
    return await searchInProgress.get(rawKey)!;
  }

  const searchPromise = (async () => {
    try {
      // First attempt with normalized query
      let searchData = await performRawSearch(normalizedQuery);

      // 4. Query broadening fallback if initial search yielded 0 items
      if ((!searchData.items || searchData.items.length === 0) && title.trim() !== normalizedQuery) {
        searchData = await performRawSearch(title.trim());
      }

      // If still empty and artist was specified, try artist + cleaned title words
      if ((!searchData.items || searchData.items.length === 0) && artist) {
        const words = title.split(" ").slice(0, 3).join(" ");
        searchData = await performRawSearch(`${artist} ${words}`);
      }

      if (!searchData.items || searchData.items.length === 0) {
        return [];
      }

      const videoIds = searchData.items
        .filter((item: any) => item.id?.videoId)
        .map((item: any) => item.id.videoId);

      if (videoIds.length === 0) return [];

      // 5. Batch fetch durations & check embeddability / playability
      const detailsMap = await batchFetchVideoDetails(videoIds);

      // 6. Filter out Shorts (<60s) and non-embeddable videos
      const validResults: YoutubeTrackResult[] = [];

      for (const item of searchData.items) {
        const videoId = item.id?.videoId;
        if (!videoId) continue;

        const details = detailsMap[videoId];
        // If details exist, enforce embeddability and minimum 60-second length (block Shorts)
        if (details) {
          if (details.embeddable === false) {
            continue; // Skip videos that cannot be embedded
          }
          if (details.durationSec < 60) {
            continue; // Skip Shorts and ultra-short clips
          }
          if (details.durationSec > 900) {
            continue; // Skip overly long multi-hour mixes
          }
        }

        validResults.push({
          videoId,
          title: item.snippet?.title || "Untitled",
          channelTitle: item.snippet?.channelTitle,
          thumbnailUrl:
            item.snippet?.thumbnails?.medium?.url ||
            item.snippet?.thumbnails?.default?.url,
          durationSec: details?.durationSec,
        });
      }

      // 7. Save to caches
      inMemorySearchCache.set(rawKey, { results: validResults, timestamp: Date.now() });

      if (validResults.length > 0) {
        const top = validResults[0];
        prisma.youtubeSearchCache
          .upsert({
            where: { query: rawKey },
            update: {
              videoId: top.videoId,
              title: top.title,
              channelTitle: top.channelTitle || "",
              thumbnailUrl: top.thumbnailUrl || "",
              durationSec: top.durationSec || null,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
            create: {
              query: rawKey,
              videoId: top.videoId,
              title: top.title,
              channelTitle: top.channelTitle || "",
              thumbnailUrl: top.thumbnailUrl || "",
              durationSec: top.durationSec || null,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          })
          .catch(() => {});
      }

      return validResults;
    } catch (error) {
      console.error("[searchYouTubeTrack] Error:", error);
      return [];
    }
  })();

  searchInProgress.set(rawKey, searchPromise);

  try {
    return await searchPromise;
  } finally {
    searchInProgress.delete(rawKey);
  }
}

/**
 * ─── Low-level YouTube Search API Call
 */
async function performRawSearch(query: string): Promise<any> {
  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    videoEmbeddable: "true", // Only request embeddable videos from YouTube API
    q: query,
    maxResults: "10",
    key: API_KEY!,
  });

  const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`, {
    headers: { "User-Agent": "Cassette/3.0" },
  });

  if (!response.ok) {
    console.error(`[performRawSearch] API error: ${response.status}`, { query });
    return { items: [] };
  }

  return await response.json();
}

/**
 * ─── Batch fetch video details: contentDetails + status (embeddability & privacy)
 */
async function batchFetchVideoDetails(
  videoIds: string[]
): Promise<Record<string, { durationSec: number; embeddable: boolean; isPublic: boolean }>> {
  if (videoIds.length === 0) return {};

  const map: Record<string, { durationSec: number; embeddable: boolean; isPublic: boolean }> = {};

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const params = new URLSearchParams({
      part: "contentDetails,status",
      id: batch.join(","),
      key: API_KEY!,
    });

    try {
      const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`, {
        headers: { "User-Agent": "Cassette/3.0" },
      });

      if (!response.ok) continue;

      const data = await response.json();
      (data.items || []).forEach((item: any) => {
        if (item.id) {
          const duration = item.contentDetails?.duration
            ? parseISO8601Duration(item.contentDetails.duration)
            : 0;
          const embeddable = item.status?.embeddable !== false;
          const isPublic = item.status?.privacyStatus === "public";

          map[item.id] = { durationSec: duration, embeddable, isPublic };
        }
      });
    } catch (err) {
      console.error("[batchFetchVideoDetails] Error:", err);
    }
  }

  return map;
}

/**
 * ─── Validate a single YouTube video at add-time
 */
export async function validateYouTubeVideo(videoId: string): Promise<{
  isValid: boolean;
  error?: string;
  title?: string;
  channelTitle?: string;
  thumbnailUrl?: string;
  durationSec?: number;
}> {
  if (!API_KEY) {
    return { isValid: false, error: "YouTube API key not configured." };
  }

  try {
    const params = new URLSearchParams({
      part: "snippet,contentDetails,status",
      id: videoId,
      key: API_KEY,
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`, {
      headers: { "User-Agent": "Cassette/3.0" },
    });

    if (!response.ok) {
      return { isValid: false, error: "Could not fetch video details from YouTube." };
    }

    const data = await response.json();
    const item = data.items?.[0];

    if (!item) {
      return { isValid: false, error: "This YouTube video was not found or is private." };
    }

    // Embeddable check
    if (item.status?.embeddable === false) {
      return {
        isValid: false,
        error: "This video has playback restricted from third-party apps by its owner. Please pick another upload or official lyric video.",
      };
    }

    const durationSec = item.contentDetails?.duration
      ? parseISO8601Duration(item.contentDetails.duration)
      : 0;

    // Shorts filter
    if (durationSec < 60) {
      return {
        isValid: false,
        error: "This video is too short (less than 60 seconds). Full tracks are recommended for mixtapes.",
      };
    }

    // Overly long video filter
    if (durationSec > 900) {
      return {
        isValid: false,
        error: "This video is longer than 15 minutes. Please select a standard track length for this tape side.",
      };
    }

    return {
      isValid: true,
      title: item.snippet?.title,
      channelTitle: item.snippet?.channelTitle,
      thumbnailUrl:
        item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
      durationSec,
    };
  } catch (error: any) {
    console.error("[validateYouTubeVideo] Error:", error);
    return { isValid: false, error: "Failed to validate YouTube track." };
  }
}

/**
 * ─── Get video duration in seconds (enhanced with status validation)
 */
export async function getVideoDurationEnhanced(videoId: string): Promise<number | null> {
  const res = await validateYouTubeVideo(videoId);
  return res.durationSec ?? null;
}

/**
 * ─── Parse ISO 8601 duration string to seconds
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
 * ─── Search for YouTube playlists
 */
export async function searchPlaylists(query: string): Promise<YoutubePlaylist[]> {
  if (!API_KEY) return [];

  try {
    const params = new URLSearchParams({
      part: "snippet",
      type: "playlist",
      q: query,
      maxResults: "10",
      key: API_KEY,
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`, {
      headers: { "User-Agent": "Cassette/3.0" },
    });

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.items || data.items.length === 0) return [];

    const playlistIds = data.items
      .map((item: any) => item.id?.playlistId)
      .filter(Boolean)
      .join(",");

    if (!playlistIds) return [];

    const detailsParams = new URLSearchParams({
      part: "contentDetails,snippet",
      id: playlistIds,
      key: API_KEY,
    });

    const detailsResponse = await fetch(`${YOUTUBE_API_BASE}/playlists?${detailsParams}`, {
      headers: { "User-Agent": "Cassette/3.0" },
    });

    if (!detailsResponse.ok) return [];

    const detailsData = await detailsResponse.json();

    return (detailsData.items || []).map((item: any) => ({
      id: item.id,
      title: item.snippet?.title || "Untitled Playlist",
      description: item.snippet?.description,
      thumbnail:
        item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
      channelTitle: item.snippet?.channelTitle,
      itemCount: item.contentDetails?.itemCount || 0,
    }));
  } catch (error) {
    console.error("[searchPlaylists] Error:", error);
    return [];
  }
}

/**
 * ─── Fetch playlist items (up to maxResults)
 */
export async function fetchPlaylistItems(
  playlistId: string,
  maxResults = 24
): Promise<YoutubePlaylistItem[]> {
  if (!API_KEY) return [];

  try {
    const items: YoutubePlaylistItem[] = [];
    let pageToken: string | undefined;
    let position = 0;

    while (position < maxResults && (!pageToken || pageToken)) {
      const params = new URLSearchParams({
        part: "snippet,contentDetails",
        playlistId,
        maxResults: Math.min(50, maxResults - position).toString(),
        key: API_KEY,
        ...(pageToken && { pageToken }),
      });

      const response = await fetch(`${YOUTUBE_API_BASE}/playlistItems?${params}`, {
        headers: { "User-Agent": "Cassette/3.0" },
      });

      if (!response.ok) break;

      const data = await response.json();
      if (!data.items) break;

      for (const item of data.items) {
        if (position >= maxResults) break;
        const videoId = item.contentDetails?.videoId;
        if (!videoId) continue;

        items.push({
          videoId,
          title: item.snippet?.title || "Untitled",
          channelTitle: item.snippet?.channelTitle,
          thumbnail:
            item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
          position,
        });

        position++;
      }

      pageToken = data.nextPageToken;
      if (!pageToken || position >= maxResults) break;
    }

    return items;
  } catch (error) {
    console.error("[fetchPlaylistItems] Error:", error);
    return [];
  }
}
