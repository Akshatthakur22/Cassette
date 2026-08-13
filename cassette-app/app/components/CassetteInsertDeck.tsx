"use client";

/**
 * CassetteInsertDeck
 * ──────────────────
 * A physical cassette-deck slot that the tape slides into.
 *
 * Animation phases (all spring-driven):
 *  idle      → cassette floating above a dark deck slot, arrow hinting downward
 *  hover     → cassette lifts slightly, slot glows
 *  pressing  → user holds the button, cassette starts descending
 *  inserting → cassette slides down with spring overshoot, slot receives it
 *  seated    → cassette settles in, a "click" micro-bounce, slot door closes
 *  done      → compact state: cassette label peeking from slot, ▶ ready
 */

import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { playClickSound, playFlipSound } from "@/app/lib/sounds";
import type { TapeColorKey } from "./CassetteObject";

/* ─── Color map (mirrors CassetteObject, only what we need) ──────────────── */
const SLOT_ACCENT: Record<string, string> = {
  cream: "#C4A870", cherry: "#E03050", peach: "#E87848", butter: "#D4A820",
  sky: "#40A8E0", pool: "#18A0A0", lavender: "#9868D0", mint: "#28A850",
  transparent: "#40A8E0", smoky: "#403848",
  classic: "#D4882A", y2k: "#D040F0", love: "#C84858", road_trip: "#3A6A96",
};

type Phase = "idle" | "hover" | "inserting" | "seated" | "done";

interface Props {
  tapeStyle?: TapeColorKey;
  /** Called when insert animation fully completes */
  onInserted: () => void;
  /** The rendered cassette SVG/component — passed as children */
  children: React.ReactNode;
}

