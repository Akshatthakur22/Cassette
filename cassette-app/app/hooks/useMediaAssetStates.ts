"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { MediaAssetStatus } from "@/app/lib/types";

interface MediaAssetTrack {
  id: string;
  provider?: string;
  providerTrackId: string;
  mediaAssetId?: string | null;
}

interface MediaAssetState {
  id: string;
  status: MediaAssetStatus;
  progress: number;
  error?: string;
  fileSize?: number;
  storageKey?: string;
  durationSec?: number;
}

interface UseMediaAssetStatesOptions {
  tracks: MediaAssetTrack[];
  enabled?: boolean;
  pollInterval?: number;
}

export function useMediaAssetStates({
  tracks,
  enabled = true,
  pollInterval = 2000,
}: UseMediaAssetStatesOptions) {
  const [states, setStates] = useState<Record<string, MediaAssetState>>({});
  const [loading, setLoading] = useState(false);
  const pollCountRef = useRef(0);
  const maxPollsRef = useRef(120); // Keep status visible during longer downloads (6 minutes at 3s).

  // Current YouTube selections are stored as media_asset tracks. Older drafts
  // may still contain raw YouTube IDs, so retain those for compatibility.
  const mediaAssetTracks = useMemo(
    () => tracks.filter(
      (t) =>
        (t.provider === "media_asset" || t.provider === "youtube") &&
        (t.mediaAssetId || t.providerTrackId)
    ),
    [tracks]
  );

  const pollStates = useCallback(async () => {
    if (!mediaAssetTracks.length) return true;

    setLoading(true);

    try {
      const results = await Promise.all(
        mediaAssetTracks.map((track) => {
          const mediaAssetId = track.mediaAssetId || track.providerTrackId;
          if (!mediaAssetId) return null;

          return fetch(`/api/media-assets/${mediaAssetId}/status`, {
            signal: AbortSignal.timeout(5000), // 5 second timeout
          })
            .then((res) => {
              if (!res.ok) throw new Error(`Status request failed (${res.status})`);
              return res.json();
            })
            .catch(() => null);
        })
      );

      const newStates: Record<string, MediaAssetState> = {};

      results.forEach((result, idx) => {
        if (result && mediaAssetTracks[idx]) {
          const track = mediaAssetTracks[idx];
          newStates[track.id] = {
            id: result.id,
            status: result.status,
            progress: result.progress || 0,
            error: result.error,
            fileSize: result.fileSize,
            storageKey: result.storageKey,
            durationSec: result.durationSec,
          };
        }
      });

      setStates(newStates);
      setLoading(false);

      // Stop polling if all ready or failed. Missing status responses should
      // remain visible as pending and get another chance on the next poll.
      const allDone =
        mediaAssetTracks.length > 0 &&
        Object.values(newStates).length === mediaAssetTracks.length &&
        Object.values(newStates).every((s) => s.status === "READY" || s.status === "FAILED");

      // Also stop if we've polled too many times
      pollCountRef.current += 1;
      if (pollCountRef.current >= maxPollsRef.current) {
        console.debug(
          "[useMediaAssetStates] Max polls reached, stopping polling"
        );
        return false;
      }

      return !allDone; // Return true to continue, false to stop
    } catch (error) {
      console.error("[useMediaAssetStates] Poll error:", error);
      setLoading(false);
      return false; // Stop polling on error
    }
  }, [mediaAssetTracks]);

  useEffect(() => {
    if (!enabled || !mediaAssetTracks.length) {
      pollCountRef.current = 0;
      return;
    }

    let interval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    pollCountRef.current = 0;
    const pollAndMaybeStop = () => {
      if (cancelled) return;
      void pollStates().then((shouldContinue) => {
        if (!shouldContinue && interval) {
          clearInterval(interval);
          interval = null;
        }
      });
    };

    const initialPoll = setTimeout(() => {
      pollAndMaybeStop();
    }, 0);
    interval = setInterval(pollAndMaybeStop, pollInterval);

    return () => {
      cancelled = true;
      clearTimeout(initialPoll);
      if (interval) clearInterval(interval);
      pollCountRef.current = 0;
    };
  }, [enabled, mediaAssetTracks.length, pollInterval, pollStates]);

  return enabled ? { states, loading } : { states: {}, loading: false };
}
