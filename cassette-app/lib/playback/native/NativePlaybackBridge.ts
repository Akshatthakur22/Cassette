import { Capacitor } from "@capacitor/core";
import { CassettePlayback } from "./CassettePlaybackPlugin";
import {
  NativePlaybackTrack,
  NativePlaybackState,
  NativePlaybackEvent,
  NativePlaybackEventListener,
} from "./types";
import { PlaybackTrack } from "../types";

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

export class NativePlaybackBridge {
  private listenerHandle: unknown = null;
  private listeners: Set<NativePlaybackEventListener> = new Set();

  public isAvailable(): boolean {
    if (typeof window === "undefined") return false;
    return Capacitor.isNativePlatform();
  }

  public async playTrack(track: PlaybackTrack): Promise<void> {
    if (!this.isAvailable()) return;

    const nativeTrack: NativePlaybackTrack = {
      id: track.id,
      url: resolveVoiceUrl(track.providerTrackId),
      title: track.title,
      artist: track.artist || "Cassette",
      album: "Cassette",
      artworkUrl: track.artworkUrl,
      durationSec: track.durationSec,
      side: track.side,
    };

    await this.setupEventListener();
    await CassettePlayback.play(nativeTrack);
  }

  public async play(): Promise<void> {
    if (!this.isAvailable()) return;
    await CassettePlayback.play({ id: "", url: "", title: "" });
  }

  public async pause(): Promise<void> {
    if (!this.isAvailable()) return;
    await CassettePlayback.pause();
  }

  public async seek(seconds: number): Promise<void> {
    if (!this.isAvailable()) return;
    await CassettePlayback.seek({ seconds });
  }

  public async next(): Promise<void> {
    if (!this.isAvailable()) return;
    await CassettePlayback.next();
  }

  public async previous(): Promise<void> {
    if (!this.isAvailable()) return;
    await CassettePlayback.previous();
  }

  public async setQueue(queue: PlaybackTrack[], index: number): Promise<void> {
    if (!this.isAvailable()) return;
    const nativeQueue: NativePlaybackTrack[] = queue.map((t) => ({
      id: t.id,
      url: resolveVoiceUrl(t.providerTrackId),
      title: t.title,
      artist: t.artist || "Cassette",
      album: "Cassette",
      artworkUrl: t.artworkUrl,
      durationSec: t.durationSec,
      side: t.side,
    }));
    await CassettePlayback.setQueue({ queue: nativeQueue, index });
  }

  public async getState(): Promise<NativePlaybackState> {
    if (!this.isAvailable()) {
      return { isPlaying: false, currentTime: 0, duration: 0, isBuffering: false };
    }
    return await CassettePlayback.getState();
  }

  public subscribe(listener: NativePlaybackEventListener): () => void {
    this.listeners.add(listener);
    this.setupEventListener();

    return () => {
      this.listeners.delete(listener);
    };
  }

  private async setupEventListener() {
    if (this.listenerHandle || !this.isAvailable()) return;

    try {
      this.listenerHandle = await CassettePlayback.addListener(
        "playbackEvent",
        (event: NativePlaybackEvent) => {
          this.listeners.forEach((cb) => cb(event));
        }
      );
    } catch (err) {
      console.debug("[NativePlaybackBridge] addListener error:", err);
    }
  }

  public async destroy(): Promise<void> {
    if (this.isAvailable()) {
      await CassettePlayback.destroy();
    }
    this.listeners.clear();
    this.listenerHandle = null;
  }
}

export const nativePlaybackBridge = new NativePlaybackBridge();
