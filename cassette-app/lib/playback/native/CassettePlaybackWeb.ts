import { WebPlugin } from "@capacitor/core";
import {
  CassettePlaybackPluginInterface,
  NativeDiagnosticsData,
} from "./CassettePlaybackPlugin";
import { NativePlaybackState } from "./types";

export class CassettePlaybackWeb
  extends WebPlugin
  implements CassettePlaybackPluginInterface
{
  async play(): Promise<{ success: boolean }> {
    console.debug("[CassettePlaybackWeb] play called on web fallback");
    return { success: false };
  }

  async pause(): Promise<{ success: boolean }> {
    console.debug("[CassettePlaybackWeb] pause called on web fallback");
    return { success: false };
  }

  async seek(): Promise<{ success: boolean }> {
    console.debug("[CassettePlaybackWeb] seek called on web fallback");
    return { success: false };
  }

  async next(): Promise<{ success: boolean }> {
    return { success: false };
  }

  async previous(): Promise<{ success: boolean }> {
    return { success: false };
  }

  async setQueue(): Promise<{ success: boolean }> {
    return { success: false };
  }

  async getState(): Promise<NativePlaybackState> {
    return {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isBuffering: false,
    };
  }

  async getDiagnostics(): Promise<NativeDiagnosticsData> {
    return {
      serviceAlive: false,
      serviceId: 0,
      playerAlive: false,
      playerId: 0,
      playerState: "WEB_FALLBACK",
      isPlaying: false,
      playWhenReady: false,
      currentPosition: 0,
      duration: 0,
      currentTrackId: null,
      controllerConnected: false,
      lastActivityState: "WEB",
      activityEvents: ["[WEB] Web browser environment"],
      logs: ["[WEB] Running in Web browser fallback"],
    };
  }

  async destroy(): Promise<{ success: boolean }> {
    return { success: true };
  }
}
