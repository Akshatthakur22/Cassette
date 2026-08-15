/**
 * Playlist Prefetching System
 * Preloads upcoming tracks for smooth playback continuity
 * - Fetches next 3-5 tracks ahead of current playback
 * - Caches video metadata and durations
 * - Reduces buffering and loading delays
 */

import { getVideoDurationEnhanced } from "./youtube-enhanced";

export interface PrefetchedTrack {
  videoId: string;
  title: string;
  durationSec: number;
  thumbnailUrl?: string;
  channelTitle?: string;
  metadata?: {
    isPrefetched: boolean;
    prefetchedAt: number;
  };
}

// In-memory prefetch cache
let prefetchCache = new Map<string, PrefetchedTrack>();
const PREFETCH_BATCH_SIZE = 5; // Prefetch 5 tracks ahead
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

/**
 * Start prefetching upcoming tracks from a playlist
 */
export async function prefetchPlaylistTracks(
  tracks: Array<{
    videoId: string;
    title: string;
    durationSec?: number;
    thumbnailUrl?: string;
    channelTitle?: string;
  }>,
  currentIndex: number
): Promise<void> {
  if (!tracks || tracks.length === 0) return;

  // Calculate which tracks to prefetch
  const startIdx = currentIndex + 1;
  const endIdx = Math.min(startIdx + PREFETCH_BATCH_SIZE, tracks.length);
  const tracksToPrefetch = tracks.slice(startIdx, endIdx);

  // Prefetch in background
  tracksToPrefetch.forEach((track, i) => {
    // Stagger prefetch requests to avoid thundering herd
    setTimeout(
      () => {
        prefetchTrackMetadata(track);
      },
      i * 200 // 200ms stagger between requests
    );
  });
}

/**
 * Prefetch metadata for a single track
 */
async function prefetchTrackMetadata(track: {
  videoId: string;
  title: string;
  durationSec?: number;
  thumbnailUrl?: string;
  channelTitle?: string;
}): Promise<void> {
  if (!track.videoId || prefetchCache.has(track.videoId)) {
    return;
  }

  try {
    // Fetch duration if not already available
    let duration = track.durationSec;
    if (!duration) {
      duration = (await getVideoDurationEnhanced(track.videoId)) || 180;
    }

    // Cache the prefetched track
    prefetchCache.set(track.videoId, {
      videoId: track.videoId,
      title: track.title,
      durationSec: duration,
      thumbnailUrl: track.thumbnailUrl,
      channelTitle: track.channelTitle,
      metadata: {
        isPrefetched: true,
        prefetchedAt: Date.now(),
      },
    });

    console.log(`Prefetched: ${track.title} (${track.videoId})`);
  } catch (error) {
    console.warn(`Failed to prefetch ${track.videoId}:`, error);
  }
}

/**
 * Get prefetched track metadata
 */
export function getPrefetchedTrack(videoId: string): PrefetchedTrack | null {
  const cached = prefetchCache.get(videoId);

  if (!cached) return null;

  // Check if cache expired
  const age = Date.now() - (cached.metadata?.prefetchedAt || 0);
  if (age > CACHE_EXPIRY) {
    prefetchCache.delete(videoId);
    return null;
  }

  return cached;
}

/**
 * Prefetch entire playlist for offline-like experience
 * Used when user imports a playlist
 */
export async function prefetchEntirePlaylist(
  tracks: Array<{
    videoId: string;
    title: string;
    durationSec?: number;
    thumbnailUrl?: string;
    channelTitle?: string;
  }>
): Promise<{
  success: number;
  failed: number;
  totalTime: number;
}> {
  const startTime = Date.now();
  let success = 0;
  let failed = 0;

  // Batch fetch in groups of 5 with delays
  const batchSize = 5;
  for (let i = 0; i < tracks.length; i += batchSize) {
    const batch = tracks.slice(i, Math.min(i + batchSize, tracks.length));

    // Fetch batch in parallel, with 1s delay between batches
    await Promise.all(
      batch.map(async (track) => {
        try {
          await prefetchTrackMetadata(track);
          success++;
        } catch {
          failed++;
        }
      })
    );

    // Delay between batches to avoid rate limiting
    if (i + batchSize < tracks.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  const totalTime = Date.now() - startTime;
  console.log(
    `Playlist prefetch complete: ${success} success, ${failed} failed in ${totalTime}ms`
  );

  return { success, failed, totalTime };
}

/**
 * Clear prefetch cache
 */
export function clearPrefetchCache(): void {
  prefetchCache.clear();
  console.log("Prefetch cache cleared");
}

/**
 * Get prefetch cache stats
 */
export function getPrefetchStats(): {
  cacheSize: number;
  items: Array<{
    videoId: string;
    title: string;
    age: number;
  }>;
} {
  const items: Array<{
    videoId: string;
    title: string;
    age: number;
  }> = [];

  prefetchCache.forEach((track) => {
    items.push({
      videoId: track.videoId,
      title: track.title,
      age: Date.now() - (track.metadata?.prefetchedAt || 0),
    });
  });

  return {
    cacheSize: prefetchCache.size,
    items,
  };
}

/**
 * Prefetch on-demand: trigger when user navigates to next track
 */
export function prefetchNextTracks(
  tracks: Array<{
    videoId: string;
    title: string;
    durationSec?: number;
    thumbnailUrl?: string;
    channelTitle?: string;
  }>,
  currentIndex: number
): void {
  // Only prefetch if not too many items already cached
  if (prefetchCache.size < PREFETCH_BATCH_SIZE * 2) {
    prefetchPlaylistTracks(tracks, currentIndex);
  }
}

/**
 * Batch prefetch multiple video durations
 * Useful for quickly loading all tracks after playlist import
 */
export async function batchPrefetchDurations(
  videoIds: string[]
): Promise<Record<string, number>> {
  const durations: Record<string, number> = {};
  const idsToFetch: string[] = [];

  // Check cache first
  videoIds.forEach((id) => {
    const cached = getPrefetchedTrack(id);
    if (cached) {
      durations[id] = cached.durationSec;
    } else {
      idsToFetch.push(id);
    }
  });

  // Fetch missing durations
  if (idsToFetch.length > 0) {
    const results = await Promise.all(
      idsToFetch.map((id) =>
        getVideoDurationEnhanced(id).then((dur) => ({
          id,
          duration: dur || 180,
        }))
      )
    );

    results.forEach(({ id, duration }) => {
      durations[id] = duration;
    });
  }

  return durations;
}
