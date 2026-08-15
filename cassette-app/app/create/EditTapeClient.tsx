"use client";

import { useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useRouter } from "next/navigation";
import CassetteObject from "@/app/components/CassetteObject";

interface Track {
  id: string;
  side: "A" | "B";
  position: number;
  title: string;
  artist?: string;
  duration?: number;
  personalNote?: string;
}

interface EditTapeClientProps {
  draftId: string;
  tapeTitle: string;
  recipientName?: string;
  senderName?: string;
  selectedStyle?: string;
  initialTracks?: Track[];
}

export default function EditTapeClient({
  draftId,
  tapeTitle,
  recipientName = "You",
  senderName = "Creator",
  selectedStyle = "cream",
  initialTracks = [],
}: EditTapeClientProps) {
  const router = useRouter();
  const [activeSide, setActiveSide] = useState<"A" | "B">("A");
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const sideTracks = tracks.filter((t) => t.side === activeSide);
  const totalDuration = sideTracks.reduce((sum, t) => sum + (t.duration || 0), 0);

  function formatDuration(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function handleDeleteTrack(trackId: string) {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
  }

  function handleSaveNote(trackId: string) {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, personalNote: noteText } : t))
    );
    setEditingNoteId(null);
  }

  function handleReorder(newTracks: Track[]) {
    setTracks(newTracks.map((t, idx) => ({ ...t, position: idx })));
  }

  async function handlePublish() {
    if (tracks.length === 0) {
      alert("Please add at least one track");
      return;
    }
    setIsLoading(true);
    try {
      // Publish tape via server action
      // await publishTape(draftId);
      router.push(`/record/${draftId}`);
    } catch (error) {
      console.error("Error publishing:", error);
      setIsLoading(false);
    }
  }

  return (
    <div
      className="relative min-h-screen flex flex-col lg:flex-row items-stretch"
      style={{ background: "#FBFAF7" }}
    >
      {/* Header */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3" style={{ background: "rgba(251,250,247,0.95)", borderBottom: "1px solid #E8E5DF" }}>
        <h1 className="text-lg font-bold" style={{ fontFamily: "monospace" }}>
          CASSETTE
        </h1>
        <div className="flex items-center gap-2" style={{ color: "#8E8E93", fontFamily: "monospace", fontSize: "12px" }}>
          <span>1</span>
          <span>•</span>
          <span>2</span>
          <span>•</span>
          <span style={{ opacity: 0.6 }}>3</span>
        </div>
        <button
          className="text-xs px-3 py-2 rounded-full transition-all"
          style={{
            background: "#F3EFE7",
            color: "#8E8E93",
            border: "1px solid #E8E5DF",
          }}
        >
          Save
        </button>
      </div>

      {/* LEFT SIDE - Cassette Player (Desktop: 50%, Mobile: Full width) */}
      <div
        className="w-full lg:w-1/2 flex flex-col items-center justify-center px-4 py-8 lg:py-12 lg:sticky lg:top-0 lg:h-screen"
        style={{ background: "#3A3028" }}
      >
        {/* Desktop Header */}
        <div className="hidden lg:flex w-full max-w-sm items-center justify-between mb-8" style={{ color: "#8E8E93" }}>
          <span style={{ fontFamily: "monospace", fontSize: "11px" }}>90 RPM • POSITION</span>
          <span style={{ fontFamily: "monospace", fontSize: "12px" }}>1:11</span>
        </div>

        {/* Cassette Player Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-full max-w-sm"
          onClick={() => setShowMenu(!showMenu)}
        >
          {/* Cassette Graphic */}
          <div
            className="relative rounded-2xl shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #5A5050 0%, #3A3028 50%, #2A1A1A 100%)",
              aspectRatio: "16/10",
              border: "8px solid #2A1A1A",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            {/* Cassette Label */}
            <div className="absolute inset-8 flex flex-col items-center justify-center rounded-lg" style={{ background: "rgba(245,240,232,0.9)", border: "2px solid #E8E5DF" }}>
              <div className="text-center space-y-1">
                <div style={{ background: "#E84060", color: "white", padding: "2px 8px", borderRadius: "2px", display: "inline-block", fontSize: "10px", fontWeight: "bold" }}>
                  SIDE {activeSide}
                </div>
                <h3 className="text-lg font-bold italic" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#1D1D1F", marginTop: "4px" }}>
                  {tapeTitle || "Untitled Tape"}
                </h3>
                <p className="text-xs" style={{ color: "#8E8E93" }}>
                  FOR {recipientName?.toUpperCase()}
                </p>
                <p className="text-xs" style={{ color: "#A07840", fontStyle: "italic" }}>
                  From {senderName}
                </p>
              </div>

              {/* Reels */}
              <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                <div className="w-12 h-12 rounded-full border-2" style={{ borderColor: "#A07840", background: "rgba(160,120,64,0.1)" }} />
                <div className="w-12 h-12 rounded-full border-2" style={{ borderColor: "#A07840", background: "rgba(160,120,64,0.1)" }} />
              </div>
            </div>

            {/* Flip Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all"
              style={{
                background: "#D4C4A8",
                border: "2px solid #8E8E93",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              }}
            >
              <span style={{ fontSize: "18px" }}>🔄</span>
            </motion.button>
          </div>

          {/* Time Display */}
          <div
            className="absolute bottom-4 left-4 font-bold tracking-widest"
            style={{
              background: "#2A1A1A",
              color: "#D9D7D1",
              padding: "4px 8px",
              borderRadius: "2px",
              fontSize: "12px",
              fontFamily: "monospace",
            }}
          >
            0:12
          </div>
        </motion.div>

        {/* Hover Menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute left-4 top-24 space-y-2 z-20"
            >
              {["Tracks", "Design", "Label", "Message", "Preview"].map((item) => (
                <button
                  key={item}
                  className="block w-full text-left px-4 py-2 rounded-lg transition-all text-sm font-medium"
                  style={{
                    background: "#FBFAF7",
                    color: "#8E8E93",
                    border: "1px solid #E8E5DF",
                  }}
                >
                  {item}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player Controls */}
        <div className="w-full max-w-sm mt-8 space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full h-1.5 rounded-full" style={{ background: "#8E8E93", opacity: 0.3 }}>
              <div className="h-full rounded-full" style={{ width: "25%", background: "#D4882A" }} />
            </div>
            <div className="flex justify-between text-xs" style={{ color: "#A09A8A", fontFamily: "monospace" }}>
              <span>0:12</span>
              <span>{formatDuration(totalDuration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#5A5A5A", color: "#D9D7D1" }}>
              ⏮
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: "#D4882A", color: "#FFFFFF" }}
            >
              {isPlaying ? "⏸" : "▶"}
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#5A5A5A", color: "#D9D7D1" }}>
              ⏭
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#5A5A5A", color: "#D9D7D1" }}>
              🔊
            </motion.button>
          </div>

          {/* Tip */}
          <p className="text-xs text-center" style={{ color: "#8E8E93", fontStyle: "italic" }}>
            💡 Tip: Add notes to each song to make it more personal.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - Track List */}
      <div className="w-full lg:w-1/2 flex flex-col px-4 lg:px-6 py-8 lg:py-12 overflow-y-auto lg:max-h-screen lg:overflow-y-scroll" style={{ scrollBehavior: "smooth" }}>
        {/* Header */}
        <div className="sticky top-0 z-10 -mx-4 lg:mx-0 px-4 lg:px-6 py-4 mb-6" style={{ background: "rgba(251,250,247,0.95)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold" style={{ color: "#1D1D1F" }}>
                SIDE {activeSide}
              </h2>
              <p className="text-sm" style={{ color: "#8E8E93" }}>
                {sideTracks.length} tracks • {formatDuration(totalDuration)}
              </p>
            </div>
            <div className="flex gap-2">
              {["A", "B"].map((side) => (
                <motion.button
                  key={side}
                  onClick={() => setActiveSide(side as "A" | "B")}
                  whileHover={{ scale: 1.05 }}
                  className="px-4 py-2 rounded-lg font-bold text-sm transition-all"
                  style={{
                    background: activeSide === side ? "#1D1D1F" : "#F3EFE7",
                    color: activeSide === side ? "#FBFAF7" : "#8E8E93",
                  }}
                >
                  {side}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Track List */}
        <Reorder.Group
          axis="y"
          values={sideTracks}
          onReorder={(newOrder) => {
            const updated = [...tracks];
            const sideIndex = updated.findIndex((t) => t.side === activeSide);
            if (sideIndex >= 0) {
              const otherSideTracks = updated.filter((t) => t.side !== activeSide);
              setTracks([...otherSideTracks, ...newOrder]);
            }
          }}
          className="space-y-3 flex-1"
        >
          {sideTracks.map((track, idx) => (
            <Reorder.Item key={track.id} value={track} className="list-none">
              <motion.div
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3 rounded-lg border transition-all hover:shadow-md group"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E8E5DF",
                  cursor: "grab",
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Track Number */}
                  <div
                    className="text-xs font-bold w-6 pt-0.5 flex-shrink-0"
                    style={{ color: "#D4882A", fontFamily: "monospace" }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: "#1D1D1F" }}>
                      {track.title}
                    </p>
                    <p className="text-xs truncate" style={{ color: "#8E8E93" }}>
                      {track.artist || "Unknown Artist"}
                    </p>
                    {track.personalNote && (
                      <p className="text-xs mt-1 italic truncate" style={{ color: "#A07840" }}>
                        "{track.personalNote}"
                      </p>
                    )}
                  </div>

                  {/* Duration */}
                  <div className="text-xs font-mono flex-shrink-0" style={{ color: "#8E8E93" }}>
                    {formatDuration(track.duration || 0)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setEditingNoteId(track.id);
                        setNoteText(track.personalNote || "");
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                      style={{
                        background: track.personalNote ? "rgba(160,120,64,0.12)" : "#F3EFE7",
                        color: track.personalNote ? "#A07840" : "#8E8E93",
                      }}
                    >
                      ✎
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteTrack(track.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                      style={{
                        background: "rgba(196,80,58,0.08)",
                        color: "#C4503A",
                      }}
                    >
                      ✕
                    </motion.button>
                  </div>
                </div>

                {/* Note Editor */}
                <AnimatePresence>
                  {editingNoteId === track.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 border-t"
                      style={{ borderColor: "#E8E5DF" }}
                    >
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        maxLength={280}
                        rows={2}
                        placeholder="Why this song?"
                        className="w-full px-2 py-1 text-sm rounded border resize-none"
                        style={{
                          background: "#FFFEF4",
                          border: "1px solid #EDE8D0",
                          color: "#3D2010",
                          fontFamily: "'Playfair Display', Georgia, serif",
                          fontStyle: "italic",
                        }}
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setEditingNoteId(null)} className="text-xs px-3 py-1 rounded transition-all" style={{ color: "#8E8E93" }}>
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveNote(track.id)}
                          className="text-xs px-3 py-1 rounded transition-all font-medium"
                          style={{ background: "#D4882A", color: "#FFFFFF" }}
                        >
                          Save
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {/* Add Track / Publish */}
        <div className="mt-6 space-y-3 pt-6 border-t" style={{ borderColor: "#E8E5DF" }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-lg font-medium transition-all"
            style={{
              background: "rgba(212,136,42,0.08)",
              border: "1.5px dashed #D4882A",
              color: "#D4882A",
            }}
          >
            + Add Song
          </motion.button>

          <motion.button
            onClick={handlePublish}
            disabled={isLoading || tracks.length === 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 px-6 rounded-full font-semibold text-lg transition-all disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #E8901A 0%, #C4503A 100%)",
              color: "#FFFFFF",
              boxShadow: "0 4px 20px rgba(232,144,26,0.3)",
            }}
          >
            {isLoading ? "Publishing…" : "⏺ Rec"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
