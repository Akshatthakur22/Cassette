/**
 * Eager Media Asset Preloading
 * Preloads all YouTube track audio files immediately on page load
 * Enables instant playback with zero waiting
 */

interface PreloadEntry {
  mediaAssetId: string;
  blobUrl: string | null;
  status: "pending" | "loading" | "ready" | "failed" | "retry_pending";
  error?: string;
  timestamp: number;
  retryCount: number;
}

class EagerPreloadService {
  private preloadedAssets: Map<string, PreloadEntry> = new Map();
  private active = true;
  private maxConcurrent = 3; // Load 3 tracks in parallel
  private processingQueue = false;
  private retryInterval: NodeJS.Timeout | null = null;
  private maxRetries = 5;

  /**
   * Start preloading all YouTube tracks immediately
   * Called when tape view loads
   */
  async preloadAllTracks(mediaAssetIds: string[]): Promise<void> {
    if (!this.active || !mediaAssetIds.length) return;

    // Filter out already preloaded (except failed ones)
    const toPreload = mediaAssetIds.filter(
      (id) => !this.preloadedAssets.has(id) || this.preloadedAssets.get(id)?.status === "failed"
    );

    if (!toPreload.length) return;

    // Queue all for preloading
    for (const mediaAssetId of toPreload) {
      if (!this.preloadedAssets.has(mediaAssetId)) {
        this.preloadedAssets.set(mediaAssetId, {
          mediaAssetId,
          blobUrl: null,
          status: "pending",
          timestamp: Date.now(),
          retryCount: 0,
        });
      }
    }

    // Start processing
    if (!this.processingQueue) {
      this.processPreloadQueue();
    }

    // Start retry scheduler
    this.startRetryScheduler();
  }

  /**
   * Get preloaded blob URL for a track
   * Returns immediately if already loaded, null if not yet ready
   */
  getPreloadedUrl(mediaAssetId: string): string | null {
    const entry = this.preloadedAssets.get(mediaAssetId);
    if (entry?.status === "ready" && entry.blobUrl) {
      return entry.blobUrl;
    }
    return null;
  }

  /**
   * Get preload status
   */
  getStatus(mediaAssetId: string): "pending" | "loading" | "ready" | "failed" | "retry_pending" | "unknown" {
    return this.preloadedAssets.get(mediaAssetId)?.status ?? "unknown";
  }

