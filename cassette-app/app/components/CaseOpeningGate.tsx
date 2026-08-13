"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CassetteCase from "./CassetteCase";
import { PosterImage } from "./PosterImage";
import { playCaseOpenSound } from "@/app/lib/sounds";
import { useReduceMotion } from "@/app/lib/use-reduce-motion";
import type { TapeColorKey } from "./CassetteObject";

interface CaseOpeningGateProps {
  title: string;
  senderName: string;
  recipientName: string;
  style: TapeColorKey;
  onOpen: () => void;
}

/* ─── Color mapping for all 10 tape styles ─────────────────────────────── */
const TAPE_COLOR_MAP: Record<TapeColorKey, { accent: string; glow: string }> = {
  cream:       { accent: "#D4882A", glow: "rgba(212,136,42,0.12)" },
  cherry:      { accent: "#E84060", glow: "rgba(232,64,96,0.14)" },
  peach:       { accent: "#E8703A", glow: "rgba(232,112,58,0.14)" },
  butter:      { accent: "#E8C430", glow: "rgba(232,196,48,0.12)" },
  sky:         { accent: "#38A8E8", glow: "rgba(56,168,232,0.14)" },
  pool:        { accent: "#1A9898", glow: "rgba(26,152,152,0.12)" },
  lavender:    { accent: "#9060C8", glow: "rgba(144,96,200,0.14)" },
  mint:        { accent: "#28A858", glow: "rgba(40,168,88,0.12)" },
  transparent: { accent: "#38A8E8", glow: "rgba(56,168,232,0.12)" },
  smoky:       { accent: "#2E2A30", glow: "rgba(46,42,48,0.10)" },
  classic:     { accent: "#C8A96E", glow: "rgba(200,169,110,0.12)" },
  y2k:         { accent: "#E020F0", glow: "rgba(224,32,240,0.14)" },
  love:        { accent: "#D45A6A", glow: "rgba(212,90,106,0.14)" },
  road_trip:   { accent: "#5B7FA6", glow: "rgba(91,127,166,0.12)" },
};

export default function CaseOpeningGate({
  title,
  senderName,
  recipientName,
  style,
  onOpen,
}: CaseOpeningGateProps) {
  const reduceMotion = useReduceMotion();
  const [state, setState] = useState<"closed" | "opening" | "open">("closed");
  const [leaving, setLeaving] = useState(false);

  const colorConfig = TAPE_COLOR_MAP[style] ?? TAPE_COLOR_MAP.cream;

  // Map all 10 new colors to closest legacy style for CassetteCase SVG
  const legacyStyle: "classic" | "y2k" | "love" | "road_trip" =
    style === "y2k" ? "y2k" :
    style === "love" ? "love" :
    style === "road_trip" ? "road_trip" :
    "classic";

  async function handleOpen() {
    if (state !== "closed") return;
    setState("opening");
    await playCaseOpenSound(true);
    setTimeout(() => setState("open"), 350);
    setTimeout(() => setLeaving(true), 1100);
    setTimeout(() => onOpen(), 1600);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: leaving ? 0.5 : 0.45 }}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center px-6"
      style={{ background: "#FBFAF7" }}
    >
      {/* Scattered poster decoration */}
      <div className="absolute top-12 left-6 z-0 opacity-60 hidden lg:block">
        <PosterImage imageNumber={20} width={85} height={120} rotation={-18} />
      </div>
      <div className="absolute bottom-16 right-8 z-0 opacity-55 hidden lg:block">
        <PosterImage imageNumber={21} width={80} height={115} rotation={12} />
      </div>

      {/* Radial ambient glow — shifts color with tape style */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 1.2 }}
        style={{
          background: `radial-gradient(ellipse 600px 400px at 50% 35%, ${colorConfig.glow} 0%, transparent 65%)`,
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <p className="text-[10px] tracking-[0.35em] uppercase mb-2"
            style={{ color: "#8E8E93", fontFamily: "monospace" }}>
            someone made this for
          </p>
          <h1
            className="font-bold italic leading-tight"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(36px, 8vw, 52px)",
              color: "#1D1D1F",
              letterSpacing: "-0.02em",
            }}
          >
            {recipientName || "You"} ❤️
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65, duration: 0.5 }}
            className="text-sm mt-1.5"
            style={{ color: "#8E8E93", fontFamily: "monospace", letterSpacing: "0.08em" }}
          >
            from {senderName}
          </motion.p>
        </motion.div>

        {/* Cassette case with 3D perspective and shadow */}
        <motion.div
          className="w-full cursor-pointer"
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          onClick={handleOpen}
          whileHover={state === "closed" && !reduceMotion ? { scale: 1.03, y: -4 } : {}}
          whileTap={state === "closed" ? { scale: 0.94 } : {}}
          style={{
            perspective: "1200px",
          }}
        >
          {/* Case shadow beneath */}
          <motion.div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-6 pointer-events-none"
            animate={{
              opacity: state === "closed" && !leaving ? 0.2 : 0.05,
              scaleY: state === "closed" && !leaving ? 1 : 0.7,
            }}
            style={{
              background: "radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)",
              filter: "blur(6px)",
            }}
          />

          <CassetteCase
            state={state}
            style={legacyStyle}
            title={title}
            recipientName={recipientName}
            senderName={senderName}
          />
        </motion.div>

        {/* Open button with shimmer */}
        <AnimatePresence>
          {state === "closed" && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              onClick={handleOpen}
              className="relative overflow-hidden btn-primary text-sm px-12 py-3.5 font-medium rounded-full"
              style={{
                background: `linear-gradient(135deg, ${colorConfig.accent} 0%, ${colorConfig.accent}dd 100%)`,
                boxShadow: `0 4px 12px rgba(0,0,0,0.15)`,
              }}
              whileHover={reduceMotion ? {} : {
                scale: 1.04,
                boxShadow: `0 12px 32px rgba(0,0,0,0.2)`,
              }}
              whileTap={{ scale: 0.93 }}
            >
              {/* Shimmer overlay */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
                }}
              />
              <span className="relative z-10">Open it</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* "Taking you inside" hint with fade */}
        <AnimatePresence>
          {state === "open" && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-sm italic"
              style={{ color: "#8E8E93", fontFamily: "'Playfair Display', serif" }}
            >
              Taking you inside…
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
