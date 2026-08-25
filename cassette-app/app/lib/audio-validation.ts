/**
 * Audio validation system for Cassette mixtapes
 * Enforces cassette-specific constraints:
 * - Duration limits (20s - 900s per track, 5400s per side)
 * - Track count limits (12 per side)
 * - Bitrate and quality checks
 * - User-friendly error messages
 */

// Cassette validation rules
const CASSETTE_VALIDATION_RULES = {
  minDurationSec: 20,           // Filter YouTube Shorts
  maxDurationSec: 900,          // 15 minutes (side limit)
  maxTapeDurationSec: 5400,     // 90 minutes total per side
  maxTracksPerSide: 12,         // Physical side capacity
  minAudioBitrate: 96,          // Quality threshold (kbps)
};

export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: {
    durationSec?: number;
    formatDuration?: string;
  };
}

export interface CapacityCheckResult {
  canFit: boolean;
  reason?: string;
  remainingTime?: number;
}

export interface AudioQualityResult {
  valid: boolean;
  error?: string;
  channels?: number;
  bitrate?: number;
  sampleRate?: number;
}

/**
 * Format duration in seconds to human-readable string
 * @param seconds Duration in seconds
 * @returns Formatted string (e.g., "1m 30s", "5m 55s")
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "0s";
  
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (minutes === 0) {
    return `${secs}s`;
  }
  if (secs === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${secs}s`;
}

/**
 * Validate track duration against cassette constraints
 * Rejects tracks that are too short (Shorts) or too long
 */
export function validateTrackDuration(durationSec: number | null | undefined): ValidationResult {
  if (!durationSec || durationSec <= 0) {
    return {
      valid: false,
      error: "Cannot determine track duration. Try a different video.",
    };
  }

  // Check minimum duration (filter Shorts)
  if (durationSec < CASSETTE_VALIDATION_RULES.minDurationSec) {
    return {
      valid: false,
      error: `This track is too short (${formatDuration(durationSec)}). Cassette tracks should be at least ${formatDuration(CASSETTE_VALIDATION_RULES.minDurationSec)} long.`,
      details: { durationSec, formatDuration: formatDuration(durationSec) },
    };
  }

  // Check maximum duration (side limit)
  if (durationSec > CASSETTE_VALIDATION_RULES.maxDurationSec) {
    return {
      valid: false,
      error: `This track is ${formatDuration(durationSec)} long, which exceeds the ${formatDuration(CASSETTE_VALIDATION_RULES.maxDurationSec)} cassette limit. Please choose a shorter version.`,
      details: { durationSec, formatDuration: formatDuration(durationSec) },
    };
  }

  return { valid: true };
}

/**
 * Check if a track can fit on a side given current capacity
 * Considers both time and track count limits
 */
export function canFitOnSide(
  currentSideDurationSec: number,
  trackDurationSec: number,
  currentTrackCount: number
): CapacityCheckResult {
  // Check track count limit
  if (currentTrackCount >= CASSETTE_VALIDATION_RULES.maxTracksPerSide) {
    return {
      canFit: false,
      reason: `Side is full! This side already has ${currentTrackCount} tracks (max is ${CASSETTE_VALIDATION_RULES.maxTracksPerSide}). Remove some tracks or switch to the other side.`,
    };
  }

  // Check time capacity
  const totalDuration = currentSideDurationSec + trackDurationSec;
  const maxCapacity = CASSETTE_VALIDATION_RULES.maxTapeDurationSec;

  if (totalDuration > maxCapacity) {
    const remainingTime = maxCapacity - currentSideDurationSec;
    return {
      canFit: false,
      reason: `Not enough space. Side has ${formatDuration(remainingTime)} remaining, but this track is ${formatDuration(trackDurationSec)}. Remove some tracks or switch to the other side.`,
      remainingTime,
    };
  }

  // All checks passed
  return {
    canFit: true,
    remainingTime: maxCapacity - totalDuration,
  };
}

/**
 * Validate tape total capacity (both sides combined)
 * Used for informational purposes or when adding multiple tracks
 */
export function validateTapeCapacity(
  sideADurationSec: number,
  sideBDurationSec: number
): {
  sideARemaining: number;
  sideBRemaining: number;
  sideAPercentage: number;
  sideBPercentage: number;
} {
  const maxCapacity = CASSETTE_VALIDATION_RULES.maxTapeDurationSec;

  const sideARemaining = Math.max(0, maxCapacity - sideADurationSec);
  const sideBRemaining = Math.max(0, maxCapacity - sideBDurationSec);

  return {
    sideARemaining,
    sideBRemaining,
    sideAPercentage: Math.round((sideADurationSec / maxCapacity) * 100),
    sideBPercentage: Math.round((sideBDurationSec / maxCapacity) * 100),
  };
}

