"use client";

import { motion, AnimatePresence } from "framer-motion";
import { type Track, formatDuration } from "@/app/lib/fake-data";

interface TrackListProps {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  side: "A" | "B";
  onSelectTrack: (index: number) => void;
}

export default function TrackList({
  tracks,
  currentIndex,
  isPlaying,
  side,
  onSelectTrack,
}: TrackListProps) {
  const sideTracks = tracks.filter(t => t.side === side);
  const allTracksInOrder = [...tracks];

  return (
    <motion.div
      key={side}
      initial={{ opacity: 0, x: side === "A" ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: side === "A" ? 20 : -20 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "rgba(28,24,20,0.6)",
          border: "1px solid rgba(245,240,232,0.06)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Side header */}
        <div
          className="px-4 py-2.5 border-b"
          style={{ borderColor: "rgba(245,240,232,0.06)" }}
        >
          <p
            className="text-xs tracking-[0.2em] uppercase"
            style={{ color: "#6B5E4E", fontFamily: "monospace" }}
          >
            Side {side} — {sideTracks.length} track{sideTracks.length !== 1 ? "s" : ""}
          </p>
        </div>

        {sideTracks.map((track) => {
          const globalIndex = allTracksInOrder.findIndex(t => t.id === track.id);
          const isActive = globalIndex === currentIndex;

          return (
            <motion.button
              key={track.id}
              onClick={() => onSelectTrack(globalIndex)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
              style={{
                background: isActive ? "rgba(212,136,42,0.08)" : "rgba(0,0,0,0)",
                borderBottom: "1px solid rgba(245,240,232,0.04)",
              }}
              whileHover={{ background: "rgba(245,240,232,0.04)" }}
              whileTap={{ scale: 0.99 }}
              aria-label={`Play ${track.title} by ${track.artist}`}
              aria-pressed={isActive}
            >
              {/* Position number / playing indicator */}
              <div
                className="w-5 flex-shrink-0 text-center"
                style={{ color: isActive ? "#D4882A" : "#6B5E4E" }}
              >
                {isActive && isPlaying ? (
                  <PlayingBars />
                ) : (
                  <span className="text-xs font-mono">{track.position + 1}</span>
                )}
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{
                    color: isActive ? "#F5F0E8" : "#C4B8A8",
                    fontFamily: "var(--font-inter, Inter, sans-serif)",
                  }}
                >
                  {track.title}
                </p>
                <p className="text-xs truncate mt-0.5" style={{ color: "#6B5E4E" }}>
                  {track.artist}
                </p>
              </div>

              {/* Duration */}
              <span
                className="text-xs flex-shrink-0 tabular-nums"
                style={{ color: "#6B5E4E", fontFamily: "monospace" }}
              >
                {formatDuration(track.durationSec)}
              </span>

              {/* Note indicator */}
              {track.personalNote && (
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: "#D4882A", opacity: isActive ? 1 : 0.4 }}
                  title="Has a personal note"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

/** Animated bars shown for the currently-playing track */
function PlayingBars() {
  return (
    <span className="flex items-end gap-[2px] justify-center h-4" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-sm"
          style={{ background: "#D4882A" }}
          animate={{ height: ["4px", "12px", "4px"] }}
          transition={{
            repeat: Infinity,
            duration: 0.8,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}
