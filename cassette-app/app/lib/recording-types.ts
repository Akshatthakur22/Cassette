/**
 * Recording Types & Constants
 * Defines recording modes, durations, and validation rules
 */

export enum RecordingMode {
  STANDARD = "standard",      // Full 2-side tape (up to 240 sec per side)
  SHORT = "short",            // Single-side short form (< 120 sec total)
  VOICE = "voice",            // User voice recording (< 180 sec)
}

export interface RecordingConfig {
  mode: RecordingMode;
  maxDurationSec: number;
  allowSideB: boolean;
  maxTracksPerSide: number;
  label: string;
  description: string;
}

export const RECORDING_MODES: Record<RecordingMode, RecordingConfig> = {
  [RecordingMode.STANDARD]: {
    mode: RecordingMode.STANDARD,
    maxDurationSec: 480, // 240 per side × 2
    allowSideB: true,
    maxTracksPerSide: 12,
    label: "Full Tape",
    description: "Classic 2-sided cassette with up to 12 songs per side",
  },
  [RecordingMode.SHORT]: {
    mode: RecordingMode.SHORT,
    maxDurationSec: 120, // Single side
    allowSideB: false,
    maxTracksPerSide: 6,
    label: "Short Form",
    description: "Quick tape - perfect for singles, mixes, or quick messages (max 2 min)",
  },
  [RecordingMode.VOICE]: {
    mode: RecordingMode.VOICE,
    maxDurationSec: 180, // User recording
    allowSideB: false,
    maxTracksPerSide: 1, // Just one voice track
    label: "Voice Message",
    description: "Record your own voice, thoughts, or personalized message",
  },
};

export interface TrackValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

// Track duration validation rules
export const DURATION_RULES = {
  MIN_DURATION_SEC: 10,        // Minimum track duration
  MAX_DURATION_SEC: 600,       // Maximum single track
  IDEAL_MIN_SEC: 90,           // Ideal minimum
  IDEAL_MAX_SEC: 300,          // Ideal maximum
};

export interface VoiceRecordingConfig {
  sampleRate: number;           // 48kHz recommended
  channels: number;             // Mono = 1, Stereo = 2
  bitDepth: number;             // 16-bit
  format: "wav" | "mp3" | "opus"; // Audio format
}

export const VOICE_RECORDING_CONFIG: VoiceRecordingConfig = {
  sampleRate: 48000,
  channels: 1,
  bitDepth: 16,
  format: "opus", // Opus is most compatible & compressed
};

// YouTube URL patterns for validation
export const YOUTUBE_URL_PATTERNS = {
  shortUrl: /^https?:\/\/(www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
  longUrl: /^https?:\/\/(www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  playlistUrl: /^https?:\/\/(www\.)?youtube\.com\/playlist\?.*list=([a-zA-Z0-9_-]+)/,
  videoIdOnly: /^[a-zA-Z0-9_-]{11}$/,
};

export function extractYoutubeVideoId(input: string): string | null {
  if (!input) return null;

  // Try video ID only
  if (YOUTUBE_URL_PATTERNS.videoIdOnly.test(input)) {
    return input;
  }

  // Try short URL
  const shortMatch = input.match(YOUTUBE_URL_PATTERNS.shortUrl);
  if (shortMatch) return shortMatch[2];

  // Try long URL
  const longMatch = input.match(YOUTUBE_URL_PATTERNS.longUrl);
  if (longMatch) return longMatch[2];

  return null;
}

export function extractYoutubePlaylistId(input: string): string | null {
  if (!input) return null;

  const match = input.match(YOUTUBE_URL_PATTERNS.playlistUrl);
  if (match) return match[2];

  return null;
}

export function validateYoutubeUrl(url: string): {
  isValid: boolean;
  type: "video" | "playlist" | "invalid";
  id: string | null;
  error?: string;
} {
  if (!url || typeof url !== "string") {
    return {
      isValid: false,
      type: "invalid",
      id: null,
      error: "Please provide a valid YouTube URL or video ID",
    };
  }

  // Try playlist first
  const playlistId = extractYoutubePlaylistId(url);
  if (playlistId) {
    return { isValid: true, type: "playlist", id: playlistId };
  }

  // Try video
  const videoId = extractYoutubeVideoId(url);
  if (videoId) {
    return { isValid: true, type: "video", id: videoId };
  }

  return {
    isValid: false,
    type: "invalid",
    id: null,
    error:
      "Invalid YouTube URL. Use: youtu.be/xxx, youtube.com/watch?v=xxx, or just the video ID",
  };
}
