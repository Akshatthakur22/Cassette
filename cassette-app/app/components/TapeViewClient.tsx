"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CassetteObject, { type CassetteSide, type TapeColorKey } from "./CassetteObject";
import CassetteInsertDeck from "./CassetteInsertDeck";
import PlayerBar from "./PlayerBar";
import TrackList from "./TrackList";
import ShareButton from "./ShareButton";
import CaseOpeningGate from "./CaseOpeningGate";
import { PosterImage } from "./PosterImage";
import { BackgroundImage } from "./BackgroundImage";
import { recordView } from "@/app/actions/tape";
import { trackClientEvent, EVENTS as CLIENT_EVENTS } from "@/app/lib/client-posthog";
import { playClickSound, playFlipSound } from "@/app/lib/sounds";
import type { TapeWithTracks, TrackRow } from "@/app/lib/types";
import { formatDuration } from "@/app/lib/fake-data";
import { useReduceMotion } from "@/app/lib/use-reduce-motion";

interface Props {
  tape: TapeWithTracks;
  isPreview?: boolean;
}

/* ─── Tape accent colors for PlayerBar tint ─────────────────────────────── */
const ACCENT_BY_STYLE: Record<string, string> = {
  cream: "#A07840", cherry: "#E84060", peach: "#E8703A", butter: "#D4A820",
  sky: "#38A8E8", pool: "#1A9898", lavender: "#9060C8", mint: "#28A858",
  transparent: "#38A8E8", smoky: "#9060C8",
  classic: "#D4882A", y2k: "#D040F0", love: "#D45A6A", road_trip: "#5B7FA6",
};

/* ─── Error / Empty fallbacks ────────────────────────────────────────────── */
function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6"
      style={{ background: "#FBFAF7" }}>
      <p className="text-2xl font-bold italic"
        style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#1D1D1F" }}>
        The tape got stuck.
      </p>
      <p className="text-sm text-center" style={{ color: "#8E8E93" }}>
        Something went wrong loading this tape.
      </p>
      <button onClick={onRetry} className="btn-ghost text-sm">
        Try again →
      </button>
    </div>
  );
}

function EmptyScreen({ isPreview }: { isPreview: boolean }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6"
      style={{ background: "#FBFAF7" }}>
      <p className="text-sm" style={{ color: "#8E8E93" }}>
        This tape has no tracks yet.
      </p>
      {isPreview && (
        <a href="." className="btn-ghost text-sm">← Add tracks</a>
      )}
    </div>
  );
}

