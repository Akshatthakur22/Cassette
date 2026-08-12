"use client";
"use client";

import { useState, useTransition, useOptimistic, useCallback, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useRouter } from "next/navigation";
import HeroScene from "@/app/components/HeroScene";
import CassetteObject from "@/app/components/CassetteObject";
import RecordingSequence from "@/app/components/RecordingSequence";
import {
  updateTapeMeta,
  addTrack,
  deleteTrack,
  reorderTracks,
  updateTrackNote,
  publishTape,
  deleteTape,
} from "@/app/actions/tape";
import type { TapeWithTracks, TrackRow, TapeStyle } from "@/app/lib/types";

const STYLES: { value: TapeStyle; label: string; color: string }[] = [
  { value: "classic",   label: "Classic",   color: "#C8A96E" },
  { value: "y2k",       label: "Y2K",       color: "#E040FB" },
  { value: "love",      label: "Love",      color: "#D45A6A" },
  { value: "road_trip", label: "Road Trip", color: "#5B7FA6" },
];

interface Props {
  tape: TapeWithTracks;
}

export default function TapeEditorClient({ tape: initialTape }: Props) {
  const router = useRouter();
  const [tape, setTape] = useState(initialTape);
  const [activeSide, setActiveSide] = useState<"A" | "B">("A");
  const [showMeta, setShowMeta] = useState(false);
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [newTrack, setNewTrack] = useState({ title: "", artist: "", providerTrackId: "", durationSec: "" });
  const [metaError, setMetaError] = useState<string | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Live label preview — typed values
  const [liveTitle, setLiveTitle] = useState(initialTape.title ?? "");
  const [liveRecipient, setLiveRecipient] = useState(initialTape.recipientName ?? "");
  const [labelTyping, setLabelTyping] = useState(false);
  const labelTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sideTracks = tape.tracks
    .filter(t => t.side === activeSide)
    .sort((a, b) => a.position - b.position);

  // ── Save meta ──
  function handleSaveMeta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMetaError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateTapeMeta(tape.id, fd);
      if (res?.error) { setMetaError(res.error); return; }
      const newTitle = fd.get("title") as string || tape.title;
      const newRecipient = fd.get("recipientName") as string || tape.recipientName;
      setTape(prev => ({
        ...prev,
        title:         newTitle,
        recipientName: newRecipient,
        dedication:    fd.get("dedication") as string || prev.dedication,
        style:         fd.get("style") as TapeStyle || prev.style,
      }));
      setLiveTitle(newTitle ?? "");
      setLiveRecipient(newRecipient ?? "");
      setShowMeta(false);
    });
  }

  function handleLabelInput(field: "title" | "recipient", value: string) {
    if (field === "title") setLiveTitle(value);
    if (field === "recipient") setLiveRecipient(value);
    setLabelTyping(true);
    if (labelTypingTimer.current) clearTimeout(labelTypingTimer.current);
    labelTypingTimer.current = setTimeout(() => setLabelTyping(false), 1200);
  }

  // ── Add track (manual entry — YouTube search comes in Phase 2) ──
  function handleAddTrack(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTrackError(null);
    if (!newTrack.title.trim()) { setTrackError("Title is required."); return; }
    if (!newTrack.providerTrackId.trim()) { setTrackError("YouTube video ID is required."); return; }

    const position = sideTracks.length;
    startTransition(async () => {
      const res = await addTrack(tape.id, {
        side: activeSide,
        position,
        title: newTrack.title.trim(),
        artist: newTrack.artist.trim() || undefined,
        providerTrackId: newTrack.providerTrackId.trim(),
        durationSec: newTrack.durationSec ? parseInt(newTrack.durationSec) : undefined,
      });
      if (res?.error) { setTrackError(res.error); return; }
      if (res?.track) {
        setTape(prev => ({
          ...prev,
          tracks: [...prev.tracks, res.track as TrackRow],
        }));
      }
      setNewTrack({ title: "", artist: "", providerTrackId: "", durationSec: "" });
      setShowAddTrack(false);
    });
  }

  // ── Delete track ──
  function handleDeleteTrack(trackId: string) {
    startTransition(async () => {
      await deleteTrack(tape.id, trackId);
      setTape(prev => ({
        ...prev,
        tracks: prev.tracks.filter(t => t.id !== trackId),
      }));
    });
  }

  // ── Save note ──
  function handleSaveNote(trackId: string) {
    startTransition(async () => {
      await updateTrackNote(tape.id, trackId, noteText);
      setTape(prev => ({
        ...prev,
        tracks: prev.tracks.map(t => t.id === trackId ? { ...t, personalNote: noteText } : t),
      }));
      setEditingNoteId(null);
    });
  }

  // ── Reorder (drag) ──
  function handleReorder(newOrder: TrackRow[]) {
    setTape(prev => ({
      ...prev,
      tracks: [
        ...prev.tracks.filter(t => t.side !== activeSide),
        ...newOrder.map((t, i) => ({ ...t, position: i })),
      ],
    }));
    startTransition(async () => {
      await reorderTracks(tape.id, activeSide, newOrder.map(t => t.id));
    });
  }

  // ── Publish ──
  function handlePublish() {
    setPublishError(null);
    startTransition(async () => {
      const res = await publishTape(tape.id);
      if (res?.error) { setPublishError(res.error); return; }
      if (res?.publicId) {
        setPublishedId(res.publicId);
        setIsRecording(true); // triggers RecordingSequence overlay
      }
    });
  }

  // ── Delete tape ──
  function handleDelete() {
    if (!confirm("Delete this tape permanently? This cannot be undone.")) return;
    startTransition(async () => { await deleteTape(tape.id); });
  }

  const totalTracks = tape.tracks.length;
  const sideATracks = tape.tracks.filter(t => t.side === "A").length;
  const sideBTracks = tape.tracks.filter(t => t.side === "B").length;

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#060408" }}>
      <HeroScene />

      {/* Recording sequence overlay */}
      <AnimatePresence>
        {isRecording && publishedId && (
          <RecordingSequence
            tracks={tape.tracks}
            tapeTitle={tape.title ?? "Untitled"}
            onComplete={() => {
              setIsRecording(false);
              router.push(`/record/${publishedId}`);
            }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-2">
          <a href="/" className="text-xs font-mono tracking-widest" style={{ color: "#6B5E4E" }}>← CASSETTE</a>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-70"
              style={{ color: "#6B5E4E", fontFamily: "monospace" }}
            >
              Delete
            </button>
            <a
              href={`/create/${tape.id}/preview`}
              className="text-xs px-4 py-1.5 rounded-full transition-all hover:opacity-80"
              style={{
                background: "rgba(245,240,232,0.07)",
                border: "1px solid rgba(245,240,232,0.10)",
                color: "#C4B8A8",
                fontFamily: "monospace",
              }}
            >
              Preview
            </a>
            <motion.button
              onClick={handlePublish}
              disabled={isPending}
              whileTap={{ scale: 0.88 }}
              transition={{ type: "spring", stiffness: 600, damping: 18 }}
              className="text-xs px-4 py-1.5 rounded-full font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #D4882A, #C4503A)",
                color: "#F5F0E8",
                fontFamily: "monospace",
                boxShadow: isPending ? "none" : "0 0 16px rgba(212,136,42,0.35)",
              }}
            >
              {isPending ? "…" : "⏺ Record Tape"}
            </motion.button>
          </div>
        </div>
        {publishError && (
          <p className="text-center text-xs pb-2" style={{ color: "#C4503A" }}>{publishError}</p>
        )}

        <div className="flex flex-col items-center px-4 pb-24 gap-5 flex-1">

          {/* Cassette preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md mt-2"
          >
            <CassetteObject
              side={activeSide}
              isPlaying={false}
              title={liveTitle || tape.title || "Untitled Tape"}
              recipientName={liveRecipient || tape.recipientName || "Someone"}
              senderName={tape.senderName}
              style={tape.style as TapeStyle}
              onFlipSide={() => setActiveSide(s => s === "A" ? "B" : "A")}
              isTyping={labelTyping}
            />
          </motion.div>

          {/* Tape meta summary + edit */}
          <div className="w-full max-w-md">
            <button
              onClick={() => setShowMeta(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all"
              style={{
                background: "rgba(28,24,20,0.6)",
                border: "1px solid rgba(245,240,232,0.07)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div className="text-left">
                <p className="text-sm font-medium" style={{ color: "#F5F0E8", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
                  {tape.title || "Untitled Tape"}
                </p>
                <p className="text-xs" style={{ color: "#6B5E4E" }}>
                  {tape.recipientName ? `For ${tape.recipientName}` : "No recipient yet"} · {totalTracks} track{totalTracks !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="text-xs" style={{ color: "#6B5E4E" }}>{showMeta ? "▲" : "✎"}</span>
            </button>

            <AnimatePresence>
              {showMeta && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <form
                    onSubmit={handleSaveMeta}
                    className="px-4 py-4 rounded-b-xl flex flex-col gap-3"
                    style={{ background: "rgba(20,16,12,0.8)", border: "1px solid rgba(245,240,232,0.07)", borderTop: "none" }}
                  >
                    <MetaField label="Tape title" name="title" defaultValue={tape.title ?? ""} placeholder="Late Night Drive Vol. 1" onChange={v => handleLabelInput("title", v)} />
                    <MetaField label="Recipient name" name="recipientName" defaultValue={tape.recipientName ?? ""} placeholder="Riya" onChange={v => handleLabelInput("recipient", v)} />
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-mono tracking-widest uppercase" style={{ color: "#6B5E4E" }}>Style</label>
                      <div className="grid grid-cols-4 gap-2">
                        {STYLES.map(s => (
                          <label key={s.value} className="flex flex-col items-center gap-1 cursor-pointer">
                            <input type="radio" name="style" value={s.value} defaultChecked={tape.style === s.value} className="sr-only" />
                            <span
                              className="w-6 h-6 rounded-full border-2 transition-all"
                              style={{
                                background: s.color,
                                borderColor: tape.style === s.value ? "#F5F0E8" : "transparent",
                              }}
                            />
                            <span className="text-[10px]" style={{ color: "#6B5E4E" }}>{s.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-mono tracking-widest uppercase" style={{ color: "#6B5E4E" }}>Dedication</label>
                      <textarea
                        name="dedication"
                        defaultValue={tape.dedication ?? ""}
                        placeholder="Every song on here has a story…"
                        maxLength={500}
                        rows={2}
                        className="cassette-input resize-none"
                      />
                    </div>
                    {metaError && <p className="text-xs" style={{ color: "#C4503A" }}>{metaError}</p>}
                    <button
                      type="submit"
                      disabled={isPending}
                      className="self-end text-xs px-4 py-2 rounded-full transition-all hover:opacity-80 disabled:opacity-50"
                      style={{ background: "rgba(212,136,42,0.2)", color: "#D4882A", fontFamily: "monospace", border: "1px solid rgba(212,136,42,0.3)" }}
                    >
                      {isPending ? "Saving…" : "Save"}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Side A / B toggle */}
          <div
            className="flex rounded-full p-1 gap-1"
            style={{ background: "rgba(28,24,20,0.7)", border: "1px solid rgba(245,240,232,0.08)", backdropFilter: "blur(10px)" }}
          >
            {(["A", "B"] as const).map(s => (
              <button
                key={s}
                onClick={() => setActiveSide(s)}
                className="px-5 py-1.5 rounded-full text-xs font-mono tracking-widest transition-all duration-200"
                style={{
                  background: activeSide === s ? "#D4882A" : "transparent",
                  color: activeSide === s ? "#1C1814" : "#A89880",
                  fontWeight: activeSide === s ? "600" : "400",
                }}
              >
                SIDE {s} ({s === "A" ? sideATracks : sideBTracks})
              </button>
            ))}
          </div>

          {/* Track list */}
          <div className="w-full max-w-md">
            <Reorder.Group
              axis="y"
              values={sideTracks}
              onReorder={handleReorder}
              className="flex flex-col gap-2"
            >
              <AnimatePresence>
                {sideTracks.map(track => (
                  <Reorder.Item key={track.id} value={track} className="list-none">
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="rounded-xl overflow-hidden"
                      style={{
                        background: "rgba(28,24,20,0.6)",
                        border: "1px solid rgba(245,240,232,0.07)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <div className="flex items-center gap-3 px-3 py-3">
                        {/* Drag handle */}
                        <span className="cursor-grab active:cursor-grabbing text-base select-none" style={{ color: "#3D2B1F" }}>⠿</span>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "#F5F0E8" }}>{track.title}</p>
                          <p className="text-xs truncate" style={{ color: "#6B5E4E" }}>{track.artist ?? "Unknown artist"}</p>
                          {track.personalNote && (
                            <p className="text-xs mt-0.5 truncate italic" style={{ color: "#A89880" }}>"{track.personalNote}"</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => {
                              if (editingNoteId === track.id) {
                                setEditingNoteId(null);
                              } else {
                                setEditingNoteId(track.id);
                                setNoteText(track.personalNote ?? "");
                              }
                            }}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:opacity-70"
                            style={{
                              background: track.personalNote ? "rgba(212,136,42,0.15)" : "rgba(245,240,232,0.05)",
                              color: track.personalNote ? "#D4882A" : "#6B5E4E",
                              fontSize: "12px",
                            }}
                            aria-label="Edit personal note"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleDeleteTrack(track.id)}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:opacity-70"
                            style={{ background: "rgba(196,80,58,0.10)", color: "#C4503A", fontSize: "12px" }}
                            aria-label="Delete track"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Note editor */}
                      <AnimatePresence>
                        {editingNoteId === track.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 flex gap-2">
                              <textarea
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                maxLength={280}
                                rows={2}
                                placeholder="Why does this song matter?"
                                className="cassette-input resize-none flex-1 text-xs"
                                style={{ fontSize: "13px" }}
                              />
                              <button
                                onClick={() => handleSaveNote(track.id)}
                                disabled={isPending}
                                className="text-xs px-3 rounded-lg self-end pb-2 transition-all hover:opacity-80 disabled:opacity-50"
                                style={{ background: "rgba(212,136,42,0.2)", color: "#D4882A", fontFamily: "monospace", border: "1px solid rgba(212,136,42,0.3)" }}
                              >
                                {isPending ? "…" : "Save"}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>

            {/* Add track button / form */}
            {sideTracks.length < 12 && (
              <div className="mt-3">
                {!showAddTrack ? (
                  <button
                    onClick={() => setShowAddTrack(true)}
                    className="w-full py-3 rounded-xl text-sm transition-all hover:opacity-80 active:scale-[0.98]"
                    style={{
                      background: "rgba(28,24,20,0.4)",
                      border: "1px dashed rgba(245,240,232,0.12)",
                      color: "#6B5E4E",
                      fontFamily: "monospace",
                      letterSpacing: "0.1em",
                    }}
                  >
                    + ADD TRACK
                  </button>
                ) : (
                  <AddTrackForm
                    onSubmit={handleAddTrack}
                    newTrack={newTrack}
                    setNewTrack={setNewTrack}
                    trackError={trackError}
                    setTrackError={setTrackError}
                    isPending={isPending}
                    activeSide={activeSide}
                    onCancel={() => { setShowAddTrack(false); setTrackError(null); }}
                  />
                )}
              </div>
            )}

            {sideTracks.length >= 12 && (
              <p className="text-center text-xs mt-3" style={{ color: "#6B5E4E" }}>Side {activeSide} is full (12/12)</p>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .cassette-input {
          width: 100%;
          background: rgba(28,24,20,0.6);
          border: 1px solid rgba(245,240,232,0.10);
          border-radius: 10px;
          padding: 12px 14px;
          color: #F5F0E8;
          font-size: 14px;
          font-family: var(--font-inter, Inter, sans-serif);
          outline: none;
          transition: border-color 0.15s;
          backdrop-filter: blur(8px);
        }
        .cassette-input::placeholder { color: #6B5E4E; }
        .cassette-input:focus { border-color: rgba(212,136,42,0.45); }
      `}</style>
    </div>
  );
}

interface SearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationSec?: number;
}

function AddTrackForm({
  onSubmit,
  newTrack,
  setNewTrack,
  trackError,
  setTrackError,
  isPending,
  activeSide,
  onCancel,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  newTrack: { title: string; artist: string; providerTrackId: string; durationSec: string };
  setNewTrack: (track: any) => void;
  trackError: string | null;
  setTrackError: (error: string | null) => void;
  isPending: boolean;
  activeSide: "A" | "B";
  onCancel: () => void;
}) {
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  async function handleSearch(query: string) {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const params = new URLSearchParams();
      params.set("title", query.split(" - ")[0]?.trim() || query);
      if (query.includes(" - ")) {
        params.set("artist", query.split(" - ")[1]?.trim() || "");
      }
      const res = await fetch(`/api/search?${params}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults((data.results ?? []).slice(0, 5));
    } catch (e) {
      console.error("Search error:", e);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function selectResult(result: SearchResult) {
    setNewTrack((p: any) => ({
      title: result.title,
      artist: result.channelTitle,
      providerTrackId: result.videoId,
      durationSec: result.durationSec?.toString() ?? "",
    }));
    setSearchResults([]);
    setSearchQuery("");
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={onSubmit}
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: "rgba(20,16,12,0.8)", border: "1px solid rgba(245,240,232,0.08)" }}
    >
      <p className="text-xs font-mono tracking-widest uppercase" style={{ color: "#6B5E4E" }}>
        Add to Side {activeSide}
      </p>

      {/* Search input (live) */}
      <div className="relative">
        <input
          className="cassette-input"
          placeholder="Search YouTube (e.g. 'Tum Se Hi - Mohit Chauhan')"
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            handleSearch(e.target.value);
          }}
        />
        {searching && (
          <span className="absolute right-3 top-3.5 text-xs" style={{ color: "#D4882A" }}>
            …
          </span>
        )}

        {/* Search results dropdown */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-10"
              style={{
                background: "rgba(20,16,12,0.95)",
                border: "1px solid rgba(245,240,232,0.12)",
                backdropFilter: "blur(12px)",
              }}
            >
              {searchResults.map(result => (
                <button
                  key={result.videoId}
                  type="button"
                  onClick={() => selectResult(result)}
                  className="w-full flex gap-2 p-2 text-left transition-all hover:bg-opacity-70"
                  style={{ background: "rgba(245,240,232,0.04)" }}
                >
                  <img
                    src={result.thumbnailUrl}
                    alt={result.title}
                    className="w-12 h-9 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: "#F5F0E8" }}>
                      {result.title}
                    </p>
                    <p className="text-[10px] truncate" style={{ color: "#6B5E4E" }}>
                      {result.channelTitle}
                    </p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Manual entry fields (show if not using search) */}
      {!searchQuery && (
        <>
          <input
            className="cassette-input"
            placeholder="Song title *"
            value={newTrack.title}
            onChange={e => setNewTrack((p: any) => ({ ...p, title: e.target.value }))}
          />
          <input
            className="cassette-input"
            placeholder="Artist"
            value={newTrack.artist}
            onChange={e => setNewTrack((p: any) => ({ ...p, artist: e.target.value }))}
          />
          <input
            className="cassette-input"
            placeholder="YouTube video ID (e.g. dQw4w9WgXcQ) *"
            value={newTrack.providerTrackId}
            onChange={e => setNewTrack((p: any) => ({ ...p, providerTrackId: e.target.value }))}
          />
        </>
      )}

      {trackError && <p className="text-xs" style={{ color: "#C4503A" }}>{trackError}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-full text-xs transition-all hover:opacity-70"
          style={{ color: "#6B5E4E", fontFamily: "monospace", border: "1px solid rgba(245,240,232,0.08)" }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-2.5 rounded-full text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #D4882A, #C4503A)", color: "#F5F0E8", fontFamily: "monospace" }}
        >
          {isPending ? "Adding…" : "Add"}
        </button>
      </div>
    </motion.form>
  );
}

function MetaField({ label, name, defaultValue, placeholder, onChange }: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-mono tracking-widest uppercase" style={{ color: "#6B5E4E" }}>{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="cassette-input"
        onChange={e => onChange?.(e.target.value)}
      />
    </div>
  );
}
