/**
 * Media Asset Prefetching Service
 * Preloads stream URLs for upcoming tracks to reduce latency
 */

interface PrefetchTask {
  mediaAssetId: string;
  title: string;
  timestamp: number;
}

class PrefetchService {
  private queue: PrefetchTask[] = [];
  private processing = false;
  private maxConcurrent = 2; // Prefetch 2 tracks simultaneously
  private active = true;

  /**
   * Prefetch URLs for next N tracks
   * Typically called when user selects a track or starts playing
   */
  async prefetchNextTracks(
    mediaAssetIds: string[],
    currentIndex: number,
    count: number = 3
  ): Promise<void> {
    if (!this.active) return;

    // Get next N tracks after current
    const nextTracks = mediaAssetIds.slice(currentIndex + 1, currentIndex + 1 + count);

    // Queue them for prefetching
    for (let i = 0; i < nextTracks.length; i++) {
      const mediaAssetId = nextTracks[i];
      if (mediaAssetId) {
        this.queue.push({
          mediaAssetId,
          title: `Track ${currentIndex + 2 + i}`,
          timestamp: Date.now(),
        });
      }
    }

    // Start processing if not already running
    if (!this.processing) {
      this.processPrefetchQueue();
    }
  }

  /**
   * Process prefetch queue with concurrency control
   */
  private async processPrefetchQueue(): Promise<void> {
    if (this.processing || !this.active) return;

    this.processing = true;

    while (this.queue.length > 0 && this.active) {
      // Get next batch to prefetch
      const batch = this.queue.splice(0, this.maxConcurrent);

      // Prefetch in parallel
      const promises = batch.map((task) =>
        this.prefetchStreamUrl(task.mediaAssetId).catch((err) => {
          console.debug(
            `[Prefetch] Failed to prefetch ${task.mediaAssetId}:`,
            err
          );
        })
      );

      await Promise.all(promises);

      // Small delay between batches to avoid overwhelming network
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    this.processing = false;
  }

  /**
   * Fetch stream URL for a single media asset
   * This warms up the R2 cache and browser cache
   */
  private async prefetchStreamUrl(mediaAssetId: string): Promise<void> {
    try {
      // Use HEAD request to check if available without downloading full file
      const response = await fetch(
        `/api/media-assets/${mediaAssetId}/stream`,
        {
          method: "HEAD",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      console.debug(`[Prefetch] Warmed ${mediaAssetId}`);
    } catch (error) {
      console.debug(
        `[Prefetch] HEAD request failed for ${mediaAssetId}, trying GET`,
        error
      );

      // Fallback: Try GET with small range header to verify availability
      // Don't download full file, just first few bytes
      try {
        await fetch(`/api/media-assets/${mediaAssetId}/stream`, {
          method: "GET",
          headers: {
            Range: "bytes=0-1024", // Only first 1KB
          },
          cache: "no-store",
        });

        console.debug(`[Prefetch] Verified ${mediaAssetId}`);
      } catch (err) {
        console.debug(`[Prefetch] Range request failed for ${mediaAssetId}`);
      }
    }
  }

  /**
   * Clear queue and stop prefetching
   */
  clear(): void {
    this.queue = [];
    this.processing = false;
  }

  /**
   * Disable/enable prefetching
   */
  setActive(active: boolean): void {
    this.active = active;
    if (!active) {
      this.clear();
    }
  }

  /**
   * Get queue status for debugging
   */
  getStatus(): { queueLength: number; processing: boolean; active: boolean } {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      active: this.active,
    };
  }
}

// Singleton instance
let prefetchService: PrefetchService | null = null;

export function getPrefetchService(): PrefetchService {
  if (!prefetchService) {
    prefetchService = new PrefetchService();
  }
  return prefetchService;
}

export default PrefetchService;
