"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import { type Track, formatDuration } from "@/app/lib/fake-data";
import { playClickSound, playSkipSound, playSeekSound } from "@/app/lib/sounds";
import { trackClientEvent, EVENTS as CLIENT_EVENTS } from "@/app/lib/client-posthog";
import { updateBackgroundPlaybackState, initBackgroundPlayback } from "@/app/lib/background-playback";
import { playbackController } from "@/lib/playback/PlaybackController";
import { usePlaybackState } from "@/lib/playback/usePlaybackState";
import { PlaybackTrack } from "@/lib/playback/types";

interface PlayerBarProps {
  tracks: Track[];
  currentIndex: number;
  isPlaying?: boolean;
  progress?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onSeek?: (ratio: number) => void;
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
                    6 + ((i * 3) % 8),
                    3 + i * 1.2,
                    8 + ((i * 5) % 6),
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
  const sizeClasses =
    size === "lg"
      ? "w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl"
      : size === "sm"
      ? "w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg"
      : "w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg";

  return (
    <motion.button
      onClick={onClick}
      aria-label={label}
      title={title}
      whileTap={{ scale: 0.88, y: 1.5 }}
      transition={{ type: "spring", stiffness: 420, damping: 18 }}
      className={`flex-shrink-0 flex items-center justify-center cursor-pointer border-0 outline-none relative ${sizeClasses}`}
      style={{
        background: active && color
          ? `linear-gradient(175deg, ${color}E0 0%, ${color}A0 100%)`
          : "linear-gradient(175deg, #5A5040 0%, #3A3028 55%, #28201A 100%)",
        boxShadow: active
          ? `0 1px 0 rgba(255,255,255,0.07) inset, 0 -1px 0 rgba(0,0,0,0.55) inset, 0 2px 6px rgba(0,0,0,0.55)`
          : `0 2px 0 rgba(255,255,255,0.10) inset, 0 -2px 0 rgba(0,0,0,0.55) inset, 0 3px 8px rgba(0,0,0,0.65)`,
      }}
    >
      {/* Active LED */}
      {active && (
        <motion.span
          className="absolute"
          style={{
            top: 3,
            right: 3,
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
          className="absolute inset-0 pointer-events-none rounded-lg sm:rounded-xl"
          style={{ border: `1.5px solid ${color ?? "#D4882A"}` }}
          animate={{ scale: [1, 1.2, 1.2], opacity: [0.5, 0, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      {children}
    </motion.button>
  );
}

/* ─── Main PlayerBar ─────────────────────────────────────────────────────── */
export default function PlayerBar({
  tracks,
  currentIndex,
  isPlaying: propIsPlaying,
  progress: propProgress,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onSeek,
  onTrackSelect,
  onTimeUpdate,
  accentColor = "#D4882A",
}: PlayerBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const playbackState = usePlaybackState();

  useEffect(() => {
    initBackgroundPlayback();
    playbackController.syncWithNativeState();
  }, []);

  // Map incoming tracks to PlaybackTrack format
  const mappedQueue: PlaybackTrack[] = tracks.map((t) => ({
    id: t.id,
    provider: t.provider ?? "youtube",
    providerTrackId: t.providerTrackId,
    title: t.title,
    artist: t.artist,
    artworkUrl: t.thumbnailUrl,
    side: (t.side as "A" | "B") || "A",
    durationSec: t.durationSec,
    personalNote: t.personalNote,
  }));

  const activeTrack = playbackState.currentTrack || mappedQueue[currentIndex] || null;
  const isPlaying = playbackState.isPlaying;
  const currentTime = playbackState.currentTime;
  const duration = playbackState.duration || activeTrack?.durationSec || 0;
  const progress = isDragging
    ? propProgress ?? (duration > 0 ? currentTime / duration : 0)
    : duration > 0
    ? currentTime / duration
    : propProgress ?? 0;

  // Sync state to callbacks & background playback helper
  useEffect(() => {
    if (currentTime >= 0 && duration > 0) {
      onTimeUpdate?.(currentTime, duration);
      if (activeTrack) {
        updateBackgroundPlaybackState(
          activeTrack.providerTrackId,
          currentTime,
          duration,
          isPlaying
        );
      }
    }
  }, [currentTime, duration, activeTrack, isPlaying, onTimeUpdate]);

  // Sync track selection with controller if changed externally
  const currentTrackIdRef = useRef<string | null>(null);
  useEffect(() => {
    const targetTrack = mappedQueue[currentIndex];
    if (targetTrack && targetTrack.id !== currentTrackIdRef.current) {
      currentTrackIdRef.current = targetTrack.id;
      playbackController.setQueue(mappedQueue, currentIndex);
      playbackController.syncWithNativeState();
    }
  }, [currentIndex, mappedQueue]);

  // Keyboard shortcut listener (Spacebar = toggle play/pause, Arrow keys = skip/seek)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        playClickSound(true);
        if (isPlaying) {
          playbackController.pause();
          onPause?.();
        } else {
          playbackController.play();
          onPlay?.();
        }
      } else if (e.code === "ArrowRight" && e.shiftKey) {
        e.preventDefault();
        playSkipSound(true);
        playbackController.next();
        onNext?.();
      } else if (e.code === "ArrowLeft" && e.shiftKey) {
        e.preventDefault();
        playSkipSound(true);
        playbackController.previous();
        onPrev?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, onPlay, onPause, onNext, onPrev]);

  // ── Explicit Seek Handler (User-Initiated Only) ─────────────────────────
  const handleExplicitSeek = useCallback(
    (ratio: number) => {
      const targetSec = ratio * duration;
      onSeek?.(ratio);
      playbackController.seek(targetSec);
    },
    [duration, onSeek]
  );

  // ── Scrubber interaction ──────────────────────────────────────────────────
  function scrubAt(clientX: number, rect: DOMRect) {
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    handleExplicitSeek(ratio);
  }
  function handleScrubberMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setIsDragging(true);
    playSeekSound(true);
    scrubAt(e.clientX, rect);
    const handleMove = (ev: MouseEvent) => scrubAt(ev.clientX, rect);
    const handleUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }
  function handleScrubberTouch(e: React.TouchEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    playSeekSound(true);
    scrubAt(e.touches[0].clientX, rect);
  }

  if (!activeTrack) return null;

  const displayDuration = duration;
  const elapsed = Math.round(currentTime);
  const lcdText = `${activeTrack.artist ? `${activeTrack.artist} – ` : ""}${activeTrack.title}    ${formatDuration(elapsed)} / ${formatDuration(displayDuration)}`;
  const sideLabel = activeTrack.side === "B" ? "B" : "A";

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
          onTouchMove={(e) => scrubAt(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
          role="slider"
          aria-label="Track progress"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") handleExplicitSeek(Math.min(1, progress + 0.01));
            if (e.key === "ArrowLeft") handleExplicitSeek(Math.max(0, progress - 0.01));
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
        <div className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-2 sm:py-2.5 max-w-3xl mx-auto">
          {/* LEFT — Play/Pause + Stop */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            <HardwareButton
              size="lg"
              onClick={() => {
                playClickSound(true);
                if (isPlaying) {
                  playbackController.pause();
                  onPause?.();
                } else {
                  if (activeTrack) {
                    playbackController.playTrack(activeTrack, mappedQueue);
                  } else {
                    playbackController.play();
                  }
                  onPlay?.();
                }
              }}
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
              onClick={() => {
                playClickSound(true);
                playbackController.pause();
                playbackController.seek(0);
                onPause?.();
              }}
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
            className="flex-1 min-w-0 flex items-center"
            style={{
              background: "linear-gradient(155deg, #182010 0%, #0C1208 100%)",
              border: "1.5px solid #0A0D07",
              borderRadius: 7,
              padding: "7px 10px",
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.025), " +
                "inset 0 2px 10px rgba(0,0,0,0.65), " +
                "inset 0 0 18px rgba(80,120,40,0.035)",
            }}
          >
            {/* Ticker row: cursor + badge + scrolling text + VU meter */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTrack.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex items-center gap-2 min-w-0 w-full"
              >
                {/* Blinking block cursor */}
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  aria-hidden="true"
                  style={{
                    width: 5,
                    height: 11,
                    borderRadius: 1,
                    background: "#B8C8A0",
                    flexShrink: 0,
                    boxShadow: "0 0 5px rgba(184,200,160,0.75)",
                    display: "inline-block",
                  }}
                />

                {/* SIDE / VOICE badge */}
                {activeTrack.provider === "voice" ? (
                  <span
                    className="flex items-center gap-0.5"
                    style={{
                      fontSize: "8px",
                      fontFamily: "'Courier New', monospace",
                      color: "#F59E0B",
                      background: "rgba(245, 158, 11, 0.18)",
                      border: "1px solid rgba(245, 158, 11, 0.4)",
                      borderRadius: 3,
                      padding: "0 4px",
                      letterSpacing: "0.08em",
                      flexShrink: 0,
                      lineHeight: "14px",
                    }}
                  >
                    🎙️ VOICE
                  </span>
                ) : (
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
                )}

                <LCDTicker text={lcdText} />

                <VUMeter isPlaying={isPlaying} accent={accentColor} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT — ◄◄ ►► + video toggle */}
          {/* RIGHT — ◄◄ ►► */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            <HardwareButton
              size="md"
              onClick={() => {
                playSkipSound(true);
                playbackController.previous();
                onPrev?.();
              }}
              aria-label="Previous track"
              title="Previous"
            >
              <RewindIcon size={13} />
            </HardwareButton>

            <HardwareButton
              size="md"
              onClick={() => {
                playSkipSound(true);
                playbackController.next();
                onNext?.();
              }}
              aria-label="Next track"
              title="Next"
            >
              <FastForwardIcon size={13} />
            </HardwareButton>
          </div>

          {/* WERK branding — right edge */}
          <div className="flex-shrink-0 hidden sm:flex items-end pb-0.5" aria-hidden="true">
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
          {isPlaying && activeTrack.personalNote && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
              style={{ borderTop: "1px solid rgba(255,255,255,0.035)" }}
            >
              <div className="flex items-start gap-2.5 px-4 py-2 max-w-3xl mx-auto">
                <div className="flex-shrink-0 mt-0.5" aria-hidden="true" style={{ opacity: 0.5 }}>
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
                  &ldquo;{activeTrack.personalNote}&rdquo;
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
