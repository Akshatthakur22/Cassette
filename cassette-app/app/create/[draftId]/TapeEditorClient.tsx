"use client";

import { useState, useTransition, useRef } from "react";
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
import { songResolver } from "@/lib/playback/SongResolver";

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
  const [visibility, setVisibility] = useState<"unlisted" | "public">(
    (initialTape.visibility as "unlisted" | "public") || "unlisted"
  );
  const [labelTyping, setLabelTyping] = useState(false);
  const labelTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualTrack, setManualTrack] = useState({ title: "", artist: "", videoId: "" });

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
      const newTitle = (fd.get("title") as string) || tape.title;
      const newRecipient = (fd.get("recipientName") as string) || tape.recipientName;
      const newStyle = (fd.get("style") as string) || tape.style;
      setTape(prev => ({
        ...prev,
        title: newTitle,
        recipientName: newRecipient,
        dedication: (fd.get("dedication") as string) || prev.dedication,
        style: newStyle as any,
        visibility,
      }));
      setLiveTitle(newTitle ?? "");
      setLiveRecipient(newRecipient ?? "");
      setShowMeta(false);
    });
  }

  // ── Optimistic Track Addition (YouTube) ────────────────────────────────────
  function handleAddTrackDirect(result: {
    title: string;
    channelTitle?: string;
    videoId: string;
    thumbnailUrl?: string;
    durationSec?: number;
  }) {
    if (sideTracks.length >= 12) {
      setTrackError(`Side ${activeSide} is already full (12 tracks max). Switch to Side ${activeSide === "A" ? "B" : "A"}.`);
      return;
    }

    setTrackError(null);
    const position = sideTracks.length;
    const tempId = `temp-${Date.now()}`;

    const optimisticTrack: TrackRow = {
      id: tempId,
      tapeId: tape.id,
      side: activeSide,
      position,
      title: result.title,
      artist: result.channelTitle ?? null,
      thumbnailUrl: result.thumbnailUrl ?? null,
      provider: "youtube",
      providerTrackId: result.videoId,
      personalNote: null,
      durationSec: result.durationSec ?? null,
    };

    // Instant optimistic update
    setTape(prev => ({ ...prev, tracks: [...prev.tracks, optimisticTrack] }));
    setShowAddTrack(false);
    setManualEntry(false);
    setManualTrack({ title: "", artist: "", videoId: "" });

    startTransition(async () => {
      const res = await addTrack(tape.id, {
        side: activeSide,
        position,
        title: result.title,
        artist: result.channelTitle,
        thumbnailUrl: result.thumbnailUrl,
        providerTrackId: result.videoId,
        durationSec: result.durationSec,
      });

      if (res?.error) {
        // Rollback optimistic addition
        setTape(prev => ({ ...prev, tracks: prev.tracks.filter(t => t.id !== tempId) }));
        setTrackError(res.error);
        setShowAddTrack(true);
      } else if (res?.track) {
        // Replace temp track with confirmed backend track
        setTape(prev => ({
          ...prev,
          tracks: prev.tracks.map(t => t.id === tempId ? (res.track as TrackRow) : t),
        }));

        // Pre-resolve audio in background for instant playback readiness
        songResolver.resolveSong(result.videoId, {
          title: result.title,
          artist: result.channelTitle,
          artworkUrl: result.thumbnailUrl,
          durationSec: result.durationSec,
        }).catch(() => {});
      }
    });
  }

  // ── Voice Recording Handler ───────────────────────────────────────────────
  function handleVoiceRecordingComplete(url: string, duration: number, trackId?: string) {
    const position = sideTracks.length;
    const realTrackId = trackId || `voice-${Date.now()}`;
    const voiceTrack: TrackRow = {
      id: realTrackId,
      tapeId: tape.id,
      side: activeSide,
      position,
      title: `🎙️ Voice Note (${Math.round(duration)}s)`,
      artist: tape.senderName || "You",
      thumbnailUrl: null,
      provider: "voice",
      providerTrackId: realTrackId,
      personalNote: null,
      durationSec: Math.round(duration),
    };

    setTape(prev => ({
      ...prev,
      tracks: [...prev.tracks.filter(t => t.id !== realTrackId), voiceTrack],
    }));
    setShowVoiceRecorder(false);
  }

  // ── Optimistic Track Deletion ──────────────────────────────────────────────
  function handleDeleteTrack(trackId: string) {
    const previousTracks = tape.tracks;
    // Instant optimistic removal
    setTape(prev => ({ ...prev, tracks: prev.tracks.filter(t => t.id !== trackId) }));

    startTransition(async () => {
      const res = await deleteTrack(tape.id, trackId);
      if (res?.error) {
        // Rollback
        setTape(prev => ({ ...prev, tracks: previousTracks }));
        setTrackError(res.error);
      }
    });
  }

  // ── Optimistic Note Update ────────────────────────────────────────────────
  function handleSaveNote(trackId: string) {
    const previousTracks = tape.tracks;
    // Instant optimistic note update
    setTape(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => t.id === trackId ? { ...t, personalNote: noteText } : t),
    }));
    setEditingNoteId(null);

    startTransition(async () => {
      const res = await updateTrackNote(tape.id, trackId, noteText);
      if (res?.error) {
        setTape(prev => ({ ...prev, tracks: previousTracks }));
      }
    });
  }

  // ── Optimistic Track Reorder ──────────────────────────────────────────────
  function handleReorder(newOrder: TrackRow[]) {
    const reorderedTracks = [
      ...tape.tracks.filter(t => t.side !== activeSide),
      ...newOrder.map((t, i) => ({ ...t, position: i })),
    ];
    setTape(prev => ({ ...prev, tracks: reorderedTracks }));

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
      const playlistUrl = `https://www.youtube.com/playlist?list=${selectedPlaylist.id}`;
      startTransition(async () => {
        const res = await addTracksFromPlaylist(
          tape.id,
          selectedPlaylist.id,
          selectedPlaylist.title,
          playlistUrl,
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
            tracks: [...prev.tracks, ...(res.tracks as unknown as TrackRow[])],
            playlistSourceId: selectedPlaylist.id,
            playlistSourceUrl: playlistUrl,
            playlistName: selectedPlaylist.title,
          }));
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

        {/* ── Sticky header ──────────────────────────────────────────────────────────── */}
        <div
          className="sticky top-0 z-30 flex flex-col sm:flex-row items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 gap-1.5 sm:gap-0"
          style={{
            background: "rgba(251,250,247,0.92)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: "1px solid #E8E5DF",
          }}
        >
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-1.5 text-[9px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase transition-opacity hover:opacity-60"
              style={{ color: "#8E8E93", fontFamily: "monospace" }}>
              <img src="/logo.png" alt="CASSETTE" className="h-4 sm:h-5 w-auto object-contain" />
              <span>← CASSETTE</span>
            </a>

            {/* Visibility Badge */}
            <span
              className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border"
              style={{
                background: visibility === "public" ? "#EFF6FF" : "#F3EFE7",
                borderColor: visibility === "public" ? "#93C5FD" : "#E8E5DF",
                color: visibility === "public" ? "#1D4ED8" : "#6B7280",
              }}
            >
              {visibility === "public" ? "🌍 Public Shelf" : "🔒 Unlisted"}
            </span>
          </div>

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
              disabled={isPending || tape.tracks.length === 0}
              whileTap={{ scale: 0.94 }}
              className="text-[10px] sm:text-xs px-3.5 sm:px-4 py-2 rounded-full font-semibold transition-all disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5"
              style={{
                background: "linear-gradient(135deg, #D4882A, #C4503A)",
                color: "#FFFFFF",
                boxShadow: isPending ? "none" : "0 2px 12px rgba(212,136,42,0.3)",
                minHeight: "44px",
                touchAction: "manipulation",
              }}
            >
              <span>{isPending ? "Sealing…" : "Seal Tape →"}</span>
            </motion.button>
          </div>
        </div>

        {publishError && (
          <p className="text-center text-xs py-2 px-4" style={{ color: "#C4503A", background: "rgba(196,80,58,0.06)" }}>
            {publishError}
          </p>
        )}

        {/* ── Main layout ─────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center px-3 sm:px-4 pb-16 sm:pb-20 gap-3 sm:gap-4 w-full max-w-lg mx-auto">

          {/* Live cassette preview */}
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

          {/* Tape meta card */}
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
                  {" · "}{visibility === "public" ? "🌍 Public" : "🔒 Unlisted"}
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

                    {/* Visibility & Discovery Setting */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs tracking-widest uppercase"
                        style={{ color: "#8E8E93", fontFamily: "monospace" }}>
                        Visibility & Discovery
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Unlisted (Private Link) */}
                        <label
                          className="flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all"
                          style={{
                            background: visibility === "unlisted" ? "#FFFDF6" : "#FFFFFF",
                            borderColor: visibility === "unlisted" ? "#D4882A" : "#E8E5DF",
                            boxShadow: visibility === "unlisted" ? "0 0 0 1.5px #D4882A" : "none",
                          }}
                        >
                          <input
                            type="radio"
                            name="visibilityRadio"
                            value="unlisted"
                            checked={visibility === "unlisted"}
                            onChange={() => setVisibility("unlisted")}
                            className="mt-0.5 accent-[#D4882A]"
                          />
                          <div>
                            <p className="text-xs font-semibold text-[#1D1D1F]">🔒 Unlisted (Default)</p>
                            <p className="text-[11px] text-[#8E8E93] mt-0.5 leading-snug">
                              Only people with your unique link can open this tape.
                            </p>
                          </div>
                        </label>

                        {/* Public (Community Shelf) */}
                        <label
                          className="flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all"
                          style={{
                            background: visibility === "public" ? "#FFFDF6" : "#FFFFFF",
                            borderColor: visibility === "public" ? "#D4882A" : "#E8E5DF",
                            boxShadow: visibility === "public" ? "0 0 0 1.5px #D4882A" : "none",
                          }}
                        >
                          <input
                            type="radio"
                            name="visibilityRadio"
                            value="public"
                            checked={visibility === "public"}
                            onChange={() => setVisibility("public")}
                            className="mt-0.5 accent-[#D4882A]"
                          />
                          <div>
                            <p className="text-xs font-semibold text-[#1D1D1F]">🌍 Public Shelf</p>
                            <p className="text-[11px] text-[#8E8E93] mt-0.5 leading-snug">
                              Featured on the community shelf (/shelf) for anyone to play.
                            </p>
                          </div>
                        </label>
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

                    {metaError && <p className="text-xs" style={{ color: "#C4503A" }}>{metaError}</p>}

                    <div className="flex gap-2">
                      <button type="button" onClick={() => setShowMeta(false)}
                        className="flex-1 py-2 rounded-full text-xs transition-all hover:opacity-70 btn-ghost">
                        Cancel
                      </button>
                      <button type="submit" disabled={isPending}
                        className="flex-1 py-2 rounded-full text-xs font-semibold btn-primary disabled:opacity-50">
                        {isPending ? "Saving…" : "Save Details"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Side A / B tabs */}
          <div
            className="flex rounded-full p-1 gap-1 w-full"
            style={{ background: "#F3EFE7", border: "1px solid #E8E5DF" }}
            role="tablist"
          >
            {(["A", "B"] as const).map(s => (
              <button
                key={s}
                onClick={() => setActiveSide(s)}
                role="tab"
                aria-selected={activeSide === s}
                className="flex-1 py-2 rounded-full text-xs font-semibold tracking-widest transition-all duration-200"
                style={{
                  background: activeSide === s ? "#1D1D1F" : "transparent",
                  color: activeSide === s ? "#FBFAF7" : "#8E8E93",
                  fontFamily: "monospace",
                  minHeight: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                SIDE {s} ({s === "A" ? sideATracks : sideBTracks}/12)
              </button>
            ))}
          </div>

          {/* Track list — drag-and-drop friendly */}
          <div className="w-full max-h-96 overflow-y-auto overflow-x-hidden" style={{ scrollBehavior: "smooth" }}>
            <Reorder.Group
              axis="y" values={sideTracks} onReorder={handleReorder}
              className="flex flex-col gap-2"
            >
              <AnimatePresence initial={false}>
                {sideTracks.map((track, i) => (
                  <Reorder.Item key={track.id} value={track} className="cursor-grab active:cursor-grabbing">
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 transition-all group"
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #E8E5DF",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                      }}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xs font-mono w-4 text-center flex-shrink-0" style={{ color: "#8E8E93" }}>
                          {track.provider === "voice" ? "🎙️" : i + 1}
                        </span>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate" style={{ color: "#1D1D1F" }}>
                            {track.title}
                          </p>
                          <p className="text-[10px] sm:text-xs truncate" style={{ color: "#8E8E93" }}>
                            {track.artist || "Unknown Artist"}
                            {track.durationSec ? ` · ${Math.floor(track.durationSec / 60)}:${(track.durationSec % 60).toString().padStart(2, "0")}` : ""}
                          </p>
                          {track.personalNote && (
                            <p className="text-[10px] sm:text-xs italic mt-0.5 truncate"
                              style={{ color: "#A07840", fontFamily: "'Playfair Display', serif" }}>
                              &ldquo;{track.personalNote}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingNoteId(editingNoteId === track.id ? null : track.id);
                              setNoteText(track.personalNote ?? "");
                            }}
                            className="p-1 rounded text-xs transition-opacity hover:opacity-60"
                            style={{ color: track.personalNote ? "#A07840" : "#8E8E93" }}
                            title="Add note"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleDeleteTrack(track.id)}
                            className="p-1 rounded text-xs transition-opacity hover:opacity-60"
                            style={{ color: "#8E8E93" }}
                            title="Remove track"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Liner note editor */}
                      <AnimatePresence>
                        {editingNoteId === track.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-2 pt-2 border-t border-[#F0EDE7]"
                          >
                            <input
                              type="text"
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Write a liner note for this song…"
                              className="w-full text-xs p-2 rounded border border-[#E8E5DF] outline-none"
                              maxLength={280}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                onClick={() => setEditingNoteId(null)}
                                className="text-xs px-2.5 py-1 rounded btn-ghost"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveNote(track.id)}
                                className="text-xs px-3 py-1 rounded btn-primary"
                              >
                                Save Note
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
          </div>

          {/* Add Track & Voice Recording Actions */}
          {sideTracks.length < 12 && (
            <div className="w-full mt-2 flex flex-col gap-2">
              {!showAddTrack && !showVoiceRecorder ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setShowAddTrack(true)}
                    className="flex-1 py-3 px-3 rounded-xl text-xs font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-1.5"
                    style={{
                      background: "#FFFFFF",
                      border: "1.5px dashed #D4882A",
                      color: "#D4882A",
                    }}
                  >
                    <span>+ Add Song to Side {activeSide}</span>
                  </button>

                  <button
                    onClick={() => setShowVoiceRecorder(true)}
                    className="py-3 px-3.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-1.5"
                    style={{
                      background: "#FFF4E6",
                      border: "1px solid #FFD8A8",
                      color: "#D9480F",
                    }}
                    title="Record a voice note or intro from your mic"
                  >
                    <span>🎙️ Voice Note</span>
                  </button>

                  <button
                    onClick={() => setShowPlaylistSearch(true)}
                    className="py-3 px-3 rounded-xl text-xs font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-1.5"
                    style={{
                      background: "#F3EFE7",
                      border: "1px solid #E8E5DF",
                      color: "#5F6065",
                    }}
                    title="Import whole YouTube playlist"
                  >
                    <span>📋 Playlist</span>
                  </button>
                </div>
              ) : null}

              {/* Voice Recording Drawer / Box */}
              <AnimatePresence>
                {showVoiceRecorder && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="rounded-2xl p-4 flex flex-col gap-3"
                    style={{ background: "#FFFFFF", border: "1px solid #E8E5DF", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono tracking-widest uppercase font-semibold text-[#D9480F]">
                        🎙️ Record Voice Intro / Note (Side {activeSide})
                      </span>
                      <button
                        onClick={() => setShowVoiceRecorder(false)}
                        className="text-xs text-[#8E8E93] hover:opacity-75"
                      >
                        ✕ Close
                      </button>
                    </div>

                    <VoiceRecorder
                      tapeId={tape.id}
                      onRecordingComplete={handleVoiceRecordingComplete}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Add Track Search Interface */}
              <AnimatePresence>
                {showAddTrack && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="rounded-2xl p-4 flex flex-col gap-3"
                    style={{ background: "#FFFFFF", border: "1px solid #E8E5DF", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono tracking-widest uppercase font-semibold" style={{ color: "#D4882A" }}>
                        🎵 Add Song to Side {activeSide}
                      </span>
                      <button
                        onClick={() => { setShowAddTrack(false); setManualEntry(false); }}
                        className="text-xs text-[#8E8E93] hover:opacity-75"
                      >
                        ✕ Close
                      </button>
                    </div>

                    {!manualEntry ? (
                      <div>
                        <YoutubeSearchBar
                          onSelectResult={handleAddTrackDirect}
                          placeholder="Search songs, artists, or paste YouTube URL..."
                          type="song"
                        />
                        <button
                          type="button"
                          onClick={() => setManualEntry(true)}
                          className="text-[11px] mt-2.5 text-[#8E8E93] hover:text-[#D4882A] transition-colors"
                        >
                          Can&apos;t find it? Enter YouTube Video ID manually →
                        </button>
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!manualTrack.title || !manualTrack.videoId) return;
                          handleAddTrackDirect({
                            title: manualTrack.title,
                            channelTitle: manualTrack.artist || undefined,
                            videoId: manualTrack.videoId,
                          });
                        }}
                        className="flex flex-col gap-2.5"
                      >
                        <input
                          className="cassette-input text-xs"
                          placeholder="Song title *"
                          value={manualTrack.title}
                          onChange={(e) => setManualTrack(p => ({ ...p, title: e.target.value }))}
                          required
                        />
                        <input
                          className="cassette-input text-xs"
                          placeholder="Artist (optional)"
                          value={manualTrack.artist}
                          onChange={(e) => setManualTrack(p => ({ ...p, artist: e.target.value }))}
                        />
                        <input
                          className="cassette-input text-xs"
                          placeholder="YouTube video ID or URL *"
                          value={manualTrack.videoId}
                          onChange={(e) => setManualTrack(p => ({ ...p, videoId: e.target.value }))}
                          required
                        />
                        <div className="flex gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => setManualEntry(false)}
                            className="flex-1 py-2 rounded-lg text-xs btn-ghost"
                          >
                            ← Search
                          </button>
                          <button
                            type="submit"
                            className="flex-1 py-2 rounded-lg text-xs btn-primary"
                          >
                            Add Track
                          </button>
                        </div>
                      </form>
                    )}

                    {trackError && (
                      <p className="text-xs mt-1 text-[#C4503A] bg-[#FFF2F0] p-2.5 rounded-lg border border-[#FFCCC7]">
                        {trackError}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Side full indicator */}
          {sideTracks.length >= 12 && (
            <p className="text-xs text-center py-2" style={{ color: "#8E8E93" }}>
              Side {activeSide} is full (12/12). {activeSide === "A" && sideBTracks < 12 ? "Switch to Side B to add more tracks." : "Your tape is full!"}
            </p>
          )}

          {/* Seal / Finalize CTA */}
          <div className="w-full mt-4 flex flex-col gap-2">
            <motion.button
              onClick={handlePublish}
              disabled={isPending || tape.tracks.length === 0}
              whileTap={{ scale: 0.96 }}
              className="w-full py-3.5 rounded-full font-semibold text-sm sm:text-base disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #D4882A 0%, #C4503A 100%)",
                color: "#FFFFFF",
                boxShadow: "0 4px 24px rgba(212,136,42,0.28)",
                minHeight: "48px",
              }}
            >
              <span>{isPending ? "Sealing Tape…" : "Finish & Seal Tape 🎁"}</span>
            </motion.button>
            <p className="text-xs text-center" style={{ color: "#8E8E93" }}>
              {tape.tracks.length} track{tape.tracks.length !== 1 ? "s" : ""} on this tape.
              {tape.tracks.length === 0 && " Add at least one track to seal."}
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
      </div>
    </div>
  );
}

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
