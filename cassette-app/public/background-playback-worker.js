/**
 * Cassette Playback State Worker
 * Coordinates lightweight playback state with the main document for PWA background management.
 * 
 * Note: Browser & YouTube security policies prevent Service Workers from executing HTML video/audio streams.
 * Media playback is owned by the active document via the YouTube IFrame API and Media Session API.
 */

let bgPlaybackState = {
  videoId: null,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
};

// Listen for playback state updates from main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  if (type === 'BACKGROUND_PLAYBACK_START') {
    bgPlaybackState = {
      videoId: payload.videoId,
      currentTime: payload.currentTime,
      duration: payload.duration,
      isPlaying: true,
    };
  }

  if (type === 'BACKGROUND_PLAYBACK_STOP') {
    bgPlaybackState.isPlaying = false;
  }

  if (type === 'UPDATE_PLAYBACK_STATE') {
    bgPlaybackState = {
      ...bgPlaybackState,
      videoId: payload.videoId,
      currentTime: payload.currentTime,
      duration: payload.duration,
    };
  }

  if (type === 'GET_PLAYBACK_STATE') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage(bgPlaybackState);
    }
  }
});
