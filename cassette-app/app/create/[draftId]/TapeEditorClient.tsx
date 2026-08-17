"use client";

import { useState, useTransition, useCallback, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useRouter } from "next/navigation";
import CassetteObject from "@/app/components/CassetteObject";
import RecordingSequence from "@/app/components/RecordingSequence";
import { PosterImage } from "@/app/components/PosterImage";
import { BackgroundImage } from "@/app/components/BackgroundImage";
import { PlaylistSearchModal } from "@/app/components/PlaylistSearchModal";
import { PlaylistItemSelector } from "@/app/components/PlaylistItemSelector";
import { YoutubeSearchBar } from "@/app/components/YoutubeSearchBar";
import { VoiceRecorder } from "@/app/components/VoiceRecorder";
import YoutubeUrlValidator from "@/app/components/YoutubeUrlValidator";
import YoutubeSearchAdvanced from "@/app/components/YoutubeSearchAdvanced";
import TrackDurationValidator from "@/app/components/TrackDurationValidator";
import { RECORDING_MODES, RecordingMode } from "@/app/lib/recording-types";
import { detectDuplicate, getDuplicateWarningMessage, type TrackFingerprint } from "@/app/lib/remix-detection";
import { getStableImageNumber } from "@/app/lib/accessibility";
import {
  updateTapeMeta,
  addTrack,
  deleteTrack,
  reorderTracks,
  updateTrackNote,
  publishTape,
  deleteTape,
  addTracksFromPlaylist,
} from "@/app/actions/tape";
import type { TapeWithTracks, TrackRow } from "@/app/lib/types";
import type { YoutubePlaylist, YoutubePlaylistItem } from "@/app/lib/youtube";

// ─── 10-color tape picker ────────────────────────────────────────────────────
const TAPE_STYLES = [
  { value: "cream",       label: "Cream",       color: "#D4C4A8" },
  { value: "cherry",      label: "Cherry",      color: "#E84060" },
  { value: "peach",       label: "Peach",       color: "#E8703A" },
  { value: "butter",      label: "Butter",      color: "#F5D840" },
  { value: "sky",         label: "Sky",         color: "#5AC8FA" },
  { value: "pool",        label: "Pool",        color: "#1A9898" },
  { value: "lavender",    label: "Lavender",    color: "#B080E0" },
  { value: "mint",        label: "Mint",        color: "#34C759" },
  { value: "transparent", label: "Clear",       color: "rgba(200,220,240,0.7)" },
  { value: "smoky",       label: "Smoky",       color: "#2E2A30" },
  // Design styles
  { value: "classic",     label: "Classic",     color: "#C8A96E" },
  { value: "y2k",         label: "Y2K",         color: "#E040FB" },
  { value: "love",        label: "Love",        color: "#D45A6A" },
  { value: "road_trip",   label: "Road Trip",   color: "#5B7FA6" },
  { value: "school",      label: "School",      color: "#4A5F8F" },
  { value: "summer",      label: "Summer",      color: "#F5A623" },
] as const;

interface Props { tape: TapeWithTracks; }

