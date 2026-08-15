/**
 * Playlist Metadata Utilities
 * Handles tracking and displaying playlist source information
 */

export interface PlaylistMetadata {
  playlistSourceId?: string | null;
  playlistSourceUrl?: string | null;
  playlistName?: string | null;
}

/**
 * Format YouTube playlist URL for display
 */
export function formatPlaylistUrl(url: string | undefined | null): string | null {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    // Extract playlist ID from URL
    const playlistId = urlObj.searchParams.get("list");
    return playlistId || url;
  } catch {
    return url;
  }
}

/**
 * Get YouTube playlist link with proper tracking
 */
export function getPlaylistLink(metadata: PlaylistMetadata): {
  url: string;
  label: string;
} | null {
  if (!metadata.playlistSourceUrl) return null;

  return {
    url: metadata.playlistSourceUrl,
    label: metadata.playlistName || "View on YouTube",
  };
}

/**
 * Get playlist source badge info
 */
export function getPlaylistSourceBadge(metadata: PlaylistMetadata): {
  label: string;
  icon: string;
  url: string | null;
} | null {
  if (!metadata.playlistSourceId && !metadata.playlistName) return null;

  return {
    label: `From: ${metadata.playlistName || "YouTube playlist"}`,
    icon: "🎵",
    url: metadata.playlistSourceUrl ?? null,
  };
}

/**
 * Check if tape was created from a playlist
 */
export function isFromPlaylist(metadata: PlaylistMetadata): boolean {
  return !!(metadata.playlistSourceId || metadata.playlistSourceUrl || metadata.playlistName);
}

/**
 * Generate analytics event for playlist view
 */
export function trackPlaylistView(
  tapeId: string,
  metadata: PlaylistMetadata
): Record<string, unknown> {
  if (!isFromPlaylist(metadata)) return {};

  return {
    event: "playlist_metadata_viewed",
    tapeId,
    playlistSourceId: metadata.playlistSourceId,
    playlistName: metadata.playlistName,
    hasSourceUrl: !!metadata.playlistSourceUrl,
  };
}

/**
 * Generate metadata description for sharing
 */
export function getPlaylistShareDescription(
  senderName: string,
  recipientName: string,
  metadata: PlaylistMetadata
): string {
  const base = `${senderName} made a tape for ${recipientName} on CASSETTE`;

  if (!isFromPlaylist(metadata)) return base;

  if (metadata.playlistName) {
    return `${base}, curated from the "${metadata.playlistName}" playlist`;
  }

  return base;
}

/**
 * Get playlist metadata for display in tape view
 */
export function getPlaylistDisplayInfo(
  metadata: PlaylistMetadata
): {
  show: boolean;
  title?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  sourceText?: string;
} {
  if (!isFromPlaylist(metadata)) {
    return { show: false };
  }

  return {
    show: true,
    title: metadata.playlistName || undefined,
    sourceLabel: "Playlist Source",
    sourceUrl: metadata.playlistSourceUrl || undefined,
    sourceText: metadata.playlistName ? `From "${metadata.playlistName}"` : "From YouTube playlist",
  };
}

/**
 * Enrich tape object with playlist metadata helpers
 */
export function enrichTapeWithPlaylistData(tape: any) {
  return {
    ...tape,
    playlistInfo: getPlaylistDisplayInfo({
      playlistSourceId: tape.playlistSourceId,
      playlistSourceUrl: tape.playlistSourceUrl,
      playlistName: tape.playlistName,
    }),
    isFromPlaylist: isFromPlaylist({
      playlistSourceId: tape.playlistSourceId,
      playlistSourceUrl: tape.playlistSourceUrl,
      playlistName: tape.playlistName,
    }),
  };
}

/**
 * Format playlist metadata for analytics/logging
 */
export function serializePlaylistMetadata(metadata: PlaylistMetadata): string {
  const parts = [];

  if (metadata.playlistName) {
    parts.push(`name:"${metadata.playlistName}"`);
  }

  if (metadata.playlistSourceId) {
    parts.push(`id:${metadata.playlistSourceId}`);
  }

  if (metadata.playlistSourceUrl) {
    parts.push(`url:${metadata.playlistSourceUrl}`);
  }

  return parts.join(" | ") || "no-playlist";
}
