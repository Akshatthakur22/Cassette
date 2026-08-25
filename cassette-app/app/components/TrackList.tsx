"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type Track, formatDuration } from "@/app/lib/fake-data";
import { MediaAssetStatusBadge } from "./MediaAssetStatusBadge";
import { useMediaAssetPoller } from "@/app/hooks/useMediaAssetPoller";

interface TrackListProps {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  side: "A" | "B";
  onSelectTrack: (index: number) => void;
  accentColor?: string;
  senderName?: string;
  mediaAssetStates?: Record<string, any>; // Media asset status for each track
}

export default function TrackList({
  tracks,
  currentIndex,
  isPlaying,
  side,
  onSelectTrack,
  accentColor = "#D4882A",
  senderName = "Sender",
  mediaAssetStates = {},
}: TrackListProps) {
  const sideTracks = tracks.filter(t => t.side === side);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  function toggleNote(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <motion.div
      key={side}
      initial={{ opacity: 0, x: side === "A" ? -14 : 14 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: side === "A" ? 14 : -14 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="w-full flex flex-col gap-2.5"
    >
      {/* J-card styled tracklist container */}
      <div
        className="rounded-2xl overflow-hidden border border-[#E8E5DF] shadow-md"
        style={{
          background: "#FFFDF9",
        }}
      >
        {/* Side Header Banner */}
        <div
          className="px-4 sm:px-5 py-3 flex items-center justify-between border-b border-[#E8E5DF]"
          style={{ background: "#F5F2EB" }}
        >
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase text-white"
              style={{ background: accentColor }}
            >
              SIDE {side}
            </span>
            <span className="text-[11px] font-mono font-medium text-[#5F6065]">
              {sideTracks.length} {sideTracks.length === 1 ? "track" : "tracks"}
            </span>
          </div>

          <span className="text-[10px] font-mono text-[#8E8E93] uppercase tracking-wider">
            Tape Index
          </span>
        </div>

        {/* Tracks List */}
        <div className="divide-y divide-[#F0ECE4]">
          {sideTracks.length === 0 ? (
            <div className="py-8 text-center px-4">
              <p className="text-xs text-[#8E8E93] font-mono">No tracks on Side {side}</p>
            </div>
          ) : (
            sideTracks.map((track) => {
              const globalIndex = tracks.findIndex(t => t.id === track.id);
              const isActive = globalIndex === currentIndex;
              const isVoice = (track as any).provider === "voice" || track.title.startsWith("Voice Recording");
              const isMediaAsset = (track as any).provider === "media_asset";
              const hasNote = Boolean(track.personalNote?.trim());
              const isNoteOpen = expandedNotes[track.id] ?? true;
              const mediaAssetState = mediaAssetStates[track.id];

              return (
                <div
                  key={track.id}
                  className="transition-colors group"
                  style={{
                    background: isActive ? `${accentColor}10` : "transparent",
                  }}
                >
                  {/* Track Row Button */}
                  <button
                    onClick={() => onSelectTrack(globalIndex)}
                    className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left transition-all active:scale-[0.99] cursor-pointer"
                    aria-label={`Play track ${track.position + 1}: ${track.title}`}
                    aria-pressed={isActive}
                  >
                    {/* Track Number / Equalizer */}
                    <div className="w-6 flex-shrink-0 flex items-center justify-center">
                      {isActive && isPlaying ? (
                        <PlayingBars accentColor={accentColor} />
                      ) : (
                        <span
                          className="text-xs font-mono font-bold transition-colors group-hover:text-[#1D1D1F]"
                          style={{ color: isActive ? accentColor : "#A09E97" }}
                        >
                          {String(track.position + 1).padStart(2, "0")}
                        </span>
                      )}
                    </div>

                    {/* Title & Artist */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isVoice && (
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold border flex items-center gap-0.5"
                            style={{
                              background: "#FEF3C7",
                              borderColor: "#FCD34D",
                              color: "#B45309",
                            }}
                          >
                            <span>🎙️</span>
                            <span>Voice Note</span>
                          </span>
                        )}

                        {isMediaAsset && (
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold border flex items-center gap-0.5"
                            style={{
                              background: "#E0E7FF",
                              borderColor: "#818CF8",
                              color: "#4F46E5",
                            }}
                          >
                            <span>🎵</span>
                            <span>MP3</span>
                          </span>
                        )}

                        <p
                          className="text-xs sm:text-sm leading-snug truncate"
                          style={{
                            color: isActive ? "#1D1D1F" : "#2C2C2E",
                            fontFamily: "var(--font-inter, Inter, sans-serif)",
                            fontWeight: isActive ? 600 : 500,
                          }}
                        >
                          {track.title}
                        </p>
                      </div>

                      <p
                        className="text-[11px] truncate mt-0.5 font-mono"
                        style={{ color: isActive ? accentColor : "#8E8E93" }}
                      >
                        {track.artist || "Unknown Artist"}
                      </p>

                      {mediaAssetState && (
                        <div className="mt-2">
                          <MediaAssetStatusBadge
                            status={mediaAssetState.status}
                            mediaAssetId={mediaAssetState.id}
                            progress={mediaAssetState.progress}
                            error={mediaAssetState.error}
                          />
                        </div>
                      )}
                    </div>

                    {/* Duration & Note toggle button */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasNote && (
                        <span
                          onClick={(e) => toggleNote(track.id, e)}
                          title="Personal liner note"
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border flex items-center gap-1 transition-all hover:bg-[#FEF3C7]"
                          style={{
                            background: "#FFFBEB",
                            borderColor: "#FDE68A",
                            color: "#B45309",
                          }}
                        >
                          <span>💌 Note</span>
                          <span className="text-[8px]">{isNoteOpen ? "▲" : "▼"}</span>
                        </span>
                      )}

                      <span
                        className="text-[11px] font-mono tabular-nums font-medium"
                        style={{ color: isActive ? accentColor : "#8E8E93" }}
                      >
                        {formatDuration(track.durationSec)}
                      </span>
                    </div>
                  </button>

                  {/* ── Personal Handwritten Note Card (If Present) ── */}
                  <AnimatePresence>
                    {hasNote && isNoteOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden px-4 sm:px-5 pb-3.5 pt-0"
                      >
                        <div
                          className="p-3 sm:p-3.5 rounded-xl border relative shadow-xs"
                          style={{
                            background: "#FEFCE8",
                            borderColor: "#FEF08A",
                            boxShadow: "0 2px 8px rgba(180,83,9,0.06)",
                          }}
                        >
                          {/* Pin Icon Accent */}
                          <div className="flex items-start gap-2">
                            <span className="text-sm select-none">📌</span>
                            <div className="flex-1">
                              <p
                                className="text-xs sm:text-sm leading-relaxed"
                                style={{
                                  fontFamily: "'Playfair Display', Georgia, serif",
                                  fontStyle: "italic",
                                  color: "#451A03",
                                }}
                              >
                                &ldquo;{track.personalNote}&rdquo;
                              </p>
                              <p
                                className="text-[10px] font-mono mt-1.5 font-medium"
                                style={{ color: "#B45309" }}
                              >
                                — {senderName}&apos;s note for this song
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}

function PlayingBars({ accentColor }: { accentColor: string }) {
  return (
    <span className="flex items-end gap-[2px] justify-center h-3.5" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="w-[2.5px] rounded-xs"
          style={{ background: accentColor }}
          animate={{ height: ["3px", "12px", "3px"] }}
          transition={{
            repeat: Infinity,
            duration: 0.75,
            delay: i * 0.16,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}
