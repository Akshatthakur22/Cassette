import { PlaybackEngine, PlaybackTrack, PlaybackState } from "./types";

export function resolveAudioUrl(track: PlaybackTrack): string {
  if (track.audioUrl) {
    return track.audioUrl;
  }
  const id = (track.providerTrackId || "").trim();
  if (!id) return "";
  if (
    id.startsWith("http://") ||
    id.startsWith("https://") ||
    id.startsWith("/") ||
    id.startsWith("data:") ||
    id.startsWith("blob:")
  ) {
    return id;
  }
  if (track.provider === "voice") {
    return id.endsWith(".webm") ? `/voice-recordings/${id}` : `/voice-recordings/${id}.webm`;
  }
  const sanitizedId = id.replace(/[^a-zA-Z0-9_-]/g, "");
  return `/audio-library/${sanitizedId}.mp3`;
}

export class AudioEngine implements PlaybackEngine {
  private audio: HTMLAudioElement | null = null;
  private stateChangeCb: ((partial: Partial<PlaybackState>) => void) | null = null;
  private isDestroyed = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.audio = new Audio();
      this.audio.preload = "auto";
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
    console.error("[AudioEngine] HTMLAudioElement error:", e);
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

  async load(track: PlaybackTrack): Promise<void> {
    if (!this.audio) return;
    const url = resolveAudioUrl(track);
    console.log(`[AudioEngine] Loading URL into HTMLAudioElement: ${url}`);

    this.audio.src = url;
    this.audio.load();

    const duration = track.durationSec ?? 0;
    this.emitState({
      currentTime: 0,
      duration,
      isPlaying: false,
      isBuffering: false,
    });
  }

  async play(): Promise<void> {
    if (!this.audio) return;
    try {
      await this.audio.play();
    } catch (err) {
      console.warn("[AudioEngine] Play request rejected/interrupted:", err);
      this.emitState({ isPlaying: false });
    }
  }

  async pause(): Promise<void> {
    if (!this.audio) return;
    this.audio.pause();
  }

  async seek(seconds: number): Promise<void> {
    if (!this.audio) return;
    try {
      this.audio.currentTime = seconds;
      this.emitState({ currentTime: seconds });
    } catch (err) {
      console.error("[AudioEngine] Seek error:", err);
    }
  }

  destroy(): void {
    this.isDestroyed = true;
    if (this.audio) {
      this.pause();
      this.removeListeners();
      this.audio.src = "";
      this.audio = null;
    }
    this.stateChangeCb = null;
  }
}
