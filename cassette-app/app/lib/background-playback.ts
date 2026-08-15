/**
 * Background Playback Manager
 * Enables YouTube playback to continue when tab is backgrounded
 * Uses Media Session API for lock screen controls
 */

export interface BackgroundPlaybackState {
  isBackgrounded: boolean;
  isPlayingInBackground: boolean;
  currentVideoId: string | null;
  currentTime: number;
  duration: number;
}

let bgState: BackgroundPlaybackState = {
  isBackgrounded: false,
  isPlayingInBackground: false,
  currentVideoId: null,
  currentTime: 0,
  duration: 0,
};

let visibilityChangeListener: (() => void) | null = null;

/**
 * Initialize background playback support
 * Must be called once in app root
 */
export function initBackgroundPlayback() {
  if (typeof window === "undefined") return;

  visibilityChangeListener = () => {
    const wasBackgrounded = bgState.isBackgrounded;
    bgState.isBackgrounded = document.hidden;

    if (bgState.isBackgrounded && !wasBackgrounded) {
      handleAppBackgrounded();
    } else if (!bgState.isBackgrounded && wasBackgrounded) {
      handleAppForegrounded();
    }
  };

  document.addEventListener("visibilitychange", visibilityChangeListener);

  window.addEventListener("unload", () => {
    if (visibilityChangeListener) {
      document.removeEventListener("visibilitychange", visibilityChangeListener);
    }
  });
}

function handleAppBackgrounded() {
  bgState.isPlayingInBackground = true;
}

function handleAppForegrounded() {
  bgState.isPlayingInBackground = false;
}

/**
 * Update background playback state from UI player
 * Called by PlayerBar to keep state in sync
 */
export function updateBackgroundPlaybackState(
  videoId: string | null,
  currentTime: number,
  duration: number,
  isPlaying: boolean
) {
  bgState.currentVideoId = videoId;
  bgState.currentTime = currentTime;
  bgState.duration = duration;

  if (bgState.isBackgrounded && isPlaying) {
    bgState.isPlayingInBackground = true;
  }
}

/**
 * Update Media Session for currently playing track
 * Shows in lock screen / control center on supported devices
 */
export function updateMediaSession(
  title: string,
  artist?: string,
  artwork?: string,
  duration?: number,
  currentTime?: number
) {
  if (typeof window === "undefined" || !("mediaSession" in navigator)) {
    return;
  }

  const mediaSession = navigator.mediaSession;

  try {
    mediaSession.metadata = new (window as any).MediaMetadata({
      title,
      artist: artist || "Unknown",
      artwork: artwork
        ? [
            {
              src: artwork,
              sizes: "512x512",
              type: "image/png",
            },
          ]
        : [],
    });

    // Set playback time if available
    if (duration !== undefined && currentTime !== undefined) {
      mediaSession.playbackState = "playing";
      try {
        (mediaSession as any).setPositionState({
          duration,
          playbackRate: 1,
          position: currentTime,
        });
      } catch (e) {
        console.debug("Media Session position state not supported");
      }
    }
  } catch (e) {
    console.debug("Media Session update failed:", e);
  }
}

/**
 * Clear Media Session
 */
export function clearMediaSession() {
  if (typeof window === "undefined" || !("mediaSession" in navigator)) {
    return;
  }

  try {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = "none";
  } catch (e) {
    console.debug("Media Session clear failed:", e);
  }
}

/**
 * Get current background playback state
 */
export function getBackgroundPlaybackState(): BackgroundPlaybackState {
  return { ...bgState };
}

/**
 * Check if background playback is active
 */
export function isPlayingInBackground(): boolean {
  return bgState.isBackgrounded && bgState.isPlayingInBackground;
}
