"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  playRecordPressSound,
  playReelsEngageSound,
  playStopSound,
  playSuccessSound,
  getSoundsEnabled,
} from "@/app/lib/sounds";

interface RecordingSequenceProps {
  tracks: { title: string; artist?: string | null }[];
  tapeTitle: string;
  onComplete: () => void;
}

const TOTAL_DURATION = 6000; // ms — total recording animation

export default function RecordingSequence({
  tracks,
  tapeTitle,
  onComplete,
}: RecordingSequenceProps) {
  const [phase, setPhase] = useState<
    "press" | "engage" | "recording" | "stopping" | "done"
  >("press");
  const [counter, setCounter] = useState(0);
  const [flashedTrack, setFlashedTrack] = useState<string | null>(null);
  const [recOn, setRecOn] = useState(false);
  const [vuLevels, setVuLevels] = useState([0.5, 0.5]);
  const counterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const vuRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Phase 1: button press animation — fires immediately
    playRecordPressSound(true);

    const t1 = setTimeout(async () => {
      setPhase("engage");
      await playReelsEngageSound(true);
      setRecOn(true);
    }, 600);

    const t2 = setTimeout(() => {
      setPhase("recording");

      // Analog counter — ticks up to ~200 over 4s
      let count = 0;
      counterRef.current = setInterval(() => {
        count += Math.floor(Math.random() * 4) + 1;
        setCounter(Math.min(count, 200));
      }, 80);

      // VU meter — random pulsing
      vuRef.current = setInterval(() => {
        setVuLevels([
          0.3 + Math.random() * 0.65,
          0.25 + Math.random() * 0.70,
        ]);
      }, 120);

      // Track flash — each track title appears briefly
      let trackIdx = 0;
      const flashInterval = Math.max(
        400,
        Math.floor(3600 / Math.max(tracks.length, 1))
      );
      trackRef.current = setInterval(() => {
        if (trackIdx < tracks.length) {
          setFlashedTrack(tracks[trackIdx].title);
          trackIdx++;
        } else {
          if (trackRef.current) clearInterval(trackRef.current);
          setFlashedTrack(null);
        }
      }, flashInterval);
    }, 1200);

    const t3 = setTimeout(async () => {
      setPhase("stopping");
      if (counterRef.current) clearInterval(counterRef.current);
      if (vuRef.current) clearInterval(vuRef.current);
      if (trackRef.current) clearInterval(trackRef.current);
      setVuLevels([0, 0]);
      setFlashedTrack(null);
      setRecOn(false);
      await playStopSound(true);
    }, TOTAL_DURATION - 800);

    const t4 = setTimeout(async () => {
      setPhase("done");
      await playSuccessSound(true);
    }, TOTAL_DURATION);

    const t5 = setTimeout(() => {
      onComplete();
    }, TOTAL_DURATION + 900);

    return () => {
      [t1, t2, t3, t4, t5].forEach(clearTimeout);
      if (counterRef.current) clearInterval(counterRef.current);
      if (vuRef.current) clearInterval(vuRef.current);
      if (trackRef.current) clearInterval(trackRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "#050305" }}
    >
      {/* Deck casing */}
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #1A1410 0%, #0D0A07 100%)",
          border: "2px solid #2A1F14",
          boxShadow: "0 0 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {/* Deck top bar */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        >
          <span className="text-[10px] font-mono tracking-[0.25em] uppercase" style={{ color: "#6B5E4E" }}>
            CASSETTE DECK
          </span>
          {/* REC indicator */}
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={recOn ? {
                opacity: [1, 0.2, 1],
                boxShadow: ["0 0 8px #FF2020", "0 0 2px #FF2020", "0 0 12px #FF2020"],
              } : { opacity: 0.15 }}
              transition={recOn ? { duration: 0.7, repeat: Infinity } : {}}
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: recOn ? "#FF3020" : "#3D1A1A" }}
            />
            <span className="text-[10px] font-mono tracking-widest" style={{ color: recOn ? "#FF4030" : "#3D1A1A" }}>
              REC
            </span>
          </div>
        </div>

        {/* Cassette bay */}
        <div className="px-6 py-5">
          {/* Bay window */}
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              background: "#0A0807",
              border: "1px solid rgba(255,255,255,0.05)",
              aspectRatio: "2.2 / 1",
            }}
          >
            {/* Spinning reels */}
            <div className="absolute inset-0 flex items-center justify-between px-8">
              {[0, 1].map((i) => {
              // Reel asymmetry: left reel (i=0) spins faster, right reel (i=1) slower
              // Add subtle wobble on top of rotation
              const reelDuration = i === 0 ? 1.4 : 2.0; // Left faster, right slower
              const wobbleAmount = 2 + i * 0.5; // Slight variation in wobble
              
              return (
                <motion.div
                  key={i}
                  animate={
                    phase === "recording"
                      ? { 
                          rotate: 360,
                          y: [0, wobbleAmount * 0.5, -wobbleAmount * 0.3, wobbleAmount * 0.2, 0],
                          x: [0, wobbleAmount * 0.3, -wobbleAmount * 0.4, wobbleAmount * 0.2, 0],
                        }
                      : phase === "engage"
                      ? { rotate: 90 }
                      : { rotate: 0 }
                  }
                  transition={
                    phase === "recording"
                      ? { 
                          rotate: { duration: reelDuration, repeat: Infinity, ease: "linear" },
                          y: { duration: 0.6, repeat: Infinity, ease: "easeInOut" },
                          x: { duration: 0.7, repeat: Infinity, ease: "easeInOut" },
                        }
                      : { duration: 0.4, ease: "easeOut" }
                  }
                  className="relative"
                  style={{ width: 64, height: 64 }}
                >
                  {/* Reel outer */}
                  <svg viewBox="0 0 64 64" width="64" height="64">
                    <circle cx="32" cy="32" r="30" fill="#1A1208" stroke="#3D2B1F" strokeWidth="1" />
                    <circle cx="32" cy="32" r="20" fill="#2A1F14" />
                    <circle cx="32" cy="32" r="10" fill="#0D0A07" />
                    <circle cx="32" cy="32" r="5" fill="#1A1208" />
                    {[0, 60, 120, 180, 240, 300].map((angle) => {
                      const rad = (angle * Math.PI) / 180;
                      const x1 = +(32 + Math.cos(rad) * 10).toFixed(4);
                      const y1 = +(32 + Math.sin(rad) * 10).toFixed(4);
                      const x2 = +(32 + Math.cos(rad) * 20).toFixed(4);
                      const y2 = +(32 + Math.sin(rad) * 20).toFixed(4);
                      return (
                        <line
                          key={angle}
                          x1={x1} y1={y1} x2={x2} y2={y2}
                          stroke="#D4882A"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          opacity="0.7"
                        />
                      );
                    })}
                    {[22, 25, 28].map((r) => (
                      <circle key={r} cx="32" cy="32" r={r} fill="none" stroke="#3D2B1F" strokeWidth="1" opacity="0.4" />
                    ))}
                  </svg>
                </motion.div>
              );
            })}

              {/* Tape label center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="px-4 py-2 rounded-lg text-center"
                  style={{
                    background: "rgba(212,136,42,0.12)",
                    border: "1px solid rgba(212,136,42,0.2)",
                    maxWidth: "120px",
                  }}
                >
                  <p
                    className="text-[9px] font-bold uppercase tracking-widest truncate"
                    style={{ color: "#D4882A", fontFamily: "monospace" }}
                  >
                    {tapeTitle || "UNTITLED"}
                  </p>
                </div>
              </div>
            </div>

            {/* Tape strip visible through bay */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[6px]"
              style={{
                background: "linear-gradient(90deg, #1A0F08, #3D2B1F, #1A0F08)",
              }}
            />
          </div>

          {/* VU meters */}
          <div className="mt-4 flex gap-3">
            {vuLevels.map((level, i) => (
              <div key={i} className="flex-1">
                <div className="text-[9px] font-mono mb-1" style={{ color: "#6B5E4E" }}>
                  {i === 0 ? "L" : "R"}
                </div>
                <div
                  className="relative h-2 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    animate={{ width: `${level * 100}%` }}
                    transition={{ duration: 0.1, ease: "linear" }}
                    style={{
                      background:
                        level > 0.8
                          ? "linear-gradient(90deg, #D4882A, #FF3020)"
                          : level > 0.6
                          ? "linear-gradient(90deg, #5B7FA6, #D4882A)"
                          : "linear-gradient(90deg, #3D6B3D, #5B7FA6)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Analog counter + track display */}
          <div className="mt-3 flex items-center justify-between">
            {/* Counter — 3-digit mechanical style */}
            <div
              className="flex gap-0.5 px-2 py-1 rounded"
              style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              {String(counter).padStart(3, "0").split("").map((digit, i) => (
                <motion.span
                  key={`${i}-${digit}`}
                  initial={{ y: -8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.06 }}
                  className="text-sm font-mono w-4 text-center"
                  style={{
                    color: "#D4882A",
                    fontVariantNumeric: "tabular-nums",
                    textShadow: "0 0 8px rgba(212,136,42,0.6)",
                  }}
                >
                  {digit}
                </motion.span>
              ))}
            </div>

            {/* Track flash display */}
            <div
              className="flex-1 ml-3 h-7 overflow-hidden rounded"
              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.04)" }}
            >
              <AnimatePresence mode="wait">
                {flashedTrack && (
                  <motion.p
                    key={flashedTrack}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="text-[10px] font-mono px-2 leading-7 truncate"
                    style={{ color: "#A89880" }}
                  >
                    ▶ {flashedTrack}
                  </motion.p>
                )}
                {!flashedTrack && phase === "recording" && (
                  <motion.p
                    key="logging"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="text-[10px] font-mono px-2 leading-7"
                    style={{ color: "#6B5E4E" }}
                  >
                    recording...
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div
          className="px-4 py-2.5 flex items-center justify-center"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <AnimatePresence mode="wait">
            {phase === "press" && (
              <motion.p key="press" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-xs font-mono tracking-widest uppercase" style={{ color: "#6B5E4E" }}>
                Preparing...
              </motion.p>
            )}
            {phase === "engage" && (
              <motion.p key="engage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-xs font-mono tracking-widest uppercase" style={{ color: "#D4882A" }}>
                Reels engaging...
              </motion.p>
            )}
            {phase === "recording" && (
              <motion.p key="rec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: "#FF4030", textShadow: "0 0 8px rgba(255,64,48,0.5)" }}>
                ● Recording your tape...
              </motion.p>
            )}
            {phase === "stopping" && (
              <motion.p key="stop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-xs font-mono tracking-widest uppercase" style={{ color: "#6B5E4E" }}>
                Finishing...
              </motion.p>
            )}
            {phase === "done" && (
              <motion.p key="done"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="text-sm font-bold italic"
                style={{ color: "#F5F0E8", fontFamily: "'Playfair Display', serif",
                  textShadow: "0 0 20px rgba(245,240,232,0.4)" }}>
                Your tape is ready. ❤
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress bar underneath */}
      <div className="mt-5 w-full max-w-sm mx-4">
        <motion.div
          className="h-px rounded-full"
          initial={{ width: "0%", opacity: 0.4 }}
          animate={{ width: "100%", opacity: phase === "done" ? 0 : 0.4 }}
          transition={{ duration: TOTAL_DURATION / 1000, ease: "linear" }}
          style={{ background: "rgba(212,136,42,0.5)" }}
        />
      </div>
    </motion.div>
  );
}
