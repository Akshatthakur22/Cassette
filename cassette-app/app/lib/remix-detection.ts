/**
 * Remix & Mashup Detection
 * Prevents duplicate/similar tracks from being added to the same tape
 */

export interface TrackFingerprint {
  videoId: string;
  title: string;
  artistName: string;
  duration: number;
}

/**
 * Calculate similarity score between two tracks (0-1 scale)
 * Considers title, artist, duration, and video ID
 */
export function calculateTrackSimilarity(
  track1: TrackFingerprint,
  track2: TrackFingerprint
): number {
  let similarityScore = 0;

  // Exact video ID match (highest priority)
  if (track1.videoId === track2.videoId) {
    return 1.0; // Identical track
  }

  // Title similarity (normalize and compare)
  const title1 = normalizeString(track1.title);
  const title2 = normalizeString(track2.title);

  if (title1 === title2) {
    similarityScore += 0.4;
  } else if (hasCommonKeywords(title1, title2, 0.7)) {
    similarityScore += 0.3;
  }

  // Artist similarity
  const artist1 = normalizeString(track1.artistName);
  const artist2 = normalizeString(track2.artistName);

  if (artist1 === artist2) {
    similarityScore += 0.3;
  } else if (hasCommonKeywords(artist1, artist2, 0.8)) {
    similarityScore += 0.15;
  }

  // Duration similarity (allow ±5 seconds variance for different versions)
  const durationDiff = Math.abs(track1.duration - track2.duration);
  if (durationDiff <= 5) {
    similarityScore += 0.3;
  } else if (durationDiff <= 30) {
    similarityScore += 0.1;
  }

  return Math.min(similarityScore, 1.0);
}

/**
 * Detect if a track is a duplicate or remix of existing tracks
 */
export function detectDuplicate(
  newTrack: TrackFingerprint,
  existingTracks: TrackFingerprint[],
  threshold = 0.85
): {
  isDuplicate: boolean;
  matchedTrack?: TrackFingerprint;
  similarity: number;
} {
  let highestSimilarity = 0;
  let matchedTrack: TrackFingerprint | undefined;

  for (const existingTrack of existingTracks) {
    const similarity = calculateTrackSimilarity(newTrack, existingTrack);
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      matchedTrack = existingTrack;
    }
  }

  return {
    isDuplicate: highestSimilarity >= threshold,
    matchedTrack,
    similarity: highestSimilarity,
  };
}

/**
 * Detect if a track is a remix/cover
 */
export function detectRemix(
  track: TrackFingerprint
): {
  isRemix: boolean;
  confidence: number;
  remixIndicators: string[];
} {
  const remixPatterns = [
    /\b(remix|rmx|mix|remaster|cover|acoustic|remix[\s-]version)/i,
    /\b(extended|extended mix|radio edit|club mix|dub remix)/i,
    /\(([^)]*(?:remix|mix|version|cover)[^)]*)\)/i,
  ];

  const remixIndicators: string[] = [];
  let confidence = 0;

  const titleLower = track.title.toLowerCase();

  for (const pattern of remixPatterns) {
    const match = titleLower.match(pattern);
    if (match) {
      remixIndicators.push(match[0]);
      confidence += 0.3;
    }
  }

  // Check for "feat." or "ft." suggesting collaboration/remix
  if (/\b(feat\.|ft\.|featuring)\b/i.test(titleLower)) {
    remixIndicators.push("Featuring collaboration");
    confidence += 0.2;
  }

  return {
    isRemix: confidence > 0,
    confidence: Math.min(confidence, 1.0),
    remixIndicators,
  };
}

/**
 * Normalize string for comparison
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "") // Remove special characters
    .replace(/\b(the|a|an)\b\s?/g, ""); // Remove articles
}

/**
 * Check if two strings share common keywords
 */
function hasCommonKeywords(
  str1: string,
  str2: string,
  minSimilarity = 0.7
): boolean {
  const words1 = new Set(str1.split(/\s+/).filter((w) => w.length > 3));
  const words2 = new Set(str2.split(/\s+/).filter((w) => w.length > 3));

  if (words1.size === 0 || words2.size === 0) {
    return false;
  }

  const common = [...words1].filter((word) => words2.has(word)).length;
  const similarity = common / Math.max(words1.size, words2.size);

  return similarity >= minSimilarity;
}

/**
 * Get user-friendly warning message for duplicate detection
 */
export function getDuplicateWarningMessage(
  similarity: number,
  matchedTrack: TrackFingerprint | undefined
): string {
  if (!matchedTrack) {
    return "";
  }

  if (similarity >= 0.95) {
    return `This appears to be the same song as "${matchedTrack.title}" already on your tape.`;
  }

  if (similarity >= 0.85) {
    return `This might be a remix or version of "${matchedTrack.title}" already on your tape.`;
  }

  return "";
}
