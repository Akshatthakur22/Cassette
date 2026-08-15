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
  const [leaving, setLeaving] = useState(false);

  const colorConfig = TAPE_COLOR_MAP[style] ?? TAPE_COLOR_MAP.cream;

  // Map all 10 new colors to closest legacy style for CassetteCase SVG
  const legacyStyle: "classic" | "y2k" | "love" | "road_trip" | "school" | "summer" =
    style === "y2k" ? "y2k" :
    style === "love" ? "love" :
    style === "road_trip" ? "road_trip" :
    style === "school" ? "school" :
    style === "summer" ? "summer" :
    "classic";

  async function handleOpen() {
    if (state !== "closed") return;
    setState("opening");
    await playCaseOpenSound(true);
    setTimeout(() => setState("open"), 500);
    setTimeout(() => setLeaving(true), 1500);
    setTimeout(() => onOpen(), 2100);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: leaving ? 0.5 : 0.45 }}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center px-3 sm:px-6 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #D4C5B9 0%, #E8DDD0 50%, #D9CEBD 100%)",
      }}
    >
      {/* Vintage paper texture overlay */}
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

      {/* Subtle vignette around edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.08) 100%)",
        }}
      />

      {/* LEFT SIDE PROPS - Film frame & sticky note */}
      <motion.div
        className="absolute left-4 sm:left-8 top-16 sm:top-20 z-0 hidden md:block"
        initial={{ opacity: 0, x: -20, rotateZ: -8 }}
        animate={{ opacity: 1, x: 0, rotateZ: -12 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <div
          className="w-16 h-24 bg-white rounded-sm shadow-lg"
          style={{
            background: "linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.5)",
            border: "2px solid #e0e0e0",
            transform: "perspective(600px) rotateX(2deg) rotateY(-8deg)",
          }}
        >
          <PosterImage imageNumber={20} width={64} height={96} rotation={0} />
        </div>
        {/* Attached sticky note */}
        <motion.div
          className="absolute -bottom-6 -right-4 text-xs font-handwritten"
          initial={{ rotateZ: 15 }}
          animate={{ rotateZ: 8 }}
        >
          <div
            className="w-20 h-20 bg-yellow-100 rounded-sm p-2 text-center flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #FFF7B3 0%, #FFFACD 100%)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              fontSize: "9px",
              color: "#333",
              fontFamily: "cursive",
              lineHeight: "1.2",
            }}
          >
            For my<br />favorite
          </div>
        </motion.div>
      </motion.div>

      {/* RIGHT SIDE PROPS - Film frame & tracklist note */}
      <motion.div
        className="absolute right-4 sm:right-8 top-24 sm:top-28 z-0 hidden md:block"
        initial={{ opacity: 0, x: 20, rotateZ: 8 }}
        animate={{ opacity: 1, x: 0, rotateZ: 10 }}
        transition={{ delay: 0.25, duration: 0.8 }}
      >
        <div
          className="w-16 h-24 bg-white rounded-sm shadow-lg"
          style={{
            background: "linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.5)",
            border: "2px solid #e0e0e0",
            transform: "perspective(600px) rotateX(2deg) rotateY(8deg)",
          }}
        >
          <PosterImage imageNumber={21} width={64} height={96} rotation={0} />
        </div>
        {/* Tracklist sticky note */}
        <motion.div
          className="absolute -bottom-8 -left-8 text-xs"
          initial={{ rotateZ: -15 }}
          animate={{ rotateZ: -12 }}
        >
          <div
            className="w-24 h-28 bg-yellow-100 rounded-sm p-1.5 text-left flex flex-col justify-center"
            style={{
              background: "linear-gradient(135deg, #FFFACD 0%, #FFF7B3 100%)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              fontSize: "7px",
              color: "#333",
              fontFamily: "cursive",
              lineHeight: "1.3",
              overflow: "hidden",
            }}
          >
            <div>01. Ik Tera</div>
            <div>02. Nadaan</div>
            <div>03. Tum Hi Ho</div>
            <div>04. Phir Le</div>
            <div>05. Rockstar ❤️</div>
          </div>
        </motion.div>
      </motion.div>

      {/* BOTTOM RIGHT - Headphones silhouette */}
      <motion.div
        className="absolute bottom-8 right-6 sm:right-12 z-0 hidden lg:block"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        style={{
          width: "120px",
          height: "80px",
          opacity: 0.7,
        }}
      >
        <svg viewBox="0 0 120 80" className="w-full h-full" style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))" }}>
          {/* Headphone band */}
          <path d="M 20 60 Q 20 30 60 25 Q 100 30 100 60" stroke="#333" strokeWidth="6" fill="none" strokeLinecap="round" />
          {/* Left ear cup */}
          <circle cx="30" cy="60" r="14" fill="#2a2a2a" opacity="0.8" />
          <circle cx="30" cy="60" r="10" fill="#1a1a1a" />
          {/* Right ear cup */}
          <circle cx="90" cy="60" r="14" fill="#2a2a2a" opacity="0.8" />
          <circle cx="90" cy="60" r="10" fill="#1a1a1a" />
        </svg>
      </motion.div>

      {/* CENTER CONTENT */}
      <div className="relative z-20 flex flex-col items-center gap-4 sm:gap-6 w-full max-w-md">

        {/* Header with vintage styling */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center pt-4 sm:pt-6"
        >
          <p 
            className="text-[9px] sm:text-[10px] tracking-[0.4em] uppercase mb-2 sm:mb-3"
            style={{ color: "#6B5B47", fontFamily: "monospace", letterSpacing: "0.08em" }}
          >
            a tape was made for
          </p>
          <h1
            className="font-bold italic leading-tight mb-2"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(28px, 6vw, 48px)",
              color: "#3D2817",
              letterSpacing: "-0.03em",
              textShadow: "0 1px 2px rgba(255,255,255,0.5)",
            }}
          >
            {recipientName || "You"}
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-xs sm:text-sm italic"
            style={{ color: "#6B5B47", fontFamily: "'Playfair Display', serif" }}
          >
            by {senderName}
          </motion.p>
        </motion.div>

        {/* CASSETTE TAPE - Realistic 3D presentation */}
        <motion.div
          className="w-full max-w-xs cursor-pointer perspective"
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          onClick={handleOpen}
          whileHover={state === "closed" && !reduceMotion ? { scale: 1.05, y: -8 } : {}}
          whileTap={state === "closed" ? { scale: 0.94 } : {}}
          style={{
            transformStyle: "preserve-3d",
            perspective: "1200px",
          }}
        >
          {/* Deep shadow beneath tape */}
          <motion.div
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-4/5 h-8 pointer-events-none"
            animate={{
              opacity: state === "closed" && !leaving ? 0.25 : 0.08,
            }}
            style={{
              background: "radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, transparent 70%)",
              filter: "blur(8px)",
            }}
          />

          {/* Realistic cassette tape with enhanced depth */}
          <motion.div
            className="relative rounded-lg overflow-hidden"
            animate={{
              rotateX: state === "opening" ? -15 : 0,
              rotateY: state === "opening" ? 8 : 0,
            }}
            transition={{ duration: 0.6 }}
            style={{
              background: "linear-gradient(135deg, #C9B8A8 0%, #D4C5B9 50%, #BFA894 100%)",
              boxShadow: `
                0 20px 60px rgba(0,0,0,0.3),
                0 10px 30px rgba(0,0,0,0.2),
                inset 0 1px 0 rgba(255,255,255,0.4),
                inset 0 -2px 4px rgba(0,0,0,0.1)
              `,
              border: "1px solid rgba(0,0,0,0.15)",
              aspectRatio: "16/10",
              position: "relative",
            }}
          >
            {/* Metallic rivets in corners */}
            {[
              { pos: "top-2 left-2" },
              { pos: "top-2 right-2" },
              { pos: "bottom-2 left-2" },
              { pos: "bottom-2 right-2" },
            ].map((rivet, i) => (
              <div
                key={i}
                className={`absolute w-2.5 h-2.5 rounded-full ${rivet.pos}`}
                style={{
                  background: "radial-gradient(circle at 30% 30%, #e8e0d0, #8b8680)",
                  boxShadow: "inset -1px -1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)",
                }}
              />
            ))}

            {/* Tape spools visible through window */}
            <div className="absolute inset-6 flex items-center justify-between">
              {/* Left spool */}
              <motion.div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                animate={state === "opening" ? { rotateZ: 360 } : { rotateZ: 0 }}
                transition={{ duration: 2, repeat: state === "opening" ? 1 : 0, ease: "linear" }}
                style={{
                  background: "radial-gradient(circle at 30% 30%, #e8dcc8, #8b7d6b)",
                  boxShadow: "inset -2px -2px 4px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)",
                }}
              >
                <div className="w-4 h-4 rounded-full bg-black opacity-80" />
              </motion.div>

              {/* Center label area */}
              <div className="flex-1 mx-3 flex flex-col items-center justify-center">
                <div
                  className="w-full bg-gradient-to-b from-yellow-50 to-yellow-100 rounded px-2 py-1 text-center border border-yellow-200"
                  style={{
                    boxShadow: "inset 0 1px 2px rgba(255,255,255,0.6)",
                  }}
                >
                  <p className="text-xs font-bold text-amber-900" style={{ fontFamily: "serif", fontSize: "10px" }}>
                    Untitled
                  </p>
                  <p className="text-[8px] text-amber-800">Tape</p>
                </div>
                <p className="text-[7px] text-gray-700 mt-1 font-mono">TDK 90</p>
              </div>

              {/* Right spool */}
              <motion.div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                animate={state === "opening" ? { rotateZ: 360 } : { rotateZ: 0 }}
                transition={{ duration: 2, repeat: state === "opening" ? 1 : 0, ease: "linear" }}
                style={{
                  background: "radial-gradient(circle at 30% 30%, #e8dcc8, #8b7d6b)",
                  boxShadow: "inset -2px -2px 4px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)",
                }}
              >
                <div className="w-4 h-4 rounded-full bg-black opacity-80" />
              </motion.div>
            </div>

            {/* Visible tape strip in window */}
            <div
              className="absolute inset-6 flex items-center pointer-events-none"
              style={{
                background: "linear-gradient(90deg, transparent 5%, rgba(0,0,0,0.15) 50%, transparent 95%)",
              }}
            />
          </motion.div>

          {/* Reveal glow pulse when opening */}
          {state !== "closed" && (
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-lg"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 0 }}
              transition={{
                duration: state === "opening" ? 0.9 : 1.3,
                ease: "easeOut",
              }}
              style={{
                background: `radial-gradient(ellipse, ${colorConfig.glow} 0%, transparent 60%)`,
              }}
            />
          )}

          {/* Opening flash effect */}
          {state === "opening" && (
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.35, 0] }}
              transition={{ duration: 0.7, ease: "easeOut", times: [0, 0.35, 1] }}
              style={{
                background: `linear-gradient(135deg, ${colorConfig.accent}45 0%, ${colorConfig.accent}15 100%)`,
              }}
            />
          )}
        </motion.div>

        {/* Instruction text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-xs sm:text-sm italic text-center"
          style={{ color: "#6B5B47", fontFamily: "monospace", letterSpacing: "0.05em" }}
        >
          Insert the tape and press play ♪
        </motion.p>

        {/* Play button with vintage styling */}
        <AnimatePresence>
          {state === "closed" && (
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              onClick={handleOpen}
              className="relative overflow-hidden px-8 sm:px-12 py-3 font-semibold rounded-lg text-white text-sm sm:text-base w-full max-w-xs"
              style={{
                background: `linear-gradient(135deg, ${colorConfig.accent} 0%, ${colorConfig.accent}dd 100%)`,
                boxShadow: `0 8px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)`,
                border: "1px solid rgba(0,0,0,0.1)",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                touchAction: "manipulation",
              }}
              whileHover={reduceMotion ? {} : {
                scale: 1.05,
                boxShadow: `0 12px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)`,
              }}
              whileTap={{ scale: 0.92 }}
            >
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                }}
              />
              <span className="relative z-10">Open It</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Success message */}
        <AnimatePresence>
          {state === "open" && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-center"
            >
              <p className="text-sm sm:text-base italic mb-1" style={{ color: colorConfig.accent, fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                ✨ Perfect ✨
              </p>
              <p className="text-xs" style={{ color: "#6B5B47", fontFamily: "monospace", letterSpacing: "0.08em" }}>
                Taking you inside…
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
