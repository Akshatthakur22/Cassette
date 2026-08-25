"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPrefetchService } from "@/lib/playback/prefetch";
import { getEagerPreloadService } from "@/lib/playback/eager-preload";

interface AudioTrackDisplayProps {
  mediaAssetId: string;
  title: string;
  artist: string;
  thumbnailUrl?: string;
  isPlaying?: boolean;
  allMediaAssetIds?: string[]; // For prefetching next tracks
  currentTrackIndex?: number;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: string) => void;
}

type PreloadState = "idle" | "loading" | "ready" | "buffering" | "error";

/**
 * HTML Audio Frame Display Component
 * Shows a native HTML audio player for YouTube-sourced MP3 tracks
 * Similar to voice message display but with streaming support
 */
export function AudioTrackDisplay({
  mediaAssetId,
  title,
  artist,
  thumbnailUrl,
  isPlaying = false,
  allMediaAssetIds,
  currentTrackIndex,
  onLoadStart,
  onLoadEnd,
  onError,
}: AudioTrackDisplayProps) {
  const [preloadState, setPreloadState] = useState<PreloadState>("idle");
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [networkQuality, setNetworkQuality] = useState<"fast" | "slow">("fast");
  const audioRef = useRef<HTMLAudioElement>(null);
  const startTimeRef = useRef<number>(0);

  // Detect network quality (for future bitrate adaptation)
  useEffect(() => {
    if ("connection" in navigator) {
      const conn = (navigator as any).connection;
      const updateQuality = () => {
        const effectiveType = conn.effectiveType; // "4g", "3g", "2g", "slow-2g"
        setNetworkQuality(
          effectiveType === "4g" || effectiveType === "3g" ? "fast" : "slow"
        );
      };
      conn.addEventListener("change", updateQuality);
      updateQuality();
      return () => conn.removeEventListener("change", updateQuality);
    }
  }, []);

  // Fetch stream URL on mount or when mediaAssetId changes
  useEffect(() => {
    let isMounted = true;
    let abortController: AbortController | null = null;

    const fetchStreamUrl = async () => {
      try {
        // Check if already eagerly preloaded
        const eagerPreload = getEagerPreloadService();
        const cachedUrl = eagerPreload.getPreloadedUrl(mediaAssetId);
        
        if (cachedUrl) {
          // Use cached URL - instant!
          if (isMounted) {
            setStreamUrl(cachedUrl);
            setPreloadState("ready");
            onLoadEnd?.();
            console.debug(`[AudioTrackDisplay] Using cached URL for ${mediaAssetId}`);
          }
          return;
        }

        // Only set loading if not already loaded
        setPreloadState((prev) => (prev === "idle" ? "loading" : prev));
        setError(null);
        onLoadStart?.();
        startTimeRef.current = Date.now();

        abortController = new AbortController();

        // STEP 1: Check database status first (don't download if not ready)
        const statusResponse = await fetch(
          `/api/media-assets/${mediaAssetId}/status`,
          {
            signal: AbortSignal.timeout(5000),
          }
        );

        if (!statusResponse.ok) {
          throw new Error(`Status check failed: ${statusResponse.status}`);
        }

        const statusData = await statusResponse.json();

        if (statusData.status !== "READY") {
          throw new Error(`Track not ready yet (status: ${statusData.status}). Will retry when ready.`);
        }

        // STEP 2: Stream is READY, fetch it
        let response: Response | undefined;
        let retries = 0;
        const maxRetries = 2;

        while (retries < maxRetries) {
          response = await fetch(
            `/api/media-assets/${mediaAssetId}/stream`,
            {
              method: "GET",
              headers: {
                Accept: "audio/mpeg",
              },
              signal: abortController.signal,
              priority: "high" as RequestInit["priority"],
            }
          );

          // If 400 (not ready), wait and retry
          if (response.status === 400 && retries < maxRetries - 1) {
            retries++;
            console.debug(
              `[AudioTrackDisplay] Stream not ready, retrying... (attempt ${retries})`
            );
            await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
            continue;
          }

          break; // Success or non-retryable error
        }

        if (!response) {
          throw new Error("Failed to fetch stream");
        }

        if (!response.ok) {
          throw new Error(`Failed to load audio: ${response.status}`);
        }

        // Measure download time for network quality assessment
        const downloadTime = Date.now() - startTimeRef.current;
        console.debug(
          `[AudioTrackDisplay] Download took ${downloadTime}ms for ${mediaAssetId}`
        );

        // Create blob URL for streaming
        const blob = await response.blob();
        
        // Verify blob is valid
        if (blob.size === 0) {
          throw new Error("Received empty audio file");
        }

        const url = URL.createObjectURL(blob);

        if (isMounted) {
          setStreamUrl(url);
          setPreloadState("ready");
          onLoadEnd?.();

          // Prefetch next 3 tracks AFTER current is ready
          if (allMediaAssetIds && currentTrackIndex !== undefined) {
            const prefetchService = getPrefetchService();
            prefetchService.prefetchNextTracks(
              allMediaAssetIds,
              currentTrackIndex,
              3
            );
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // Silently ignore abort
        }
        const message = err instanceof Error ? err.message : "Failed to load audio";
        if (isMounted) {
          setError(message);
          onError?.(message);
          setStreamUrl(null);
          setPreloadState("error");
        }
      }
    };

    fetchStreamUrl();

    // Cleanup blob URL on unmount
    return () => {
      isMounted = false;
      if (abortController) abortController.abort();
      if (streamUrl) {
        URL.revokeObjectURL(streamUrl);
      }
    };
  }, [mediaAssetId]); // ONLY depend on mediaAssetId to prevent re-fetches

  // Sync playing state with audio element
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying && streamUrl) {
      audioRef.current.play().catch((err) => {
        console.error("[AudioTrackDisplay] Play error:", err);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, streamUrl]);

  const getPreloadIndicator = () => {
    switch (preloadState) {
      case "loading":
        return { icon: "⟳", text: "Loading...", color: "#F59E0B" };
      case "buffering":
        return { icon: "⟳", text: "Buffering", color: "#EF4444" };
      case "ready":
        return { icon: "✓", text: "Ready", color: "#10B981" };
      case "error":
        return { icon: "✗", text: "Failed", color: "#EF4444" };
      default:
        return { icon: "•", text: "Idle", color: "#6B7280" };
    }
  };

  const indicator = getPreloadIndicator();

  return (
    <AnimatePresence mode="wait">
      {streamUrl && !error ? (
        <motion.div
          key="audio-display"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
          style={{ borderTop: "1px solid rgba(255,255,255,0.035)" }}
        >
          <div className="flex flex-col gap-3 px-4 py-3 max-w-3xl mx-auto">
            {/* Thumbnail + Info + Status */}
            <div className="flex gap-3 items-start">
              {thumbnailUrl && (
                <div
                  className="flex-shrink-0 rounded-md overflow-hidden"
                  style={{ width: 56, height: 56 }}
                >
                  <img
                    src={thumbnailUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-semibold truncate"
                  style={{ color: "#B8C8A0" }}
                >
                  {title}
                </p>
                <p
                  className="text-xs truncate"
                  style={{ color: "#7A8858" }}
                >
                  {artist}
                </p>
              </div>

              {/* Preload Status Indicator */}
              <div className="flex-shrink-0 flex flex-col items-center gap-1">
                <motion.div
                  animate={preloadState === "loading" || preloadState === "buffering" ? { rotate: 360 } : {}}
                  transition={{
                    duration: 1,
                    repeat: preloadState === "loading" || preloadState === "buffering" ? Infinity : 0,
                    ease: "linear",
                  }}
                  style={{
                    fontSize: "12px",
                    color: indicator.color,
                  }}
                >
                  {indicator.icon}
                </motion.div>
                <span
                  style={{
                    fontSize: "8px",
                    color: indicator.color,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {indicator.text}
                </span>
              </div>
            </div>

            {/* Network Quality Badge */}
            {networkQuality === "slow" && (
              <div
                style={{
                  fontSize: "10px",
                  color: "#F59E0B",
                  background: "rgba(245, 158, 11, 0.1)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  borderRadius: 3,
                  padding: "4px 6px",
                  textAlign: "center",
                  letterSpacing: "0.05em",
                }}
              >
                ⚠ Slow network detected - streaming may buffer
              </div>
            )}

            {/* HTML Audio Element */}
            <audio
              ref={audioRef}
              src={streamUrl}
              controls
              className="w-full"
              style={{
                height: 32,
                filter: "invert(1) hue-rotate(180deg)",
              }}
              onCanPlay={() => {
                if (preloadState === "buffering") {
                  setPreloadState("ready");
                }
              }}
              onWaiting={() => {
                if (preloadState === "ready") {
                  setPreloadState("buffering");
                }
              }}
              onError={() => {
                setError("Audio format not supported");
                onError?.("Audio format not supported");
                setPreloadState("error");
              }}
              crossOrigin="anonymous"
            />
          </div>
        </motion.div>
      ) : error ? (
        <motion.div
          key="audio-error"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.26 }}
          className="overflow-hidden"
          style={{ borderTop: "1px solid rgba(255,255,255,0.035)" }}
        >
          <div className="flex items-center gap-2 px-4 py-2 max-w-3xl mx-auto">
            <span style={{ color: "#DC2626", fontSize: "12px" }}>⚠</span>
            <p style={{ color: "#DC2626", fontSize: "11px" }}>
              {error}
            </p>
            <button
              onClick={() => {
                setError(null);
                setPreloadState("idle");
              }}
              style={{
                marginLeft: "auto",
                color: "#60A5FA",
                fontSize: "10px",
                cursor: "pointer",
                border: "1px solid #60A5FA",
                borderRadius: 3,
                padding: "2px 6px",
                background: "transparent",
              }}
              className="hover:bg-blue-500 hover:bg-opacity-10"
            >
              Retry
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
