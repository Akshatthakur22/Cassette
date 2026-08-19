import { registerPlugin, PluginListenerHandle } from "@capacitor/core";
import { NativePlaybackTrack, NativePlaybackState, NativePlaybackEvent } from "./types";

export interface CassettePlaybackPluginInterface {
  play(track: NativePlaybackTrack): Promise<{ success: boolean }>;
  pause(): Promise<{ success: boolean }>;
  seek(options: { seconds: number }): Promise<{ success: boolean }>;
  next(): Promise<{ success: boolean }>;
  previous(): Promise<{ success: boolean }>;
  setQueue(options: { queue: NativePlaybackTrack[]; index: number }): Promise<{ success: boolean }>;
  getState(): Promise<NativePlaybackState>;
  destroy(): Promise<{ success: boolean }>;
  addListener(
    eventName: "playbackEvent",
    listenerFunc: (event: NativePlaybackEvent) => void
  ): Promise<PluginListenerHandle>;
}

export const CassettePlayback = registerPlugin<CassettePlaybackPluginInterface>("CassettePlayback", {
  web: () => import("./CassettePlaybackWeb").then((m) => new m.CassettePlaybackWeb()),
});
