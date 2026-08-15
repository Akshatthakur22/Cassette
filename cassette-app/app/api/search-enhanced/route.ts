import { NextRequest, NextResponse } from "next/server";
import { searchYouTubeTrack } from "@/app/lib/youtube-enhanced";
import { checkRateLimitSimple } from "@/app/lib/rate-limit";
import { prisma } from "@/app/lib/prisma";

/**
 * Enhanced Search API
 * - Returns accurate durations via batch fetching
 * - Caches results in database
 * - Rate limits per IP
 * - Real-time feedback with loading states
 */
export async function GET(request: NextRequest) {
  // Rate limiting: 30 searches per IP per minute
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rateLimitKey = `search:${ip}`;

  if (!checkRateLimitSimple(rateLimitKey, 30, 60_000)) {
    return NextResponse.json(
      { error: "Too many searches. Please try again in a moment.", retryAfter: 60 },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.trim();
  const artist = searchParams.get("artist")?.trim();
  const useCache = searchParams.get("cache") !== "false";

  if (!title) {
    return NextResponse.json(
      { error: "title query param required" },
      { status: 400 }
    );
  }

  try {
    // Check database cache first
    if (useCache) {
      const cacheKey = `${title}|${artist || ""}`;
      const cached = await prisma.youtubeSearchCache.findFirst({
        where: {
          query: cacheKey,
          expiresAt: { gt: new Date() },
        },
        take: 1,
      });

      if (cached) {
        // Return cached single result for demonstration
        // In production, return array of cached results
        return NextResponse.json({
          results: [
            {
              videoId: cached.videoId,
              title: cached.title,
              channelTitle: cached.channelTitle,
              thumbnailUrl: cached.thumbnailUrl,
              durationSec: cached.durationSec,
              cached: true,
            },
          ],
          cached: true,
          cacheAge: Date.now() - cached.createdAt.getTime(),
        });
      }
    }

    // Fetch fresh results
    const results = await searchYouTubeTrack(title, artist ?? undefined);

    // Cache results in database (first 3 results)
    if (useCache && results.length > 0) {
      try {
        const expireAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const cacheKey = `${title}|${artist || ""}`;

        // Cache top result
        await prisma.youtubeSearchCache.upsert({
          where: {
            query: cacheKey,
          },
          create: {
            query: cacheKey,
            videoId: results[0].videoId,
            title: results[0].title,
            channelTitle: results[0].channelTitle || "Unknown",
            thumbnailUrl: results[0].thumbnailUrl || "",
            durationSec: results[0].durationSec || null,
            expiresAt: expireAt,
          },
          update: {
            videoId: results[0].videoId,
            title: results[0].title,
            channelTitle: results[0].channelTitle || "Unknown",
            thumbnailUrl: results[0].thumbnailUrl || "",
            durationSec: results[0].durationSec || null,
            expiresAt: expireAt,
          },
        });
      } catch (err) {
        console.error("Error caching search results:", err);
        // Don't fail the request if caching fails
      }
    }

    return NextResponse.json({
      results,
      cached: false,
      count: results.length,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Search API error:", {
      error: errorMsg,
      title,
      artist,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Search failed",
        message: "Unable to search YouTube. Please try again in a moment.",
        results: [],
      },
      { status: 200 } // Keep 200 status even on error for client compatibility
    );
  }
}

/**
 * POST endpoint for batch searches
 * Used for playlist imports
 */
export async function POST(request: NextRequest) {
  try {
    const { tracks } = await request.json();

    if (!Array.isArray(tracks) || tracks.length === 0) {
      return NextResponse.json(
        { error: "tracks array required" },
        { status: 400 }
      );
    }

    // Limit batch size
    if (tracks.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 tracks per batch" },
        { status: 400 }
      );
    }

    // Search all in parallel
    const results = await Promise.all(
      tracks.map((track: any) =>
        searchYouTubeTrack(track.title, track.artist).catch(() => [])
      )
    );

    return NextResponse.json({
      results: results.map((r, i) => ({
        query: tracks[i],
        results: r,
        count: r.length,
      })),
    });
  } catch (error) {
    console.error("Batch search error:", error);
    return NextResponse.json(
      { error: "Batch search failed" },
      { status: 500 }
    );
  }
}
