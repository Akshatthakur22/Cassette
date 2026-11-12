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
   * Waits for processing to finish, then loads the stream endpoint.
   */
  async load(track: PlaybackTrack, retries: number = 0): Promise<void> {
    if (!this.audio) return;

    try {
      this.currentTrack = track;
      this.mediaAssetId = track.providerTrackId; // For media_asset, this is the mediaAssetId

      const statusResponse = await fetch(`/api/media-assets/${this.mediaAssetId}/status`, {
        cache: "no-store",
      });
      if (!statusResponse.ok) {
        throw new Error(`Status check failed: ${statusResponse.status}`);
      }
      const asset = await statusResponse.json();

      if (asset.status !== "READY") {
        if (asset.status === "FAILED" || asset.status === "EXPIRED") {
          throw new Error(asset.error || `Media processing ${asset.status.toLowerCase()}`);
        }
        this.emitState({
          isPlaying: false,
          isBuffering: true,
        });

        // Downloads can take longer than the old 30 second window. Poll the
        // job record (small response) instead of repeatedly probing the audio stream.
        if (retries < 40) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          return this.load(track, retries + 1);
        } else {
          throw new Error(`Media asset is still ${asset.status.toLowerCase()} after 2 minutes`);
        }
      }
      
      const streamUrl = `/api/media-assets/${this.mediaAssetId}/stream`;
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
