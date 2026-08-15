"use client";

/**
 * PlaylistMetadataSection Component
 * Displays detailed playlist source information in tape view
 */

import { getPlaylistDisplayInfo, isFromPlaylist, formatPlaylistUrl } from "@/app/lib/playlist-metadata";

interface PlaylistMetadataSectionProps {
  playlistSourceId?: string | null;
  playlistSourceUrl?: string | null;
  playlistName?: string | null;
  senderName?: string;
}

export function PlaylistMetadataSection({
  playlistSourceId,
  playlistSourceUrl,
  playlistName,
  senderName,
}: PlaylistMetadataSectionProps) {
  const metadata = {
    playlistSourceId,
    playlistSourceUrl,
    playlistName,
  };

  if (!isFromPlaylist(metadata)) {
    return null;
  }

  const displayInfo = getPlaylistDisplayInfo(metadata);

  if (!displayInfo.show) {
    return null;
  }

  return (
    <section
      aria-labelledby="playlist-metadata-heading"
      className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 my-6"
    >
      <h3
        id="playlist-metadata-heading"
        className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2"
      >
        <span>🎵</span>
        {displayInfo.sourceLabel}
      </h3>

      <div className="space-y-3">
        {displayInfo.title && (
          <div>
            <p className="text-xs text-blue-600 uppercase tracking-wide font-medium">
              Playlist Name
            </p>
            <p className="text-base font-medium text-blue-900 mt-1">
              "{displayInfo.title}"
            </p>
          </div>
        )}

        {displayInfo.sourceText && (
          <p className="text-sm text-blue-800">{displayInfo.sourceText}</p>
        )}

        {displayInfo.sourceUrl && (
          <div>
            <a
              href={displayInfo.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-blue-300 rounded-lg text-blue-600 hover:bg-blue-100 transition text-sm font-medium"
              aria-label={`View ${displayInfo.title} on YouTube`}
            >
              <span>🔗</span>
              View original playlist on YouTube
            </a>
          </div>
        )}

        {senderName && (
          <p className="text-xs text-blue-700 italic pt-2 border-t border-blue-200">
            {senderName} curated this tape from "{displayInfo.title}"
          </p>
        )}
      </div>
    </section>
  );
}
