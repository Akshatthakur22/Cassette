import {
  PlaybackState,
  PlaybackTrack,
  PlaybackEngine,
  PlaybackListener,
} from "./types";
import { VoiceEngine } from "./VoiceEngine";
import { YouTubeEngine } from "./YouTubeEngine";
import { AudioAssetEngine } from "./AudioAssetEngine";
import { updateMediaSession } from "./MediaSessionManager";

const initialPlaybackState: PlaybackState = {
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  side: "A",
  isBuffering: false,
};

export class PlaybackController {
  private state: PlaybackState = { ...initialPlaybackState };
  private engine: PlaybackEngine | null = null;
  private currentProvider: string | null = null;
  private listeners: Set<PlaybackListener> = new Set();
  private containerId: string = "yt-player-cassette";

  public setContainerId(id: string) {
    this.containerId = id;
  }

  public subscribe(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): PlaybackState {
    return this.state;
  }

  public setQueue(queue: PlaybackTrack[], startIndex = 0): void {
    this.state = {
      ...this.state,
      queue,
      queueIndex: Math.max(0, Math.min(startIndex, queue.length - 1)),
      currentTrack: queue[startIndex] || null,
      side: queue[startIndex]?.side || "A",
    };
    this.emit();
  }

  public async playTrack(track: PlaybackTrack, queue?: PlaybackTrack[]): Promise<void> {
    const newQueue = queue || this.state.queue;
    const queueIndex = newQueue.findIndex((t) => t.id === track.id);

    // 1. If engine exists and provider differs, destroy it
    if (this.engine && this.currentProvider !== track.provider) {
      this.engine.destroy();
      this.engine = null;
    }

    // 2. Instantiate YouTubeEngine, VoiceEngine, or AudioAssetEngine based on track.provider
    if (!this.engine) {
      if (track.provider === "voice") {
        this.engine = new VoiceEngine();
      } else if (track.provider === "media_asset") {
        this.engine = new AudioAssetEngine();
      } else {
        this.engine = new YouTubeEngine(this.containerId);
      }
      this.currentProvider = track.provider;
    }

    // 3. engine.load(track), engine.onStateChange(this.handleEngineUpdate)
    this.engine.onStateChange(this.handleEngineUpdate);

    this.state = {
      ...this.state,
      currentTrack: track,
      queue: newQueue,
      queueIndex: queueIndex >= 0 ? queueIndex : this.state.queueIndex,
      side: track.side,
      currentTime: 0,
      duration: track.durationSec || 0,
      isPlaying: false,
    };
    this.emit();

    await this.engine.load(track);

    // 4. engine.play()
    await this.engine.play();

    // 5. Update state & emit to listeners
    this.state = { ...this.state, isPlaying: true };
    this.emit();

    // 6. Update MediaSession
    updateMediaSession(this.state);
  }

  public async play(): Promise<void> {
    if (!this.state.currentTrack) {
      if (this.state.queue.length > 0) {
        await this.playTrack(this.state.queue[this.state.queueIndex || 0]);
      }
      return;
    }

    if (this.engine) {
      await this.engine.play();
    }
    this.state = { ...this.state, isPlaying: true };
    this.emit();
    updateMediaSession(this.state);
  }

  public async pause(): Promise<void> {
    if (this.engine) {
      await this.engine.pause();
    }
    this.state = { ...this.state, isPlaying: false };
    this.emit();
    updateMediaSession(this.state);
  }

  public async seek(seconds: number): Promise<void> {
    if (this.engine) {
      await this.engine.seek(seconds);
    }
    this.state = { ...this.state, currentTime: seconds };
    this.emit();
    updateMediaSession(this.state);
  }

  public async next(): Promise<void> {
    const { queue, queueIndex } = this.state;
    if (queue.length === 0) return;

    const nextIndex = queueIndex + 1;
    if (nextIndex < queue.length) {
      await this.playTrack(queue[nextIndex], queue);
    } else {
      await this.pause();
      await this.seek(0);
    }
  }

  public async previous(): Promise<void> {
    if (this.state.currentTime > 3) {
      await this.seek(0);
      return;
    }

    const { queue, queueIndex } = this.state;
    if (queue.length === 0) return;

    const prevIndex = Math.max(0, queueIndex - 1);
    await this.playTrack(queue[prevIndex], queue);
  }

  private handleEngineUpdate = (partial: Partial<PlaybackState>) => {
    const prevPlaying = this.state.isPlaying;
    this.state = { ...this.state, ...partial };

    // Auto advance track if track finished
    if (
      prevPlaying &&
      !this.state.isPlaying &&
      this.state.duration > 0 &&
      this.state.currentTime >= this.state.duration - 0.5
    ) {
      this.next();
      return;
    }

    this.emit();
  };

  private emit() {
    this.listeners.forEach((l) => l(this.state));
  }
}

export const playbackController = new PlaybackController();
