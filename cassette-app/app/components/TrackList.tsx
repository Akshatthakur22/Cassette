"use client";

import { motion, AnimatePresence } from "framer-motion";
import { type Track, formatDuration } from "@/app/lib/fake-data";

interface TrackListProps {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  side: "A" | "B";
  onSelectTrack: (index: number) => void;
  accentColor?: string;
}

export default function TrackList({
  tracks,
  currentIndex,
  isPlaying,
  side,
  onSelectTrack,
  accentColor = "#D4882A",
}: TrackListProps) {
  const sideTracks = tracks.filter(t => t.side === side);

  return (
    <motion.div
      key={side}
      initial={{ opacity: 0, x: side === "A" ? -16 : 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: side === "A" ? 16 : -16 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      {/* J-card style container */}
      <div
        className="rounded-2xl overflow-hidden jcard-paper max-h-96 overflow-y-auto"
        style={{ scrollBehavior: "smooth" }}
      >
        {/* Side header */}
        <div
          className="px-4 py-2.5"
          style={{ borderBottom: "1px solid #E8E5DF", background: "#FAFAF6" }}
        >
          <p className="text-[10px] tracking-[0.25em] uppercase"
            style={{ color: "#8E8E93", fontFamily: "monospace" }}>
            Side {side} — {sideTracks.length} track{sideTracks.length !== 1 ? "s" : ""}
          </p>
        </div>

        {sideTracks.map((track) => {
          const globalIndex = tracks.findIndex(t => t.id === track.id);
          const isActive = globalIndex === currentIndex;

          return (
            <motion.button
              key={track.id}
              onClick={() => onSelectTrack(globalIndex)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
              style={{
                background: isActive ? `${accentColor}0D` : "transparent",
                borderBottom: "1px solid #F0ECE4",
              }}
              whileHover={{ background: "#F8F5EF" }}
              whileTap={{ scale: 0.99 }}
              aria-label={`Play ${track.title} by ${track.artist}`}
              aria-pressed={isActive}
            >
              {/* Position / playing indicator */}
              <div className="w-5 flex-shrink-0 text-center">
                {isActive && isPlaying ? (
                  <PlayingBars accentColor={accentColor} />
                ) : (
                  <span
                    className="text-xs font-mono"
                    style={{ color: isActive ? accentColor : "#8E8E93" }}
                  >
                    {track.position + 1}
                  </span>
                )}
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate leading-tight"
                  style={{
                    color: isActive ? "#1D1D1F" : "#3D3D3F",
                    fontFamily: "var(--font-inter, Inter, sans-serif)",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {track.title}
                </p>
                <p className="text-xs truncate mt-0.5 leading-tight" style={{ color: "#8E8E93" }}>
                  {track.artist}
                </p>
              </div>

              {/* Duration */}
              <span className="text-xs flex-shrink-0 tabular-nums"
                style={{ color: "#8E8E93", fontFamily: "monospace" }}>
                {formatDuration(track.durationSec)}
              </span>

              {/* Note dot — amber */}
              {track.personalNote && (
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: accentColor, opacity: isActive ? 1 : 0.35 }}
                  title="Has a personal note"
                  aria-label="Has personal note"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

function PlayingBars({ accentColor }: { accentColor: string }) {
  return (
    <span className="flex items-end gap-[2px] justify-center h-4" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-sm"
          style={{ background: accentColor }}
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