export default function TapeViewClient({ tape, isPreview = false }: Props) {
  const reduceMotion = useReduceMotion();

  // Gate + playback state
  const [opened, setOpened] = useState(isPreview);
  const [inserted, setInserted] = useState(false);
  const [inserting, setInserting] = useState(false);
  const [side, setSide] = useState<CassetteSide>("A");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const durationRef = useRef<number>(240);

  // UI overlay states
  const [sideADone, setSideADone] = useState(false);         // "Side A is done"
  const [tapeDone, setTapeDone] = useState(false);           // "That's the whole tape"
  const [showFlipRitual, setShowFlipRitual] = useState(false); // physical flip animation
  const [flipPhase, setFlipPhase] = useState<"ejecting" | "flipped" | "inserting" | "done">("ejecting");
  const [showMakeOne, setShowMakeOne] = useState(false);
  const [showDedication, setShowDedication] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Record view on mount
  useEffect(() => {
    if (!isPreview) {
      const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      recordView(tape.id, sessionId).catch(() => {});
    }
  }, [tape.id, isPreview]);

  // Error handler
  useEffect(() => {
    const handler = (e: ErrorEvent) => { console.error(e.error); setHasError(true); };
    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, []);

  const tracks = (tape.tracks as TrackRow[]) ?? [];
  const currentTrack = tracks[currentIndex];
  const accentColor = ACCENT_BY_STYLE[tape.style ?? "cream"] ?? "#D4882A";

  // Show Make One Back after listening a bit
  useEffect(() => {
    if (currentIndex >= 1) setShowMakeOne(true);
  }, [currentIndex]);

  // Extract YouTube video ID
  const extractVideoId = (urlOrId: string): string => {
    if (!urlOrId) return "";
    if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
    try {
      const url = new URL(urlOrId);
      if (url.hostname.includes("youtube.com") && url.searchParams.has("v"))
        return url.searchParams.get("v") || "";
      if (url.hostname.includes("youtube.com") && url.pathname.startsWith("/shorts/"))
        return url.pathname.replace("/shorts/", "");
      if (url.hostname === "youtu.be") return url.pathname.slice(1);
    } catch {}
    return urlOrId;
  };

  const playerTracks = tracks.map(t => ({
    id: t.id,
    side: t.side as CassetteSide,
    position: t.position,
    title: t.title,
    artist: t.artist ?? "Unknown",
    thumbnailUrl: t.thumbnailUrl ?? "",
    providerTrackId: extractVideoId(t.providerTrackId),
    personalNote: t.personalNote ?? undefined,
    durationSec: t.durationSec ?? 240,
  }));

  const handleNext = useCallback(() => {
    setProgress(0);
    setCurrentIndex(prev => {
      const next = prev + 1;
      if (next < tracks.length) {
        const nextSide = tracks[next].side as CassetteSide;
        // If crossing A → B, pause and show Side A Done screen
        if (tracks[prev].side === "A" && nextSide === "B") {
          setIsPlaying(false);
          setSideADone(true);
          return prev; // stay on last A track until user flips
        }
        setSide(nextSide);
        return next;
      }
      // Tape is done
      setIsPlaying(false);
      setTapeDone(true);
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
    // If they manually select a B-side track, clear the A-done gate
    if (tracks[index].side === "B") setSideADone(false);
  }, [tracks]);

  // ── INSERT TAPE — handled by CassetteInsertDeck, state lives here ─────

  // ── PHYSICAL FLIP ritual ───────────────────────────────────────────────
  function handleFlipRitual() {
    setSideADone(false);
    setShowFlipRitual(true);
    setFlipPhase("ejecting");

    // Phase timeline
    setTimeout(() => setFlipPhase("flipped"), 700);
    setTimeout(() => setFlipPhase("inserting"), 1500);
    setTimeout(() => {
      setFlipPhase("done");
      playFlipSound();
    }, 2200);
    setTimeout(() => {
      setShowFlipRitual(false);
      // Switch to side B
      setSide("B");
      const firstBIdx = tracks.findIndex(t => t.side === "B");
      if (firstBIdx !== -1) {
        setCurrentIndex(firstBIdx);
        setProgress(0);
      }
      setIsPlaying(true);
    }, 2700);
  }

  // ── SWITCH SIDE (fast path — no ritual) ───────────────────────────────
  function handleSwitchSide(newSide: CassetteSide) {
    setSide(newSide);
    const firstIdx = tracks.findIndex(t => t.side === newSide);
    if (firstIdx !== -1 && tracks[currentIndex]?.side !== newSide) {
      setCurrentIndex(firstIdx);
      setProgress(0);
    }
    setSideADone(false);
    setTapeDone(false);
  }

  // ── Error fallback ─────────────────────────────────────────────────────
  if (hasError) {
    return (
      <ErrorScreen onRetry={() => window.location.reload()} />
    );
  }

  if (tracks.length === 0) {
    return (
      <EmptyScreen isPreview={isPreview} />
    );
  }

  // ── Cassette visual state ─────────────────────────────────────────────
  const cassetteState = inserting
    ? "inserting"
    : showFlipRitual
      ? flipPhase === "ejecting" ? "ejecting" : flipPhase === "flipped" ? "flipping" : "inserting"
    : !inserted
      ? "idle"
    : isPlaying
      ? "playing"
      : "paused";

  return (
    <div
      className="relative min-h-screen overflow-y-auto overflow-x-hidden"
      style={{ background: "#FBFAF7", scrollBehavior: "smooth" }}
    >
      {/* Background decorative image */}
      <BackgroundImage
        imageNumber={Math.floor(Math.random() * 20) + 1}
        opacity={0.5}
        blendMode="normal"
        position="top-right"
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
        <div className="absolute top-20 left-4 z-0 opacity-50 hidden lg:block">
          <PosterImage imageNumber={14} width={80} height={110} rotation={-12} />
        </div>

      {/* ── CASE OPENING GATE ──────────────────────────────────────────── */}
      <AnimatePresence>
        {!opened && (
          <CaseOpeningGate
            title={tape.title ?? "Untitled Tape"}
            senderName={tape.senderName}
            recipientName={tape.recipientName ?? "You"}
            style={(tape.style ?? "cream") as any}
            onOpen={() => setOpened(true)}
          />
        )}
      </AnimatePresence>

      {/* ── SIDE A DONE OVERLAY ─────────────────────────────────────────── */}
      <AnimatePresence>
        {sideADone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center px-6"
            style={{ background: "rgba(251,250,247,0.96)", backdropFilter: "blur(8px)" }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-center max-w-xs"
            >
              {/* Mini cassette visual */}
              <div className="text-5xl mb-6" role="img" aria-label="cassette">📼</div>

              <p className="text-xs tracking-[0.3em] uppercase mb-3"
                style={{ color: "#8E8E93", fontFamily: "monospace" }}>
                SIDE A IS DONE
              </p>
              <h2
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#1D1D1F",
                  marginBottom: "10px",
                  lineHeight: 1.2,
                }}
              >
                Flip the tape.
              </h2>
              <p className="text-sm mb-8" style={{ color: "#8E8E93", lineHeight: 1.6 }}>
                Side B is waiting.
              </p>

              {/* Physical flip button */}
              <motion.button
                onClick={handleFlipRitual}
                whileTap={{ scale: 0.94 }}
                className="btn-primary w-full mb-3"
              >
                Flip to Side B →
              </motion.button>
              <button
                onClick={() => setSideADone(false)}
                className="text-xs"
                style={{ color: "#8E8E93", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
              >
                Stay on Side A
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FLIP RITUAL OVERLAY ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showFlipRitual && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(251,250,247,0.98)" }}
          >
            <div className="text-center">
              <motion.div
                animate={
                  reduceMotion ? {} :
                  flipPhase === "ejecting" ? { y: [0, -30], scale: [1, 1.05] } :
                  flipPhase === "flipped" ? { rotateY: 180, scale: 1.05 } :
                  flipPhase === "inserting" ? { y: [-30, 0], rotateY: 180, scale: [1.05, 1] } :
                  { rotateY: 180 }
                }
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ perspective: 600 }}
              >
                <div className="text-7xl" role="img" aria-label="cassette being flipped">📼</div>
              </motion.div>

              <motion.p
                key={flipPhase}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 text-sm"
                style={{ color: "#8E8E93", fontFamily: "monospace", letterSpacing: "0.15em" }}
              >
                {flipPhase === "ejecting" && "Ejecting..."}
                {flipPhase === "flipped" && "Flipping..."}
                {flipPhase === "inserting" && "Inserting Side B..."}
                {flipPhase === "done" && "Side B →"}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── END OF TAPE OVERLAY ─────────────────────────────────────────── */}
      <AnimatePresence>
        {tapeDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center px-6"
            style={{ background: "rgba(251,250,247,0.96)", backdropFilter: "blur(8px)" }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-center max-w-xs"
            >
              <div className="text-5xl mb-6" role="img" aria-label="heart">❤️</div>

              <p className="text-xs tracking-[0.3em] uppercase mb-3"
                style={{ color: "#8E8E93", fontFamily: "monospace" }}>
                THAT'S THE WHOLE TAPE
              </p>
              <h2
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#1D1D1F",
                  marginBottom: "10px",
                  lineHeight: 1.2,
                }}
              >
                Someone made this for you.
              </h2>
              <p className="text-sm mb-8" style={{ color: "#8E8E93", lineHeight: 1.6 }}>
                Want to make one back?
              </p>

              {!isPreview && (
                <a
                  href={`/create?for=${encodeURIComponent(tape.senderName)}&from=${tape.publicId}`}
                  onClick={() => trackClientEvent(CLIENT_EVENTS.MAKE_ONE_BACK_CLICKED, {
                    tapeId: tape.publicId, senderName: tape.senderName,
                  })}
                  className="btn-primary w-full block text-center mb-3"
                  style={{ textDecoration: "none" }}
                >
                  Make One Back ❤
                </a>
              )}
              <button
                onClick={() => {
                  setTapeDone(false);
                  setCurrentIndex(0);
                  setSide("A");
                  setProgress(0);
                }}
                className="text-xs"
                style={{ color: "#8E8E93", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
              >
                Listen again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT — responsive layout ── */}
      <div className="flex flex-col items-center pb-28 sm:pb-36 md:pb-44 min-h-screen px-3 sm:px-4 md:px-6">

        {/* Header — responsive */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full pt-3 sm:pt-5 pb-2 sm:pb-3 flex flex-col sm:flex-row items-center justify-between max-w-2xl mx-auto gap-1.5 sm:gap-0"
        >
          <a
            href="/"
            className="text-[9px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase transition-opacity hover:opacity-60 order-1 sm:order-none"
            style={{ color: "#8E8E93", fontFamily: "monospace" }}
          >
            ← CASSETTE
          </a>
          <div className="text-center order-2 sm:order-1">
            <p className="text-[8px] sm:text-[9px] tracking-[0.15em] sm:tracking-[0.2em] uppercase"
              style={{ color: "#8E8E93", fontFamily: "monospace" }}>
              a tape was made for
            </p>
            <h1
              className="font-bold"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: "italic",
                fontSize: "clamp(14px, 4vw, 18px)",
                color: "#1D1D1F",
              }}
            >
              {tape.recipientName || "You"}
            </h1>
          </div>
          <p className="text-[8px] sm:text-xs order-3 sm:order-2" style={{ color: "#8E8E93", fontFamily: "monospace" }}>
            by {tape.senderName.slice(0, 12)}
          </p>
        </motion.header>

        {/* Cassette + insert zone — responsive width */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm mt-3 sm:mt-5"
        >
          {inserted ? (
            /* ── Already inserted — show cassette with flip button ── */
            <CassetteObject
              side={side}
              isPlaying={isPlaying}
              title={tape.title ?? "Untitled Tape"}
              recipientName={tape.recipientName ?? "You"}
              senderName={tape.senderName}
              style={(tape.style ?? "cream") as TapeColorKey}
              onFlipSide={() => handleSwitchSide(side === "A" ? "B" : "A")}
              showFlipButton
              progress={progress}
              cassetteState={cassetteState}
            />
          ) : (
            /* ── Not yet inserted — full deck insert animation ── */
            <CassetteInsertDeck
              tapeStyle={(tape.style ?? "cream") as TapeColorKey}
              onInserted={() => {
                setInserting(false);
                setInserted(true);
              }}
            >
              <CassetteObject
                side={side}
                isPlaying={false}
                title={tape.title ?? "Untitled Tape"}
                recipientName={tape.recipientName ?? "You"}
                senderName={tape.senderName}
                style={(tape.style ?? "cream") as TapeColorKey}
                showFlipButton={false}
                progress={0}
                cassetteState="idle"
              />
            </CassetteInsertDeck>
          )}
        </motion.div>

        {/* Side A / B tabs — only shown when inserted */}
        <AnimatePresence>
          {inserted && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mt-3 sm:mt-4 flex rounded-full p-1 gap-1"
              style={{
                background: "#F3EFE7",
                border: "1px solid #E8E5DF",
              }}
              role="tablist"
              aria-label="Tape sides"
            >
              {(["A", "B"] as CassetteSide[]).map(s => (
                <button
                  key={s}
                  onClick={() => handleSwitchSide(s)}
                  role="tab"
                  aria-selected={side === s}
                  className="px-4 sm:px-6 py-2 sm:py-2 rounded-full text-xs font-semibold tracking-widest transition-all duration-200"
                  style={{
                    background: side === s ? "#1D1D1F" : "transparent",
                    color: side === s ? "#FBFAF7" : "#8E8E93",
                    fontFamily: "monospace",
                    minHeight: "44px",
                    display: "flex",
                    alignItems: "center",
                    touchAction: "manipulation",
                  }}
                >
                  SIDE {s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Track list — responsive */}
        <AnimatePresence>
          {inserted && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="w-full max-w-sm mt-3 sm:mt-4 px-0"
            >
              <TrackList
                key={side}
                tracks={playerTracks}
                currentIndex={currentIndex}
                isPlaying={isPlaying}
                side={side}
                onSelectTrack={handleSelectTrack}
                accentColor={accentColor}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* J-card / Dedication — responsive */}
        <AnimatePresence>
          {inserted && tape.dedication && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="w-full max-w-sm mt-3 sm:mt-4 px-0"
            >
              <button
                onClick={() => setShowDedication(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 sm:py-3 rounded-xl transition-all hover:opacity-80"
                style={{
                  background: "#FFFEF4",
                  border: "1px solid #EDE8D0",
                  boxShadow: "1px 1px 6px rgba(0,0,0,0.05)",
                  minHeight: "44px",
                  touchAction: "manipulation",
                }}
              >
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 3h10M2 6h10M2 9h7" stroke="#A07840" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <span className="text-xs tracking-widest uppercase"
                    style={{ color: "#A07840", fontFamily: "monospace", fontWeight: 600 }}>
                    Liner Notes
                  </span>
                </div>
                <span className="text-xs" style={{ color: "#8E8E93" }}>
                  {showDedication ? "▲" : "▼"}
                </span>
              </button>

              <AnimatePresence>
                {showDedication && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div
                      className="px-5 py-5 rounded-b-xl note-paper paper-grain"
                      style={{ borderTop: "none" }}
                    >
                      <p
                        className="text-sm leading-relaxed"
                        style={{
                          color: "#3D2010",
                          fontFamily: "'Playfair Display', Georgia, serif",
                          fontStyle: "italic",
                          lineHeight: "1.75",
                        }}
                      >
                        &ldquo;{tape.dedication}&rdquo;
                      </p>
                      <p className="text-xs mt-3" style={{ color: "#A07840", fontFamily: "monospace" }}>
                        — {tape.senderName}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Share button */}
        <AnimatePresence>
          {inserted && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="mt-5"
            >
              <ShareButton
                title={tape.title ?? "A tape was made for you"}
                senderName={tape.senderName}
                publicId={tape.publicId}
                tapeId={tape.id}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Make One Back */}
        <AnimatePresence>
          {showMakeOne && !isPreview && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-6 pb-6"
            >
              <a
                href={`/create?for=${encodeURIComponent(tape.senderName)}&from=${tape.publicId}`}
                onClick={() => trackClientEvent(CLIENT_EVENTS.MAKE_ONE_BACK_CLICKED, {
                  tapeId: tape.publicId,
                  senderName: tape.senderName,
                })}
                className="btn-primary text-sm inline-flex"
                style={{ textDecoration: "none" }}
              >
                Make One Back ❤
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* End of Content wrapper */}
      </div>

      {/* ── PLAYER BAR ──────────────────────────────────────────────────── */}
      {inserted && (
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
          onTrackSelect={handleSelectTrack}
          onTimeUpdate={(elapsed, duration) => {
            durationRef.current = duration;
            setProgress(elapsed / duration);
          }}
          accentColor={accentColor}
        />
      )}
    </div>
  );
}
