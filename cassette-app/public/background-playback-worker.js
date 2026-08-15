/**
 * Background Playback Service Worker
 * Handles YouTube playback continuation when app is backgrounded
 * 
 * Note: YouTube IFrame API has restrictions on cross-origin audio
 * This worker stores state and coordinates with the main thread
 */

let bgPlaybackState = {
  videoId: null,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
};

// Listen for messages from main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  if (type === 'BACKGROUND_PLAYBACK_START') {
    bgPlaybackState = {
      videoId: payload.videoId,
      currentTime: payload.currentTime,
      duration: payload.duration,
      isPlaying: true,
    };
    console.log('Background playback started:', bgPlaybackState);
  }

  if (type === 'BACKGROUND_PLAYBACK_STOP') {
    bgPlaybackState.isPlaying = false;
    console.log('Background playback stopped');
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
    event.ports[0].postMessage(bgPlaybackState);
  }
});

// Periodic sync for background playback
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-playback') {
    event.waitUntil(
      (async () => {
        if (bgPlaybackState.isPlaying) {
          console.log('Sync playback - current state:', bgPlaybackState);
          // Future: Could use periodic background sync to update UI
        }
      })()
    );
  }
});

// Handle fetch events (for caching)
self.addEventListener('fetch', (event) => {
  // Allow normal fetch behavior - we're mainly interested in message passing
  // for background playback state management
});
