import {
  PlaybackState,
  PlaybackTrack,
  PlaybackEngine,
  PlaybackListener,
} from "./types";
import { AudioEngine } from "./AudioEngine";
import { updateMediaSession } from "./MediaSessionManager";
import { nativePlaybackBridge, NativePlaybackBridge } from "./native/NativePlaybackBridge";
import { songResolver } from "./SongResolver";

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
  private nativeBridge: NativePlaybackBridge = nativePlaybackBridge;
  private currentProvider: string | null = null;
  private listeners: Set<PlaybackListener> = new Set();

  constructor() {
    this.setupNativeBridgeListener();
  }

  private setupNativeBridgeListener() {
    this.nativeBridge.subscribe((event) => {
      if (this.currentProvider !== "native_audio") return;
      console.log("[REACT-PLAYBACK] nativeEvent received:", event);

      if (event.type === "timeUpdate" && event.currentTime !== undefined) {
        this.handleEngineUpdate({
          currentTime: event.currentTime,
          duration: event.duration || this.state.duration,
        });
      } else if (event.type === "play") {
        this.handleEngineUpdate({ isPlaying: true });
      } else if (event.type === "pause") {
        this.handleEngineUpdate({ isPlaying: false });
      } else if (event.type === "ended") {
        this.handleEngineUpdate({ isPlaying: false, currentTime: this.state.duration });
        this.next();
      } else if (event.type === "trackChanged" && event.trackId) {
        const foundIndex = this.state.queue.findIndex((t) => t.id === event.trackId);
        if (foundIndex >= 0) {
          const track = this.state.queue[foundIndex];
          this.state = {
            ...this.state,
            currentTrack: track,
            queueIndex: foundIndex,
            side: track.side,
          };
          this.emit();
        }
      }
    });
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

  public async syncWithNativeState(): Promise<void> {
    if (!this.nativeBridge.isAvailable()) return;

    try {
      console.log("[REACT-PLAYBACK] syncWithNativeState() starting...");
      const nativeState = await this.nativeBridge.getState();
      console.log("[REACT-PLAYBACK] syncWithNativeState() received:", nativeState);

      if (nativeState && nativeState.currentTrackId) {
        const foundIndex = this.state.queue.findIndex((t) => t.id === nativeState.currentTrackId);
        if (foundIndex >= 0) {
          const track = this.state.queue[foundIndex];
          this.currentProvider = "native_audio";
          this.state = {
            ...this.state,
            currentTrack: track,
            queueIndex: foundIndex,
            side: track.side,
            isPlaying: nativeState.isPlaying,
            currentTime: nativeState.currentTime,
            duration: nativeState.duration > 0 ? nativeState.duration : track.durationSec || 0,
            isBuffering: nativeState.isBuffering,
          };
          this.emit();
        }
      }
    } catch (e) {
      console.debug("[REACT-PLAYBACK] Error syncing with native state:", e);
    }
  }

  public setQueue(queue: PlaybackTrack[], startIndex = 0): void {
    console.log("[REACT-PLAYBACK] setQueue() called: length=" + queue.length + ", startIndex=" + startIndex);
    const validIndex = Math.max(0, Math.min(startIndex, queue.length - 1));
    this.state = {
      ...this.state,
      queue,
      queueIndex: validIndex,
      currentTrack: queue[validIndex] || null,
      side: queue[validIndex]?.side || "A",
    };
    this.emit();

    if (this.nativeBridge.isAvailable() && this.currentProvider === "native_audio") {
      this.nativeBridge.setQueue(queue, validIndex);
    }

    // Prefetch next tracks
    songResolver.prefetchQueue(queue, validIndex);
  }

  public async playTrack(track: PlaybackTrack, queue?: PlaybackTrack[]): Promise<void> {
    console.log("[REACT-PLAYBACK] playTrack() called:", track.id, track.title, track.provider);
    const newQueue = queue || this.state.queue;
    const queueIndex = newQueue.findIndex((t) => t.id === track.id);
    const resolvedIndex = queueIndex >= 0 ? queueIndex : this.state.queueIndex;

    // Immediately update UI track state to show active item
    this.state = {
      ...this.state,
      currentTrack: track,
      queue: newQueue,
      queueIndex: resolvedIndex,
      side: track.side,
      currentTime: 0,
      duration: track.durationSec || 0,
      isPlaying: true,
      isBuffering: true,
    };
    this.emit();

    // 1. Resolve audio URL if needed for YouTube tracks
    let activeTrack: PlaybackTrack = { ...track };
    if ((activeTrack.provider === "youtube" || activeTrack.provider === "cassette") && !activeTrack.audioUrl) {
      const cached = songResolver.getCached(activeTrack.providerTrackId);
      if (cached && cached.audioUrl) {
        activeTrack = {
          ...activeTrack,
          audioUrl: cached.audioUrl,
          durationSec: cached.durationSec || activeTrack.durationSec,
        };
      } else {
        const resolved = await songResolver.resolveSong(activeTrack.providerTrackId, activeTrack);
        if (resolved && resolved.audioUrl) {
          activeTrack = {
            ...activeTrack,
            audioUrl: resolved.audioUrl,
            durationSec: resolved.durationSec || activeTrack.durationSec,
          };
        }
      }

      if (resolvedIndex >= 0 && resolvedIndex < newQueue.length) {
        newQueue[resolvedIndex] = activeTrack;
      }
    }

    // Prefetch upcoming tracks
    songResolver.prefetchQueue(newQueue, resolvedIndex);

    // 2. Route to Android Native Player
    if (this.nativeBridge.isAvailable()) {
      if (this.engine) {
        this.engine.destroy();
        this.engine = null;
      }
      this.currentProvider = "native_audio";

      this.state = {
        ...this.state,
        currentTrack: activeTrack,
        queue: newQueue,
        queueIndex: resolvedIndex,
        side: activeTrack.side,
        duration: activeTrack.durationSec || 0,
        isPlaying: true,
        isBuffering: false,
      };
      this.emit();

      await this.nativeBridge.playTrack(activeTrack);
      await this.nativeBridge.setQueue(newQueue, resolvedIndex);
      updateMediaSession(this.state);
      return;
    }

    // 3. Route to Web HTML5 AudioEngine (playing downloaded song from library)
    if (this.currentProvider === "native_audio") {
      await this.nativeBridge.pause();
    }

    if (!this.engine || !(this.engine instanceof AudioEngine)) {
      if (this.engine) {
        this.engine.destroy();
      }
      this.engine = new AudioEngine();
    }
    this.currentProvider = "web_audio";
    this.engine.onStateChange(this.handleEngineUpdate);

    this.state = {
      ...this.state,
      currentTrack: activeTrack,
      queue: newQueue,
      queueIndex: resolvedIndex,
      side: activeTrack.side,
      duration: activeTrack.durationSec || 0,
      isPlaying: false,
      isBuffering: true,
    };
    this.emit();

    await this.engine.load(activeTrack);
    await this.engine.play();

    this.state = { ...this.state, isPlaying: true, isBuffering: false };
    this.emit();
    updateMediaSession(this.state);
  }

  public async play(): Promise<void> {
    console.log("[REACT-PLAYBACK] play() called: currentTrack=" + this.state.currentTrack?.id);
    if (!this.state.currentTrack) {
      if (this.state.queue.length > 0) {
        await this.playTrack(this.state.queue[this.state.queueIndex || 0]);
      }
      return;
    }

    if (this.currentProvider === "native_audio" && this.nativeBridge.isAvailable()) {
      await this.nativeBridge.play();
    } else if (this.engine) {
      await this.engine.play();
    } else {
      await this.playTrack(this.state.currentTrack, this.state.queue);
      return;
    }
    this.state = { ...this.state, isPlaying: true };
    this.emit();
    updateMediaSession(this.state);
  }

  public async pause(): Promise<void> {
    console.log("[REACT-PLAYBACK] pause() called");
    if (this.currentProvider === "native_audio" && this.nativeBridge.isAvailable()) {
      await this.nativeBridge.pause();
    } else if (this.engine) {
      await this.engine.pause();
    }
    this.state = { ...this.state, isPlaying: false };
    this.emit();
    updateMediaSession(this.state);
  }

  public async seek(seconds: number): Promise<void> {
    console.log("[REACT-PLAYBACK] seek() called:", seconds);
    if (this.currentProvider === "native_audio" && this.nativeBridge.isAvailable()) {
      await this.nativeBridge.seek(seconds);
    } else if (this.engine) {
      await this.engine.seek(seconds);
    }
    this.state = { ...this.state, currentTime: seconds };
    this.emit();
    updateMediaSession(this.state);
  }

  public async next(): Promise<void> {
    console.log("[REACT-PLAYBACK] next() called");
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
    console.log("[REACT-PLAYBACK] previous() called");
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
