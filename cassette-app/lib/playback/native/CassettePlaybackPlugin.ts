import { registerPlugin, PluginListenerHandle } from "@capacitor/core";
import { NativePlaybackTrack, NativePlaybackState, NativePlaybackEvent } from "./types";

export interface NativeDiagnosticsData {
  serviceAlive: boolean;
  serviceId: number;
  playerAlive: boolean;
  playerId: number;
  playerState: string;
  isPlaying: boolean;
  playWhenReady: boolean;
  currentPosition: number;
  duration: number;
  currentTrackId?: string | null;
  controllerConnected: boolean;
  lastActivityState: string;
  activityEvents: string[];
  logs: string[];
}

export interface CassettePlaybackPluginInterface {
  play(track: NativePlaybackTrack): Promise<{ success: boolean }>;
  pause(): Promise<{ success: boolean }>;
  seek(options: { seconds: number }): Promise<{ success: boolean }>;
  next(): Promise<{ success: boolean }>;
  previous(): Promise<{ success: boolean }>;
  setQueue(options: { queue: NativePlaybackTrack[]; index: number }): Promise<{ success: boolean }>;
  getState(): Promise<NativePlaybackState>;
  getDiagnostics(): Promise<NativeDiagnosticsData>;
  destroy(): Promise<{ success: boolean }>;
  addListener(
    eventName: "playbackEvent",
    listenerFunc: (event: NativePlaybackEvent) => void
  ): Promise<PluginListenerHandle>;
}

export const CassettePlayback = registerPlugin<CassettePlaybackPluginInterface>("CassettePlayback", {
  web: () => import("./CassettePlaybackWeb").then((m) => new m.CassettePlaybackWeb()),
});
