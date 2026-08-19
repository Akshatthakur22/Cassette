import { PlaybackEngine, PlaybackTrack, PlaybackState } from "./types";

function resolveVoiceUrl(providerTrackId: string): string {
  if (!providerTrackId) return "";
  if (
    providerTrackId.startsWith("http://") ||
    providerTrackId.startsWith("https://") ||
    providerTrackId.startsWith("/") ||
    providerTrackId.startsWith("data:") ||
    providerTrackId.startsWith("blob:")
  ) {
    return providerTrackId;
  }
  if (providerTrackId.endsWith(".webm")) {
    return `/voice-recordings/${providerTrackId}`;
  }
  return `/voice-recordings/${providerTrackId}.webm`;
}

export class VoiceEngine implements PlaybackEngine {
  private audio: HTMLAudioElement | null = null;
  private stateChangeCb: ((partial: Partial<PlaybackState>) => void) | null = null;
  private isDestroyed = false;

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
    console.error("[VoiceEngine] Audio error event:", e);
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
    const url = resolveVoiceUrl(track.providerTrackId);
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
      console.error("[VoiceEngine] Play error:", err);
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
      console.error("[VoiceEngine] Seek error:", err);
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
