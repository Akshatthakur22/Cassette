"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { type Track } from "@/app/lib/fake-data";
import { MediaAssetStatus } from "@/app/lib/types";

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
  tracks: Track[];
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
  const maxPollsRef = useRef(30); // Max 30 polls = 60 seconds

  // IMPORTANT: If polling is disabled, return empty states immediately
  if (!enabled) {
    return { states: {}, loading: false };
  }

  // Get YouTube media asset tracks only (not voice)
  const mediaAssetTracks = tracks.filter(
    (t) => (t as any).provider === "youtube" && (t as any).providerTrackId
  );

  const pollStates = useCallback(async () => {
    if (!mediaAssetTracks.length) return true;

    setLoading(true);

    try {
      const results = await Promise.all(
        mediaAssetTracks.map((track) => {
          const mediaAssetId = (track as any).providerTrackId;
          if (!mediaAssetId) return null;

          return fetch(`/api/media-assets/${mediaAssetId}/status`, {
            signal: AbortSignal.timeout(5000), // 5 second timeout
          })
            .then((res) => res.json())
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

      // Stop polling if all ready or failed
      const allDone = Object.values(newStates).every(
        (s) => s.status === "READY" || s.status === "FAILED"
      );

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
  }, [mediaAssetTracks.length]);

  useEffect(() => {
    if (!mediaAssetTracks.length) {
      pollCountRef.current = 0;
      return;
    }

    let interval: NodeJS.Timeout | null = null;
    pollCountRef.current = 0;

    // Initial poll
    pollStates().then((shouldContinue) => {
      if (!shouldContinue) return; // Stop if all ready

      // Set up polling with exponential backoff
      let delayMultiplier = 1;
      let pollDelay = pollInterval;

      interval = setInterval(() => {
        pollStates().then((shouldContinue) => {
          if (!shouldContinue) {
            if (interval) clearInterval(interval);
            interval = null;
          } else {
            // Exponential backoff: increase delay after 5 polls
            if (pollCountRef.current > 5) {
              delayMultiplier = 2;
            }
          }
        });
      }, pollDelay * delayMultiplier);
    });

    return () => {
      if (interval) clearInterval(interval);
      pollCountRef.current = 0;
    };
  }, [mediaAssetTracks.length, pollInterval, pollStates]);

  return { states, loading };
}
