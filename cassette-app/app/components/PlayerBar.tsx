"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import { type Track, formatDuration } from "@/app/lib/fake-data";
import { playClickSound, playSkipSound, playSeekSound } from "@/app/lib/sounds";
import { trackClientEvent, EVENTS as CLIENT_EVENTS } from "@/app/lib/client-posthog";

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
  progress: number;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (ratio: number) => void;
  onTrackSelect?: (index: number) => void;
  onTimeUpdate?: (elapsedSec: number, durationSec: number) => void;
  accentColor?: string;
}

/* ─── VU Meter bars (cosmetic, animated when playing) ───────────────────── */
function VUMeter({ isPlaying, accent }: { isPlaying: boolean; accent: string }) {
  const barCount = 5;
  return (
    <div
      className="flex items-end gap-[2px] flex-shrink-0"
      aria-hidden="true"
      style={{ height: 14, width: barCount * 5 + (barCount - 1) * 2 }}
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            width: 4,
            borderRadius: 2,
            background: accent,
            opacity: isPlaying ? 0.8 : 0.2,
          }}
          animate={
            isPlaying
              ? {
                  height: [
                    4 + i * 1.5,
                    6 + Math.random() * 8,
                    3 + i * 1.2,
                    8 + Math.random() * 6,
                    4 + i * 1.5,
                  ],
                }
              : { height: 3 }
          }
          transition={
            isPlaying
              ? {
                  duration: 0.45 + i * 0.08,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.07,
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

/* ─── LCD ticker — scrolls long text horizontally ───────────────────────── */
function LCDTicker({ text }: { text: string }) {
  const [offset, setOffset] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => { setOffset(0); }, [text]);

  useEffect(() => {
    const textEl = textRef.current;
    if (!textEl) return;
    const observer = new ResizeObserver(() => setTextWidth(textEl.scrollWidth));
    observer.observe(textEl);
    setTextWidth(textEl.scrollWidth);
    return () => observer.disconnect();
  }, [text]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const overflow = textWidth - container.offsetWidth;
    if (overflow <= 0) { setOffset(0); return; }

    const PAUSE = 1400;
    const SPEED = 38; // px/sec
    const TOTAL = PAUSE + (overflow / SPEED) * 1000 + PAUSE;
    let start: number | null = null;

    function tick(now: number) {
      if (!start) start = now;
      const t = now - start;
      if (t < PAUSE) setOffset(0);
      else if (t < PAUSE + (overflow / SPEED) * 1000)
        setOffset(-Math.min(((t - PAUSE) / 1000) * SPEED, overflow));
      else if (t < TOTAL) setOffset(-overflow);
      else start = now;
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [text, textWidth]);

  return (
    <div ref={containerRef} className="overflow-hidden flex-1 min-w-0">
      <span
        ref={textRef}
        className="whitespace-nowrap inline-block"
        style={{
          transform: `translateX(${offset}px)`,
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "12px",
          letterSpacing: "0.04em",
          color: "#B8C8A0",
          textShadow: "0 0 8px rgba(184,200,160,0.65), 0 0 2px rgba(184,200,160,0.4)",
        }}
      >
        {text}
      </span>
    </div>
  );
}

/* ─── Hardware button — deep bevel, physical feel ───────────────────────── */
function HardwareButton({
  children,
  onClick,
  "aria-label": label,
  active = false,
  size = "md",
  color,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  "aria-label": string;
  active?: boolean;
  size?: "sm" | "md" | "lg";
  color?: string;
  title?: string;
}) {
  const dim = size === "lg" ? 50 : size === "md" ? 42 : 34;
  const radius = size === "lg" ? 10 : 8;

  return (
    <motion.button
      onClick={onClick}
      aria-label={label}
      title={title}
      whileTap={{ scale: 0.86, y: 2 }}
      transition={{ type: "spring", stiffness: 420, damping: 18 }}
      style={{
        width: dim,
        height: dim,
        borderRadius: radius,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        border: "none",
        outline: "none",
        position: "relative",
        background: active && color
          ? `linear-gradient(175deg, ${color}E0 0%, ${color}A0 100%)`
          : "linear-gradient(175deg, #5A5040 0%, #3A3028 55%, #28201A 100%)",
        boxShadow: active
          ? `0 1px 0 rgba(255,255,255,0.07) inset, 0 -1px 0 rgba(0,0,0,0.55) inset, 0 2px 6px rgba(0,0,0,0.55)`
          : `0 2px 0 rgba(255,255,255,0.10) inset, 0 -2px 0 rgba(0,0,0,0.55) inset, 0 4px 12px rgba(0,0,0,0.65)`,
      }}
    >
      {/* Active LED */}
      {active && (
        <motion.span
          className="absolute"
          style={{
            top: 4,
            right: 4,
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: color ?? "#FF4444",
            boxShadow: `0 0 5px ${color ?? "#FF4444"}`,
          }}
          animate={{ opacity: [1, 0.35, 1] }}
          transition={{ duration: 1.1, repeat: Infinity }}
        />
      )}
      {/* Pulse ring on play */}
      {active && size === "lg" && (
        <motion.span
          className="absolute inset-0 pointer-events-none"
          style={{ borderRadius: radius, border: `1.5px solid ${color ?? "#D4882A"}` }}
          animate={{ scale: [1, 1.2, 1.2], opacity: [0.5, 0, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      {children}
    </motion.button>
  );
}

/* ─── Track position pill dots ───────────────────────────────────────────── */
function TrackDots({
  tracks,
  currentIndex,
  accentColor,
  onSelect,
}: {
  tracks: Track[];
  currentIndex: number;
  accentColor: string;
  onSelect: (i: number) => void;
}) {
  // Only show up to 12 dots — beyond that just show "n/total"
  const MAX = 12;
  if (tracks.length > MAX) {
    return (
      <span
        style={{
          fontSize: "9px",
          fontFamily: "'Courier New', monospace",
          color: "#6A6850",
          letterSpacing: "0.1em",
        }}
      >
        {currentIndex + 1}/{tracks.length}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-[3px]" role="tablist" aria-label="Track list">
      {tracks.map((t, i) => (
        <motion.button
          key={t.id}
          onClick={() => onSelect(i)}
          role="tab"
          aria-selected={i === currentIndex}
          aria-label={`Track ${i + 1}: ${t.title}`}
          title={t.title}
          whileHover={{ scale: 1.3 }}
          whileTap={{ scale: 0.85 }}
          style={{
            width: i === currentIndex ? 16 : 5,
            height: 4,
            borderRadius: 3,
            background:
              i === currentIndex
                ? accentColor
                : i < currentIndex
                  ? "rgba(184,200,160,0.45)"
                  : "rgba(184,200,160,0.13)",
            border: "none",
            cursor: "pointer",
            padding: 0,
            flexShrink: 0,
            boxShadow: i === currentIndex ? `0 0 7px ${accentColor}90` : "none",
            transition: "width 0.3s cubic-bezier(0.22,1,0.36,1), background 0.25s ease",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Main PlayerBar ─────────────────────────────────────────────────────── */
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
  onTrackSelect,
  onTimeUpdate,
  accentColor = "#D4882A",
}: PlayerBarProps) {
  const track = tracks[currentIndex];
  const playerDivId = "yt-player-cassette";
  const playerRef = useRef<any>(null);
  const apiReadyRef = useRef(false);
  const initPendingRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const onNextRef = useRef(onNext);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const [showVideo, setShowVideo] = useState(false);
  const [ytReady, setYtReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { onNextRef.current = onNext; }, [onNext]);
  useEffect(() => { onTimeUpdateRef.current = onTimeUpdate; }, [onTimeUpdate]);

  // ── Load YouTube IFrame API once ─────────────────────────────────────────
  useEffect(() => {
    if (apiReadyRef.current) return;
    if (window.YT?.Player) { apiReadyRef.current = true; setYtReady(true); return; }
    if (!document.getElementById("yt-iframe-script")) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-script";
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true; tag.defer = true;
      document.head.appendChild(tag);
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      apiReadyRef.current = true; setYtReady(true); prev?.();
    };
    const t = setTimeout(() => {
      if (!apiReadyRef.current && window.YT?.Player) { apiReadyRef.current = true; setYtReady(true); }
    }, 10000);
    return () => clearTimeout(t);
  }, []);

  // ── Create YT player ──────────────────────────────────────────────────────
  const createPlayer = useCallback((videoId: string) => {
    if (playerRef.current || initPendingRef.current) return;
    if (!videoId || videoId === "undefined") return;
    const el = document.getElementById(playerDivId);
    if (!el || !window.YT?.Player) return;
    initPendingRef.current = true;
    try {
      playerRef.current = new window.YT.Player(playerDivId, {
        videoId,
        width: "100%", height: "100%",
        playerVars: { autoplay: 0, controls: 1, modestbranding: 1, rel: 0, playsinline: 1, fs: 0, iv_load_policy: 3 },
        events: {
          onReady(event: any) {
            initPendingRef.current = false;
            if (isPlayingRef.current) event.target.playVideo();
          },
          onStateChange(event: any) {
            if (event.data === 1) trackClientEvent(CLIENT_EVENTS.TAPE_PLAYED, { videoId }).catch(() => {});
            if (event.data === 0) onNextRef.current();
          },
          onError() { onNextRef.current(); },
        },
      });
    } catch { initPendingRef.current = false; }
  }, []);

  useEffect(() => { if (ytReady && track?.providerTrackId) createPlayer(track.providerTrackId); }, [ytReady, createPlayer, track]);

  useEffect(() => {
    if (!playerRef.current || !track?.providerTrackId) return;
    try {
      if (isPlaying) playerRef.current.loadVideoById(track.providerTrackId);
      else playerRef.current.cueVideoById(track.providerTrackId);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id]);

  useEffect(() => {
    if (!playerRef.current) return;
    try { if (isPlaying) playerRef.current.playVideo(); else playerRef.current.pauseVideo(); } catch {}
  }, [isPlaying]);

  useEffect(() => {
    if (!playerRef.current || !track) return;
    const targetSec = progress * track.durationSec;
    try {
      const cur = playerRef.current.getCurrentTime?.() ?? 0;
      if (Math.abs(cur - targetSec) > 2) playerRef.current.seekTo(targetSec, true);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (!isPlaying) return;
    tickRef.current = setInterval(() => {
      if (!playerRef.current) return;
      try {
        const elapsed = playerRef.current.getCurrentTime?.() ?? 0;
        const dur = playerRef.current.getDuration?.() ?? track?.durationSec ?? 0;
        if (dur > 0) onTimeUpdateRef.current?.(elapsed, dur);
      } catch {}
    }, 500);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [isPlaying, track?.id]);

  // ── Scrubber interaction ──────────────────────────────────────────────────
  function scrubAt(clientX: number, rect: DOMRect) {
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(ratio);
  }
  function handleScrubberMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setIsDragging(true);
    playSeekSound(true);
    scrubAt(e.clientX, rect);
    const handleMove = (ev: MouseEvent) => scrubAt(ev.clientX, rect);
    const handleUp = () => { setIsDragging(false); window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }
  function handleScrubberTouch(e: React.TouchEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    playSeekSound(true);
    scrubAt(e.touches[0].clientX, rect);
  }

  if (!track) return null;

  const elapsed = Math.round(progress * (track.durationSec ?? 0));
  const lcdText = `${track.artist ? `${track.artist} – ` : ""}${track.title}    ${formatDuration(elapsed)} / ${formatDuration(track.durationSec)}`;
  const sideLabel = track.side === "B" ? "B" : "A";

  return (
    <motion.div
      initial={{ y: 110, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* ── OUTER CHASSIS ─────────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(180deg, #302820 0%, #1E1812 48%, #14100C 100%)",
          borderTop: "1px solid rgba(255,255,255,0.055)",
          boxShadow:
            "0 -1px 0 rgba(255,255,255,0.03), " +
            "0 -14px 44px rgba(0,0,0,0.58), " +
            "0 -4px 18px rgba(0,0,0,0.42)",
        }}
      >
        {/* ── PROGRESS SCRUBBER ────────────────────────────────────── */}
        <div
          className="group relative w-full cursor-pointer"
          style={{ height: 4, background: "#0D0A07" }}
          onMouseDown={handleScrubberMouseDown}
          onTouchStart={handleScrubberTouch}
          onTouchMove={e => scrubAt(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
          role="slider"
          aria-label="Track progress"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === "ArrowRight") onSeek(Math.min(1, progress + 0.01));
            if (e.key === "ArrowLeft")  onSeek(Math.max(0, progress - 0.01));
          }}
        >
          {/* Fill */}
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: `${progress * 100}%`,
              background: `linear-gradient(90deg, ${accentColor}70, ${accentColor})`,
              boxShadow: `0 0 8px ${accentColor}80`,
              transition: isDragging ? "none" : "width 0.5s linear",
            }}
          />
          {/* Thumb */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `calc(${progress * 100}% - 7px)`, width: 14, height: 14 }}
            animate={{ scale: isDragging ? 1 : 0, opacity: isDragging ? 1 : 0 }}
            whileHover={{ scale: 1 }}
            // always show on hover via group
            initial={false}
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                background: accentColor,
                boxShadow: `0 0 10px ${accentColor}`,
              }}
            />
          </motion.div>
          {/* Hover expand */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-100"
            style={{ transform: "scaleY(2.5)", transformOrigin: "center" }}
          />
        </div>

        {/* ── MAIN DECK ROW ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-3 py-2.5 max-w-3xl mx-auto">

          {/* LEFT — Play/Pause + Stop */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <HardwareButton
              size="lg"
              onClick={() => { playClickSound(true); isPlaying ? onPause() : onPlay(); }}
              aria-label={isPlaying ? "Pause" : "Play"}
              active={isPlaying}
              color={accentColor}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isPlaying ? "pause" : "play"}
                  initial={{ opacity: 0, scale: 0.55 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.55 }}
                  transition={{ duration: 0.09 }}
                >
                  {isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
                </motion.div>
              </AnimatePresence>
            </HardwareButton>

            <HardwareButton
              size="sm"
              onClick={() => { playClickSound(true); onPause(); onSeek(0); }}
              aria-label="Stop"
              color="#C03030"
              active={!isPlaying && progress === 0}
              title="Stop"
            >
              <StopIcon size={12} />
            </HardwareButton>
          </div>

          {/* CENTER — LCD panel */}
          <div
            className="flex-1 min-w-0 flex flex-col"
            style={{
              background: "linear-gradient(155deg, #182010 0%, #0C1208 100%)",
              border: "1.5px solid #0A0D07",
              borderRadius: 6,
              padding: "5px 9px 4px",
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.025), " +
                "inset 0 2px 10px rgba(0,0,0,0.65), " +
                "inset 0 0 18px rgba(80,120,40,0.035)",
              gap: 3,
            }}
          >
            {/* Top row: cursor + scrolling text + VU meter */}
            <AnimatePresence mode="wait">
              <motion.div
                key={track.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex items-center gap-2 min-w-0"
              >
                {/* Blinking block cursor */}
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  aria-hidden="true"
                  style={{
                    width: 5,
                    height: 10,
                    borderRadius: 1,
                    background: "#B8C8A0",
                    flexShrink: 0,
                    boxShadow: "0 0 5px rgba(184,200,160,0.75)",
                    display: "inline-block",
                  }}
                />

                {/* SIDE badge */}
                <span
                  style={{
                    fontSize: "8px",
                    fontFamily: "'Courier New', monospace",
                    color: accentColor,
                    background: `${accentColor}22`,
                    border: `1px solid ${accentColor}44`,
                    borderRadius: 3,
                    padding: "0 4px",
                    letterSpacing: "0.1em",
                    flexShrink: 0,
                    lineHeight: "14px",
                  }}
                >
                  {sideLabel}
                </span>

                <LCDTicker text={lcdText} />

                <VUMeter isPlaying={isPlaying} accent={accentColor} />
              </motion.div>
            </AnimatePresence>

            {/* Bottom row: track dots */}
            <TrackDots
              tracks={tracks}
              currentIndex={currentIndex}
              accentColor={accentColor}
              onSelect={i => onTrackSelect?.(i)}
            />
          </div>

          {/* RIGHT — ◄◄ ►► + video toggle */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <HardwareButton
              size="md"
              onClick={() => { playSkipSound(true); onPrev(); }}
              aria-label="Previous track"
              title="Previous"
            >
              <RewindIcon size={13} />
            </HardwareButton>

            <HardwareButton
              size="md"
              onClick={() => { playSkipSound(true); onNext(); }}
              aria-label="Next track"
              title="Next"
            >
              <FastForwardIcon size={13} />
            </HardwareButton>

            {/* Video toggle */}
            <motion.button
              onClick={() => setShowVideo(v => !v)}
              aria-label={showVideo ? "Hide video" : "Show video"}
              title={showVideo ? "Hide video" : "Show video"}
              whileTap={{ scale: 0.86, y: 1 }}
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: showVideo
                  ? `linear-gradient(175deg, ${accentColor}90 0%, ${accentColor}55 100%)`
                  : "linear-gradient(175deg, #3A3028 0%, #241C14 100%)",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 1px 0 rgba(255,255,255,0.07) inset, 0 3px 8px rgba(0,0,0,0.5)",
              }}
            >
              <VideoIcon accent={showVideo ? "#E8DCC8" : "#6A604A"} />
            </motion.button>
          </div>

          {/* WERK branding — right edge */}
          <div
            className="flex-shrink-0 hidden sm:flex items-end pb-0.5"
            aria-hidden="true"
          >
            <span
              style={{
                fontSize: "8px",
                fontFamily: "'Courier New', monospace",
                letterSpacing: "0.28em",
                color: "rgba(255,255,255,0.12)",
                textTransform: "uppercase",
                writingMode: "vertical-lr",
                transform: "rotate(180deg)",
                lineHeight: 1,
              }}
            >
              WERK
            </span>
          </div>
        </div>

        {/* ── PERSONAL NOTE STRIP ──────────────────────────────────── */}
        <AnimatePresence>
          {isPlaying && track.personalNote && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
              style={{ borderTop: "1px solid rgba(255,255,255,0.035)" }}
            >
              <div className="flex items-start gap-2.5 px-4 py-2 max-w-3xl mx-auto">
                {/* Note icon */}
                <div
                  className="flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                  style={{ opacity: 0.5 }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 2.5h8M1 5h8M1 7.5h5" stroke="#8A9860" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </div>
                <p
                  style={{
                    fontSize: "11px",
                    lineHeight: 1.6,
                    color: "#7A8858",
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontStyle: "italic",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  &ldquo;{track.personalNote}&rdquo;
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── YOUTUBE PLAYER ────────────────────────────────────────── */}
      <div
        style={{
          background: "#0E0C08",
          borderTop: showVideo ? "1px solid rgba(255,255,255,0.035)" : "none",
          overflow: "hidden",
          maxHeight: showVideo ? 220 : 0,
          transition: "max-height 0.35s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div
          className="w-full max-w-xs mx-auto"
          style={{ aspectRatio: "16/9", padding: "8px 12px" }}
        >
          <div
            id={playerDivId}
            style={{
              width: "100%", height: "100%",
              minWidth: 180, minHeight: 102,
              borderRadius: 8,
              overflow: "hidden",
              background: "#100E08",
            }}
          />
        </div>
      </div>

    </motion.div>
  );
}

/* ─── Icons ───────────────────────────────────────────────────────────────── */
function PlayIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M5 3L13 8L5 13V3Z" fill="#E8DCC8" />
    </svg>
  );
}
function PauseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="3" y="2.5" width="3.5" height="11" rx="1.5" fill="#E8DCC8" />
      <rect x="9.5" y="2.5" width="3.5" height="11" rx="1.5" fill="#E8DCC8" />
    </svg>
  );
}
function StopIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <rect x="2" y="2" width="8" height="8" rx="1.5" fill="#E8DCC8" />
    </svg>
  );
}
function RewindIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <path d="M6.5 6.5L12 2.5v8L6.5 6.5z" fill="#E8DCC8" />
      <path d="M1 6.5L6.5 2.5v8L1 6.5z" fill="#E8DCC8" />
    </svg>
  );
}
function FastForwardIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <path d="M6.5 6.5L1 2.5v8l5.5-4z" fill="#E8DCC8" />
      <path d="M12 6.5L6.5 2.5v8l5.5-4z" fill="#E8DCC8" />
    </svg>
  );
}
function VideoIcon({ accent }: { accent: string }) {
  return (
    <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
      <rect x="0.5" y="0.5" width="8" height="10" rx="1.5" stroke={accent} strokeWidth="1" />
      <path d="M9 3.5L12.5 2v7L9 7.5V3.5z" fill={accent} />
    </svg>
  );
}
