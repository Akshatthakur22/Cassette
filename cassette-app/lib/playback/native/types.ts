export interface NativePlaybackTrack {
  id: string;
  url: string;
  title: string;
  artist?: string;
  artworkUrl?: string;
  album?: string;
  durationSec?: number;
  side?: "A" | "B";
}

export interface NativePlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  currentTrackId?: string | null;
}

export type NativePlaybackEventType =
  | "play"
  | "pause"
  | "timeUpdate"
  | "durationChanged"
  | "buffering"
  | "ended"
  | "error"
  | "trackChanged";

export interface NativePlaybackEvent {
  type: NativePlaybackEventType;
  currentTime?: number;
  duration?: number;
  isPlaying?: boolean;
  isBuffering?: boolean;
  trackId?: string;
  error?: string;
}

export type NativePlaybackEventListener = (event: NativePlaybackEvent) => void;
