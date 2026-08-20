export type TrackProvider = "youtube" | "voice" | "cassette";

export interface PlaybackTrack {
  id: string;                // TapeTrack.id
  provider: TrackProvider;
  providerTrackId: string;   // YouTube video id, or voice file id/url
  title: string;
  artist?: string;
  artworkUrl?: string;
  side: "A" | "B";
  durationSec?: number;
  personalNote?: string;
  audioUrl?: string;         // Resolved Cassette audio URL
  isResolving?: boolean;     // Resolution in-progress flag
}

export interface PlaybackState {
  currentTrack: PlaybackTrack | null;
  queue: PlaybackTrack[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;   // seconds
  duration: number;      // seconds
  side: "A" | "B";
  isBuffering: boolean;
}

export interface PlaybackEngine {
  load(track: PlaybackTrack): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  seek(seconds: number): Promise<void>;
  destroy(): void;
  onStateChange(cb: (partial: Partial<PlaybackState>) => void): void;
}

export type PlaybackListener = (state: PlaybackState) => void;
