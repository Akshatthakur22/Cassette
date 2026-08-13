"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PosterImage } from "./PosterImage";
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

const TOTAL_DURATION = 7500; // ms — slightly longer for enhanced visuals

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
  const [peakLevel, setPeakLevel] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [tapeSpinAmount, setTapeSpinAmount] = useState([0, 0]); // Tape wound on each reel
  const counterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const vuRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Phase 1: button press animation — fires immediately
    playRecordPressSound(true);

    const t1 = setTimeout(async () => {
      setPhase("engage");
      await playReelsEngageSound(true);
      setRecOn(true);
    }, 700);

    const t2 = setTimeout(() => {
      setPhase("recording");
      let count = 0;
      let progressVal = 0;
      let reel0Spin = 0;
      let reel1Spin = 0;

      // Analog counter — ticks up to ~250+ over recording
      counterRef.current = setInterval(() => {
        count += Math.floor(Math.random() * 5) + 1;
        setCounter(Math.min(count, 280));
      }, 70);

      // VU meter — more realistic audio simulation
      vuRef.current = setInterval(() => {
        const left = 0.2 + Math.random() * 0.75;
        const right = 0.25 + Math.random() * 0.70;
        const peak = Math.max(left, right);
        
        setVuLevels([left, right]);
        setPeakLevel(peak);
      }, 100);

      // Progress tracker
      progressRef.current = setInterval(() => {
        progressVal += Math.random() * 8 + 2;
        setProgress(Math.min(progressVal, 100));
        
        // Tape spool animation — both reels accumulate tape
        reel0Spin += Math.random() * 12 + 5;
        reel1Spin += Math.random() * 8 + 3;
        setTapeSpinAmount([reel0Spin % 360, reel1Spin % 360]);
      }, 120);

      // Track flash — each track title appears briefly
      let trackIdx = 0;
      const flashInterval = Math.max(
        500,
        Math.floor(4800 / Math.max(tracks.length, 1))
      );
      trackRef.current = setInterval(() => {
        if (trackIdx < tracks.length) {
          setFlashedTrack(tracks[trackIdx].title);
          setCurrentTrackIdx(trackIdx);
          trackIdx++;
        } else {
          if (trackRef.current) clearInterval(trackRef.current);
          setFlashedTrack(null);
        }
      }, flashInterval);
    }, 1300);

    const t3 = setTimeout(async () => {
      setPhase("stopping");
      if (counterRef.current) clearInterval(counterRef.current);
      if (vuRef.current) clearInterval(vuRef.current);
      if (trackRef.current) clearInterval(trackRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
      setVuLevels([0, 0]);
      setPeakLevel(0);
      setFlashedTrack(null);
      setRecOn(false);
      setProgress(100);
      await playStopSound(true);
    }, TOTAL_DURATION - 900);

    const t4 = setTimeout(async () => {
      setPhase("done");
      setProgress(100);
      await playSuccessSound(true);
    }, TOTAL_DURATION);

    const t5 = setTimeout(() => {
      onComplete();
    }, TOTAL_DURATION + 1200);

    return () => {
      [t1, t2, t3, t4, t5].forEach(clearTimeout);
      if (counterRef.current) clearInterval(counterRef.current);
      if (vuRef.current) clearInterval(vuRef.current);
      if (trackRef.current) clearInterval(trackRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-3 sm:px-4 md:px-6 py-6 md:py-0 overflow-y-auto"
      style={{ background: "#FBFAF7" }}
    >
      {/* Scattered poster decoration */}
      <div className="absolute top-10 left-4 z-0 opacity-55 hidden lg:block">
        <PosterImage imageNumber={18} width={70} height={100} rotation={-15} />
      </div>
      <div className="absolute bottom-20 right-6 z-0 opacity-50 hidden lg:block">
        <PosterImage imageNumber={19} width={75} height={105} rotation={10} />
      </div>

      {/* Deck casing — responsive sizing: mobile optimized, scales up to 600px max */}
      <div
        className="relative w-full rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden my-auto"
        style={{
          maxWidth: "clamp(280px, 95vw, 600px)",
          background: "linear-gradient(180deg, #F3EFE7 0%, #E8E0D0 100%)",
          border: "2px solid #D9D7D1",
          boxShadow: "0 16px 48px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
        }}
      >
        {/* Deck top bar — responsive padding */}
        <div
          className="flex items-center justify-between px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3"
          style={{ background: "rgba(0,0,0,0.04)", borderBottom: "1px solid #E8E5DF" }}
        >
          <span className="text-[9px] sm:text-[10px] md:text-xs font-mono tracking-[0.2em] sm:tracking-[0.25em] uppercase" style={{ color: "#6B5E4E" }}>
            DECK
          </span>
          {/* REC indicator */}
          <div className="flex items-center gap-1">
            <motion.div
              animate={recOn ? {
                opacity: [1, 0.2, 1],
                boxShadow: ["0 0 8px #FF2020", "0 0 2px #FF2020", "0 0 12px #FF2020"],
              } : { opacity: 0.15 }}
              transition={recOn ? { duration: 0.7, repeat: Infinity } : {}}
              className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full"
              style={{ background: recOn ? "#FF3020" : "#D9D7D1" }}
            />
            <span className="text-[8px] sm:text-[10px] font-mono tracking-widest" style={{ color: recOn ? "#FF4030" : "#8E8E93" }}>
              REC
            </span>
          </div>
        </div>

        {/* Cassette bay — responsive padding and sizing */}
        <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6">
          {/* Bay window */}
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              background: "#DDD5C4",
              border: "1px solid #C8C0B0",
              aspectRatio: "2.2 / 1",
            }}
          >
            {/* Spinning reels with tape winding visualization — responsive size */}
            <div className="absolute inset-0 flex items-center justify-between" style={{ padding: "clamp(8px, 5vw, 32px)" }}>
              {[0, 1].map((i) => {
                const reelDuration = i === 0 ? 1.2 : 1.8;
                const wobbleAmount = 1.5 + i * 0.3;
                const tapeLayers = Math.floor(tapeSpinAmount[i] / 45);
                const reelSize = Math.min(72, Math.max(56, window.innerWidth < 640 ? 56 : 72));
                
                return (
                  <motion.div
                    key={i}
                    animate={
                      phase === "recording"
                        ? { 
                            rotate: 360,
                            y: [0, wobbleAmount * 0.6, -wobbleAmount * 0.4, wobbleAmount * 0.25, 0],
                            x: [0, wobbleAmount * 0.4, -wobbleAmount * 0.35, wobbleAmount * 0.2, 0],
                          }
                        : phase === "engage"
                        ? { rotate: 120 }
                        : { rotate: 0 }
                    }
                    transition={
                      phase === "recording"
                        ? { 
                            rotate: { duration: reelDuration, repeat: Infinity, ease: "linear" },
                            y: { duration: 0.7, repeat: Infinity, ease: "easeInOut" },
                            x: { duration: 0.8, repeat: Infinity, ease: "easeInOut" },
                          }
                        : { duration: 0.5, ease: "easeOut" }
                    }
                    className="relative flex-shrink-0"
                    style={{ width: reelSize, height: reelSize }}
                  >
                    {/* Reel outer — base — responsive SVG */}
                    <svg viewBox="0 0 72 72" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                      {/* Tape layers buildup */}
                      {phase === "recording" && Array.from({ length: Math.min(tapeLayers, 6) }).map((_, layer) => (
                        <circle
                          key={`tape-${layer}`}
                          cx="36"
                          cy="36"
                          r={26 + layer * 2.5}
                          fill="none"
                          stroke="#D4A76A"
                          strokeWidth="0.8"
                          opacity={0.5 - layer * 0.08}
                        />
                      ))}

                      {/* Reel hub */}
                      <circle cx="36" cy="36" r="32" fill="#C8A870" stroke="#A07840" strokeWidth="1.2" />
                      <circle cx="36" cy="36" r="22" fill="#B89050" />
                      <circle cx="36" cy="36" r="11" fill="#987830" />
                      <circle cx="36" cy="36" r="6" fill="#7A6020" />

                      {/* Spokes — glowing when spinning */}
                      {[0, 60, 120, 180, 240, 300].map((angle) => {
                        const rad = (angle * Math.PI) / 180;
                        const x1 = +(36 + Math.cos(rad) * 11).toFixed(2);
                        const y1 = +(36 + Math.sin(rad) * 11).toFixed(2);
                        const x2 = +(36 + Math.cos(rad) * 22).toFixed(2);
                        const y2 = +(36 + Math.sin(rad) * 22).toFixed(2);
                        return (
                          <line
                            key={angle}
                            x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke="#D4882A"
                            strokeWidth="2.8"
                            strokeLinecap="round"
                            opacity={recOn ? 0.9 : 0.5}
                          />
                        );
                      })}

                      {/* Rings — indicate tape position */}
                      {[24, 27, 30].map((r) => (
                        <circle key={r} cx="36" cy="36" r={r} fill="none" stroke="#80600A" strokeWidth="0.8" opacity="0.25" />
                      ))}
                    </svg>
                  </motion.div>
                );
              })}

              {/* Tape label center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="px-5 py-3 rounded-lg text-center"
                  animate={recOn ? { scale: [1, 1.02, 1] } : {}}
                  transition={recOn ? { duration: 0.8, repeat: Infinity } : {}}
                  style={{
                    background: "rgba(212,136,42,0.15)",
                    border: "1.5px solid rgba(212,136,42,0.35)",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <p
                    className="text-[8px] font-bold uppercase tracking-wider mb-0.5"
                    style={{ color: "#D4882A", fontFamily: "monospace" }}
                  >
                    {tapeTitle || "UNTITLED"}
                  </p>
                  <p
                    className="text-[7px] font-mono"
                    style={{ color: "#A07840" }}
                  >
                    SIDE A • {tracks.length} songs
                  </p>
                </motion.div>
              </div>
            </div>

            {/* Tape strip visible through bay */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[6px]"
              style={{
                background: "linear-gradient(90deg, #C8A870, #987830, #C8A870)",
              }}
            />
          </div>

          {/* VU meters — enhanced with peak indicators — responsive */}
          <div className="mt-3 sm:mt-4 md:mt-5 flex gap-2 sm:gap-3 md:gap-4">
            {vuLevels.map((level, i) => (
              <div key={i} className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                  <div className="text-[8px] sm:text-[9px] font-mono font-bold" style={{ color: "#6B5E4E" }}>
                    {i === 0 ? "L" : "R"}
                  </div>
                  <div className="text-[7px] sm:text-[8px] font-mono" style={{ color: "#A07840" }}>
                    {Math.round(level * 100)}%
                  </div>
                </div>
                
                {/* VU meter background with markers */}
                <div className="relative h-2 sm:h-3 rounded-full overflow-hidden" style={{ background: "#E8E0D0" }}>
                  {/* Markers */}
                  <div className="absolute inset-0 flex" style={{ pointerEvents: "none" }}>
                    {[0.25, 0.5, 0.75].map((pos) => (
                      <div
                        key={pos}
                        className="h-full w-px"
                        style={{ left: `${pos * 100}%`, background: "rgba(0,0,0,0.1)" }}
                      />
                    ))}
                  </div>

                  {/* Level bar */}
                  <motion.div
                    className="h-full rounded-full"
                    animate={{ width: `${level * 100}%` }}
                    transition={{ duration: 0.12, ease: "linear" }}
                    style={{
                      background:
                        level > 0.85
                          ? "linear-gradient(90deg, #FF4500 0%, #FF2020 100%)"
                          : level > 0.65
                          ? "linear-gradient(90deg, #FFB800 0%, #D4882A 100%)"
                          : "linear-gradient(90deg, #34C759 0%, #5B7FA6 100%)",
                      boxShadow: level > 0.8 ? "0 0 8px rgba(255,32,32,0.6)" : "none",
                    }}
                  />

                  {/* Peak hold indicator — glowing dot at peak */}
                  <motion.div
                    className="absolute top-1/2 w-1.5 h-1.5 rounded-full -translate-y-1/2"
                    animate={{ left: `${peakLevel * 100}%` }}
                    transition={{ duration: 0.2 }}
                    style={{
                      background: "#FF2020",
                      boxShadow: peakLevel > 0.75 ? "0 0 12px rgba(255,32,32,0.8)" : "0 0 4px rgba(255,32,32,0.4)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Analog counter + track display + progress */}
          <div className="mt-4 space-y-3">
            
            {/* Track progress bar — shows which track is being recorded */}
            {tracks.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[7px] font-mono uppercase tracking-wider" style={{ color: "#6B5E4E" }}>
                    TRACK {currentTrackIdx + 1} OF {tracks.length}
                  </span>
                  <span className="text-[7px] font-mono" style={{ color: "#A07840" }}>
                    {Math.round(progress)}%
                  </span>
                </div>
                <div
                  className="relative h-1.5 rounded-full overflow-hidden"
                  style={{ background: "#E8E0D0", border: "1px solid #D9D7D1" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.15, ease: "linear" }}
                    style={{
                      background: "linear-gradient(90deg, #D4882A 0%, #E8901A 50%, #C4503A 100%)",
                      boxShadow: progress > 80 ? "0 0 6px rgba(212,136,42,0.7)" : "none",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Counter + Track display */}
            <div className="flex items-center justify-between gap-2">
              {/* Counter — 3-digit mechanical style */}
              <div
                className="flex gap-0.5 px-2.5 py-1.5 rounded"
                style={{ background: "rgba(0,0,0,0.08)", border: "1px solid #D9D7D1" }}
              >
                {String(counter).padStart(3, "0").split("").map((digit, i) => (
                  <motion.span
                    key={`${i}-${digit}`}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.05 }}
                    className="text-sm font-mono font-bold w-5 text-center"
                    style={{
                      color: "#D4882A",
                      fontVariantNumeric: "tabular-nums",
                      textShadow: "0 0 8px rgba(212,136,42,0.5)",
                    }}
                  >
                    {digit}
                  </motion.span>
                ))}
              </div>

              {/* Track flash display — shows currently recording track */}
              <div
                className="flex-1 h-8 overflow-hidden rounded flex items-center px-2"
                style={{ background: "rgba(0,0,0,0.05)", border: "1px solid #E8E5DF" }}
              >
                <AnimatePresence mode="wait">
                  {flashedTrack && (
                    <motion.div
                      key={flashedTrack}
                      initial={{ y: 12, opacity: 0, x: -10 }}
                      animate={{ y: 0, opacity: 1, x: 0 }}
                      exit={{ y: -12, opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1"
                    >
                      <p className="text-[10px] font-mono truncate" style={{ color: "#5F6065" }}>
                        <span style={{ color: "#D4882A", marginRight: "4px" }}>▶</span>
                        {flashedTrack}
                      </p>
                    </motion.div>
                  )}
                  {!flashedTrack && phase === "recording" && (
                    <motion.p
                      key="recording"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.4, 0.9, 0.4] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                      className="text-[10px] font-mono"
                      style={{ color: "#8E8E93" }}
                    >
                      recording...
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Status bar with enhanced messaging */}
        <div
          className="px-4 py-3 flex flex-col items-center justify-center gap-1.5"
          style={{ borderTop: "1px solid #E8E5DF" }}
        >
          <AnimatePresence mode="wait">
            {phase === "press" && (
              <motion.div key="press" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-center">
                <p className="text-xs font-mono tracking-widest uppercase" style={{ color: "#8E8E93" }}>
                  Get ready...
                </p>
              </motion.div>
            )}
            {phase === "engage" && (
              <motion.div key="engage" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-center">
                <p className="text-xs font-mono tracking-widest uppercase" style={{ color: "#D4882A" }}>
                  ⚙️ Reels engaging...
                </p>
                <p className="text-[10px] font-mono mt-0.5" style={{ color: "#A07840" }}>
                  Loading {tracks.length} track{tracks.length !== 1 ? 's' : ''}
                </p>
              </motion.div>
            )}
            {phase === "recording" && (
              <motion.div key="rec" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-center">
                <motion.p className="text-xs font-mono tracking-widest uppercase"
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  style={{ color: "#FF4030" }}>
                  ● RECORDING YOUR TAPE
                </motion.p>
                <p className="text-[9px] font-mono mt-1" style={{ color: "#8E8E93" }}>
                  {Math.round(progress)}% • {Math.ceil((100 - progress) / 10)} sec remaining
                </p>
              </motion.div>
            )}
            {phase === "stopping" && (
              <motion.div key="stop" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-center">
                <p className="text-xs font-mono tracking-widest uppercase" style={{ color: "#D4882A" }}>
                  ⏹ Finalizing tape...
                </p>
              </motion.div>
            )}
            {phase === "done" && (
              <motion.div key="done"
                initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="text-center py-1">
                <motion.p
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="text-sm font-bold italic"
                  style={{ color: "#1D1D1F", fontFamily: "'Playfair Display', serif", fontSize: "18px" }}>
                  ✨ Your tape is ready ✨
                </motion.p>
                <p className="text-[9px] font-mono mt-1" style={{ color: "#A07840" }}>
                  {tapeTitle} • {tracks.length} track{tracks.length !== 1 ? 's' : ''} • {Math.round(counter)} sec
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Enhanced progress bar underneath with phase indicator — responsive */}
      <div className="mt-4 sm:mt-5 md:mt-6 w-full" style={{ maxWidth: "clamp(280px, 95vw, 600px)", marginLeft: "auto", marginRight: "auto", paddingLeft: "clamp(12px, 2vw, 24px)", paddingRight: "clamp(12px, 2vw, 24px)" }}>
        <div className="flex items-center justify-between mb-1.5 sm:mb-2 text-[6px] sm:text-[7px] font-mono tracking-wider" style={{ color: "#A07840" }}>
          <span>{phase.toUpperCase()}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        
        <div
          className="relative h-0.5 sm:h-1 rounded-full overflow-hidden"
          style={{ background: "#E8E0D0", border: "1px solid #D9D7D1" }}
        >
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2, ease: "linear" }}
            style={{
              background: phase === "done"
                ? "linear-gradient(90deg, #34C759 0%, #28A858 100%)"
                : phase === "stopping"
                ? "linear-gradient(90deg, #FFB800 0%, #D4882A 100%)"
                : phase === "recording"
                ? "linear-gradient(90deg, #D4882A 0%, #E8901A 50%, #C4503A 100%)"
                : "linear-gradient(90deg, #5B7FA6 0%, #38A8E8 100%)",
              boxShadow:
                phase === "recording"
                  ? "0 0 8px rgba(212,136,42,0.6), inset 0 1px 1px rgba(255,255,255,0.3)"
                  : "inset 0 1px 1px rgba(255,255,255,0.2)",
            }}
          />
        </div>

        {/* Phase indicators below */}
        <div className="mt-1.5 sm:mt-2 flex justify-between text-[6px] sm:text-[7px] font-mono tracking-wider" style={{ color: "#D9D7D1" }}>
          <span style={{ opacity: phase === "press" || phase === "engage" ? 1 : 0.3 }}>ENGAGE</span>
          <span style={{ opacity: phase === "recording" ? 1 : 0.3 }}>RECORD</span>
          <span style={{ opacity: phase === "stopping" ? 1 : 0.3 }}>FINISH</span>
          <span style={{ opacity: phase === "done" ? 1 : 0.3 }}>DONE</span>
        </div>
      </div>
    </motion.div>
  );
}