/**
 * Validate audio quality post-conversion
 * Checks channels, bitrate, sample rate
 */
export function validateAudioQuality(
  channels: number | undefined,
  bitrate: number | undefined,
  sampleRate: number | undefined
): AudioQualityResult {
  // Check channels
  if (!channels || channels <= 0) {
    return {
      valid: false,
      error: "Audio has no channels. This file may be corrupted.",
      channels,
    };
  }

  // Check bitrate
  if (bitrate && bitrate < CASSETTE_VALIDATION_RULES.minAudioBitrate) {
    return {
      valid: false,
      error: `Audio bitrate is too low (${bitrate}kbps). Minimum is ${CASSETTE_VALIDATION_RULES.minAudioBitrate}kbps.`,
      bitrate,
    };
  }

  return {
    valid: true,
    channels,
    bitrate,
    sampleRate,
  };
}

/**
 * Map download errors to cassette-context error messages
 * Used by media-asset.ts to provide user-friendly errors
 */
export function mapDownloadError(error: string): string {
  if (!error) return "Failed to download audio.";

  const lowerError = error.toLowerCase();

  // Copyright and rights issues
  if (
    lowerError.includes("copyright") ||
    lowerError.includes("music licensing") ||
    lowerError.includes("rights holder") ||
    lowerError.includes("403")
  ) {
    return "This track is protected by copyright and cannot be added to your cassette. Try searching for the song differently.";
  }

  // Video status
  if (lowerError.includes("not found") || lowerError.includes("deleted")) {
    return "This video is no longer available. Please choose another track.";
  }
  if (lowerError.includes("unavailable")) {
    return "This video is currently unavailable. Please try another track.";
  }

  // Geo and age restrictions
  if (lowerError.includes("geo")) {
    return "This video is not available in your region. Please choose another track.";
  }
  if (lowerError.includes("age-restricted") || lowerError.includes("age restricted")) {
    return "This video is age-restricted and cannot be processed.";
  }

  // Playback restrictions
  if (lowerError.includes("playback") || lowerError.includes("embed")) {
    return "This video's owner restricted playback from third-party apps. Try a different version.";
  }

  // Technical issues
  if (lowerError.includes("timeout") || lowerError.includes("network")) {
    return "Network error while downloading. Please try again.";
  }
  if (lowerError.includes("conversion") || lowerError.includes("convert")) {
    return "Failed to process this audio. Please try again.";
  }
  if (lowerError.includes("upload")) {
    return "Failed to store the audio file. Please try again.";
  }
  if (lowerError.includes("no audio") || lowerError.includes("audio track")) {
    return "This video does not contain an audio track. Please choose another track.";
  }

  // Duration issues (from pre-check)
  if (lowerError.includes("too short")) {
    return "This track is too short for a cassette (minimum 20 seconds).";
  }
  if (lowerError.includes("too long")) {
    return "This track exceeds the 15-minute cassette limit. Please choose a shorter version.";
  }

  // Fallback
  return "Failed to prepare this audio. Please try again.";
}

/**
 * Get validation rules for UI display
 * Useful for showing constraints to users
 */
export function getValidationRules() {
  return {
    ...CASSETTE_VALIDATION_RULES,
    formattedMinDuration: formatDuration(CASSETTE_VALIDATION_RULES.minDurationSec),
    formattedMaxDuration: formatDuration(CASSETTE_VALIDATION_RULES.maxDurationSec),
    formattedMaxTapeDuration: formatDuration(CASSETTE_VALIDATION_RULES.maxTapeDurationSec),
  };
}

/**
 * Get status message for a track being added
 * Shows progress through validation layers
 */
export function getValidationStatusMessage(layer: number): string {
  const messages = {
    1: "Checking duration...",
    2: "Verifying YouTube video...",
    3: "Preparing audio...",
    4: "Downloading...",
    5: "Converting...",
    6: "Uploading...",
  };
  return messages[layer as keyof typeof messages] || "Processing...";
}

/**
 * Calculate remaining time on a side
 * Useful for UI progress display
 */
export function calculateSideRemaining(durationSec: number): {
  remaining: number;
  percentage: number;
  isFull: boolean;
} {
  const maxCapacity = CASSETTE_VALIDATION_RULES.maxTapeDurationSec;
  const remaining = Math.max(0, maxCapacity - durationSec);
  const percentage = Math.round((durationSec / maxCapacity) * 100);
  const isFull = remaining === 0;

  return { remaining, percentage, isFull };
}
