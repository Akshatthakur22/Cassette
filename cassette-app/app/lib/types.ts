export type TapeStyle = "classic" | "y2k" | "love" | "road_trip";
export type TapeRelationship =
  | "partner"
  | "best_friend"
  | "family"
  | "memory"
  | "self"
  | "other";
export type TapeSide = "A" | "B";
export type TapeStatus = "draft" | "published" | "deleted";

export interface TrackInput {
  side: TapeSide;
  position: number;
  title: string;
  artist?: string;
  thumbnailUrl?: string;
  providerTrackId: string;
  personalNote?: string;
  durationSec?: number;
}

// Shape returned by the DB and used throughout the UI
export interface TapeWithTracks {
  id: string;
  publicId: string;
  draftToken: string;
  title: string | null;
  dedication: string | null;
  senderName: string;
  recipientName: string | null;
  relationship: string | null;
  style: TapeStyle;
  status: string;
  createdAt: Date;
  tracks: TrackRow[];
}

export interface TrackRow {
  id: string;
  tapeId: string;
  side: TapeSide;
  position: number;
  title: string;
  artist: string | null;
  thumbnailUrl: string | null;
  provider: string;
  providerTrackId: string;
  personalNote: string | null;
  durationSec: number | null;
}
