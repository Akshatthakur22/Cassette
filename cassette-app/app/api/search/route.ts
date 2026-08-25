/**
 * GET /api/search
 * Search for songs from YouTube and local library
 * 
 * Query params:
 * - q: search query
 * - source: 'youtube' | 'library' | 'all'
 * - limit: max results (default 20, max 50)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// You'll need to implement YouTube search
async function searchYouTube(query: string, limit: number) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.warn('[search] YouTube API key not configured');
      return [];
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${limit}&key=${apiKey}`
    );

    if (!response.ok) {
      console.error('[search] YouTube API error:', response.status);
      return [];
    }

    const data = await response.json();

    return (data.items || []).map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url,
      source: 'youtube' as const,
    }));
  } catch (error) {
    console.error('[search] YouTube search error:', error);
    return [];
  }
}

// Search local library
async function searchLibrary(query: string, limit: number) {
  try {
    const songs = await prisma.mediaAsset.findMany({
      where: {
        AND: [
          { status: 'READY' },
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { artist: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        artist: true,
        durationSec: true,
        status: true,
        storageKey: true,
      },
      take: limit,
    });

    return songs.map((song) => ({
      id: song.id,
      title: song.title,
      artist: song.artist || 'Unknown',
      durationSec: song.durationSec || 0,
      status: song.status,
      source: 'library' as const,
      storageKey: song.storageKey,
    }));
  } catch (error) {
    console.error('[search] Library search error:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const source = (searchParams.get('source') || 'all') as 'youtube' | 'library' | 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    console.log(`[search] Query: "${query}", source: ${source}, limit: ${limit}`);

    let songs: any[] = [];

    if (source === 'all' || source === 'library') {
      const librarySongs = await searchLibrary(query, limit);
      songs = [...songs, ...librarySongs];
    }

    if (source === 'all' || source === 'youtube') {
      const youtubeSongs = await searchYouTube(query, limit);
      songs = [...songs, ...youtubeSongs];
    }

    return NextResponse.json({
      query,
      source,
      count: songs.length,
      songs: songs.slice(0, limit),
    });
  } catch (error) {
    console.error('[search] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
