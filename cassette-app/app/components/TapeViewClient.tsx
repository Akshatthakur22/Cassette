"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CassetteObject, { type CassetteSide } from "./CassetteObject";
import PlayerBar from "./PlayerBar";
import TrackList from "./TrackList";
import HeroScene from "./HeroScene";
import ShareButton from "./ShareButton";
import CaseOpeningGate from "./CaseOpeningGate";
import { recordView } from "@/app/actions/tape";
import type { TapeWithTracks, TrackRow, TapeStyle } from "@/app/lib/types";
import { formatDuration } from "@/app/lib/fake-data";

interface Props {
  tape: TapeWithTracks;
  isPreview?: boolean;
}

export default function TapeViewClient({ tape, isPreview = false }: Props) {
  const [hasError, setHasError] = useState(false);
  const publicId = tape.publicId;
  const [opened, setOpened] = useState(isPreview); // skip gate in preview mode
  const [side, setSide] = useState<CassetteSide>("A");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showDedication, setShowDedication] = useState(false);
  const [showMakeOne, setShowMakeOne] = useState(false);
  // No fake timer — progress is driven by real YT player time
  const durationRef = useRef<number>(240);

  // Catch any errors
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      console.error("TapeViewClient error:", event.error);
      setHasError(true);
    };
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  // Record tape view on mount
  useEffect(() => {
    if (!isPreview) {
      try {
        // Generate a session ID (using timestamp + random for uniqueness)
        const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        recordView(tape.id, sessionId).catch(err => {
          console.warn("Failed to record tape view:", err);
        });
      } catch (err) {
        console.error("Error in recordView:", err);
      }
    }
  }, [tape.id, isPreview]);

  const tracks = (tape.tracks as TrackRow[]) ?? [];
  const currentTrack = tracks[currentIndex];

  useEffect(() => {
    if (currentIndex >= 1) setShowMakeOne(true);
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    setProgress(0);
    setCurrentIndex(prev => {
      const next = prev + 1;
      if (next < tracks.length) {
        setSide(tracks[next].side as CassetteSide);
        return next;
      }
      setIsPlaying(false);
      return prev;
    });
  }, [tracks]);

  const handlePrev = useCallback(() => {
    setProgress(0);
    setCurrentIndex(prev => {
      const next = Math.max(0, prev - 1);
      setSide(tracks[next].side as CassetteSide);
      return next;
    });
  }, [tracks]);

  const handleSelectTrack = useCallback((index: number) => {
    setCurrentIndex(index);
    setProgress(0);
    setSide(tracks[index].side as CassetteSide);
    setIsPlaying(true);
  }, [tracks]);

  const handleFlipSide = useCallback(() => {
    const newSide: CassetteSide = side === "A" ? "B" : "A";
    setSide(newSide);
    const firstIdx = tracks.findIndex(t => t.side === newSide);
    if (firstIdx !== -1) { setCurrentIndex(firstIdx); setProgress(0); }
  }, [side, tracks]);

  // Extract YouTube video ID from URL or return as-is if already an ID
  const extractVideoId = (urlOrId: string): string => {
    if (!urlOrId) {
      console.error('[extractVideoId] Empty urlOrId provided');
      return '';
    }
    // If it's already just an ID (11 characters, no special chars)
    if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
      console.log('[extractVideoId] Already a video ID:', urlOrId);
      return urlOrId;
    }
    // Extract from various YouTube URL formats
    try {
      const url = new URL(urlOrId);
      // youtube.com/watch?v=ID
      if (url.hostname.includes('youtube.com') && url.searchParams.has('v')) {
        const videoId = url.searchParams.get('v') || '';
        console.log('[extractVideoId] Extracted from youtube.com:', videoId);
        return videoId;
      }
      // youtube.com/shorts/ID
      if (url.hostname.includes('youtube.com') && url.pathname.startsWith('/shorts/')) {
        const videoId = url.pathname.replace('/shorts/', '');
        console.log('[extractVideoId] Extracted from youtube.com/shorts:', videoId);
        return videoId;
      }
      // youtu.be/ID
      if (url.hostname === 'youtu.be') {
        const videoId = url.pathname.slice(1);
        console.log('[extractVideoId] Extracted from youtu.be:', videoId);
        return videoId;
      }
    } catch (error) {
      // Not a URL, might be just the ID
      console.log('[extractVideoId] Not a URL, returning as-is:', urlOrId);
      return urlOrId;
    }
    console.warn('[extractVideoId] Could not extract video ID from:', urlOrId);
    return urlOrId;
  };

  const playerTracks = tracks.map(t => {
    const videoId = extractVideoId(t.providerTrackId);
    console.log('[TapeViewClient] Track:', t.title, 'Video ID:', videoId);
    return {
      id: t.id,
      side: t.side as CassetteSide,
      position: t.position,
      title: t.title,
      artist: t.artist ?? "Unknown",
      thumbnailUrl: t.thumbnailUrl ?? "",
      providerTrackId: videoId, // Extract video ID from URL
      personalNote: t.personalNote ?? undefined,
      durationSec: t.durationSec ?? 240,
    };
  });

  if (hasError) {
    return (
      <div className="relative min-h-screen flex items-center justify-center" style={{ background: "#060408" }}>
        <HeroScene />
        <div className="relative z-10 text-center px-6 max-w-md">
          <p className="text-xl mb-4" style={{ color: "#F5F0E8", fontFamily: "'Playfair Display', Georgia, serif" }}>
            Oops! Something went wrong
          </p>
          <p className="text-sm mb-6" style={{ color: "#A89880" }}>
            There was an error loading this tape.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-full text-sm transition-all hover:opacity-80"
            style={{
              background: "rgba(212,136,42,0.15)",
              border: "1px solid rgba(212,136,42,0.3)",
              color: "#D4882A",
              fontFamily: "monospace",
            }}
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="relative min-h-screen flex items-center justify-center" style={{ background: "#060408" }}>
        <HeroScene />
        <div className="relative z-10 text-center px-6">
          <p className="text-sm" style={{ color: "#6B5E4E" }}>This tape has no tracks yet.</p>
          {isPreview && <a href="." className="text-xs mt-4 block" style={{ color: "#D4882A" }}>← Add tracks</a>}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#060408" }}>
      {/* Case opening gate — shown on first visit only */}
      <AnimatePresence>
        {!opened && (
          <CaseOpeningGate
            title={tape.title ?? "Untitled Tape"}
            senderName={tape.senderName}
            recipientName={tape.recipientName ?? "You"}
            style={(tape.style as TapeStyle) ?? "classic"}
            onOpen={() => setOpened(true)}
          />
        )}
      </AnimatePresence>
      <HeroScene />

      <div className="relative z-10 flex flex-col min-h-screen">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="pt-8 pb-4 text-center px-4"
        >
          <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: "#A89880", fontFamily: "monospace" }}>
            a tape was made for
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              color: "#F5F0E8",
              textShadow: "0 2px 24px rgba(212,136,42,0.28)",
            }}
          >
            {tape.recipientName || "You"} ❤
          </h1>
          <p className="text-sm mt-1.5 opacity-50" style={{ color: "#A89880", fontFamily: "monospace", letterSpacing: "0.1em" }}>
            from {tape.senderName}
          </p>
        </motion.header>

        <div className="flex-1 flex flex-col items-center px-4 pb-36 gap-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <CassetteObject
              side={side}
              isPlaying={isPlaying}
              title={tape.title ?? "Untitled Tape"}
              recipientName={tape.recipientName ?? "You"}
              senderName={tape.senderName}
              style={(tape.style as TapeStyle) ?? "classic"}
              onFlipSide={handleFlipSide}
              progress={progress}
            />
          </motion.div>

          <div
            className="flex rounded-full p-1 gap-1"
            style={{ background: "rgba(28,24,20,0.7)", border: "1px solid rgba(245,240,232,0.08)", backdropFilter: "blur(10px)" }}
          >
            {(["A", "B"] as CassetteSide[]).map(s => (
              <button
                key={s}
                onClick={() => {
                  setSide(s);
                  const firstIdx = tracks.findIndex(t => t.side === s);
                  if (firstIdx !== -1 && tracks[currentIndex]?.side !== s) {
                    setCurrentIndex(firstIdx); setProgress(0);
                  }
                }}
                className="px-5 py-1.5 rounded-full text-xs font-mono tracking-widest transition-all duration-200"
                style={{
                  background: side === s ? "#D4882A" : "transparent",
                  color: side === s ? "#1C1814" : "#A89880",
                  fontWeight: side === s ? "600" : "400",
                }}
                aria-pressed={side === s}
              >
                SIDE {s}
              </button>
            ))}
          </div>

          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              <TrackList
                key={side}
                tracks={playerTracks}
                currentIndex={currentIndex}
                isPlaying={isPlaying}
                side={side}
                onSelectTrack={handleSelectTrack}
              />
            </AnimatePresence>
          </div>

          {tape.dedication && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="w-full max-w-md flex flex-col gap-3"
            >
              <button
                onClick={() => setShowDedication(v => !v)}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all"
                style={{
                  background: "rgba(28,24,20,0.5)",
                  border: "1px solid rgba(245,240,232,0.06)",
                  color: "#A89880",
                  backdropFilter: "blur(8px)",
                }}
              >
                <span style={{ fontFamily: "monospace", fontSize: "11px", letterSpacing: "0.15em" }}>LINER NOTES</span>
                <span className="ml-auto" style={{ fontSize: "10px" }}>{showDedication ? "▲" : "▼"}</span>
              </button>
              <AnimatePresence>
                {showDedication && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="px-4 py-4 rounded-b-xl"
                      style={{ background: "rgba(20,16,12,0.7)", border: "1px solid rgba(245,240,232,0.06)", borderTop: "none" }}
                    >
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "#C4B8A8", fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", lineHeight: "1.7" }}
                      >
                        &ldquo;{tape.dedication}&rdquo;
                      </p>
                      <p className="text-xs mt-3" style={{ color: "#6B5E4E", fontFamily: "monospace" }}>— {tape.senderName}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <ShareButton
                title={tape.title ?? "A tape was made for you"}
                senderName={tape.senderName}
                publicId={publicId}
                tapeId={tape.id}
                onShare={(platform) => { console.log("Shared via", platform); }}
              />
            </motion.div>
          )}

          <AnimatePresence>
            {showMakeOne && !isPreview && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="pb-4"
              >
                <a
                  href={`/create?for=${encodeURIComponent(tape.senderName)}`}
                  className="inline-block px-8 py-3 rounded-full text-sm transition-all hover:opacity-90 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #D4882A, #C4503A)",
                    color: "#F5F0E8",
                    fontFamily: "monospace",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    fontSize: "11px",
                    fontWeight: "600",
                    boxShadow: "0 4px 24px rgba(212,136,42,0.25)",
                  }}
                >
                  Make One Back ❤
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <PlayerBar
        tracks={playerTracks}
        currentIndex={currentIndex}
        isPlaying={isPlaying}
        progress={progress}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onNext={handleNext}
        onPrev={handlePrev}
        onSeek={ratio => setProgress(ratio)}
        onTimeUpdate={(elapsed, duration) => {
          durationRef.current = duration;
          setProgress(elapsed / duration);
        }}
      />
    </div>
  );
}
