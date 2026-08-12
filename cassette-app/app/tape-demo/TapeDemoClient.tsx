"use client";
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CassetteObject, { type CassetteSide } from "@/app/components/CassetteObject";
import PlayerBar from "@/app/components/PlayerBar";
import TrackList from "@/app/components/TrackList";
import HeroScene from "@/app/components/HeroScene";
import { FAKE_TAPE, type Track } from "@/app/lib/fake-data";

export default function TapeDemoClient() {
  const tape = FAKE_TAPE;
  const [side, setSide] = useState<CassetteSide>("A");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showDedication, setShowDedication] = useState(false);

  const currentTrack: Track | undefined = tape.tracks[currentIndex];

  const handleNext = useCallback(() => {
    setProgress(0);
    setCurrentIndex(prev => {
      const next = prev + 1;
      if (next < tape.tracks.length) {
        // Sync side
        setSide(tape.tracks[next].side);
        return next;
      }
      setIsPlaying(false);
      return prev;
    });
  }, [tape.tracks]);

  const handlePrev = useCallback(() => {
    setProgress(0);
    setCurrentIndex(prev => {
      const next = Math.max(0, prev - 1);
      setSide(tape.tracks[next].side);
      return next;
    });
  }, [tape.tracks]);

  const handleSelectTrack = useCallback((index: number) => {
    setCurrentIndex(index);
    setProgress(0);
    setSide(tape.tracks[index].side);
    setIsPlaying(true);
  }, [tape.tracks]);

  const handleFlipSide = useCallback(() => {
    const newSide: CassetteSide = side === "A" ? "B" : "A";
    setSide(newSide);
    // Jump to first track of that side
    const firstIdx = tape.tracks.findIndex(t => t.side === newSide);
    if (firstIdx !== -1) {
      setCurrentIndex(firstIdx);
      setProgress(0);
    }
  }, [side, tape.tracks]);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#060408" }}>
      {/* Background scene */}
      <HeroScene />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top: tape name + recipient */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="pt-8 pb-4 text-center px-4"
        >
          <p
            className="text-xs tracking-[0.3em] uppercase mb-3"
            style={{ color: "#A89880", fontFamily: "monospace" }}
          >
            a tape was made for
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              color: "#F5F0E8",
              textShadow: "0 2px 24px rgba(212,136,42,0.3)",
            }}
          >
            {tape.recipientName} ❤
          </h1>
          <p
            className="text-sm mt-2 opacity-50"
            style={{ color: "#A89880", fontFamily: "monospace", letterSpacing: "0.1em" }}
          >
            from {tape.senderName}
          </p>
        </motion.header>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center px-4 pb-36 gap-6">
          {/* Cassette object */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <CassetteObject
              side={side}
              isPlaying={isPlaying}
              title={tape.title}
              recipientName={tape.recipientName}
              senderName={tape.senderName}
              style={tape.style}
              onFlipSide={handleFlipSide}
            />
          </motion.div>

          {/* Side A/B pill toggle */}
          <div
            className="flex rounded-full p-1 gap-1"
            style={{
              background: "rgba(28,24,20,0.7)",
              border: "1px solid rgba(245,240,232,0.08)",
              backdropFilter: "blur(10px)",
            }}
            role="group"
            aria-label="Tape side selector"
          >
            {(["A", "B"] as CassetteSide[]).map(s => (
              <button
                key={s}
                onClick={() => {
                  setSide(s);
                  const firstIdx = tape.tracks.findIndex(t => t.side === s);
                  if (firstIdx !== -1 && tape.tracks[currentIndex]?.side !== s) {
                    setCurrentIndex(firstIdx);
                    setProgress(0);
                  }
                }}
                className="px-5 py-1.5 rounded-full text-xs font-mono tracking-widest transition-all duration-200"
                style={{
                  background: side === s ? "#D4882A" : "transparent",
                  color: side === s ? "#1C1814" : "#A89880",
                  fontWeight: side === s ? "600" : "400",
                }}
                aria-pressed={side === s}
                aria-label={`Side ${s}`}
              >
                SIDE {s}
              </button>
            ))}
          </div>

          {/* Track list */}
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              <TrackList
                key={side}
                tracks={tape.tracks}
                currentIndex={currentIndex}
                isPlaying={isPlaying}
                side={side}
                onSelectTrack={handleSelectTrack}
              />
            </AnimatePresence>
          </div>

          {/* Dedication */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="w-full max-w-md"
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
              <span style={{ fontFamily: "monospace", fontSize: "11px", letterSpacing: "0.15em" }}>
                LINER NOTES
              </span>
              <span className="ml-auto" style={{ fontSize: "10px" }}>
                {showDedication ? "▲" : "▼"}
              </span>
            </button>

            <AnimatePresence>
              {showDedication && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div
                    className="px-4 py-4 rounded-b-xl"
                    style={{
                      background: "rgba(20,16,12,0.7)",
                      border: "1px solid rgba(245,240,232,0.06)",
                      borderTop: "none",
                    }}
                  >
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        color: "#C4B8A8",
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontStyle: "italic",
                        lineHeight: "1.7",
                      }}
                    >
                      &ldquo;{tape.dedication}&rdquo;
                    </p>
                    <p className="text-xs mt-3" style={{ color: "#6B5E4E", fontFamily: "monospace" }}>
                      — {tape.senderName}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Make One Back */}
          <AnimatePresence>
            {(currentIndex >= 2 || !isPlaying) && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
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

      {/* Persistent bottom player bar */}
      <PlayerBar
        tracks={tape.tracks}
        currentIndex={currentIndex}
        isPlaying={isPlaying}
        progress={progress}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onNext={handleNext}
        onPrev={handlePrev}
        onSeek={ratio => setProgress(ratio)}
        onTimeUpdate={(elapsed, duration) => {
          if (duration > 0) setProgress(elapsed / duration);
        }}
      />
    </div>
  );
}
