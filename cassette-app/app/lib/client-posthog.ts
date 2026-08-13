/**
 * Client-side PostHog tracking.
 * Tracks events that occur in the browser (play, make one back, etc.)
 */

export const EVENTS = {
  TAPE_PLAYED: "tape_played",
  TRACK_PLAYED: "track_played",
  MAKE_ONE_BACK_CLICKED: "make_one_back_clicked",
  TAPE_CREATION_STARTED: "create_started",
  RECIPIENT_CREATED_TAPE: "recipient_created_tape",
};

/**
 * Track an event on the client side.
 * Sends to our own endpoint to record analytics.
 */
export async function trackClientEvent(
  event: string,
  properties?: Record<string, any>
) {
  if (typeof window === "undefined") return;

  try {
    // Use sendBeacon if available for reliability
    if (navigator.sendBeacon) {
      const payload = JSON.stringify({
        event,
        properties,
        timestamp: new Date().toISOString(),
      });
      navigator.sendBeacon("/api/analytics", payload);
    } else {
      // Fallback to fetch
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event,
          properties,
          timestamp: new Date().toISOString(),
        }),
        keepalive: true,
      }).catch(() => {
        // Silently fail
      });
    }
  } catch (error) {
    // Silently fail
  }
}
