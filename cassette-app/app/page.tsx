"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import HeroScene from "./components/HeroScene";
import { createTapeHiss, setSoundsEnabled, getSoundsEnabled } from "./lib/sounds";

export default function LandingPage() {
  const [soundOn, setSoundOn] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [reelDragging, setReelDragging] = useState(false);
  const hissRef = useRef<ReturnType<typeof createTapeHiss> | null>(null);

  // Reel drag interaction
  const reelRotation = useMotionValue(0);
  const reelSpring = useSpring(reelRotation, { stiffness: 180, damping: 22 });

  // Scene entrance sequencing
  useEffect(() => {
    const t = setTimeout(() => setSceneReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Ambient tape hiss
  const toggleSound = useCallback(() => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundsEnabled(next);
    if (next) {
      if (!hissRef.current) hissRef.current = createTapeHiss(0.015);
      hissRef.current.start();
    } else {
      hissRef.current?.stop();
    }
  }, [soundOn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { hissRef.current?.stop(); };
  }, []);

  // Reel drag — springs back
  function handleReelDragStart() { setReelDragging(true); }
  function handleReelDragEnd() {
    setReelDragging(false);
    reelRotation.set(0);
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden flex flex-col"
      style={{ background: "#060408" }}
    >
      <HeroScene />

      {/* Minimal floating UI */}
      <div className="relative z-10 flex flex-col flex-1">

        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: sceneReady ? 1 : 0 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="pt-8 px-8 flex items-center justify-between"
        >
          <span className="text-xs tracking-[0.35em] uppercase"
            style={{ color: "#6B5E4E", fontFamily: "monospace" }}>
            CASSETTE
          </span>
          {/* Sound toggle */}
          <button
            onClick={toggleSound}
            className="text-xs font-mono tracking-wide transition-all hover:opacity-70 flex items-center gap-1.5"
            style={{ color: soundOn ? "#D4882A" : "#3D2B1F" }}
            aria-label={`Sound ${soundOn ? "on" : "off"}`}
          >
            <span>{soundOn ? "◉" : "○"}</span>
            <span className="hidden sm:inline">{soundOn ? "sound on" : "sound off"}</span>
          </button>
        </motion.div>

        {/* Hero — headline + interactive cassette */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-10">

          {/* Headline — sequenced entrance */}
          <div className="text-center">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: sceneReady ? 1 : 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-xs tracking-[0.35em] uppercase mb-5"
              style={{ color: "#6B5E4E", fontFamily: "monospace" }}
            >
              DIGITAL MIXTAPES
            </motion.p>

            <div className="overflow-hidden">
              <motion.h1
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: sceneReady ? 0 : 60, opacity: sceneReady ? 1 : 0 }}
                transition={{ duration: 0.9, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.06] tracking-tight"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: "italic",
                  color: "#F5F0E8",
                  textShadow: "0 4px 40px rgba(212,136,42,0.18)",
                }}
              >
                Put your feelings
              </motion.h1>
            </div>

            <div className="overflow-hidden">
              <motion.h1
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: sceneReady ? 0 : 60, opacity: sceneReady ? 1 : 0 }}
                transition={{ duration: 0.9, delay: 0.95, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.06] tracking-tight"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: "italic",
                  color: "#F5F0E8",
                  textShadow: "0 4px 40px rgba(212,136,42,0.18)",
                }}
              >
                on tape.
              </motion.h1>
            </div>
          </div>

          {/* Interactive mini-cassette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: sceneReady ? 1 : 0, scale: sceneReady ? 1 : 0.85, y: sceneReady ? 0 : 20 }}
            transition={{ duration: 0.8, delay: 1.15, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xs"
          >
            <InteractiveMiniCassette
              reelSpring={reelSpring}
              reelRotation={reelRotation}
              dragging={reelDragging}
              onDragStart={handleReelDragStart}
              onDragEnd={handleReelDragEnd}
              soundOn={soundOn}
              onSoundToggle={toggleSound}
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.7 }}
              className="text-center text-xs mt-3"
              style={{ color: "#3D2B1F", fontFamily: "monospace" }}
            >
              drag a reel ↑
            </motion.p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: sceneReady ? 1 : 0, y: sceneReady ? 0 : 16 }}
            transition={{ duration: 0.7, delay: 1.35 }}
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <Link
              href="/create"
              className="px-8 py-3.5 rounded-full text-sm font-semibold tracking-wide transition-all hover:opacity-90 active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #D4882A 0%, #C4503A 100%)",
                color: "#F5F0E8",
                boxShadow: "0 4px 32px rgba(212,136,42,0.3), 0 1px 0 rgba(255,255,255,0.08) inset",
                fontFamily: "var(--font-inter, Inter, sans-serif)",
              }}
            >
              MAKE A TAPE
            </Link>
            <Link
              href="/tape-demo"
              className="px-6 py-3.5 rounded-full text-sm transition-all hover:opacity-80 active:scale-[0.97]"
              style={{
                color: "#A89880",
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                letterSpacing: "0.04em",
              }}
            >
              Open a tape →
            </Link>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 1.8 }}
          className="pb-8 px-8 flex items-end justify-between"
        >
          <p className="text-xs" style={{ color: "#2A1F14", fontFamily: "monospace" }}>
            No signup required.
          </p>
          <p className="text-xs" style={{ color: "#2A1F14", fontFamily: "monospace" }}>
            Private by default.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Interactive mini-cassette SVG ───────────────────────────────────────────

function InteractiveMiniCassette({
  reelSpring,
  reelRotation,
  dragging,
  onDragStart,
  onDragEnd,
  soundOn,
  onSoundToggle,
}: {
  reelSpring: any;
  reelRotation: any;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  soundOn: boolean;
  onSoundToggle: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  function handlePointerDown(e: React.PointerEvent, reelCx: number) {
    e.currentTarget.setPointerCapture(e.pointerId);
    onDragStart();

    const startY = e.clientY;
    let current = 0;

    function onMove(ev: PointerEvent) {
      const delta = (startY - ev.clientY) * 2.5;
      current = delta;
      reelRotation.set(delta);
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      onDragEnd();
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <div ref={containerRef} className="relative">
      <svg
        viewBox="0 0 280 170"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        style={{ filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.7))" }}
      >
        <defs>
          <linearGradient id="miniShell" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2A1F14" />
            <stop offset="100%" stopColor="#0A0705" />
          </linearGradient>
          <radialGradient id="miniReel" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4A3728" />
            <stop offset="100%" stopColor="#1A120C" />
          </radialGradient>
        </defs>

        {/* Shell */}
        <rect x="4" y="4" width="272" height="162" rx="16"
          fill="url(#miniShell)" stroke="#D4882A" strokeWidth="0.8" strokeOpacity="0.3" />
        <rect x="14" y="14" width="252" height="142" rx="10"
          fill="#0A0807" fillOpacity="0.8" />

        {/* Label */}
        <rect x="68" y="18" width="144" height="134" rx="8"
          fill="linear-gradient(#C8A96E,#8B5E3C)" />
        <rect x="68" y="18" width="144" height="134" rx="8"
          fill="#D4882A" fillOpacity="0.18" />
        <text x="140" y="52" textAnchor="middle" fill="#1C0F05"
          fontSize="10" fontWeight="700"
          fontFamily="'Playfair Display',serif" fontStyle="italic">
          your mixtape
        </text>
        <text x="140" y="68" textAnchor="middle" fill="#1C0F05"
          fontSize="6" fontFamily="monospace" letterSpacing="2" opacity="0.5">
          CASSETTE
        </text>

        {/* Tape window */}
        <rect x="108" y="76" width="64" height="38" rx="4"
          fill="#050402" stroke="#D4882A" strokeWidth="0.5" strokeOpacity="0.4" />
        <rect x="109" y="85" width="62" height="8"
          fill="#3D2B1F" opacity="0.7" />

        {/* Left reel — draggable */}
        <motion.g
          style={{ rotate: reelSpring, originX: "82px", originY: "85px" }}
          className="cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => handlePointerDown(e, 82)}
        >
          <circle cx="82" cy="85" r="38" fill="#0A0807" />
          <circle cx="82" cy="85" r="28" fill="url(#miniReel)" />
          <circle cx="82" cy="85" r="16" fill="#0A0807" />
          <circle cx="82" cy="85" r="6" fill="#050402" />
          {[0,60,120,180,240,300].map(a => {
            const r = (a * Math.PI) / 180;
            return <line key={a}
              x1={82 + Math.cos(r)*16} y1={85 + Math.sin(r)*16}
              x2={82 + Math.cos(r)*28} y2={85 + Math.sin(r)*28}
              stroke="#D4882A" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round" />;
          })}
          {[18,22,26].map(r => (
            <circle key={r} cx="82" cy="85" r={r} fill="none"
              stroke="#3D2B1F" strokeWidth="1" opacity="0.4" />
          ))}
        </motion.g>

        {/* Right reel — same spring */}
        <motion.g
          style={{ rotate: reelSpring, originX: "198px", originY: "85px" }}
          className="cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => handlePointerDown(e, 198)}
        >
          <circle cx="198" cy="85" r="38" fill="#0A0807" />
          <circle cx="198" cy="85" r="28" fill="url(#miniReel)" />
          <circle cx="198" cy="85" r="16" fill="#0A0807" />
          <circle cx="198" cy="85" r="6" fill="#050402" />
          {[0,60,120,180,240,300].map(a => {
            const r = (a * Math.PI) / 180;
            return <line key={a}
              x1={198 + Math.cos(r)*16} y1={85 + Math.sin(r)*16}
              x2={198 + Math.cos(r)*28} y2={85 + Math.sin(r)*28}
              stroke="#D4882A" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round" />;
          })}
          {[18,22,26].map(r => (
            <circle key={r} cx="198" cy="85" r={r} fill="none"
              stroke="#3D2B1F" strokeWidth="1" opacity="0.4" />
          ))}
        </motion.g>
      </svg>

      {/* Spring-back hint — bouncy indicator when dragging */}
      {dragging && (
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{ boxShadow: "inset 0 0 0 1px rgba(212,136,42,0.3)" }}
        />
      )}
    </div>
  );
}
