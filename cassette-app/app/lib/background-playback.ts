/**
 * Background Playback State Helper
 * Tracks visibility state and coordinates lightweight playback metadata.
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
 * Initialize background visibility listener
 */
export function initBackgroundPlayback() {
  if (typeof window === "undefined") return;

  visibilityChangeListener = () => {
    const wasBackgrounded = bgState.isBackgrounded;
    bgState.isBackgrounded = document.hidden;

    if (bgState.isBackgrounded && !wasBackgrounded) {
      bgState.isPlayingInBackground = true;
    } else if (!bgState.isBackgrounded && wasBackgrounded) {
      bgState.isPlayingInBackground = false;
    }
  };

  document.addEventListener("visibilitychange", visibilityChangeListener);

  window.addEventListener("unload", () => {
    if (visibilityChangeListener) {
      document.removeEventListener("visibilitychange", visibilityChangeListener);
    }
  });
}

/**
 * Update background playback state
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
 * Get current background playback state snapshot
 */
export function getBackgroundPlaybackState(): BackgroundPlaybackState {
  return { ...bgState };
}

/**
 * Check if document is currently hidden while playing
 */
export function isPlayingInBackground(): boolean {
  return bgState.isBackgrounded && bgState.isPlayingInBackground;
}