export default function TapeEditorClient({ tape: initialTape }: Props) {
  const router = useRouter();
  const [tape, setTape] = useState(initialTape);
  const [activeSide, setActiveSide] = useState<"A" | "B">("A");
  const [recordingMode, setRecordingMode] = useState<RecordingMode>(RecordingMode.STANDARD);
  const [showMeta, setShowMeta] = useState(false);
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [metaError, setMetaError] = useState<string | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [liveTitle, setLiveTitle] = useState(initialTape.title ?? "");
  const [liveRecipient, setLiveRecipient] = useState(initialTape.recipientName ?? "");
  const [labelTyping, setLabelTyping] = useState(false);
  const labelTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [newTrack, setNewTrack] = useState({ title: "", artist: "", providerTrackId: "", durationSec: "" });
  const [visibility, setVisibility] = useState<"unlisted" | "public">(
    (initialTape.visibility as "unlisted" | "public") || "unlisted"
  );
  const [showPlaylistSearch, setShowPlaylistSearch] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<YoutubePlaylist | null>(null);

  const sideTracks = tape.tracks
    .filter(t => t.side === activeSide)
    .sort((a, b) => a.position - b.position);

  const sideATracks = tape.tracks.filter(t => t.side === "A").length;
  const sideBTracks = tape.tracks.filter(t => t.side === "B").length;

  function handleLabelInput(field: "title" | "recipient", value: string) {
    if (field === "title") setLiveTitle(value);
    if (field === "recipient") setLiveRecipient(value);
    setLabelTyping(true);
    if (labelTypingTimer.current) clearTimeout(labelTypingTimer.current);
    labelTypingTimer.current = setTimeout(() => setLabelTyping(false), 1200);
  }

  function handleSaveMeta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMetaError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("visibility", visibility);
    startTransition(async () => {
      const res = await updateTapeMeta(tape.id, fd);
      if (res?.error) { setMetaError(res.error); return; }
      const newTitle = fd.get("title") as string || tape.title;
      const newRecipient = fd.get("recipientName") as string || tape.recipientName;
      const newStyle = fd.get("style") as string || tape.style;
      setTape(prev => ({ ...prev, title: newTitle, recipientName: newRecipient,
        dedication: fd.get("dedication") as string || prev.dedication,
        style: newStyle as any, visibility }));
      setLiveTitle(newTitle ?? "");
      setLiveRecipient(newRecipient ?? "");
      setShowMeta(false);
    });
  }

  function handleAddTrackSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTrackError(null);
    if (!newTrack.title.trim()) { setTrackError("Title is required."); return; }
    if (!newTrack.providerTrackId.trim()) { setTrackError("YouTube video ID is required."); return; }
    const position = sideTracks.length;
    startTransition(async () => {
      const res = await addTrack(tape.id, {
        side: activeSide, position,
        title: newTrack.title.trim(),
        artist: newTrack.artist.trim() || undefined,
        providerTrackId: newTrack.providerTrackId.trim(),
        durationSec: newTrack.durationSec ? parseInt(newTrack.durationSec) : undefined,
      });
      if (res?.error) { setTrackError(res.error); return; }
      if (res?.track) setTape(prev => ({ ...prev, tracks: [...prev.tracks, res.track as TrackRow] }));
      setNewTrack({ title: "", artist: "", providerTrackId: "", durationSec: "" });
      setShowAddTrack(false);
    });
  }

  function handleDeleteTrack(trackId: string) {
    startTransition(async () => {
      await deleteTrack(tape.id, trackId);
      setTape(prev => ({ ...prev, tracks: prev.tracks.filter(t => t.id !== trackId) }));
    });
  }

  function handleSaveNote(trackId: string) {
    startTransition(async () => {
      await updateTrackNote(tape.id, trackId, noteText);
      setTape(prev => ({ ...prev,
        tracks: prev.tracks.map(t => t.id === trackId ? { ...t, personalNote: noteText } : t) }));
      setEditingNoteId(null);
    });
  }

  function handleReorder(newOrder: TrackRow[]) {
    setTape(prev => ({ ...prev,
      tracks: [...prev.tracks.filter(t => t.side !== activeSide),
               ...newOrder.map((t, i) => ({ ...t, position: i }))] }));
    startTransition(async () => {
      await reorderTracks(tape.id, activeSide, newOrder.map(t => t.id));
    });
  }

  function handlePlaylistSelect(playlist: YoutubePlaylist) {
    setSelectedPlaylist(playlist);
  }

  function handlePlaylistItemsConfirm(items: YoutubePlaylistItem[]) {
    return new Promise<void>((resolve) => {
      if (!selectedPlaylist) return;
      startTransition(async () => {
        const res = await addTracksFromPlaylist(
          tape.id,
          selectedPlaylist.id,
          selectedPlaylist.title,
          `https://www.youtube.com/playlist?list=${selectedPlaylist.id}`,
          items.map(item => ({
            videoId: item.videoId,
            title: item.title,
            channelTitle: item.channelTitle,
            thumbnail: item.thumbnail,
          }))
        );
        if (res?.ok && res?.tracks) {
          setTape(prev => ({
            ...prev,
            tracks: [...prev.tracks, ...res.tracks],
            playlistSourceId: selectedPlaylist.id,
            playlistName: selectedPlaylist.title,
          } as any));
        }
        setSelectedPlaylist(null);
        resolve();
      });
    });
  }

  function handlePublish() {
    setPublishError(null);
    startTransition(async () => {
      const res = await publishTape(tape.id);
      if (res?.error) { setPublishError(res.error); return; }
      if (res?.publicId) { setPublishedId(res.publicId); setIsRecording(true); }
    });
  }

  function handleDelete() {
    if (!confirm("Delete this tape? This cannot be undone.")) return;
    startTransition(async () => { await deleteTape(tape.id); });
  }

  return (
    <div className="relative min-h-screen overflow-y-auto overflow-x-hidden" style={{ background: "#FBFAF7" }}>
      {/* Background decorative image */}
      <BackgroundImage
        imageNumber={getStableImageNumber(tape.id, 13)}
        opacity={0.25}
        position="bottom-left"
      />

      {/* Semi-transparent overlay for text readability */}
      <div
        className="absolute inset-0 z-5 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(251,250,247,0.85) 0%, rgba(251,250,247,0.7) 50%, rgba(251,250,247,0.85) 100%)",
        }}
      />

      {/* Content wrapper */}
      <div className="relative z-10">
      
      {/* Scattered poster decoration */}
      <div className="absolute top-32 right-6 z-0 opacity-45 hidden lg:block">
        <PosterImage imageNumber={16} width={75} height={105} rotation={8} />
      </div>

      {/* Recording sequence overlay */}
      <AnimatePresence>
        {isRecording && publishedId && (
          <RecordingSequence
            tracks={tape.tracks}
            tapeTitle={tape.title ?? "Untitled"}
            onComplete={() => { setIsRecording(false); router.push(`/record/${publishedId}`); }}
          />
        )}
      </AnimatePresence>

      {/* ── Sticky header — responsive ──────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-30 flex flex-col sm:flex-row items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 gap-1.5 sm:gap-0"
        style={{
          background: "rgba(251,250,247,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid #E8E5DF",
        }}
      >
        <a href="/" className="text-[9px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase transition-opacity hover:opacity-60 sm:order-1"
          style={{ color: "#8E8E93", fontFamily: "monospace" }}>
          ← CASSETTE
        </a>

        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center sm:justify-end w-full sm:w-auto">
          <button onClick={handleDelete} className="text-[8px] sm:text-xs px-2 sm:px-3 py-2 rounded-full transition-all hover:opacity-60"
            style={{ color: "#8E8E93", fontFamily: "monospace", minHeight: "44px", display: "flex", alignItems: "center", touchAction: "manipulation" }}>
            Delete
          </button>
          <a href={`/create/${tape.id}/preview`}
            className="text-[8px] sm:text-xs px-2.5 sm:px-3 py-2 rounded-full transition-all hover:opacity-80 whitespace-nowrap"
            style={{ background: "#F3EFE7", border: "1px solid #E8E5DF", color: "#5F6065", fontFamily: "monospace", minHeight: "44px", display: "flex", alignItems: "center", touchAction: "manipulation" }}>
            Preview
          </a>
          <motion.button
            onClick={handlePublish}
            disabled={isPending}
            whileTap={{ scale: 0.92 }}
            className="text-[8px] sm:text-xs px-2.5 sm:px-3 py-2 rounded-full font-semibold transition-all disabled:opacity-50 whitespace-nowrap"
            style={{
              background: "linear-gradient(135deg, #D4882A, #C4503A)",
              color: "#FFFFFF",
              fontFamily: "monospace",
              boxShadow: isPending ? "none" : "0 2px 12px rgba(212,136,42,0.3)",
              minHeight: "44px",
              display: "flex",
              alignItems: "center",
              touchAction: "manipulation",
            }}
          >
            {isPending ? "…" : "⏺ Rec"}
          </motion.button>
        </div>
      </div>

      {publishError && (
        <p className="text-center text-xs py-2 px-4" style={{ color: "#C4503A", background: "rgba(196,80,58,0.06)" }}>
          {publishError}
        </p>
      )}

      {/* ── Main layout — responsive ─────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center px-3 sm:px-4 pb-16 sm:pb-20 gap-3 sm:gap-4 w-full max-w-lg mx-auto">

        {/* Live cassette preview — responsive */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full mt-2 sm:mt-3"
        >
          <CassetteObject
            side={activeSide}
            isPlaying={false}
            title={liveTitle || tape.title || "Untitled Tape"}
            recipientName={liveRecipient || tape.recipientName || "Someone"}
            senderName={tape.senderName}
            style={tape.style as any}
            onFlipSide={() => setActiveSide(s => s === "A" ? "B" : "A")}
            isTyping={labelTyping}
            showFlipButton
          />
        </motion.div>

        {/* Tape meta card — responsive */}
        <div className="w-full">
          <button
            onClick={() => setShowMeta(v => !v)}
            className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-2xl transition-all hover:opacity-90"
            style={{ background: "#FFFFFF", border: "1px solid #E8E5DF", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
            aria-expanded={showMeta}
          >
            <div className="text-left min-w-0">
              <p className="text-sm sm:text-base font-semibold truncate" style={{ fontFamily: "'Playfair Display', serif",
                fontStyle: "italic", color: "#1D1D1F" }}>
                {tape.title || "Untitled Tape"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#8E8E93" }}>
                {tape.recipientName ? `for ${tape.recipientName}` : "No recipient yet"}
                {" · "}{tape.tracks.length} track{tape.tracks.length !== 1 ? "s" : ""}
              </p>
            </div>
            <span className="text-base flex-shrink-0 ml-2" style={{ color: "#8E8E93" }}>{showMeta ? "↑" : "✎"}</span>
          </button>

          <AnimatePresence>
            {showMeta && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28 }}
                className="overflow-hidden"
              >
                <form
                  onSubmit={handleSaveMeta}
                  className="px-3 sm:px-4 py-3 sm:py-4 flex flex-col gap-3 sm:gap-4 rounded-b-lg sm:rounded-b-2xl"
                  style={{ background: "#FFFFFF", border: "1px solid #E8E5DF", borderTop: "none" }}
                >
                  <EditorField label="Tape title" name="title"
                    defaultValue={tape.title ?? ""} placeholder="Late Night Drive Vol. 1"
                    onChange={v => handleLabelInput("title", v)} />

                  <EditorField label="For" name="recipientName"
                    defaultValue={tape.recipientName ?? ""} placeholder="Riya"
                    onChange={v => handleLabelInput("recipient", v)} />

                  {/* 10-color tape picker */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs tracking-widest uppercase"
                      style={{ color: "#8E8E93", fontFamily: "monospace" }}>
                      Tape Colour
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {TAPE_STYLES.map(s => (
                        <label key={s.value}
                          className="flex flex-col items-center gap-1 cursor-pointer group">
                          <input type="radio" name="style" value={s.value}
                            defaultChecked={tape.style === s.value} className="sr-only" />
                          <span
                            className="w-9 h-9 rounded-full border-2 transition-all"
                            style={{
                              background: s.color,
                              borderColor: tape.style === s.value ? "#1D1D1F" : "rgba(0,0,0,0.08)",
                              boxShadow: tape.style === s.value ? `0 0 0 2px white, 0 0 0 3.5px ${s.color}` : "none",
                              transform: tape.style === s.value ? "scale(1.12)" : "scale(1)",
                              minHeight: "44px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          />
                          <span className="text-[9px] leading-none"
                            style={{ color: "#8E8E93", fontFamily: "monospace" }}>
                            {s.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Dedication */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs tracking-widest uppercase"
                      style={{ color: "#8E8E93", fontFamily: "monospace" }}>
                      Liner notes (dedication)
                    </label>
                    <textarea
                      name="dedication"
                      defaultValue={tape.dedication ?? ""}
                      placeholder="Every song on here has a story…"
                      maxLength={500}
                      rows={2}
                      className="cassette-input resize-none text-sm"
                    />
                  </div>

                  {/* Visibility Toggle */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs tracking-widest uppercase"
                      style={{ color: "#8E8E93", fontFamily: "monospace" }}>
                      Share with
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setVisibility("unlisted")}
                        className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: visibility === "unlisted" ? "#1D1D1F" : "#F3EFE7",
                          color: visibility === "unlisted" ? "#FBFAF7" : "#8E8E93",
                          border: `1px solid ${visibility === "unlisted" ? "#1D1D1F" : "#E8E5DF"}`,
                        }}
                      >
                        Only via link
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisibility("public")}
                        className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: visibility === "public" ? "#D4882A" : "#F3EFE7",
                          color: visibility === "public" ? "#FBFAF7" : "#8E8E93",
                          border: `1px solid ${visibility === "public" ? "#D4882A" : "#E8E5DF"}`,
                        }}
                      >
                        🌍 Public shelf
                      </button>
                    </div>
                    <p className="text-xs"
                      style={{ color: "#8E8E93", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
                      {visibility === "public"
                        ? "This tape will appear on the discovery shelf for everyone to find and enjoy."
                        : "Only people with the link can find this tape."}
                    </p>
                  </div>

                  {metaError && <p className="text-xs" style={{ color: "#C4503A" }}>{metaError}</p>}

                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowMeta(false)}
                      className="flex-1 py-2 rounded-full text-xs transition-all hover:opacity-70 btn-ghost">
                      Cancel
                    </button>
                    <button type="submit" disabled={isPending}
                      className="flex-1 py-2 rounded-full text-xs font-semibold btn-primary disabled:opacity-50">
                      {isPending ? "Saving…" : "Save"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Side A / B tabs */}
        <div
          className="flex rounded-full p-1 gap-1"
          style={{ background: "#F3EFE7", border: "1px solid #E8E5DF" }}
          role="tablist"
        >
          {(["A", "B"] as const).map(s => (
            <button key={s} onClick={() => setActiveSide(s)}
              role="tab" aria-selected={activeSide === s}
              className="flex-1 px-5 py-2.5 rounded-full text-xs font-mono tracking-widest transition-all duration-200"
              style={{
                background: activeSide === s ? "#1D1D1F" : "transparent",
                color: activeSide === s ? "#FBFAF7" : "#8E8E93",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
              SIDE {s} ({s === "A" ? sideATracks : sideBTracks})
            </button>
          ))}
        </div>

        {/* Recording Mode Selector */}
        <div className="w-full">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#8E8E93", fontFamily: "monospace" }}>
            Recording Mode
          </p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(RECORDING_MODES).map(([mode, config]) => (
              <button
                key={mode}
                onClick={() => setRecordingMode(mode as RecordingMode)}
                className="flex-1 min-w-fit px-4 py-2.5 rounded-lg text-xs font-medium transition-all text-center whitespace-nowrap"
                style={{
                  background: recordingMode === mode 
                    ? "linear-gradient(135deg, #D4882A, #C4503A)"
                    : "#F3EFE7",
                  color: recordingMode === mode ? "#FFFFFF" : "#5F6065",
                  border: recordingMode === mode ? "1px solid #C4503A" : "1px solid #E8E5DF",
                  fontWeight: recordingMode === mode ? 600 : 500,
                  minHeight: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: recordingMode === mode ? "0 2px 8px rgba(212,136,42,0.25)" : "none",
                }}
                title={config.description}
              >
                {config.label}
              </button>
            ))}
          </div>
          {RECORDING_MODES[recordingMode] && (
            <p className="text-xs mt-2" style={{ 
              color: "#8E8E93",
              fontStyle: "italic",
              fontFamily: "monospace",
            }}>
              💡 {RECORDING_MODES[recordingMode].description}
            </p>
          )}
        </div>

        {/* Track list — drag-and-drop friendly, responsive */}
        <div className="w-full max-h-96 overflow-y-auto overflow-x-hidden" style={{ scrollBehavior: "smooth" }}>
          <Reorder.Group
            axis="y" values={sideTracks} onReorder={handleReorder}
            className="flex flex-col gap-2"
          >
            <AnimatePresence>
              {sideTracks.map(track => (
                <Reorder.Item key={track.id} value={track} className="list-none touch-manipulation">
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="rounded-lg sm:rounded-xl overflow-hidden active:shadow-lg transition-shadow"
                    style={{ background: "#FFFFFF", border: "1px solid #E8E5DF", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2.5 sm:py-3">
                      {/* Drag handle — mobile-optimized touch target */}
                      <span className="cursor-grab active:cursor-grabbing text-lg sm:text-base select-none w-6 h-6 flex items-center justify-center"
                        style={{ color: "#D9D7D1" }} aria-hidden="true">⠿</span>

                      {/* Track num */}
                      <span className="text-xs w-3 sm:w-4 text-center flex-shrink-0 tabular-nums font-mono"
                        style={{ color: "#8E8E93" }}>
                        {track.position + 1}
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "#1D1D1F" }}>
                          {track.title}
                        </p>
                        <p className="text-xs truncate mt-0.5" style={{ color: "#8E8E93" }}>
                          {track.artist ?? "Unknown"}
                        </p>
                        {track.personalNote && (
                          <p className="text-xs mt-1 italic truncate" style={{
                            color: "#A07840", fontFamily: "'Playfair Display', serif" }}>
                            "{track.personalNote}"
                          </p>
                        )}
                      </div>

                      {/* Note + delete buttons — mobile-friendly touch targets */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            if (editingNoteId === track.id) { setEditingNoteId(null); }
                            else { setEditingNoteId(track.id); setNoteText(track.personalNote ?? ""); }
                          }}
                          className="w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all hover:opacity-70 active:scale-95"
                          style={{
                            background: track.personalNote ? "rgba(160,120,64,0.12)" : "#F3EFE7",
                            color: track.personalNote ? "#A07840" : "#8E8E93",
                            fontSize: "14px",
                            minHeight: "44px",
                            minWidth: "44px",
                          }}
                          aria-label="Edit personal note"
                          title="Edit note"
                        >✎</button>
                        <button
                          onClick={() => handleDeleteTrack(track.id)}
                          className="w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all hover:opacity-70 active:scale-95"
                          style={{
                            background: "rgba(196,80,58,0.08)",
                            color: "#C4503A",
                            fontSize: "14px",
                            minHeight: "44px",
                            minWidth: "44px",
                          }}
                          aria-label="Delete track"
                          title="Delete"
                        >✕</button>
                      </div>
                    </div>

                    {/* Note editor — paper style, responsive */}
                    <AnimatePresence>
                      {editingNoteId === track.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div
                            className="px-3 sm:px-4 pb-2.5 sm:pb-3 pt-2"
                            style={{ background: "#FFFEF4", borderTop: "1px solid #EDE8D0" }}
                          >
                            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest mb-2"
                              style={{ color: "#A07840", fontFamily: "monospace" }}>
                              Why this song?
                            </p>
                            <textarea
                              value={noteText}
                              onChange={e => setNoteText(e.target.value)}
                              maxLength={280}
                              rows={2}
                              placeholder="This song reminds me of you…"
                              className="w-full resize-none text-sm outline-none bg-transparent"
                              style={{
                                color: "#3D2010",
                                fontFamily: "'Playfair Display', Georgia, serif",
                                fontStyle: "italic",
                                lineHeight: "1.6",
                                borderBottom: "1px solid #EDE8D0",
                                paddingBottom: "4px",
                              }}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button onClick={() => setEditingNoteId(null)}
                                className="text-xs px-3 py-2.5 rounded-full btn-ghost"
                                style={{ minHeight: "44px", minWidth: "44px" }}>
                                Cancel
                              </button>
                              <button onClick={() => handleSaveNote(track.id)} disabled={isPending}
                                className="text-xs px-3 py-2.5 rounded-full btn-primary disabled:opacity-50"
                                style={{ minHeight: "44px", minWidth: "44px" }}>
                                {isPending ? "…" : "Save"}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>

          {/* Add track */}
          {sideTracks.length < RECORDING_MODES[recordingMode].maxTracksPerSide && (
            <div className="mt-3 space-y-2">
              {/* Voice Recording Option */}
              {recordingMode === RecordingMode.VOICE && !showVoiceRecorder && (
                <motion.button
                  onClick={() => setShowVoiceRecorder(true)}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
                  style={{
                    background: "linear-gradient(135deg, #D4882A 0%, #C4503A 100%)",
                    border: "none",
                    color: "#FFFFFF",
                    fontFamily: "var(--font-inter, Inter, sans-serif)",
                    boxShadow: "0 4px 12px rgba(212,136,42,0.3)",
                    minHeight: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    letterSpacing: "0.3px",
                  }}
                  whileHover={{ boxShadow: "0 6px 16px rgba(212,136,42,0.4)" }}
                  whileTap={{ scale: 0.97 }}
                >
                  🎤 Record Your Voice
                </motion.button>
              )}

              {/* Voice Recorder Component */}
              {showVoiceRecorder && recordingMode === RecordingMode.VOICE && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="rounded-2xl p-4"
                  style={{ background: "#FFFFFF", border: "1px solid #E8E5DF", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                >
                  <VoiceRecorder
                    tapeId={tape.id}
                    onRecordingComplete={(url, duration, trackId) => {
                      console.log("[TapeEditorClient] Recording complete:", { url, duration, trackId });
                      setShowVoiceRecorder(false);
                      // The track is already created in the API, just refresh to get it from DB
                      // For now, add optimistically - backend already created it
                      setTape(prev => ({
                        ...prev,
                        tracks: [...prev.tracks, {
                          id: trackId || `voice-${Date.now()}`,
                          tapeId: tape.id,
                          title: `Voice Recording - ${new Date().toLocaleTimeString()}`,
                          artist: "You",
                          side: activeSide,
                          position: sideTracks.length,
                          provider: "voice",
                          providerTrackId: trackId || `voice-${Date.now()}`,
                          durationSec: Math.round(duration),
                          personalNote: null,
                          createdAt: new Date(),
                          thumbnailUrl: undefined,
                        } as any]
                      }));
                    }}
                  />
                </motion.div>
              )}

              {/* Add from playlist button */}
              {recordingMode !== RecordingMode.VOICE && (
                <motion.button
                  onClick={() => setShowPlaylistSearch(true)}
                  className="w-full py-3 rounded-xl text-sm transition-all hover:opacity-80 active:scale-[0.98]"
                  style={{
                    background: "rgba(212, 136, 42, 0.08)",
                    border: "1.5px dashed #D4882A",
                    color: "#D4882A",
                    fontFamily: "var(--font-inter, Inter, sans-serif)",
                  }}
                  whileHover={{ borderColor: "#C67820", color: "#C67820" }}
                >
                  🎵 Add from Playlist
                </motion.button>
              )}

              {/* Add single track button */}
              {!showAddTrack ? (
                <motion.button
                  onClick={() => setShowAddTrack(true)}
                  className="w-full py-3 rounded-xl text-sm transition-all hover:opacity-80 active:scale-[0.98]"
                  style={{
                    background: "transparent",
                    border: "1.5px dashed #D9D7D1",
                    color: "#8E8E93",
                    fontFamily: "var(--font-inter, Inter, sans-serif)",
                  }}
                  whileHover={{ borderColor: "#A07840", color: "#A07840" }}
                >
                  + Put something on the tape
                </motion.button>
              ) : (
                <AddTrackForm
                  onSubmit={handleAddTrackSubmit}
                  newTrack={newTrack}
                  setNewTrack={setNewTrack}
                  trackError={trackError}
                  setTrackError={setTrackError}
                  isPending={isPending}
                  activeSide={activeSide}
                  onCancel={() => { setShowAddTrack(false); setTrackError(null); }}
                  existingTracks={sideTracks}
                />
              )}
            </div>
          )}
          {sideTracks.length >= RECORDING_MODES[recordingMode].maxTracksPerSide && (
            <p className="text-center text-xs mt-3" style={{ color: "#8E8E93", fontFamily: "monospace" }}>
              Side {activeSide} is full ({sideTracks.length}/{RECORDING_MODES[recordingMode].maxTracksPerSide})
            </p>
          )}
        </div>

        {/* J-card preview */}
        <AnimatePresence>
          {tape.tracks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full jcard-paper paper-grain rounded-2xl overflow-hidden"
            >
              <div className="px-5 py-4">
                <p className="text-[10px] uppercase tracking-[0.25em] mb-3"
                  style={{ color: "#8E8E93", fontFamily: "monospace" }}>
                  J-Card Preview
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {(["A", "B"] as const).map(s => {
                    const tracks = tape.tracks.filter(t => t.side === s).sort((a, b) => a.position - b.position);
                    return (
                      <div key={s}>
                        <p className="text-[10px] uppercase tracking-widest mb-2"
                          style={{ color: "#A07840", fontFamily: "monospace" }}>
                          Side {s}
                        </p>
                        {tracks.length === 0 ? (
                          <p className="text-xs italic" style={{ color: "#D9D7D1" }}>No tracks yet</p>
                        ) : (
                          <ol className="flex flex-col gap-1">
                            {tracks.map((t, i) => (
                              <li key={t.id} className="text-xs truncate"
                                style={{ color: "#5F6065", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
                                {i + 1}. {t.title}
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    );
                  })}
                </div>
                {tape.dedication && (
                  <div className="mt-4 pt-4" style={{ borderTop: "1px solid #E8E5DF" }}>
                    <p className="text-xs italic leading-relaxed"
                      style={{ color: "#5F6065", fontFamily: "'Playfair Display', serif" }}>
                      "{tape.dedication}"
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: "#8E8E93", fontFamily: "monospace" }}>
                      — {tape.senderName}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Record tape CTA — bottom of page */}
        <div className="w-full pt-3 sm:pt-4 flex flex-col items-center gap-1.5 sm:gap-2">
          <motion.button
            onClick={handlePublish}
            disabled={isPending}
            whileTap={{ scale: 0.95 }}
            className="w-full py-3 sm:py-3.5 rounded-full font-semibold text-sm sm:text-base disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #D4882A 0%, #C4503A 100%)",
              color: "#FFFFFF",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              boxShadow: "0 4px 24px rgba(212,136,42,0.28)",
              minHeight: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              touchAction: "manipulation",
            }}
          >
            {isPending ? "Recording…" : "⏺ Record Tape"}
          </motion.button>
          <p className="text-xs text-center" style={{ color: "#8E8E93" }}>
            {tape.tracks.length} track{tape.tracks.length !== 1 ? "s" : ""} on this tape.
            {tape.tracks.length === 0 && " Add at least one track."}
          </p>
        </div>

        {/* Playlist modals */}
        <PlaylistSearchModal
          isOpen={showPlaylistSearch}
          onClose={() => setShowPlaylistSearch(false)}
          onSelectPlaylist={handlePlaylistSelect}
        />
        {selectedPlaylist && (
          <PlaylistItemSelector
            playlist={selectedPlaylist}
            onConfirm={handlePlaylistItemsConfirm}
            onCancel={() => setSelectedPlaylist(null)}
          />
        )}
      </div>
      {/* Close content wrapper */}
      </div>
    </div>
  );
}

/* ─── Add track form ─────────────────────────────────────────────────────── */
interface SearchResult {
  videoId: string; title: string; channelTitle: string; thumbnailUrl: string; durationSec?: number;
}

function AddTrackForm({ onSubmit, newTrack, setNewTrack, trackError, setTrackError, isPending, activeSide, onCancel, existingTracks = [] }:
  { onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    newTrack: any; setNewTrack: (t: any) => void;
    trackError: string | null; setTrackError: (e: string | null) => void;
    isPending: boolean; activeSide: "A" | "B"; onCancel: () => void; existingTracks?: TrackRow[]; }) {
  const [manualEntry, setManualEntry] = useState(false);
  const [useAdvancedSearch, setUseAdvancedSearch] = useState(false);
  const [useUrlValidator, setUseUrlValidator] = useState(false);

  function handleSearchResult(result: any) {
    const fingerprint: TrackFingerprint = {
      videoId: result.videoId,
      title: result.title,
      artistName: result.channelTitle,
      duration: result.durationSec || 0,
    };
    const existingFingerprints: TrackFingerprint[] = existingTracks.map(t => ({
      videoId: t.providerTrackId,
      title: t.title,
      artistName: t.artist || "Unknown",
      duration: t.durationSec || 0,
    }));
    const duplicateCheck = detectDuplicate(fingerprint, existingFingerprints);
    if (duplicateCheck.isDuplicate) {
      setTrackError(getDuplicateWarningMessage(duplicateCheck.similarity, duplicateCheck.matchedTrack));
      return;
    }
    setTrackError(null);
    setNewTrack({
      title: result.title,
      artist: result.channelTitle,
      providerTrackId: result.videoId,
      durationSec: result.durationSec?.toString() ?? "",
    });
  }

  function handleUrlValidate(videoId: string) {
    setNewTrack((p: any) => ({ ...p, providerTrackId: videoId }));
    setUseUrlValidator(false);
    setUseAdvancedSearch(false);
    setManualEntry(false);
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={onSubmit}
      className="rounded-2xl p-4 flex flex-col gap-4"
      style={{ background: "#FFFFFF", border: "1px solid #E8E5DF", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
    >
      <p className="text-[10px] font-mono tracking-widest uppercase" style={{ color: "#8E8E93" }}>
        🎵 Add to Side {activeSide}
      </p>

      {/* Search mode tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setUseAdvancedSearch(false); setUseUrlValidator(false); setManualEntry(false); }}
          className={`flex-1 px-3 py-2 text-xs rounded-lg transition-all font-medium ${!useAdvancedSearch && !useUrlValidator && !manualEntry ? 'text-white' : 'text-gray-600'}`}
          style={{ 
            border: "1px solid", 
            minHeight: "44px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            backgroundColor: !useAdvancedSearch && !useUrlValidator && !manualEntry ? '#F5A623' : '#F0F0F0',
            borderColor: !useAdvancedSearch && !useUrlValidator && !manualEntry ? '#F5A623' : '#D8D8D8'
          }}
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => { setUseUrlValidator(true); setUseAdvancedSearch(false); setManualEntry(false); }}
          className={`flex-1 px-3 py-2 text-xs rounded-lg transition-all font-medium`}
          style={{ 
            border: "1px solid", 
            minHeight: "44px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            backgroundColor: useUrlValidator ? '#F5A623' : '#F0F0F0',
            borderColor: useUrlValidator ? '#F5A623' : '#D8D8D8',
            color: useUrlValidator ? '#FFFFFF' : '#333333'
          }}
        >
          URL
        </button>
        <button
          type="button"
          onClick={() => { setUseAdvancedSearch(true); setUseUrlValidator(false); setManualEntry(false); }}
          className={`flex-1 px-3 py-2 text-xs rounded-lg transition-all font-medium`}
          style={{ 
            border: "1px solid", 
            minHeight: "44px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            backgroundColor: useAdvancedSearch ? '#F5A623' : '#F0F0F0',
            borderColor: useAdvancedSearch ? '#F5A623' : '#D8D8D8',
            color: useAdvancedSearch ? '#FFFFFF' : '#333333'
          }}
        >
          Advanced
        </button>
      </div>

      {/* URL Validator */}
      {useUrlValidator && (
        <div>
          <YoutubeUrlValidator onValidUrl={handleUrlValidate} onError={setTrackError} />
        </div>
      )}

      {/* Advanced Search */}
      {useAdvancedSearch && (
        <div>
          <YoutubeSearchAdvanced onSelect={(result) => {
            handleSearchResult({
              videoId: result.videoId,
              title: result.title,
              channelTitle: result.channelTitle,
              durationSec: result.durationSec,
            });
            setUseAdvancedSearch(false);
          }} type="song" />
        </div>
      )}

      {/* Standard search */}
      {!useAdvancedSearch && !useUrlValidator && !manualEntry && (
        <div>
          <YoutubeSearchBar
            onSelectResult={handleSearchResult}
            placeholder="Song title, artist, or YouTube link..."
            type="song"
          />
          <button
            type="button"
            onClick={() => setManualEntry(true)}
            className="text-xs mt-3 hover:opacity-70 transition-opacity"
            style={{ color: "#D4882A" }}
          >
            Or enter manually →
          </button>
        </div>
      )}

      {/* Manual entry option */}
      {manualEntry && (
        <>
          <input
            className="cassette-input text-sm"
            placeholder="Song title *"
            value={newTrack.title}
            onChange={(e) => setNewTrack((p: any) => ({ ...p, title: e.target.value }))}
          />
          <input
            className="cassette-input text-sm"
            placeholder="Artist"
            value={newTrack.artist}
            onChange={(e) => setNewTrack((p: any) => ({ ...p, artist: e.target.value }))}
          />
          <input
            className="cassette-input text-sm"
            placeholder="YouTube video ID *"
            value={newTrack.providerTrackId}
            onChange={(e) => setNewTrack((p: any) => ({ ...p, providerTrackId: e.target.value }))}
          />
          <button
            type="button"
            onClick={() => setManualEntry(false)}
            className="text-xs hover:opacity-70 transition-opacity"
            style={{ color: "#8E8E93" }}
          >
            ← Back to search
          </button>
        </>
      )}

      {/* Track Duration Validator */}
      {newTrack.durationSec && (
        <TrackDurationValidator
          durationSec={parseInt(newTrack.durationSec)}
          title={newTrack.title}
          showDetails
        />
      )}

      {trackError && <p className="text-xs" style={{ color: "#C4503A" }}>{trackError}</p>}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-full text-xs btn-ghost"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-2.5 rounded-full text-xs btn-primary disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Add Song"}
        </button>
      </div>
    </motion.form>
  );
}

/* ─── Form field ─────────────────────────────────────────────────────────── */
function EditorField({ label, name, defaultValue, placeholder, onChange }: {
  label: string; name: string; defaultValue: string; placeholder: string; onChange?: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs tracking-widest uppercase" style={{ color: "#8E8E93", fontFamily: "monospace" }}>
        {label}
      </label>
      <input name={name} defaultValue={defaultValue} placeholder={placeholder}
        className="cassette-input text-sm" onChange={e => onChange?.(e.target.value)} />
    </div>
  );
}
