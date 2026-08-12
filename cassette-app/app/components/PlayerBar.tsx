"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import { type Track, formatDuration } from "@/app/lib/fake-data";
import { playClickSound, playSkipSound, playSeekSound } from "@/app/lib/sounds";

// ─── YouTube IFrame API types ─────────────────────────────────────────────────
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface PlayerBarProps {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  progress: number;          // 0–1, driven from outside for scrubber display
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (ratio: number) => void;
  /** Called every ~500ms with current elapsed seconds from YT player */
  onTimeUpdate?: (elapsedSec: number, durationSec: number) => void;
}

export default function PlayerBar({
  tracks,
  currentIndex,
  isPlaying,
  progress,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onSeek,
  onTimeUpdate,
}: PlayerBarProps) {
  const track = tracks[currentIndex];
  const playerDivId = "yt-player-cassette";
  const playerRef = useRef<any>(null);          // YT.Player instance
  const apiReadyRef = useRef(false);
  const initPendingRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const onNextRef = useRef(onNext);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const [showVideo, setShowVideo] = useState(false);
  const [ytReady, setYtReady] = useState(false);

  // Keep refs in sync so callbacks always see fresh values
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { onNextRef.current = onNext; }, [onNext]);
  useEffect(() => { onTimeUpdateRef.current = onTimeUpdate; }, [onTimeUpdate]);

  // ── 1. Load YouTube IFrame API once ────────────────────────────────────────
  useEffect(() => {
    if (apiReadyRef.current) return;

    if (window.YT?.Player) {
      apiReadyRef.current = true;
      setYtReady(true);
      return;
    }

    // Guard: only inject the script once
    if (!document.getElementById("yt-iframe-script")) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-script";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      apiReadyRef.current = true;
      setYtReady(true);
      prev?.();
    };
  }, []);

  // ── 2. Create the player once the API and the div are ready ────────────────
  const createPlayer = useCallback((videoId: string) => {
    if (playerRef.current || initPendingRef.current) return;
    if (!videoId || videoId === 'undefined' || videoId === 'null') {
      console.error('Invalid video ID:', videoId);
      return;
    }
    const el = document.getElementById(playerDivId);
    if (!el || !window.YT?.Player) return;

    initPendingRef.current = true;
    playerRef.current = new window.YT.Player(playerDivId, {
      videoId,
      width: "100%",
      height: "100%",
      playerVars: {
        autoplay: 0,
        controls: 1,          // Show YT controls (required — keeps player visible + accessible)
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        fs: 0,
        iv_load_policy: 3,
      },
      events: {
        onReady(event: any) {
          initPendingRef.current = false;
          if (isPlayingRef.current) event.target.playVideo();
        },
        onStateChange(event: any) {
          // 0 = ended → advance to next track
          if (event.data === 0) onNextRef.current();
        },
        onError(event: any) {
          console.warn("YT player error code:", event.data);
          // On error, skip to next track
          onNextRef.current();
        },
      },
    });
  }, []);

  // ── 3. Init player when API is ready ───────────────────────────────────────
  useEffect(() => {
    if (!ytReady || !track || !track.providerTrackId) return;
    console.log('Initializing player with video ID:', track.providerTrackId);
    createPlayer(track.providerTrackId);
  }, [ytReady, createPlayer, track]);

  // ── 4. When track changes: load new video ──────────────────────────────────
  useEffect(() => {
    if (!playerRef.current || !track || !track.providerTrackId) return;
    try {
      console.log('Loading new video:', track.providerTrackId);
      if (isPlaying) {
        playerRef.current.loadVideoById(track.providerTrackId);
      } else {
        playerRef.current.cueVideoById(track.providerTrackId);
      }
    } catch (e) {
      console.error('Error loading video:', e);
      // Player not ready yet; onReady will handle it
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id]);

  // ── 5. Sync play/pause from UI into the player ─────────────────────────────
  useEffect(() => {
    if (!playerRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch (e) {}
  }, [isPlaying]);

  // ── 6. Seek when progress is set externally (scrubber click) ───────────────
  const lastExternalSeekRef = useRef(-1);
  useEffect(() => {
    if (!playerRef.current || !track) return;
    const targetSec = progress * track.durationSec;
    // Only seek if this was a deliberate scrub (big jump > 2s)
    try {
      const currentSec = playerRef.current.getCurrentTime?.() ?? 0;
      if (Math.abs(currentSec - targetSec) > 2) {
        playerRef.current.seekTo(targetSec, true);
        lastExternalSeekRef.current = targetSec;
      }
    } catch (e) {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  // ── 7. Ticker — poll YT player for real elapsed time every 500ms ───────────
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (!isPlaying) return;

    tickRef.current = setInterval(() => {
      if (!playerRef.current) return;
      try {
        const elapsed = playerRef.current.getCurrentTime?.() ?? 0;
        const dur = playerRef.current.getDuration?.() ?? track?.durationSec ?? 0;
        if (dur > 0) onTimeUpdateRef.current?.(elapsed, dur);
      } catch (e) {}
    }, 500);

    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [isPlaying, track?.id]);

  const elapsed = Math.round(progress * (track?.durationSec ?? 0));

  function handleScrubberClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    playSeekSound(true);
    onSeek(Math.max(0, Math.min(1, ratio)));
  }

  if (!track) return null;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "rgba(18,14,10,0.92)",
        borderTop: "1px solid rgba(245,240,232,0.08)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* ── Scrubber — thicker hit area, thumb dot on hover ── */}
      <div
        className="group relative h-1.5 w-full cursor-pointer"
        style={{ background: "rgba(245,240,232,0.05)" }}
        onClick={handleScrubberClick}
        role="slider"
        aria-label="Track progress"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === "ArrowRight") onSeek(Math.min(1, progress + 0.02));
          if (e.key === "ArrowLeft")  onSeek(Math.max(0, progress - 0.02));
        }}
      >
        {/* Fill track */}
        <div
          className="absolute top-0 left-0 h-full transition-none"
          style={{
            width: `${progress * 100}%`,
            background: "linear-gradient(90deg, #D4882A, #C4503A)",
            boxShadow: "0 0 8px rgba(212,136,42,0.5)",
          }}
        />
        {/* Thumb — appears on hover */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
          style={{
            left: `calc(${progress * 100}% - 6px)`,
            background: "#D4882A",
            boxShadow: "0 0 6px rgba(212,136,42,0.8)",
          }}
        />
      </div>

      {/* ── Main bar ── */}
      <div className="flex items-center gap-3 px-4 py-3 max-w-4xl mx-auto">

        {/* Thumbnail / video toggle */}
        <motion.button
          onClick={() => setShowVideo(v => !v)}
          className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center hover:opacity-75"
          style={{ background: "#2A1F14", border: "1px solid rgba(245,240,232,0.06)" }}
          aria-label="Toggle video"
          whileTap={{
            scale: 0.9,
            y: 1,
          }}
          transition={{
            scale: { type: "spring", stiffness: 300, damping: 15 },
            y: { type: "spring", stiffness: 300, damping: 15 },
          }}
        >
          {track.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={track.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span style={{ color: "#D4882A", fontSize: "11px", fontFamily: "monospace" }}>
              {track.side}
            </span>
          )}
        </motion.button>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.18 }}
            >
              <p className="text-sm font-medium truncate leading-tight"
                style={{ color: "#F5F0E8", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
                {track.title}
              </p>
              <p className="text-xs truncate leading-tight mt-0.5" style={{ color: "#A89880" }}>
                {track.artist}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <ControlButton onClick={() => { playSkipSound(true); onPrev(); }} aria-label="Previous track"><SkipBackIcon /></ControlButton>
          <motion.button
            onClick={isPlaying ? onPause : onPlay}
            className="relative w-9 h-9 rounded-full flex items-center justify-center hover:opacity-90"
            style={{ background: "#D4882A" }}
            aria-label={isPlaying ? "Pause" : "Play"}
            whileTap={{
              scale: 0.82,
              y: 2,
            }}
            transition={{
              scale: { type: "spring", stiffness: 280, damping: 14 },
              y: { type: "spring", stiffness: 280, damping: 14 },
            }}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
            {/* Note-available pulse ring */}
            {track.personalNote && isPlaying && (
              <motion.span
                className="absolute inset-0 rounded-full pointer-events-none"
                animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                style={{ border: "1.5px solid #D4882A" }}
              />
            )}
          </motion.button>
          <ControlButton onClick={() => { playSkipSound(true); onNext(); }} aria-label="Next track"><SkipForwardIcon /></ControlButton>
        </div>

        {/* Time */}
        <div className="text-xs tabular-nums flex-shrink-0 hidden sm:block"
          style={{ color: "#6B5E4E", fontFamily: "monospace", minWidth: "72px", textAlign: "right" }}>
          {formatDuration(elapsed)} / {formatDuration(track.durationSec)}
        </div>
      </div>

      {/* ── YouTube player ──────────────────────────────────────────────────────
          ALWAYS in the DOM — just visually hidden when showVideo is false.
          The player must be ≥200×200 and visible when playing (YouTube ToS §4.1).
          We slide it open instead of conditionally mounting it.
      ── */}
      <div
        style={{
          height: showVideo ? "auto" : "0px",
          overflow: "hidden",
          transition: "height 0.3s ease",
          borderTop: showVideo ? "1px solid rgba(245,240,232,0.06)" : "none",
        }}
      >
        <div className="w-full max-w-sm mx-auto" style={{ aspectRatio: "16/9", padding: "8px 12px" }}>
          {/* Actual YouTube player target — always mounted */}
          <div
            id={playerDivId}
            style={{
              width: "100%",
              height: "100%",
              minWidth: "200px",
              minHeight: "113px",
              borderRadius: "8px",
              overflow: "hidden",
              background: "#0A0807",
            }}
          />
        </div>
      </div>

      {/* Personal note */}
      <AnimatePresence>
        {isPlaying && track.personalNote && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="text-center text-xs px-6 pb-3 leading-relaxed"
              style={{ color: "#A89880", fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic" }}>
              &ldquo;{track.personalNote}&rdquo;
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Icon helpers ─────────────────────────────────────────────────────────────

function ControlButton({ children, onClick, "aria-label": label }:
  { children: React.ReactNode; onClick: () => void; "aria-label": string }) {
  return (
    <motion.button
      onClick={onClick}
      aria-label={label}
      className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:opacity-80"
      style={{ color: "#A89880" }}
      whileTap={{
        scale: 0.85,
        y: 1.5,
      }}
      transition={{
        scale: { type: "spring", stiffness: 300, damping: 15 },
        y: { type: "spring", stiffness: 300, damping: 15 },
      }}
    >
      {children}
    </motion.button>
  );
}
function PlayIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 2.5L13 8L4 13.5V2.5Z" fill="#1C1814" /></svg>;
}
function PauseIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="2" width="4" height="12" rx="1.5" fill="#1C1814" /><rect x="9" y="2" width="4" height="12" rx="1.5" fill="#1C1814" /></svg>;
}
function SkipBackIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 3h1.5v10H4V3zm1.5 5L12 13V3l-6.5 5z" fill="currentColor" /></svg>;
}
function SkipForwardIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 3h-1.5v10H12V3zm-1.5 5L4 3v10l6.5-5z" fill="currentColor" /></svg>;
}
