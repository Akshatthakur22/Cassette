import { PlaybackEngine, PlaybackTrack, PlaybackState } from "./types";

declare global {
  interface Window {
    YT?: {
      Player: new (containerId: string, options: unknown) => Record<string, (...args: unknown[]) => unknown>;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export class YouTubeEngine implements PlaybackEngine {
  private player: Record<string, (...args: unknown[]) => unknown> | null = null;
  private containerId: string;
  private stateChangeCb: ((partial: Partial<PlaybackState>) => void) | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private isDestroyed = false;
  private currentTrack: PlaybackTrack | null = null;
  private isPlayerReady = false;

  constructor(containerId: string = "yt-player-cassette") {
    this.containerId = containerId;
  }

  onStateChange(cb: (partial: Partial<PlaybackState>) => void): void {
    this.stateChangeCb = cb;
  }

  private emitState(partial: Partial<PlaybackState>) {
    if (this.stateChangeCb && !this.isDestroyed) {
      this.stateChangeCb(partial);
    }
  }

  private ensureApiLoaded(): Promise<void> {
    if (typeof window === "undefined") return Promise.reject("SSR");
    if (window.YT?.Player) return Promise.resolve();

    return new Promise((resolve) => {
      if (!document.getElementById("yt-iframe-script")) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-script";
        tag.src = "https://www.youtube.com/iframe_api";
        tag.async = true;
        tag.defer = true;
        document.head.appendChild(tag);
      }

      const prevOnReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prevOnReady?.();
        resolve();
      };

      const timer = setInterval(() => {
        if (window.YT?.Player) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  }

  private startPolling() {
    this.stopPolling();
    this.pollInterval = setInterval(() => {
      if (!this.player || this.isDestroyed) return;
      try {
        const curr = this.player.getCurrentTime?.();
        const currentTime = typeof curr === "number" ? curr : 0;
        const dur = this.player.getDuration?.();
        const duration = typeof dur === "number" && dur > 0 ? Math.round(dur) : this.currentTrack?.durationSec || 0;
        this.emitState({ currentTime, duration });
      } catch (e) {
        console.debug("[YouTubeEngine] Error polling current time:", e);
      }
    }, 500);
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private initPlayer(videoId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") return reject("SSR");

      const el = document.getElementById(this.containerId);
      if (!el) {
        console.warn(`[YouTubeEngine] Container element #${this.containerId} not found`);
      }

      if (!window.YT?.Player) {
        return reject("YouTube API Player not ready");
      }

      try {
        this.player = new window.YT.Player(this.containerId, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            fs: 0,
            iv_load_policy: 3,
          },
          events: {
            onReady: (event: { target: Record<string, (...args: unknown[]) => unknown> }) => {
              this.isPlayerReady = true;
              try {
                event.target.setVolume?.(100);
                event.target.unMute?.();
                const dur = event.target.getDuration?.();
                if (typeof dur === "number" && dur > 0) {
                  this.emitState({ duration: Math.round(dur) });
                }
              } catch (e) {
                console.warn("[YouTubeEngine] onReady volume error:", e);
              }
              resolve();
            },
            onStateChange: (event: { target: Record<string, (...args: unknown[]) => unknown>; data: number }) => {
              // YT.PlayerState: UNSTARTED (-1), ENDED (0), PLAYING (1), PAUSED (2), BUFFERING (3), CUED (5)
              if (event.data === 1) { // PLAYING
                this.emitState({ isPlaying: true, isBuffering: false });
                this.startPolling();
                const dur = event.target.getDuration?.();
                if (typeof dur === "number" && dur > 0) {
                  this.emitState({ duration: Math.round(dur) });
                }
              } else if (event.data === 2) { // PAUSED
                this.emitState({ isPlaying: false, isBuffering: false });
                this.stopPolling();
              } else if (event.data === 0) { // ENDED
                this.emitState({ isPlaying: false, isBuffering: false, currentTime: this.currentTrack?.durationSec || 0 });
                this.stopPolling();
              } else if (event.data === 3) { // BUFFERING
                this.emitState({ isBuffering: true });
              }
            },
            onError: (event: { data: number }) => {
              console.warn(`[YouTubeEngine] YouTube error (${event.data}) for videoId:`, videoId);
              this.emitState({ isPlaying: false, isBuffering: false });
              this.stopPolling();
            },
          },
        });
      } catch (err) {
        console.error("[YouTubeEngine] Player instantiation failed:", err);
        reject(err);
      }
    });
  }

  async load(track: PlaybackTrack): Promise<void> {
    this.currentTrack = track;
    this.emitState({
      currentTime: 0,
      duration: track.durationSec || 0,
      isPlaying: false,
      isBuffering: false,
    });

    await this.ensureApiLoaded();
    if (this.isDestroyed) return;

    if (!this.player) {
      await this.initPlayer(track.providerTrackId);
    } else if (this.isPlayerReady && typeof this.player.cueVideoById === "function") {
      try {
        this.player.cueVideoById(track.providerTrackId);
      } catch (err) {
        console.warn("[YouTubeEngine] Error cuing video:", err);
      }
    }
  }

  async play(): Promise<void> {
    if (!this.player) return;
    try {
      if (this.currentTrack && this.isPlayerReady && typeof this.player.loadVideoById === "function") {
        const state = this.player.getPlayerState?.();
        if (state === 5 || state === -1) {
          this.player.loadVideoById(this.currentTrack.providerTrackId);
          return;
        }
      }
      this.player.unMute?.();
      this.player.setVolume?.(100);
      this.player.playVideo?.();
    } catch (err) {
      console.error("[YouTubeEngine] playVideo failed:", err);
    }
  }

  async pause(): Promise<void> {
    if (!this.player) return;
    try {
      this.player.pauseVideo?.();
    } catch (err) {
      console.error("[YouTubeEngine] pauseVideo failed:", err);
    }
  }

  async seek(seconds: number): Promise<void> {
    if (!this.player) return;
    try {
      this.player.seekTo?.(seconds, true);
      this.emitState({ currentTime: seconds });
    } catch (err) {
      console.error("[YouTubeEngine] seekTo failed:", err);
    }
  }

  destroy(): void {
    this.isDestroyed = true;
    this.stopPolling();
    if (this.player) {
      try {
        this.player.destroy?.();
      } catch (e) {
        console.warn("[YouTubeEngine] Destroy error:", e);
      }
      this.player = null;
    }
    this.stateChangeCb = null;
    this.isPlayerReady = false;
  }
}
