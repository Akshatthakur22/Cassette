"use client";

import { useEffect, useState, useCallback } from "react";
import { MediaAssetStatus } from "@/app/lib/types";

interface MediaAssetStatusResponse {
  id: string;
  status: MediaAssetStatus;
  progress: number;
  error?: string;
  fileSize?: number;
  storageKey?: string;
  durationSec?: number;
}

interface UseMediaAssetPollerOptions {
  mediaAssetId: string;
  enabled?: boolean;
  interval?: number;
  onStatusChange?: (status: MediaAssetStatusResponse) => void;
}

export function useMediaAssetPoller({
  mediaAssetId,
  enabled = true,
  interval = 2000, // 2 seconds by default
  onStatusChange,
}: UseMediaAssetPollerOptions) {
  const [status, setStatus] = useState<MediaAssetStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const poll = useCallback(async () => {
    if (!mediaAssetId) return;

    try {
      const res = await fetch(`/api/media-assets/${mediaAssetId}/status`);

      if (!res.ok) {
        throw new Error(`Failed to fetch status: ${res.status}`);
      }

      const data = await res.json();
      setStatus(data);
      setError(null);
      setLoading(false);

      if (onStatusChange) {
        onStatusChange(data);
      }

      // Stop polling if ready or failed
      return data.status === "READY" || data.status === "FAILED";
    } catch (err) {
      setError(String(err));
      setLoading(false);
      return false;
    }
  }, [mediaAssetId, onStatusChange]);

  useEffect(() => {
    if (!enabled || !mediaAssetId) return;

    // Initial poll
    poll().then((shouldStop) => {
      if (shouldStop) return;

      // Set up interval
      const pollInterval = setInterval(() => {
        poll().then((shouldStop) => {
          if (shouldStop) {
            clearInterval(pollInterval);
          }
        });
      }, interval);

      return () => clearInterval(pollInterval);
    });
  }, [mediaAssetId, enabled, interval, poll]);

  return { status, loading, error };
}
