"use client";

import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { playFlipSound } from "@/app/lib/sounds";
import { useReduceMotion } from "@/app/lib/use-reduce-motion";

export type CassetteSide = "A" | "B";

/**
 * All tape style keys — new 10-color system + legacy aliases for DB compat.
 * DB stores old values (classic/y2k/love/road_trip); new values added alongside.
 */
export type TapeColorKey =
  | "cream" | "cherry" | "peach" | "butter"
  | "sky" | "pool" | "lavender" | "mint"
  | "transparent" | "smoky"
  | "classic" | "y2k" | "love" | "road_trip"; // legacy DB values

/** Visual state of the cassette */
export type CassetteState =
  | "idle" | "hover" | "selected"
  | "inserting" | "inserted" | "ready"
  | "playing" | "paused" | "stopped"
  | "rewinding" | "fast_forwarding"
  | "ejecting" | "flipping"
  | "recording" | "recorded"
  | "side_a" | "side_b" | "error";

interface CassetteObjectProps {
  side: CassetteSide;
  isPlaying: boolean;
  title: string;
  recipientName: string;
  senderName: string;
  /** Accepts both new color keys and legacy DB style strings */
  style?: TapeColorKey;
  onFlipSide?: () => void;
  isTyping?: boolean;
  className?: string;
  /** 0–1 playback progress — drives tape ribbon thickness shift */
  progress?: number;
  /** Cassette visual state */
  cassetteState?: CassetteState;
  /** Show/hide the flip button */
  showFlipButton?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

/* ─── Color palette — 10 real colors + legacy aliases ──────────────────── */
interface TapeColors {
  shell: string;
  shellGradTop: string;
  shellGradBot: string;
  label: string;
  labelGradBot: string;
  accent: string;
  text: string;
  specular: string;
  windowTint: string;
  reelHub: string;
  isLight: boolean; // determines text color on label
}

const TAPE_COLORS: Record<TapeColorKey, TapeColors> = {
  // ── New 10-color system ────────────────────────────────────────────────
  cream: {
    shell: "#D4C4A8", shellGradTop: "#E8D8BC", shellGradBot: "#BCA888",
    label: "#F5EFE0", labelGradBot: "#E0D4B8",
    accent: "#A07840", text: "#3D2010", specular: "#FFFFFF",
    windowTint: "#F0E8D0", reelHub: "#C4A870",
    isLight: true,
  },
  cherry: {
    shell: "#C42040", shellGradTop: "#E03050", shellGradBot: "#901830",
    label: "#E84060", labelGradBot: "#B01830",
    accent: "#FFB0C0", text: "#FFFFFF", specular: "#FFC8D4",
    windowTint: "#800020", reelHub: "#D03050",
    isLight: false,
  },
  peach: {
    shell: "#E8703A", shellGradTop: "#F08050", shellGradBot: "#C05828",
    label: "#FF9060", labelGradBot: "#D06030",
    accent: "#FFD4B8", text: "#FFFFFF", specular: "#FFE0C8",
    windowTint: "#A04020", reelHub: "#E87848",
    isLight: false,
  },
  butter: {
    shell: "#E8C430", shellGradTop: "#F4D840", shellGradBot: "#C4A018",
    label: "#F5D840", labelGradBot: "#D4B020",
    accent: "#806000", text: "#3D2800", specular: "#FFFFFF",
    windowTint: "#F0C800", reelHub: "#D4A820",
    isLight: true,
  },
  sky: {
    shell: "#38A8E8", shellGradTop: "#58C0F8", shellGradBot: "#1888C8",
    label: "#5AC8FA", labelGradBot: "#2898D8",
    accent: "#B8E8FF", text: "#002848", specular: "#FFFFFF",
    windowTint: "#0060A0", reelHub: "#40A8E0",
    isLight: false,
  },
  pool: {
    shell: "#1A9898", shellGradTop: "#28B8B8", shellGradBot: "#0A7878",
    label: "#20B0B0", labelGradBot: "#088888",
    accent: "#88E8E8", text: "#002828", specular: "#D0FFFF",
    windowTint: "#004848", reelHub: "#18A0A0",
    isLight: false,
  },
  lavender: {
    shell: "#9060C8", shellGradTop: "#A878D8", shellGradBot: "#6840A0",
    label: "#B080E0", labelGradBot: "#7848B8",
    accent: "#E0C8FF", text: "#FFFFFF", specular: "#F0E0FF",
    windowTint: "#300860", reelHub: "#9868D0",
    isLight: false,
  },
  mint: {
    shell: "#28A858", shellGradTop: "#38C068", shellGradBot: "#188040",
    label: "#34C759", labelGradBot: "#1A9840",
    accent: "#B0F0C8", text: "#002810", specular: "#D0FFE0",
    windowTint: "#005820", reelHub: "#28A850",
    isLight: false,
  },
  transparent: {
    shell: "rgba(180,210,235,0.45)", shellGradTop: "rgba(210,230,248,0.55)", shellGradBot: "rgba(160,195,225,0.38)",
    label: "rgba(225,238,250,0.65)", labelGradBot: "rgba(195,218,240,0.50)",
    accent: "rgba(120,175,220,0.8)", text: "#1A3050", specular: "rgba(255,255,255,0.9)",
    windowTint: "rgba(80,120,160,0.3)", reelHub: "rgba(140,185,220,0.7)",
    isLight: true,
  },
  smoky: {
    shell: "#2E2A30", shellGradTop: "#3E3840", shellGradBot: "#1A1820",
    label: "#484050", labelGradBot: "#2A2430",
    accent: "#888098", text: "#F0ECF4", specular: "#D0C8DC",
    windowTint: "#080610", reelHub: "#403848",
    isLight: false,
  },

  // ── Legacy DB aliases → map to closest new color ──────────────────────
  classic: {
    shell: "#D4C4A8", shellGradTop: "#E0CC98", shellGradBot: "#B89860",
    label: "#C8A96E", labelGradBot: "#8B5E3C",
    accent: "#D4882A", text: "#1C0F05", specular: "#E8C87A",
    windowTint: "#5A3820", reelHub: "#C09048",
    isLight: true,
  },
  y2k: {
    shell: "#1A0D2E", shellGradTop: "#280D40", shellGradBot: "#0D0820",
    label: "#D040F0", labelGradBot: "#8000A8",
    accent: "#00E5FF", text: "#F8E0FF", specular: "#FF80FF",
    windowTint: "#100020", reelHub: "#8020B8",
    isLight: false,
  },
  love: {
    shell: "#2C0A0A", shellGradTop: "#401010", shellGradBot: "#180505",
    label: "#D45A6A", labelGradBot: "#901828",
    accent: "#F7A8B0", text: "#FFFFFF", specular: "#FFC0C8",
    windowTint: "#4A0810", reelHub: "#C84858",
    isLight: false,
  },
  road_trip: {
    shell: "#0D1A1A", shellGradTop: "#182828", shellGradBot: "#080D0D",
    label: "#5B7FA6", labelGradBot: "#2A4A6A",
    accent: "#D4882A", text: "#E8F4FF", specular: "#8BB0D8",
    windowTint: "#081020", reelHub: "#3A6A96",
    isLight: false,
  },
};

function getColors(style?: TapeColorKey): TapeColors {
  if (!style) return TAPE_COLORS.cream;
  return TAPE_COLORS[style] ?? TAPE_COLORS.cream;
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function CassetteObject({
  side,
  isPlaying,
  title,
  recipientName,
  senderName,
  style = "cream",
  onFlipSide,
  isTyping = false,
  className = "",
  progress = 0,
  cassetteState,
  showFlipButton = true,
  size = "md",
}: CassetteObjectProps) {
  const colors = getColors(style);
  const reduceMotion = useReduceMotion();

  // 3D tilt from pointer — spring-smoothed (disabled on reduce-motion)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(
    useTransform(mouseY, [-1, 1], reduceMotion ? [0, 0] : [5, -5]),
    { stiffness: 120, damping: 24 }
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-1, 1], reduceMotion ? [0, 0] : [-7, 7]),
    { stiffness: 120, damping: 24 }
  );
  const containerRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    mouseY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }
  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  // Tape spool physics — left reel loses tape, right gains as progress → 1
  const leftThickness  = Math.round(14 + (1 - progress) * 18); // 14–32
  const rightThickness = Math.round(14 + progress * 18);

  // Asymmetric reel speeds
  const leftReelDuration  = 1.8 + progress * 0.9;
  const rightReelDuration = 2.8 - progress * 0.9;

  const playing = isPlaying || cassetteState === "playing";
  const rewinding = cassetteState === "rewinding";
  const ffing = cassetteState === "fast_forwarding";

  const reelVariantsLeft = {
    playing:  { rotate: 360, transition: { repeat: Infinity, duration: leftReelDuration, ease: "linear" as const } },
    rewinding:{ rotate: -360, transition: { repeat: Infinity, duration: 0.5, ease: "linear" as const } },
    ff:       { rotate: 360, transition: { repeat: Infinity, duration: 0.4, ease: "linear" as const } },
    paused:   { rotate: 0,   transition: { duration: 0.5, ease: "easeOut" as const } },
  };
  const reelVariantsRight = {
    playing:  { rotate: 360, transition: { repeat: Infinity, duration: rightReelDuration, ease: "linear" as const } },
    rewinding:{ rotate: -360, transition: { repeat: Infinity, duration: 0.5, ease: "linear" as const } },
    ff:       { rotate: 360, transition: { repeat: Infinity, duration: 0.4, ease: "linear" as const } },
    paused:   { rotate: 0,   transition: { duration: 0.5, ease: "easeOut" as const } },
  };

  function reelState() {
    if (rewinding) return "rewinding";
    if (ffing) return "ff";
    if (playing) return "playing";
    return "paused";
  }

  // Typing pulse on label
  const [typingPulse, setTypingPulse] = useState(false);
  useEffect(() => {
    if (isTyping) {
      setTypingPulse(true);
      const t = setTimeout(() => setTypingPulse(false), 300);
      return () => clearTimeout(t);
    }
  }, [isTyping, title, recipientName]);

  // Label text color depends on whether tape is light or dark
  const labelTextColor = colors.isLight ? colors.text : colors.text;
  const labelTextOpacity = colors.isLight ? 1 : 0.95;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={side}
        initial={reduceMotion ? { opacity: 0 } : { rotateY: side === "A" ? -80 : 80, opacity: 0, scale: 0.95 }}
        animate={{ rotateY: 0, opacity: 1, scale: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { rotateY: side === "A" ? 80 : -80, opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ perspective: 1200 }}
        className={`relative select-none ${className}`}
      >
        {/* Pointer-driven 3D tilt wrapper */}
        <motion.div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="relative"
        >
          <svg
            viewBox="0 0 420 260"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
            style={{
              filter: `drop-shadow(0 12px 40px rgba(0,0,0,0.22)) drop-shadow(0 4px 12px rgba(0,0,0,0.14))`,
            }}
            role="img"
            aria-label={`Cassette tape — Side ${side}, "${title || "Untitled"}"`}
          >
            <defs>
              {/* Shell gradient */}
              <linearGradient id={`sg-${style}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={colors.shellGradTop} />
                <stop offset="50%"  stopColor={colors.shell} />
                <stop offset="100%" stopColor={colors.shellGradBot} />
              </linearGradient>

              {/* Shell side shadows */}
              <linearGradient id={`ssl-${style}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"  stopColor="#000" stopOpacity="0.28" />
                <stop offset="18%" stopColor="#000" stopOpacity="0" />
              </linearGradient>
              <linearGradient id={`ssr-${style}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="82%" stopColor="#000" stopOpacity="0" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.28" />
              </linearGradient>

              {/* Top specular edge */}
              <linearGradient id={`sts-${style}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor={colors.specular} stopOpacity="0" />
                <stop offset="25%"  stopColor={colors.specular} stopOpacity="0.22" />
                <stop offset="55%"  stopColor={colors.specular} stopOpacity="0.38" />
                <stop offset="80%"  stopColor={colors.specular} stopOpacity="0.14" />
                <stop offset="100%" stopColor={colors.specular} stopOpacity="0" />
              </linearGradient>

              {/* Label gradient */}
              <linearGradient id={`lg-${style}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={colors.label} />
                <stop offset="100%" stopColor={colors.labelGradBot} />
              </linearGradient>

              {/* Label gloss */}
              <linearGradient id={`lgl-${style}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor="white" stopOpacity="0.18" />
                <stop offset="55%" stopColor="white" stopOpacity="0" />
              </linearGradient>

              {/* Reel hub gradient */}
              <radialGradient id={`rg-${style}`} cx="50%" cy="35%" r="65%">
                <stop offset="0%"   stopColor={colors.reelHub} />
                <stop offset="60%"  stopColor={colors.shell} />
                <stop offset="100%" stopColor={colors.shellGradBot} />
              </radialGradient>

              {/* Tape ribbon gradient */}
              <linearGradient id={`tr-${style}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={colors.windowTint} stopOpacity="0.9" />
                <stop offset="40%"  stopColor={colors.shellGradBot} stopOpacity="0.85" />
                <stop offset="60%"  stopColor={colors.shellGradBot} stopOpacity="0.9" />
                <stop offset="100%" stopColor={colors.windowTint} stopOpacity="0.8" />
              </linearGradient>

              {/* Typing pulse glow */}
              <filter id="typingGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* ── OUTER SHELL ─────────────────────────────────────────────── */}
            <rect x="4" y="4" width="412" height="252" rx="20" fill={`url(#sg-${style})`} />

            {/* Shell border stroke */}
            <rect x="4" y="4" width="412" height="252" rx="20"
              fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />

            {/* Side shadow overlays */}
            <rect x="4" y="4" width="412" height="252" rx="20" fill={`url(#ssl-${style})`} />
            <rect x="4" y="4" width="412" height="252" rx="20" fill={`url(#ssr-${style})`} />

            {/* Top edge specular highlight */}
            <rect x="4" y="4" width="412" height="4" rx="2" fill={`url(#sts-${style})`} />
            <rect x="20" y="6" width="380" height="1.5" rx="0.75" fill="white" fillOpacity="0.1" />

            {/* Bottom edge shadow */}
            <rect x="4" y="252" width="412" height="4" rx="2" fill="black" fillOpacity="0.35" />

            {/* ── CORNER SCREWS ───────────────────────────────────────────── */}
            {([[28, 28], [392, 28], [28, 232], [392, 232]] as [number,number][]).map(([cx, cy], i) => (
              <g key={i}>
                {/* Screw base */}
                <circle cx={cx} cy={cy} r="8"
                  fill={colors.shellGradBot}
                  stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
                {/* Screw face */}
                <circle cx={cx} cy={cy} r="6"
                  fill={colors.shell}
                  stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
                {/* Phillips cross */}
                <line x1={cx-3.5} y1={cy} x2={cx+3.5} y2={cy}
                  stroke="rgba(0,0,0,0.3)" strokeWidth="1.2" strokeLinecap="round" />
                <line x1={cx} y1={cy-3.5} x2={cx} y2={cy+3.5}
                  stroke="rgba(0,0,0,0.3)" strokeWidth="1.2" strokeLinecap="round" />
                {/* Specular dot */}
                <circle cx={cx-1.5} cy={cy-1.5} r="1.5" fill="white" fillOpacity="0.25" />
              </g>
            ))}

            {/* ── INNER CAVITY ─────────────────────────────────────────────── */}
            <rect x="20" y="18" width="380" height="224" rx="12"
              fill="rgba(0,0,0,0.18)" />
            <rect x="21" y="19" width="378" height="1" rx="0.5"
              fill="rgba(0,0,0,0.12)" />

            {/* ── TAPE LABEL ───────────────────────────────────────────────── */}
            <rect x="102" y="26" width="216" height="208" rx="10"
              fill={`url(#lg-${style})`} />
            {/* Label top gloss */}
            <rect x="102" y="26" width="216" height="104" rx="10"
              fill={`url(#lgl-${style})`} />
            {/* Label inner border */}
            <rect x="102" y="26" width="216" height="208" rx="10"
              fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
            {/* Label texture lines */}
            {[52,66,80,94,108,122,136,150,164,178].map(y => (
              <line key={y} x1="114" y1={y} x2="306" y2={y}
                stroke="rgba(0,0,0,0.06)" strokeWidth="0.6" />
            ))}

            {/* Typing pulse glow on label */}
            {typingPulse && (
              <rect x="102" y="26" width="216" height="208" rx="10"
                fill={colors.accent} fillOpacity="0.12"
                filter="url(#typingGlow)" />
            )}

            {/* ── TEXT AREA WITH SEMI-TRANSPARENT BACKGROUND ─────────────── */}
            {/* Background panel behind text — ensures readability over reels */}
            <rect x="106" y="50" width="208" height="110" rx="6"
              fill={colors.label} fillOpacity="0.92"
              stroke="rgba(0,0,0,0.08)" strokeWidth="0.8" />
            {/* Panel gloss overlay */}
            <rect x="106" y="50" width="208" height="25" rx="6"
              fill="white" fillOpacity="0.12" />

            {/* SIDE badge */}
            <rect x="114" y="34" width="38" height="18" rx="4"
              fill="rgba(0,0,0,0.45)" />
            <text x="133" y="46.5" textAnchor="middle"
              fill={colors.label} fontSize="8.5" fontWeight="700"
              fontFamily="'Inter', monospace" letterSpacing="1.5"
              fillOpacity="0.9">
              SIDE {side}
            </text>

            {/* Tape title */}
            <foreignObject x="112" y="58" width="196" height="48">
              <div
                {...{ xmlns: "http://www.w3.org/1999/xhtml" }}
                style={{
                  width: "100%", height: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: "italic", fontWeight: 700,
                  fontSize: title.length > 16 ? "14px" : "16px",
                  color: colors.text,
                  opacity: 1,
                  textAlign: "center",
                  padding: "0 6px", overflow: "hidden", lineHeight: "1.3",
                  textShadow: "0 1px 2px rgba(255,255,255,0.3)",
                }}
              >
                {title.length > 24 ? title.slice(0, 24) + "…" : title || "Untitled Tape"}
              </div>
            </foreignObject>

            {/* FOR [RECIPIENT] */}
            <foreignObject x="112" y="108" width="196" height="22">
              <div
                {...{ xmlns: "http://www.w3.org/1999/xhtml" }}
                style={{
                  width: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Inter', monospace",
                  fontSize: "9px", letterSpacing: "2px",
                  color: colors.text, opacity: 0.8, textAlign: "center",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                FOR {(recipientName || "Someone").toUpperCase().slice(0, 20)}
              </div>
            </foreignObject>

            {/* Divider line */}
            <line x1="126" y1="134" x2="294" y2="134"
              stroke="rgba(0,0,0,0.15)" strokeWidth="1" />

            {/* FROM [SENDER] — moved and styled for visibility */}
            <foreignObject x="112" y="138" width="196" height="18">
              <div
                {...{ xmlns: "http://www.w3.org/1999/xhtml" }}
                style={{
                  width: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Inter', monospace",
                  fontSize: "8px", letterSpacing: "1.5px",
                  color: colors.text, opacity: 0.75, textAlign: "center",
                  textTransform: "uppercase",
                  fontWeight: 500,
                }}
              >
                FROM {(senderName || "").toUpperCase().slice(0, 18)}
              </div>
            </foreignObject>

            {/* CASSETTE wordmark */}
            <text x="210" y="218" textAnchor="middle"
              fill={colors.text} fontSize="6.5" letterSpacing="3.5" fontFamily="'Inter', monospace"
              fillOpacity="0.28">
              C A S S E T T E
            </text>

            {/* ── TAPE WINDOW ──────────────────────────────────────────────── */}
            {/* Window bezel */}
            <rect x="168" y="140" width="84" height="46" rx="7"
              fill={colors.shellGradBot} stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
            {/* Window glass — dark */}
            <rect x="170" y="142" width="80" height="42" rx="6"
              fill={colors.windowTint} fillOpacity="0.5" />
            {/* Window inner shadow */}
            <rect x="170" y="142" width="80" height="6" rx="3"
              fill="rgba(0,0,0,0.25)" />
            {/* Window top gloss */}
            <rect x="171" y="143" width="78" height="4" rx="2"
              fill="white" fillOpacity="0.07" />

            {/* ── TAPE RIBBON ─────────────────────────────────────────────── */}
            <rect x="170" y="158" width="80" height="10" fill={`url(#tr-${style})`} opacity="0.95" />
            <rect x="170" y="158" width="80" height="1.5" fill={colors.accent} fillOpacity="0.3" />
            <rect x="170" y="167" width="80" height="1" fill="rgba(0,0,0,0.3)" />
            <rect x="170" y="159" width="80" height="2" fill="white" fillOpacity="0.08" />

            {/* ── LEFT REEL ───────────────────────────────────────────────── */}
            <motion.g
              animate={reelState()}
              variants={reelVariantsLeft}
              style={{ originX: "125px", originY: "130px" }}
            >
              {/* Outer ring */}
              <circle cx="125" cy="130" r="56" fill="rgba(0,0,0,0.15)" />
              <circle cx="125" cy="130" r="54"
                fill={colors.shell} stroke="rgba(0,0,0,0.12)" strokeWidth="1" />

              {/* Tape wound rings — more = fuller reel */}
              {Array.from({ length: Math.max(2, Math.round((1 - progress) * 8)) }).map((_, i) => (
                <circle key={i} cx="125" cy="130"
                  r={leftThickness + i * 2.4}
                  fill="none"
                  stroke={colors.windowTint}
                  strokeWidth="2"
                  strokeOpacity={0.55 - i * 0.05} />
              ))}

              {/* Hub outer */}
              <circle cx="125" cy="130" r="22" fill={`url(#rg-${style})`} />
              {/* Hub face */}
              <circle cx="125" cy="130" r="14" fill={colors.shellGradBot} />

              {/* Spokes */}
              {[0, 60, 120, 180, 240, 300].map(angle => {
                const rad = (angle * Math.PI) / 180;
                const x1 = +(125 + Math.cos(rad) * 14).toFixed(3);
                const y1 = +(130 + Math.sin(rad) * 14).toFixed(3);
                const x2 = +(125 + Math.cos(rad) * 22).toFixed(3);
                const y2 = +(130 + Math.sin(rad) * 22).toFixed(3);
                return (
                  <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={colors.accent} strokeWidth="2.5"
                    strokeOpacity="0.7" strokeLinecap="round" />
                );
              })}

              {/* Centre */}
              <circle cx="125" cy="130" r="5.5"
                fill={colors.shellGradBot} stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
              {/* Specular */}
              <circle cx="123" cy="128" r="2" fill="white" fillOpacity="0.2" />
            </motion.g>

            {/* ── RIGHT REEL ──────────────────────────────────────────────── */}
            <motion.g
              animate={reelState()}
              variants={reelVariantsRight}
              style={{ originX: "295px", originY: "130px" }}
            >
              <circle cx="295" cy="130" r="56" fill="rgba(0,0,0,0.15)" />
              <circle cx="295" cy="130" r="54"
                fill={colors.shell} stroke="rgba(0,0,0,0.12)" strokeWidth="1" />

              {Array.from({ length: Math.max(2, Math.round(progress * 8)) }).map((_, i) => (
                <circle key={i} cx="295" cy="130"
                  r={rightThickness + i * 2.4}
                  fill="none"
                  stroke={colors.windowTint}
                  strokeWidth="2"
                  strokeOpacity={0.55 - i * 0.05} />
              ))}

              <circle cx="295" cy="130" r="22" fill={`url(#rg-${style})`} />
              <circle cx="295" cy="130" r="14" fill={colors.shellGradBot} />

              {[0, 60, 120, 180, 240, 300].map(angle => {
                const rad = (angle * Math.PI) / 180;
                const x1 = +(295 + Math.cos(rad) * 14).toFixed(3);
                const y1 = +(130 + Math.sin(rad) * 14).toFixed(3);
                const x2 = +(295 + Math.cos(rad) * 22).toFixed(3);
                const y2 = +(130 + Math.sin(rad) * 22).toFixed(3);
                return (
                  <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={colors.accent} strokeWidth="2.5"
                    strokeOpacity="0.7" strokeLinecap="round" />
                );
              })}

              <circle cx="295" cy="130" r="5.5"
                fill={colors.shellGradBot} stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
              <circle cx="293" cy="128" r="2" fill="white" fillOpacity="0.2" />
            </motion.g>

            {/* ── GRIP BUMPS on sides ──────────────────────────────────────── */}
            {[55, 88, 121, 154, 187].map((y, i) => (
              <g key={i}>
                <rect x="4" y={y} width="6" height="12" rx="2"
                  fill={colors.shellGradBot} fillOpacity="0.7" />
                <rect x="4" y={y} width="2" height="12" rx="1"
                  fill="white" fillOpacity="0.1" />
                <rect x="410" y={y} width="6" height="12" rx="2"
                  fill={colors.shellGradBot} fillOpacity="0.7" />
              </g>
            ))}

            {/* ── RECORDING STATE INDICATOR ─────────────────────────────── */}
            {(cassetteState === "recording") && (
              <motion.circle
                cx="378" cy="44" r="5"
                fill="#FF3020"
                animate={{ opacity: [1, 0.2, 1], r: [5, 6, 5] }}
                transition={{ duration: 0.7, repeat: Infinity }}
              />
            )}
          </svg>

          {/* Pointer-driven ambient specular — outside SVG */}
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 38% 18%, ${colors.specular}16 0%, transparent 58%)`,
              mixBlendMode: "screen",
            }}
          />
        </motion.div>

        {/* ── FLIP BUTTON ────────────────────────────────────────────────── */}
        {onFlipSide && showFlipButton && (
          <motion.button
            onClick={() => {
              playFlipSound();
              onFlipSide();
            }}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide border"
            style={{
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderColor: "rgba(0,0,0,0.1)",
              color: "#1D1D1F",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
            }}
            whileHover={{ scale: 1.04, boxShadow: "0 4px 12px rgba(0,0,0,0.14)" }}
            whileTap={{ scale: 0.93, y: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            aria-label={`Side ${side} playing. Tap to flip to Side ${side === "A" ? "B" : "A"}`}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 5a4 4 0 1 1 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M5 9L3 7l2-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Flip
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
