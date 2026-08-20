import { Capacitor } from "@capacitor/core";
import { CassettePlayback, NativeDiagnosticsData } from "./CassettePlaybackPlugin";
import {
  NativePlaybackTrack,
  NativePlaybackState,
  NativePlaybackEvent,
  NativePlaybackEventListener,
} from "./types";
import { PlaybackTrack } from "../types";

function resolveNativeAudioUrl(track: PlaybackTrack): string {
  let target = track.audioUrl || track.providerTrackId || "";
  if (!target) return "";

  if (
    target.startsWith("http://") ||
    target.startsWith("https://") ||
    target.startsWith("data:") ||
    target.startsWith("blob:")
  ) {
    return target;
  }

  // Base URL for relative paths when running in Capacitor Android/iOS WebView
  let baseUrl = "https://cassette-share.vercel.app";
  if (typeof window !== "undefined" && window.location?.origin && !window.location.origin.includes("localhost")) {
    baseUrl = window.location.origin;
  }

  if (target.startsWith("/")) {
    return `${baseUrl}${target}`;
  }

  if (track.provider === "voice") {
    const filename = target.endsWith(".webm") ? target : `${target}.webm`;
    return `${baseUrl}/voice-recordings/${filename}`;
  }

  return `${baseUrl}/audio-library/${target}.mp3`;
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

    const url = resolveNativeAudioUrl(track);
    console.log(`[NativePlaybackBridge] playTrack: title="${track.title}", url="${url}"`);

    const nativeTrack: NativePlaybackTrack = {
      id: track.id,
      url,
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
      url: resolveNativeAudioUrl(t),
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

  public async getDiagnostics(): Promise<NativeDiagnosticsData> {
    if (!this.isAvailable()) {
      return {
        serviceAlive: false,
        serviceId: 0,
        playerAlive: false,
        playerId: 0,
        playerState: "WEB_BROWSER",
        isPlaying: false,
        playWhenReady: false,
        currentPosition: 0,
        duration: 0,
        currentTrackId: null,
        controllerConnected: false,
        lastActivityState: "WEB",
        activityEvents: ["[WEB] Running in web browser"],
        logs: ["[WEB] Running in web browser, native bridge unavailable"],
      };
    }
    return await CassettePlayback.getDiagnostics();
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