  /**
   * Process preload queue with concurrency control
   */
  private async processPreloadQueue(): Promise<void> {
    if (this.processingQueue) return;

    this.processingQueue = true;

    const pending = Array.from(this.preloadedAssets.entries())
      .filter(([_, entry]) => entry.status === "pending" || entry.status === "retry_pending")
      .map(([id, _]) => id);

    while (pending.length > 0 && this.active) {
      const batch = pending.splice(0, this.maxConcurrent);

      const promises = batch.map((id) => {
        const entry = this.preloadedAssets.get(id)!;
        entry.status = "loading";
        return this.loadTrack(id);
      });

      await Promise.all(promises);

      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.processingQueue = false;
  }

  /**
   * Load a single track with retry logic
   * First checks database status, then fetches if ready
   * Handles YouTube video IDs that haven't been converted to MediaAssets yet
   */
  private async loadTrack(mediaAssetId: string): Promise<void> {
    const entry = this.preloadedAssets.get(mediaAssetId);
    if (!entry) return;

    try {
      // STEP 1: Check database status first
      const statusResponse = await fetch(
        `/api/media-assets/${mediaAssetId}/status`,
        {
          method: "GET",
          signal: AbortSignal.timeout(5000), // 5s timeout for status check
        }
      );

      // 404 means asset doesn't exist yet (old playlist track with YouTube ID)
      // Mark for retry - worker will create it when processing
      if (statusResponse.status === 404) {
        entry.status = "retry_pending";
        entry.error = "Not found (awaiting MediaAsset creation)";
        console.debug(`[EagerPreload] Asset not found yet (404), will retry: ${mediaAssetId}`);
        return;
      }

      if (!statusResponse.ok) {
        throw new Error(`Status check failed: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();

      // If not ready, mark for retry
      if (statusData.status !== "READY") {
        entry.status = "retry_pending";
        entry.error = `Asset status: ${statusData.status}`;
        console.debug(`[EagerPreload] Not ready yet (${statusData.status}), will retry: ${mediaAssetId}`);
        return;
      }

      // STEP 2: Asset is READY in DB, now fetch the stream
      const streamResponse = await fetch(
        `/api/media-assets/${mediaAssetId}/stream`,
        {
          method: "GET",
          headers: { Accept: "audio/mpeg" },
          signal: AbortSignal.timeout(30000), // 30s timeout for download
          priority: "high" as RequestInit["priority"],
        }
      );

      if (streamResponse.status === 400) {
        // Shouldn't happen since we checked status, but handle it
        entry.status = "retry_pending";
        entry.error = "Stream fetch returned 400";
        console.debug(`[EagerPreload] Unexpected 400, will retry: ${mediaAssetId}`);
        return;
      }

      if (!streamResponse.ok) {
        throw new Error(`Stream fetch failed: ${streamResponse.status}`);
      }

      const blob = await streamResponse.blob();

      if (blob.size === 0) {
        throw new Error("Empty blob received");
      }

      const blobUrl = URL.createObjectURL(blob);

      entry.blobUrl = blobUrl;
      entry.status = "ready";
      entry.retryCount = 0;
      console.debug(`[EagerPreload] Ready: ${mediaAssetId} (${blob.size} bytes)`);
    } catch (error) {
      entry.status = "failed";
      entry.error = error instanceof Error ? error.message : "Unknown error";
      console.warn(`[EagerPreload] Failed: ${mediaAssetId}`, error);
    }
  }

  /**
   * Retry scheduler for assets marked as "not ready yet"
   */
  private startRetryScheduler(): void {
    if (this.retryInterval) return;

    this.retryInterval = setInterval(() => {
      const retryPending = Array.from(this.preloadedAssets.entries())
        .filter(([_, entry]) => entry.status === "retry_pending" && entry.retryCount < this.maxRetries)
        .map(([id, _]) => id);

      if (retryPending.length > 0) {
        retryPending.forEach((id) => {
          const entry = this.preloadedAssets.get(id)!;
          entry.retryCount += 1;
          console.debug(`[EagerPreload] Retry attempt ${entry.retryCount} for ${id}`);
        });

        // Requeue for processing
        this.processPreloadQueue();
      } else if (this.retryInterval) {
        clearInterval(this.retryInterval);
        this.retryInterval = null;
      }
    }, 3000); // Retry every 3 seconds
  }

  /**
   * Clear all preloaded assets
   */
  clear(): void {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }

    for (const [_, entry] of this.preloadedAssets.entries()) {
      if (entry.blobUrl) {
        URL.revokeObjectURL(entry.blobUrl);
      }
    }
    this.preloadedAssets.clear();
  }

  /**
   * Get stats for debugging
   */
  getStats(): {
    total: number;
    ready: number;
    loading: number;
    failed: number;
    pending: number;
    retryPending: number;
  } {
    let ready = 0;
    let loading = 0;
    let failed = 0;
    let pending = 0;
    let retryPending = 0;

    for (const [_, entry] of this.preloadedAssets.entries()) {
      if (entry.status === "ready") ready++;
      else if (entry.status === "loading") loading++;
      else if (entry.status === "failed") failed++;
      else if (entry.status === "retry_pending") retryPending++;
      else if (entry.status === "pending") pending++;
    }

    return {
      total: this.preloadedAssets.size,
      ready,
      loading,
      failed,
      pending,
      retryPending,
    };
  }
}

// Singleton
let eagerPreloadService: EagerPreloadService | null = null;

export function getEagerPreloadService(): EagerPreloadService {
  if (!eagerPreloadService) {
    eagerPreloadService = new EagerPreloadService();
  }
  return eagerPreloadService;
}

export default EagerPreloadService;
