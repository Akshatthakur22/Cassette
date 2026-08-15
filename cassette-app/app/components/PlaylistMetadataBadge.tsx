/**
 * PlaylistMetadataBadge Component
 * Displays playlist source information when a tape was created from a playlist
 */

import { getPlaylistSourceBadge, isFromPlaylist } from "@/app/lib/playlist-metadata";

interface PlaylistMetadataBadgeProps {
  playlistSourceId?: string | null;
  playlistSourceUrl?: string | null;
  playlistName?: string | null;
  size?: "small" | "medium" | "large";
  showIcon?: boolean;
  className?: string;
}

export function PlaylistMetadataBadge({
  playlistSourceId,
  playlistSourceUrl,
  playlistName,
  size = "medium",
  showIcon = true,
  className = "",
}: PlaylistMetadataBadgeProps) {
  const metadata = {
    playlistSourceId,
    playlistSourceUrl,
    playlistName,
  };

  if (!isFromPlaylist(metadata)) {
    return null;
  }

  const badge = getPlaylistSourceBadge(metadata);
  if (!badge) {
    return null;
  }

  const sizeClasses = {
    small: "px-2 py-1 text-xs",
    medium: "px-3 py-2 text-sm",
    large: "px-4 py-3 text-base",
  };

  const content = (
    <span className={`flex items-center gap-2 ${sizeClasses[size]}`}>
      {showIcon && <span className="text-lg">{badge.icon}</span>}
      <span className="font-medium text-gray-700">{badge.label}</span>
    </span>
  );

  if (badge.url) {
    return (
      <a
        href={badge.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`View ${playlistName} on YouTube`}
        className={`inline-flex items-center bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition ${className}`}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      className={`inline-flex items-center bg-blue-50 border border-blue-200 rounded-lg ${className}`}
    >
      {content}
    </div>
  );
}
