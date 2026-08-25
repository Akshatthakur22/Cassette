export type TapeStyle =
  // New 10-color system
  | "cream" | "cherry" | "peach" | "butter"
  | "sky" | "pool" | "lavender" | "mint"
  | "transparent" | "smoky"
  // Legacy DB values (backward compat)
  | "classic" | "y2k" | "love" | "road_trip";
export type TapeRelationship =
  | "partner"
  | "best_friend"
  | "family"
  | "memory"
  | "self"
  | "other";
export type TapeSide = "A" | "B";
export type TapeStatus = "draft" | "published" | "deleted";

// Media asset status values
export type MediaAssetStatus = 
  | "PENDING" 
  | "VALIDATING" 
  | "DOWNLOADING" 
  | "CONVERTING" 
  | "UPLOADING" 
  | "READY" 
  | "FAILED" 
  | "EXPIRED";

export interface TrackInput {
  side: TapeSide;
  position: number;
  title: string;
  artist?: string;
  thumbnailUrl?: string;
  provider?: string;
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
  visibility: "unlisted" | "public";
  memoryDate: Date | null;
  status: string;
  playlistSourceId?: string | null;
  playlistSourceUrl?: string | null;
  playlistName?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
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

// Media Asset types
export interface MediaAssetRow {
  id: string;
  provider: string;
  providerTrackId: string;
  title: string;
  artist: string | null;
  durationSec: number;
  status: MediaAssetStatus;
  attemptCount: number;
  lastAttemptAt: Date | null;
  nextAttemptAt: Date | null;
  error: string | null;
  errorDetails: string | null;
  storageProvider: string | null;
  storageKey: string | null;
  mimeType: string | null;
  fileSize: number | null;
  checksum: string | null;
  bitrate: number | null;
  createdAt: Date;
  updatedAt: Date;
  processedAt: Date | null;
  expiresAt: Date | null;
}

export interface MediaAssetStatusResponse {
  id: string;
  status: MediaAssetStatus;
  error: string | null;
  progress?: number; // 0-100 for UI display
  fileSize?: number;
  downloadUrl?: string; // For admin/debug
}
