/**
 * YouTube Data API v3 integration.
 * Requires YOUTUBE_API_KEY in .env.local.
 * Implements search with local caching to preserve quota.
 */

import { prisma } from "./prisma";

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationSec?: number;
  isShort?: boolean;
}

const YOUTUBE_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * Check if a video duration indicates it's likely a YouTube Short
 * Shorts are typically under 60 seconds
 */
function isLikelyShort(durationSec: number | undefined): boolean {
  return durationSec !== undefined && durationSec <= 60;
}

/**
 * Search YouTube for a song by title and artist.
 * Hits cache first, then YouTube Data API.
 * Caches results for 30 days.
 * Filters out YouTube Shorts (videos under 60 seconds) as they don't embed well.
 */
export async function searchYouTubeTrack(
  title: string,
  artist?: string
): Promise<YouTubeSearchResult[]> {
  const query = `${title}${artist ? ` ${artist}` : ""}`.toLowerCase().trim();
  const cacheKey = `${title}|${artist ?? ""}`;

  // Check cache
  const cached = await prisma.youtubeSearchCache.findUnique({
    where: { query: cacheKey },
  });

  if (cached && cached.expiresAt > new Date()) {
    return [
      {
        videoId: cached.videoId,
        title: cached.title,
        channelTitle: cached.channelTitle,
        thumbnailUrl: cached.thumbnailUrl,
        durationSec: cached.durationSec ?? undefined,
        isShort: isLikelyShort(cached.durationSec ?? undefined),
      },
    ];
  }

  // Search YouTube
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn("YOUTUBE_API_KEY not set — search will fail.");
    return [];
  }

  try {
    const searchUrl = new URL(`${YOUTUBE_BASE}/search`);
    searchUrl.searchParams.set("key", apiKey);
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("maxResults", "10"); // Increased to filter shorts
    searchUrl.searchParams.set("videoCategoryId", "10"); // Music category
    searchUrl.searchParams.set("videoEmbeddable", "true");
    searchUrl.searchParams.set("relevanceLanguage", "en");
    searchUrl.searchParams.set("videoDuration", "medium"); // Prefer medium-length videos (4-20 min)

    const searchRes = await fetch(searchUrl.toString());
    if (!searchRes.ok) {
      console.error(`YouTube search failed: ${searchRes.statusText}`);
      return [];
    }

    const searchData = await searchRes.json() as any;
    const videoIds = searchData.items?.map((item: any) => item.id.videoId).filter(Boolean) ?? [];

    if (videoIds.length === 0) return [];

    // Get video details (duration, thumbnail)
    const detailsUrl = new URL(`${YOUTUBE_BASE}/videos`);
    detailsUrl.searchParams.set("key", apiKey);
    detailsUrl.searchParams.set("part", "snippet,contentDetails");
    detailsUrl.searchParams.set("id", videoIds.join(","));

    const detailsRes = await fetch(detailsUrl.toString());
    if (!detailsRes.ok) {
      console.error(`YouTube details fetch failed: ${detailsRes.statusText}`);
      return [];
    }

    const detailsData = await detailsRes.json() as any;
    const results: YouTubeSearchResult[] = [];

    for (const video of detailsData.items ?? []) {
      const videoId = video.id;
      const snippet = video.snippet;
      const contentDetails = video.contentDetails;

      // Parse duration (PT format) — e.g. PT3M24S → 204 seconds
      let durationSec: number | undefined;
      if (contentDetails?.duration) {
        const match = contentDetails.duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (match) {
          const hours = parseInt(match[1] ?? "0", 10);
          const minutes = parseInt(match[2] ?? "0", 10);
          const seconds = parseInt(match[3] ?? "0", 10);
          durationSec = hours * 3600 + minutes * 60 + seconds;
        }
      }

      // Skip YouTube Shorts (videos under 60 seconds)
      if (isLikelyShort(durationSec)) {
        console.log(`Skipping likely Short: ${snippet?.title} (${durationSec}s)`);
        continue;
      }

      const result: YouTubeSearchResult = {
        videoId,
        title: snippet?.title ?? "Unknown",
        channelTitle: snippet?.channelTitle ?? "Unknown",
        thumbnailUrl:
          snippet?.thumbnails?.medium?.url ??
          snippet?.thumbnails?.default?.url ??
          "",
        durationSec,
        isShort: false,
      };

      results.push(result);

      // Cache the first result (most relevant)
      if (results.length === 1) {
        await prisma.youtubeSearchCache
          .upsert({
            where: { query: cacheKey },
            create: {
              query: cacheKey,
              videoId,
              title: result.title,
              channelTitle: result.channelTitle,
              thumbnailUrl: result.thumbnailUrl,
              durationSec,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
            update: {
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          })
          .catch((e: any) => console.error("Failed to cache search result:", e));
      }

      // Stop after finding 5 good results
      if (results.length >= 5) break;
    }

    return results;
  } catch (error) {
    console.error("YouTube search error:", error);
    return [];
  }
}

/**
 * Get the embed URL for a YouTube video (for IFrame player)
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  const url = new URL("https://www.youtube.com/embed/" + encodeURIComponent(videoId));
  url.searchParams.set("enablejsapi", "1");
  url.searchParams.set("controls", "1");
  url.searchParams.set("modestbranding", "1");
  url.searchParams.set("rel", "0");
  url.searchParams.set("fs", "1");
  return url.toString();
}
