/**
 * PostHog client initialization and event tracking.
 * Uses the posthog-node package for server-side tracking.
 */

import { PostHog } from "posthog-node";

let client: PostHog | null = null;

export function getPostHogClient(): PostHog {
  if (client) return client;

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) {
    console.warn("NEXT_PUBLIC_POSTHOG_KEY not set — PostHog tracking disabled");
    // Return a no-op client
    return {
      capture: () => Promise.resolve(),
      identify: () => Promise.resolve(),
      shutdown: () => Promise.resolve(),
    } as any;
  }

  client = new PostHog(apiKey, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
  });

  return client;
}

export async function trackEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, any>,
  shouldFlush = false
) {
  const posthog = getPostHogClient();
  try {
    posthog.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
      },
    });
    if (shouldFlush && typeof (posthog as any).flush === "function") {
      await (posthog as any).flush();
    }
  } catch (error) {
    console.error("PostHog tracking error:", error);
  }
}

export async function flushPostHog() {
  if (client && typeof (client as any).flush === "function") {
    try {
      await (client as any).flush();
    } catch (e) {
      console.warn("PostHog flush error:", e);
    }
  }
}

export async function identifyUser(
  distinctId: string,
  properties?: Record<string, any>
) {
  const posthog = getPostHogClient();
  try {
    posthog.identify({
      distinctId,
      properties,
    });
  } catch (error) {
    console.error("PostHog identify error:", error);
  }
}

export async function shutdownPostHog() {
  if (client) {
    await client.shutdown();
    client = null;
  }
}

// Event names for consistency
export const EVENTS = {
  // Tape creation
  TAPE_CREATION_STARTED: "tape_creation_started",
  TAPE_CREATED: "tape_created",
  TAPE_PUBLISHED: "tape_published",
  TAPE_DELETED: "tape_deleted",

  // Tracks
  TRACK_ADDED: "track_added",
  TRACK_DELETED: "track_deleted",
  TRACK_REORDERED: "track_reordered",

  // Tape viewing
  TAPE_VIEWED: "tape_viewed",
  TAPE_PLAYED: "tape_played",
  TRACK_PLAYED: "track_played",

  // Sharing
  TAPE_SHARED: "tape_shared",
  MAKE_ONE_BACK_CLICKED: "make_one_back_clicked",

  // Search
  MUSIC_SEARCH: "music_search",
};
