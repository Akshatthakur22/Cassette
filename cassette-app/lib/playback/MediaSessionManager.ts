import { PlaybackController } from "./PlaybackController";
import { PlaybackState } from "./types";

export function updateMediaSession(state: PlaybackState) {
  if (
    typeof window === "undefined" ||
    typeof navigator === "undefined" ||
    !("mediaSession" in navigator)
  ) {
    return;
  }
  if (!state.currentTrack) return;

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: state.currentTrack.title,
      artist: state.currentTrack.artist ?? "Cassette",
      album: "Cassette",
      artwork: state.currentTrack.artworkUrl
        ? [{ src: state.currentTrack.artworkUrl, sizes: "512x512", type: "image/png" }]
        : [],
    });
    navigator.mediaSession.playbackState = state.isPlaying ? "playing" : "paused";

    if (state.duration > 0 && state.currentTime >= 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: state.duration,
          playbackRate: 1,
          position: Math.min(state.currentTime, state.duration),
        });
      } catch {
        /* ignore unsupported position updates */
      }
    }
  } catch (e) {
    console.debug("[MediaSessionManager] Error updating media session:", e);
  }
}

let isInitialized = false;

export function initMediaSession(controller: PlaybackController) {
  if (
    typeof window === "undefined" ||
    typeof navigator === "undefined" ||
    !("mediaSession" in navigator)
  ) {
    return;
  }
  if (isInitialized) return;
  isInitialized = true;

  const safeSetHandler = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
    try {
      navigator.mediaSession.setActionHandler(action, handler);
    } catch {
      /* action not supported */
    }
  };

  safeSetHandler("play", () => controller.play());
  safeSetHandler("pause", () => controller.pause());
  safeSetHandler("nexttrack", () => controller.next());
  safeSetHandler("previoustrack", () => controller.previous());
  safeSetHandler("seekto", (details) => {
    if (details.seekTime != null) controller.seek(details.seekTime);
  });

  controller.subscribe((state) => {
    updateMediaSession(state);
  });
}
