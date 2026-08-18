"use client";

import { useEffect } from "react";

interface MediaSessionTrack {
  title: string;
  artist?: string | null;
  album?: string | null;
  artworkUrl?: string | null;
}

interface MediaSessionControls {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onSeek?: (seekTime: number) => void;
  duration?: number;
  position?: number;
}

/**
 * Custom React hook for Media Session API.
 * Connects lock-screen and notification center controls to tape playback.
 */
export function useMediaSession(
  track: MediaSessionTrack | null,
  controls: MediaSessionControls
) {
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator) || !track) {
      return;
    }

    const defaultArtwork = "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=512&q=80";
    const artworkSrc = track.artworkUrl || defaultArtwork;

    // Set metadata
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title || "Untitled Track",
        artist: track.artist || "CASSETTE",
        album: track.album || "Digital Mixtape",
        artwork: [
          { src: artworkSrc, sizes: "96x96", type: "image/jpeg" },
          { src: artworkSrc, sizes: "128x128", type: "image/jpeg" },
          { src: artworkSrc, sizes: "256x256", type: "image/jpeg" },
          { src: artworkSrc, sizes: "512x512", type: "image/jpeg" },
        ],
      });
    } catch (e) {
      console.debug("[useMediaSession] Metadata error:", e);
    }

    // Set playback state
    try {
      navigator.mediaSession.playbackState = controls.isPlaying ? "playing" : "paused";
    } catch {}

    // Wire action handlers
    const handlers: Array<[MediaSessionAction, MediaSessionActionHandler | null]> = [
      ["play", controls.onPlay],
      ["pause", controls.onPause],
      ["previoustrack", controls.onPrevious ?? null],
      ["nexttrack", controls.onNext ?? null],
    ];

    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (e) {
        // Some actions might not be supported on older browsers
      }
    }

    return () => {
      for (const [action] of handlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {}
      }
    };
  }, [
    track?.title,
    track?.artist,
    track?.album,
    track?.artworkUrl,
    controls.isPlaying,
    controls.onPlay,
    controls.onPause,
    controls.onPrevious,
    controls.onNext,
  ]);
}
