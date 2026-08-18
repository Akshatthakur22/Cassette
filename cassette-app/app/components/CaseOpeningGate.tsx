"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CassetteCase from "./CassetteCase";
import { playCaseOpenSound, playClickSound } from "@/app/lib/sounds";
import { useReduceMotion } from "@/app/lib/use-reduce-motion";
import type { TapeColorKey } from "./CassetteObject";

interface CaseOpeningGateProps {
  title: string;
  senderName: string;
  recipientName: string;
  style: TapeColorKey;
  onOpen: () => void;
}

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
  school:      { accent: "#4A5F8F", glow: "rgba(74,95,143,0.12)" },
  summer:      { accent: "#F5A623", glow: "rgba(245,166,35,0.14)" },
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
  const [isInserting, setIsInserting] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const colorConfig = TAPE_COLOR_MAP[style] ?? TAPE_COLOR_MAP.cream;

  async function handleOpenCase() {
    if (state !== "closed") return;
    setState("opening");
    await playCaseOpenSound(true);
    setTimeout(() => {
      setState("open");
    }, 700);
  }

  async function handleExtractTape() {
    setIsInserting(true);
    await playClickSound(true);
    setTimeout(() => {
      setLeaving(true);
      setTimeout(() => {
        onOpen();
      }, 500);
    }, 450);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: leaving ? 0.45 : 0.4 }}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #D4C5B9 0%, #E8DDD0 50%, #D9CEBD 100%)",
      }}
    >
      {/* Vintage paper texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px),
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)
          `,
          mixBlendMode: "multiply",
        }}
      />

      {/* Subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.08) 100%)",
        }}
      />

      {/* Main Unboxing Container */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full gap-6 text-center">
        
        {/* Header Branding */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center"
        >
          <p
            className="text-[10px] sm:text-xs font-mono tracking-[0.25em] uppercase mb-1.5"
            style={{ color: "#7A6D5E" }}
          >
            CASSETTE.FM · PERSONAL GIFT
          </p>
          <h1
            className="text-2xl sm:text-3xl font-bold italic"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: "#1D1D1F",
            }}
          >
            A tape was made for you ❤️
          </h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: "#6B5B47" }}>
            from <strong className="font-semibold text-[#1D1D1F]">{senderName}</strong> for{" "}
            <strong className="font-semibold text-[#1D1D1F]">{recipientName}</strong>
          </p>
        </motion.div>

        {/* Photorealistic Acrylic Cassette Case */}
        <motion.div
          initial={{ scale: 0.9, y: 16, opacity: 0 }}
          animate={{
            scale: isInserting ? 1.05 : 1,
            y: isInserting ? -24 : 0,
            opacity: 1,
          }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-xs sm:max-w-sm relative cursor-pointer"
          onClick={state === "closed" ? handleOpenCase : undefined}
        >
          <CassetteCase
            state={state}
            style={style}
            title={title}
            recipientName={recipientName}
            senderName={senderName}
          />
        </motion.div>

        {/* Unboxing Action Buttons */}
        <div className="w-full flex flex-col items-center gap-3">
          <AnimatePresence mode="wait">
            {state === "closed" && (
              <motion.button
                key="open-btn"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                onClick={handleOpenCase}
                whileHover={reduceMotion ? {} : { scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                className="w-full max-w-xs py-3.5 px-6 rounded-full font-semibold text-sm sm:text-base text-white flex items-center justify-center gap-2 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${colorConfig.accent} 0%, #C4503A 100%)`,
                  boxShadow: `0 8px 24px ${colorConfig.glow}, 0 2px 6px rgba(0,0,0,0.15)`,
                  minHeight: "48px",
                }}
              >
                <span>🎁</span>
                <span>Unwrap & Open Case</span>
              </motion.button>
            )}

            {(state === "open" || state === "opening") && (
              <motion.div
                key="insert-btn"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full flex flex-col items-center gap-2"
              >
                <motion.button
                  onClick={handleExtractTape}
                  disabled={isInserting}
                  whileHover={reduceMotion ? {} : { scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  className="w-full max-w-xs py-3.5 px-6 rounded-full font-semibold text-sm sm:text-base text-white flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, #1D1D1F 0%, #3A3530 100%)`,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                    minHeight: "48px",
                  }}
                >
                  <span>▶</span>
                  <span>{isInserting ? "Inserting Tape…" : "Take Out Tape & Listen"}</span>
                </motion.button>

                <p className="text-[11px] font-mono" style={{ color: "#7A6D5E" }}>
                  ♫ Ready to load into deck
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
}