/* ─── SVG Deck slot ──────────────────────────────────────────────────────── */
function DeckSlot({
  accent,
  phase,
  slotGlow,
}: {
  accent: string;
  phase: Phase;
  slotGlow: number; // 0–1
}) {
  const glowOpacity = slotGlow * 0.55;
  const isOpen = phase !== "done";

  return (
    <svg
      viewBox="0 0 320 64"
      className="w-full"
      style={{ maxWidth: 380 }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="deckBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2C2820" />
          <stop offset="100%" stopColor="#14100C" />
        </linearGradient>
        <linearGradient id="deckFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3A3428" />
          <stop offset="100%" stopColor="#1E1A14" />
        </linearGradient>
        <radialGradient id="slotGlowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity={glowOpacity * 0.9} />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <filter id="deckInner">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* ── Deck body ── */}
      <rect x="0" y="8" width="320" height="56" rx="10" fill="url(#deckBody)" />

      {/* Top edge highlight */}
      <rect x="0" y="8" width="320" height="1.5" rx="0.75"
        fill="rgba(255,255,255,0.06)" />

      {/* Face panel */}
      <rect x="8" y="14" width="304" height="44" rx="7" fill="url(#deckFace)" />

      {/* Slot opening — the actual mouth */}
      <rect
        x="28" y="22" width="264" height="28" rx="4"
        fill="#0A0806"
        stroke="rgba(0,0,0,0.7)" strokeWidth="1.5"
        filter="url(#deckInner)"
      />
      {/* Slot inner top shadow */}
      <rect x="28" y="22" width="264" height="6" rx="4"
        fill="rgba(0,0,0,0.55)" />
      {/* Slot floor reflection */}
      <rect x="28" y="44" width="264" height="6" rx="2"
        fill="rgba(255,255,255,0.02)" />

      {/* Glow bloom in slot when tape near */}
      <rect x="28" y="22" width="264" height="28" rx="4"
        fill="url(#slotGlowGrad)"
        style={{ mixBlendMode: "screen" }} />

      {/* ── Left/right status LEDs ── */}
      {/* Left — power LED (always dim green) */}
      <circle cx="18" cy="36" r="3"
        fill={phase === "done" ? "#28C840" : "#1A3818"}
        style={{ transition: "fill 0.5s ease" }}
      />
      {phase === "done" && (
        <circle cx="18" cy="36" r="5" fill="#28C840" fillOpacity="0.2" />
      )}

      {/* Right — tape-ready LED (accent color, pulses when inserting) */}
      <circle cx="302" cy="36" r="3"
        fill={phase === "inserting" ? accent : phase === "done" ? accent : "#2A2018"}
        style={{ transition: "fill 0.3s ease" }}
      />
      {(phase === "inserting" || phase === "done") && (
        <circle cx="302" cy="36" r="5" fill={accent} fillOpacity="0.25" />
      )}

      {/* ── Deck brand text ── */}
      <text x="160" y="55" textAnchor="middle"
        fill="rgba(255,255,255,0.12)"
        fontSize="6" letterSpacing="4"
        fontFamily="'Courier New', monospace">
        CASSETTE DECK
      </text>

      {/* ── Door — slides up when open, covers slot when closed ── */}
      <AnimatePresence>
        {!isOpen && (
          // When "done", a thin door covers the slot showing tape peeking
          <motion.rect
            x="28" y="22" width="264" height="28" rx="4"
            fill="#2A2418"
            stroke="rgba(0,0,0,0.5)" strokeWidth="1"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            style={{ originY: "22px" } as any}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </AnimatePresence>
    </svg>
  );
}

/* ─── Arrow hint ─────────────────────────────────────────────────────────── */
function InsertArrow({ visible, accent }: { visible: boolean; accent: string }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: [0, 6, 0] }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{
            opacity: { duration: 0.3 },
            y: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
          }}
          className="flex flex-col items-center gap-0.5 pointer-events-none"
          aria-hidden="true"
        >
          {[0.7, 0.45, 0.2].map((opacity, i) => (
            <svg key={i} width="18" height="10" viewBox="0 0 18 10" fill="none">
              <path
                d="M1 1L9 9L17 1"
                stroke={accent}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity={opacity}
              />
            </svg>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function CassetteInsertDeck({ tapeStyle = "cream", onInserted, children }: Props) {
  const accent = SLOT_ACCENT[tapeStyle] ?? "#D4882A";

  const [phase, setPhase] = useState<Phase>("idle");
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Spring-driven Y position for the cassette (0 = resting above slot)
  const rawY = useMotionValue(0);
  const springY = useSpring(rawY, { stiffness: 280, damping: 22, mass: 0.8 });

  // Slot glow follows cassette proximity (0 = no glow, 1 = full glow)
  const slotGlow = useTransform(springY, [0, 140], [0, 1]);
  const slotGlowValue = useMotionValue(0);

  useEffect(() => {
    const unsub = slotGlow.on("change", v => slotGlowValue.set(v));
    return unsub;
  }, [slotGlow, slotGlowValue]);

  function handleInsert() {
    if (phase !== "idle" && phase !== "hover") return;
    playClickSound(true);
    setPhase("inserting");

    // Cassette slides DOWN into slot — overshoot then settle
    rawY.set(0);
    // Spring to "inside slot" position
    rawY.set(148);

    timerRef.current = setTimeout(() => {
      // Micro-bounce on seat
      playFlipSound(true);
      setPhase("seated");

      timerRef.current = setTimeout(() => {
        setPhase("done");
        onInserted();
      }, 420);
    }, 680);
  }

  // Scale down cassette as it inserts
  const cassetteScale = useTransform(springY, [0, 148], [1, 0.72]);
  const cassetteOpacity = useTransform(springY, [0, 100, 148], [1, 0.9, 0]);

  return (
    <div className="relative flex flex-col items-center w-full select-none">

      {/* ── Cassette + insert button area ────────────────────────────── */}
      <div className="relative w-full flex flex-col items-center">

        {/* The cassette — slides down on insert */}
        <motion.div
          className="w-full relative z-10"
          style={{
            y: phase === "idle" || phase === "hover" ? 0 : springY,
            scale: phase === "inserting" || phase === "seated" ? cassetteScale : 1,
            opacity: phase === "done" ? 0 : 1,
          }}
          animate={
            phase === "idle" || phase === "hover"
              ? { y: isHovered ? -8 : 0, scale: isHovered ? 1.015 : 1 }
              : {}
          }
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
        >
          {children}
        </motion.div>

        {/* Arrow hints — only when idle */}
        <div className="mt-1">
          <InsertArrow
            visible={phase === "idle" || phase === "hover"}
            accent={accent}
          />
        </div>

        {/* ── INSERT TAPE button ────────────────────────────────────── */}
        <AnimatePresence>
          {(phase === "idle" || phase === "hover") && (
            <motion.button
              key="insert-btn"
              onClick={handleInsert}
              onHoverStart={() => setIsHovered(true)}
              onHoverEnd={() => setIsHovered(false)}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88, y: -4 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.93, y: 2 }}
              className="mt-5 relative overflow-hidden"
              aria-label="Insert tape into deck"
              style={{
                padding: "14px 40px",
                borderRadius: 99,
                border: "none",
                cursor: "pointer",
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: "#FFFFFF",
                background: `linear-gradient(135deg, ${accent} 0%, ${accent}CC 100%)`,
                boxShadow: `0 4px 22px ${accent}44, 0 1px 0 rgba(255,255,255,0.12) inset`,
                outline: "none",
              }}
            >
              {/* Shimmer sweep */}
              <motion.span
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)",
                  backgroundSize: "200% 100%",
                }}
                animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "linear", repeatDelay: 0.8 }}
              />
              Insert Tape
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── INSERTING state label ─────────────────────────────────── */}
        <AnimatePresence>
          {phase === "inserting" && (
            <motion.div
              key="inserting-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex items-center gap-2"
            >
              {/* Spinning reel icon */}
              <motion.svg
                width="16" height="16" viewBox="0 0 16 16" fill="none"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
              >
                <circle cx="8" cy="8" r="6" stroke={accent} strokeWidth="1.5" strokeOpacity="0.3" />
                <path d="M8 2a6 6 0 0 1 6 6" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
              </motion.svg>
              <span
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.22em",
                  color: "#8E8E93",
                  fontFamily: "'Courier New', monospace",
                  textTransform: "uppercase",
                }}
              >
                Inserting…
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SEATED micro-bounce label ─────────────────────────────── */}
        <AnimatePresence>
          {phase === "seated" && (
            <motion.div
              key="seated-label"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 14 }}
              className="mt-4 flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7L5.5 10.5L12 3" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.22em",
                  color: accent,
                  fontFamily: "'Courier New', monospace",
                  textTransform: "uppercase",
                }}
              >
                Click
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── DECK SLOT ─────────────────────────────────────────────────── */}
      <motion.div
        className="w-full mt-2"
        style={{ maxWidth: 380 }}
        animate={{
          scale: phase === "inserting" ? [1, 1.015, 1] : phase === "seated" ? [1, 1.02, 1] : 1,
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <SlotWithGlow accent={accent} phase={phase} springY={springY} />
      </motion.div>

      {/* ── DONE state: cassette peeking from slot ────────────────────── */}
      <AnimatePresence>
        {phase === "done" && (
          <motion.div
            key="done-peek"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full flex flex-col items-center mt-1"
            style={{ maxWidth: 380 }}
          >
            {/* Tape label peeking from slot */}
            <TapePeek accent={accent} />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                marginTop: 12,
                fontSize: "11px",
                letterSpacing: "0.22em",
                color: "#8E8E93",
                fontFamily: "'Courier New', monospace",
                textTransform: "uppercase",
              }}
            >
              Tape ready — press play
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Slot with reactive glow ────────────────────────────────────────────── */
function SlotWithGlow({
  accent,
  phase,
  springY,
}: {
  accent: string;
  phase: Phase;
  springY: ReturnType<typeof useSpring>;
}) {
  // Convert spring Y (0→148) to glow 0→1
  const glowRaw = useTransform(springY, [0, 148], [0, 1]);
  const [glowVal, setGlowVal] = useState(0);

  useEffect(() => {
    const unsub = glowRaw.on("change", v => setGlowVal(v));
    return unsub;
  }, [glowRaw]);

  // Extra glow pulse when seated/done
  const extraGlow = phase === "seated" ? 0.9 : phase === "done" ? 0.4 : 0;

  return (
    <div className="relative">
      {/* Ambient glow beneath slot */}
      <div
        className="absolute inset-x-0 -bottom-2 h-8 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${accent}${Math.round((glowVal + extraGlow) * 0.4 * 255).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
          transition: phase === "seated" ? "none" : "background 0.1s",
        }}
      />
      <DeckSlot accent={accent} phase={phase} slotGlow={Math.min(1, glowVal + extraGlow)} />
    </div>
  );
}

/* ─── Tape peeking from slot (done state) ────────────────────────────────── */
function TapePeek({ accent }: { accent: string }) {
  return (
    <div
      className="w-full relative overflow-hidden"
      style={{ height: 20, maxWidth: 320 }}
    >
      {/* A thin strip representing the tape label sticking out of the slot */}
      <div
        className="absolute inset-x-0 top-0 h-full rounded-b-sm"
        style={{
          background: `linear-gradient(90deg, ${accent}33 0%, ${accent}66 40%, ${accent}33 100%)`,
          borderBottom: `1px solid ${accent}44`,
          boxShadow: `0 2px 8px ${accent}33`,
        }}
      />
      {/* Label text on the peek strip */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          style={{
            fontSize: "8px",
            letterSpacing: "0.3em",
            color: accent,
            fontFamily: "'Courier New', monospace",
            textTransform: "uppercase",
            opacity: 0.8,
          }}
        >
          ▶ CASSETTE
        </span>
      </div>
    </div>
  );
}
