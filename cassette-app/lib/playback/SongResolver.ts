import { PlaybackTrack } from "./types";

export interface ResolvedSong {
  id: string;
  videoId: string;
  title: string;
  artist?: string;
  thumbnailUrl?: string;
  durationSec?: number;
  audioUrl: string;
  status: string;
}

class SongResolver {
  private cache = new Map<string, ResolvedSong>();
  private activeResolutions = new Map<string, Promise<ResolvedSong | null>>();

  /**
   * Cleans YouTube URLs or extracts standard 11-char videoId.
   */
  public extractVideoId(urlOrId: string): string {
    if (!urlOrId) return "";
    try {
      if (urlOrId.includes("youtube.com") || urlOrId.includes("youtu.be")) {
        const url = new URL(urlOrId.startsWith("http") ? urlOrId : `https://${urlOrId}`);
        if (url.searchParams.has("v")) return url.searchParams.get("v") || "";
        if (url.pathname.startsWith("/shorts/")) return url.pathname.replace("/shorts/", "");
        if (url.hostname === "youtu.be") return url.pathname.slice(1);
      }
    } catch {}
    return urlOrId.trim();
  }

  /**
   * Resolves a videoId to a Cassette-hosted audioUrl.
   */
  public async resolveSong(
    videoIdOrUrl: string,
    meta?: Partial<PlaybackTrack>
  ): Promise<ResolvedSong | null> {
    const videoId = this.extractVideoId(videoIdOrUrl);
    if (!videoId) return null;

    // 1. Check local cache
    const cached = this.cache.get(videoId);
    if (cached) {
      return cached;
    }

    // 2. Check in-flight resolution
    const inFlight = this.activeResolutions.get(videoId);
    if (inFlight) {
      return inFlight;
    }

    // 3. Request resolution from backend
    const resolutionPromise = (async () => {
      try {
        console.log(`[SongResolver] Requesting resolution for videoId: ${videoId}`);
        const res = await fetch("/api/songs/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoId,
            title: meta?.title,
            artist: meta?.artist,
            thumbnailUrl: meta?.artworkUrl,
            durationSec: meta?.durationSec,
          }),
        });

        if (!res.ok) {
          console.warn(`[SongResolver] API responded with status ${res.status}`);
          return null;
        }

        const data = await res.json();
        if (data.success && data.song?.audioUrl) {
          const resolved: ResolvedSong = {
            id: data.song.id,
            videoId: data.song.videoId,
            title: data.song.title,
            artist: data.song.artist,
            thumbnailUrl: data.song.thumbnailUrl,
            durationSec: data.song.durationSec,
            audioUrl: data.song.audioUrl,
            status: data.song.status,
          };
          this.cache.set(videoId, resolved);
          return resolved;
        }
        return null;
      } catch (err) {
        console.error(`[SongResolver] Error resolving song ${videoId}:`, err);
        return null;
      } finally {
        this.activeResolutions.delete(videoId);
      }
    })();

    this.activeResolutions.set(videoId, resolutionPromise);
    return resolutionPromise;
  }

  /**
   * Prefetches and pre-resolves upcoming tracks in the queue.
   */
  public prefetchQueue(queue: PlaybackTrack[], currentIndex: number): void {
    const nextTracks = queue.slice(currentIndex + 1, currentIndex + 3);
    for (const track of nextTracks) {
      if (track.provider === "youtube" && track.providerTrackId) {
        this.resolveSong(track.providerTrackId, track).catch(() => {});
      }
    }
  }

  /**
   * Inspect cache synchronously.
   */
  public getCached(videoId: string): ResolvedSong | undefined {
    return this.cache.get(this.extractVideoId(videoId));
  }
}

export const songResolver = new SongResolver();
