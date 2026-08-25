/**
 * AudioAssetEngine - Plays processed MP3 files from Cloudflare R2
 * Extends PlaybackEngine interface for HTML5 audio playback
 *
 * Used for tracks with provider="media_asset" (converted from YouTube to MP3)
 * Handles:
 * - Fetching signed/public URLs from API
 * - HTML5 audio playback with state tracking
 * - Background playback support
 * - MediaSession API integration
 */

import { PlaybackEngine, PlaybackTrack, PlaybackState } from "./types";

export class AudioAssetEngine implements PlaybackEngine {
  private audio: HTMLAudioElement | null = null;
  private stateChangeCb: ((partial: Partial<PlaybackState>) => void) | null = null;
  private isDestroyed = false;
  private currentTrack: PlaybackTrack | null = null;
  private mediaAssetId: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.audio = new Audio();
      this.attachListeners();
    }
  }

  private attachListeners() {
    if (!this.audio) return;

    this.audio.addEventListener("timeupdate", this.handleTimeUpdate);
    this.audio.addEventListener("durationchange", this.handleDurationChange);
    this.audio.addEventListener("ended", this.handleEnded);
    this.audio.addEventListener("waiting", this.handleWaiting);
    this.audio.addEventListener("playing", this.handlePlaying);
    this.audio.addEventListener("pause", this.handlePause);
    this.audio.addEventListener("error", this.handleError);
  }

  private removeListeners() {
    if (!this.audio) return;

    this.audio.removeEventListener("timeupdate", this.handleTimeUpdate);
    this.audio.removeEventListener("durationchange", this.handleDurationChange);
    this.audio.removeEventListener("ended", this.handleEnded);
    this.audio.removeEventListener("waiting", this.handleWaiting);
    this.audio.removeEventListener("playing", this.handlePlaying);
    this.audio.removeEventListener("pause", this.handlePause);
    this.audio.removeEventListener("error", this.handleError);
  }

  private handleTimeUpdate = () => {
    if (!this.audio) return;
    this.emitState({
      currentTime: this.audio.currentTime || 0,
    });
  };

  private handleDurationChange = () => {
    if (!this.audio) return;
    const dur = this.audio.duration;
    if (dur && !isNaN(dur) && isFinite(dur) && dur > 0) {
      this.emitState({ duration: Math.round(dur) });
    }
  };

  private handleEnded = () => {
    this.emitState({
      isPlaying: false,
      isBuffering: false,
      currentTime: this.audio?.duration || this.audio?.currentTime || 0,
    });
  };

  private handleWaiting = () => {
    this.emitState({ isBuffering: true });
  };

  private handlePlaying = () => {
    this.emitState({ isPlaying: true, isBuffering: false });
  };

  private handlePause = () => {
    this.emitState({ isPlaying: false });
  };

  private handleError = (e: Event) => {
    const audio = this.audio;
    let errorMessage = "playback error";

    if (audio?.error) {
      switch (audio.error.code) {
        case 1:
          errorMessage = "loading aborted";
          break;
        case 2:
          errorMessage = "network error";
          break;
        case 3:
          errorMessage = "decoding failed";
          break;
        case 4:
          errorMessage = "unsupported audio format";
          break;
        default:
          errorMessage = `error code ${audio.error.code}`;
      }
    }

    console.error("[AudioAssetEngine] Audio error:", { errorMessage, event: e });
    this.emitState({ isPlaying: false, isBuffering: false });
  };

  private emitState(partial: Partial<PlaybackState>) {
    if (this.stateChangeCb && !this.isDestroyed) {
      this.stateChangeCb(partial);
    }
  }

  onStateChange(cb: (partial: Partial<PlaybackState>) => void): void {
    this.stateChangeCb = cb;
  }

  /**
   * Load a media asset track
   * Fetches signed URL from API endpoint, then loads into audio element
   * Handles pending assets by retrying automatically
   */
  async load(track: PlaybackTrack, retries: number = 0): Promise<void> {
    if (!this.audio) return;

    try {
      this.currentTrack = track;
      this.mediaAssetId = track.providerTrackId; // For media_asset, this is the mediaAssetId

      // Fetch audio from our stream endpoint (has CORS headers)
      // This proxies R2 with proper CORS headers for browser playback
      const streamUrl = `/api/media-assets/${this.mediaAssetId}/stream`;
      
      const checkResponse = await fetch(streamUrl, { method: 'HEAD' });
      
      if (checkResponse.status === 202) {
        // Asset is still processing
        const retryAfter = parseInt(checkResponse.headers.get('Retry-After') || '3', 10) * 1000;
        console.log(`[AudioAssetEngine] Asset processing, retrying in ${retryAfter}ms`, { mediaAssetId: this.mediaAssetId });
        
        this.emitState({
          isPlaying: false,
          isBuffering: true,
        });

        // Retry after delay (max 10 attempts = ~30 seconds)
        if (retries < 10) {
          await new Promise(resolve => setTimeout(resolve, retryAfter));
          return this.load(track, retries + 1);
        } else {
          throw new Error('Media asset processing timeout');
        }
      } else if (!checkResponse.ok) {
        throw new Error(`Stream check failed: ${checkResponse.status} ${checkResponse.statusText}`);
      }
      
      // Set audio source to stream endpoint
      this.audio.src = streamUrl;
      this.audio.load();

      // Emit state with track duration
      const duration = track.durationSec ?? 0;
      this.emitState({
        currentTime: 0,
        duration,
        isPlaying: false,
        isBuffering: false,
      });

      console.log("[AudioAssetEngine] Track loaded successfully", {
        mediaAssetId: this.mediaAssetId,
        duration,
        streamUrl,
      });
    } catch (error) {
      console.error("[AudioAssetEngine] Failed to load track:", {
        mediaAssetId: this.mediaAssetId,
        error: String(error),
      });

      this.emitState({
        isPlaying: false,
        isBuffering: false,
      });

      throw error;
    }
  }

  /**
   * Start playback
   * Supports background playback via MediaSession API
   */
  async play(): Promise<void> {
    if (!this.audio) return;

    try {
      await this.audio.play();

      // Update MediaSession API for background playback
      if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "playing";
      }
    } catch (err) {
      console.error("[AudioAssetEngine] Play error:", err);
      this.emitState({ isPlaying: false });
    }
  }

  /**
   * Pause playback
   */
  async pause(): Promise<void> {
    if (!this.audio) return;

    this.audio.pause();

    // Update MediaSession API
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "paused";
    }
  }

  /**
   * Seek to specific time
   */
  async seek(seconds: number): Promise<void> {
    if (!this.audio) return;

    try {
      this.audio.currentTime = seconds;
      this.emitState({ currentTime: seconds });
    } catch (err) {
      console.error("[AudioAssetEngine] Seek error:", err);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.isDestroyed = true;

    if (this.audio) {
      this.pause();
      this.removeListeners();
      this.audio.src = "";
      this.audio = null;
    }

    this.stateChangeCb = null;
    this.currentTrack = null;
    this.mediaAssetId = null;

    // Update MediaSession API
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "none";
    }
  }
}
