"use client";

import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { playFlipSound } from "@/app/lib/sounds";

export type CassetteSide = "A" | "B";

interface CassetteObjectProps {
  side: CassetteSide;
  isPlaying: boolean;
  title: string;
  recipientName: string;
  senderName: string;
  style?: "classic" | "y2k" | "love" | "road_trip";
  onFlipSide?: () => void;
  isTyping?: boolean;
  className?: string;
  /** 0–1 playback progress — drives tape ribbon thickness shift */
  progress?: number;
}

const STYLE_COLORS: Record<string, { shell: string; label: string; accent: string; text: string; specular: string }> = {
  classic:   { shell: "#2A1F14", label: "#C8A96E", accent: "#8B5E3C", text: "#1C0F05", specular: "#E8C87A" },
  y2k:       { shell: "#1A0D2E", label: "#E040FB", accent: "#00E5FF", text: "#0D0020", specular: "#FF80FF" },
  love:      { shell: "#2C0A0A", label: "#D45A6A", accent: "#F7A8B0", text: "#1A0305", specular: "#FFC0C8" },
  road_trip: { shell: "#0D1A0D", label: "#5B7FA6", accent: "#D4882A", text: "#050D05", specular: "#8BB0D8" },
};

export default function CassetteObject({
  side,
  isPlaying,
  title,
  recipientName,
  senderName,
  style = "road_trip",
  onFlipSide,
  isTyping = false,
  className = "",
  progress = 0,
}: CassetteObjectProps) {
  const colors = STYLE_COLORS[style] ?? STYLE_COLORS.road_trip;

  // 3D tilt from pointer — spring-smoothed
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-1, 1], [6, -6]), { stiffness: 120, damping: 22 });
  const rotateY = useSpring(useTransform(mouseX, [-1, 1], [-8, 8]), { stiffness: 120, damping: 22 });
  const specularX = useSpring(useTransform(mouseX, [-1, 1], [30, 70]), { stiffness: 80, damping: 18 });
  const specularY = useSpring(useTransform(mouseY, [-1, 1], [30, 70]), { stiffness: 80, damping: 18 });
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

  // Tape ribbon thickness: left reel grows, right reel shrinks as tape plays
  // progress=0 → full left reel, progress=1 → full right reel
  const leftThickness  = Math.round(14 + (1 - progress) * 18); // 14–32
  const rightThickness = Math.round(14 + progress * 18);        // 14–32

  // Asymmetric reel speeds (left faster because more tape is on left early on)
  const leftReelDuration  = 1.8 + progress * 0.8;   // slows as left empties
  const rightReelDuration = 2.8 - progress * 0.8;   // speeds up as right fills

  // Reel spoke blur amount for FF/RW feel — faster = more blur
  const [isFF, setIsFF] = useState(false);
  const spokeBlur = isFF ? "3px" : "0px";

  const reelVariantsLeft = {
    playing: { rotate: 360, transition: { repeat: Infinity, duration: leftReelDuration, ease: "linear" as const } },
    paused:  { rotate: 0,   transition: { duration: 0.4, ease: "easeOut" as const } },
  };
  const reelVariantsRight = {
    playing: { rotate: 360, transition: { repeat: Infinity, duration: rightReelDuration, ease: "linear" as const } },
    paused:  { rotate: 0,   transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  // Specular highlight positions (pointer-driven via motion values)
  // We derive CSS strings in the component body since we can't use hooks inside JSX
  const specHighlightStyle = {
    background: `radial-gradient(ellipse at var(--sx, 50%) var(--sy, 30%), ${colors.specular}18 0%, transparent 60%)`,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={side}
        initial={{ rotateY: -90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        exit={{ rotateY: 90, opacity: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{ perspective: 1000 }}
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
              filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.7)) drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
            }}
            role="img"
            aria-label={`Cassette tape — Side ${side}, ${title}`}
          >
            <defs>
              {/* Shell gradient — deeper, more realistic */}
              <linearGradient id="shellGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={colors.shell}   stopOpacity="1" />
                <stop offset="45%"  stopColor={colors.shell}   stopOpacity="1" />
                <stop offset="100%" stopColor="#050402"         stopOpacity="1" />
              </linearGradient>

              {/* Shell side shadow — left and right edges darker */}
              <linearGradient id="shellSideL" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"  stopColor="#000" stopOpacity="0.35" />
                <stop offset="15%" stopColor="#000" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="shellSideR" x1="0" y1="0" x2="1" y2="0">
                <stop offset="85%" stopColor="#000" stopOpacity="0" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.35" />
              </linearGradient>

              {/* Top edge specular */}
              <linearGradient id="shellTopSpec" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor={colors.specular} stopOpacity="0" />
                <stop offset="30%"  stopColor={colors.specular} stopOpacity="0.18" />
                <stop offset="55%"  stopColor={colors.specular} stopOpacity="0.32" />
                <stop offset="80%"  stopColor={colors.specular} stopOpacity="0.12" />
                <stop offset="100%" stopColor={colors.specular} stopOpacity="0" />
              </linearGradient>

              {/* Label gradient */}
              <linearGradient id="labelGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={colors.label}  stopOpacity="1" />
                <stop offset="100%" stopColor={colors.accent} stopOpacity="1" />
              </linearGradient>

              {/* Label gloss */}
              <linearGradient id="labelGloss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="white" stopOpacity="0.12" />
                <stop offset="50%"  stopColor="white" stopOpacity="0" />
              </linearGradient>

              {/* Reel gradient */}
              <radialGradient id="reelGrad" cx="50%" cy="35%" r="65%">
                <stop offset="0%"   stopColor="#6A5040" stopOpacity="1" />
                <stop offset="40%"  stopColor="#3A2A1E" stopOpacity="1" />
                <stop offset="100%" stopColor="#1A120C" stopOpacity="1" />
              </radialGradient>

              {/* Tape ribbon gradient */}
              <linearGradient id="tapeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#5A3820" stopOpacity="1" />
                <stop offset="40%"  stopColor="#2A1810" stopOpacity="1" />
                <stop offset="60%"  stopColor="#1A0F08" stopOpacity="1" />
                <stop offset="100%" stopColor="#5A3820" stopOpacity="1" />
              </linearGradient>

              {/* Spoke blur filter for motion effect */}
              <filter id="spokeBlur">
                <feGaussianBlur stdDeviation={isFF ? "2.5" : "0"} />
              </filter>

              {/* Shell ambient occlusion at corners */}
              <radialGradient id="cornerAO" cx="0%" cy="0%" r="40%">
                <stop offset="0%"   stopColor="#000" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* ── OUTER SHELL ── */}
            <rect x="4" y="4" width="412" height="252" rx="22" fill="url(#shellGrad)" />

            {/* Shell stroke */}
            <rect x="4" y="4" width="412" height="252" rx="22"
              fill="none" stroke={colors.accent} strokeWidth="1.2" strokeOpacity="0.3" />

            {/* Side shadow overlays */}
            <rect x="4" y="4" width="412" height="252" rx="22" fill="url(#shellSideL)" />
            <rect x="4" y="4" width="412" height="252" rx="22" fill="url(#shellSideR)" />

            {/* TOP EDGE SPECULAR HIGHLIGHT — most visible surface */}
            <rect x="4" y="4" width="412" height="3" rx="2"
              fill="url(#shellTopSpec)" />

            {/* Secondary highlight band — subtle */}
            <rect x="22" y="7" width="376" height="1" rx="0.5"
              fill="white" fillOpacity="0.06" />

            {/* Bottom edge shadow */}
            <rect x="4" y="253" width="412" height="3" rx="2"
              fill="black" fillOpacity="0.5" />

            {/* Corner ambient occlusion */}
            {[[4,4],[416,4],[4,256],[416,256]].map(([cx,cy],i) => (
              <circle key={i} cx={cx} cy={cy} r="40"
                fill={i < 2 ? "url(#cornerAO)" : "none"}
                fillOpacity="0.3" />
            ))}

            {/* Corner screws */}
            {[[24,24],[396,24],[24,236],[396,236]].map(([cx,cy],i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r="7" fill="#0A0806"
                  stroke={colors.accent} strokeWidth="0.8" strokeOpacity="0.5" />
                {/* Screw highlight */}
                <circle cx={cx-1.5} cy={cy-1.5} r="2" fill="white" fillOpacity="0.08" />
                <line x1={cx-3.5} y1={cy} x2={cx+3.5} y2={cy}
                  stroke={colors.accent} strokeWidth="1" strokeOpacity="0.35" />
                <line x1={cx} y1={cy-3.5} x2={cx} y2={cy+3.5}
                  stroke={colors.accent} strokeWidth="1" strokeOpacity="0.35" />
              </g>
            ))}

            {/* ── INNER CAVITY ── */}
            <rect x="18" y="18" width="384" height="224" rx="14"
              fill="#080605" fillOpacity="0.92" />
            {/* Cavity inner edge highlight */}
            <rect x="19" y="19" width="382" height="1" rx="0.5"
              fill="white" fillOpacity="0.04" />

            {/* ── TAPE LABEL ── */}
            <rect x="100" y="28" width="220" height="204" rx="10" fill="url(#labelGrad)" />
            {/* Label gloss */}
            <rect x="100" y="28" width="220" height="102" rx="10" fill="url(#labelGloss)" />
            {/* Label texture lines */}
            {[50,65,80,95,110,125,140,155,170,185].map(y => (
              <line key={y} x1="110" y1={y} x2="310" y2={y}
                stroke={colors.text} strokeWidth="0.5" strokeOpacity="0.1" />
            ))}
            {/* Label edge shadow */}
            <rect x="100" y="28" width="220" height="204" rx="10"
              fill="none" stroke={colors.text} strokeWidth="1" strokeOpacity="0.15" />

            {/* Label: SIDE badge */}
            <rect x="112" y="36" width="36" height="16" rx="3"
              fill={colors.text} fillOpacity="0.55" />
            <text x="130" y="47.5" textAnchor="middle" fill={colors.label}
              fontSize="8" fontWeight="700" fontFamily="monospace" letterSpacing="1">
              SIDE {side}
            </text>

            {/* Label: tape title */}
            <foreignObject x="110" y="60" width="200" height="50">
              <div
                style={{
                  width: "100%", height: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: "italic", fontWeight: 700, fontSize: "13px",
                  color: colors.text, textAlign: "center",
                  padding: "0 4px", overflow: "hidden", lineHeight: 1.2,
                }}
              >
                {title.length > 22 ? title.slice(0, 22) + "…" : title || "Untitled Tape"}
              </div>
            </foreignObject>

            {/* Label: FOR [NAME] */}
            <foreignObject x="110" y="96" width="200" height="20">
              <div
                style={{
                  width: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "monospace", fontSize: "8px", letterSpacing: "2px",
                  color: colors.text, opacity: 0.7, textAlign: "center",
                }}
              >
                FOR {recipientName.toUpperCase() || "SOMEONE"}
              </div>
            </foreignObject>
            <line x1="130" y1="118" x2="290" y2="118"
              stroke={colors.text} strokeWidth="0.6" strokeOpacity="0.2" />

            {/* Label: from sender */}
            <text x="210" y="196" textAnchor="middle" fill={colors.text}
              fontSize="7.5" letterSpacing="1.5" fontFamily="monospace" fillOpacity="0.55">
              FROM {senderName.toUpperCase()}
            </text>
            {/* Label: CASSETTE wordmark */}
            <text x="210" y="210" textAnchor="middle" fill={colors.text}
              fontSize="6.5" letterSpacing="3" fontFamily="monospace" fillOpacity="0.3">
              C A S S E T T E
            </text>

            {/* ── TAPE WINDOW ── */}
            {/* Window bezel with depth */}
            <rect x="168" y="108" width="84" height="44" rx="7"
              fill="#050403" stroke={colors.accent} strokeWidth="1.2" strokeOpacity="0.5" />
            {/* Inner window inset shadow */}
            <rect x="169" y="109" width="82" height="42" rx="6"
              fill="#0A0807" />
            {/* Top window gloss */}
            <rect x="170" y="110" width="80" height="6" rx="3"
              fill="white" fillOpacity="0.05" />

            {/* ── TAPE RIBBON — visible through window ── */}
            {/* The ribbon shows the tape going left-to-right through the window */}
            {/* Ribbon main strip */}
            <rect x="169" y="125" width="82" height="10" fill="url(#tapeGrad)" opacity="0.9" />
            {/* Ribbon edge highlights */}
            <rect x="169" y="125" width="82" height="1" fill={colors.accent} fillOpacity="0.25" />
            <rect x="169" y="134" width="82" height="1" fill="#000" fillOpacity="0.4" />
            {/* Ribbon sheen */}
            <rect x="169" y="126" width="82" height="2" fill="white" fillOpacity="0.06" />

            {/* Window YT hint */}
            <text x="210" y="122" textAnchor="middle" fill={colors.accent}
              fontSize="6" fontFamily="monospace" fillOpacity="0.35">▶ YT</text>

            {/* ── LEFT REEL — with tape thickness rings ── */}
            <motion.g
              animate={isPlaying ? "playing" : "paused"}
              variants={reelVariantsLeft}
              style={{ originX: "125px", originY: "130px" }}
            >
              {/* Outer ring */}
              <circle cx="125" cy="130" r="56" fill="#080605" />
              <circle cx="125" cy="130" r="54" fill="none"
                stroke={colors.accent} strokeWidth="0.8" strokeOpacity="0.25" />

              {/* Tape wound on left reel — shrinks as progress increases */}
              {Array.from({ length: Math.max(2, Math.round((1 - progress) * 8)) }).map((_, i) => (
                <circle key={i} cx="125" cy="130"
                  r={leftThickness + i * 2.2}
                  fill="none" stroke="#3D2B1F" strokeWidth="1.8" strokeOpacity={0.55 - i * 0.04} />
              ))}

              {/* Reel hub */}
              <circle cx="125" cy="130" r="22" fill="url(#reelGrad)" />
              <circle cx="125" cy="130" r="14" fill="#0A0807" />

              {/* Spokes — with motion blur when fast */}
              <g filter={isFF ? "url(#spokeBlur)" : undefined}>
                {[0, 60, 120, 180, 240, 300].map(angle => {
                  const rad = (angle * Math.PI) / 180;
                  const x1 = +(125 + Math.cos(rad) * 14).toFixed(4);
                  const y1 = +(130 + Math.sin(rad) * 14).toFixed(4);
                  const x2 = +(125 + Math.cos(rad) * 22).toFixed(4);
                  const y2 = +(130 + Math.sin(rad) * 22).toFixed(4);
                  return (
                    <line
                      key={angle}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={colors.accent}
                      strokeWidth="2.5"
                      strokeOpacity="0.65"
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>

              {/* Spoke highlight on top spoke */}
              <circle cx="125" cy={130 - 18} r="1.5"
                fill={colors.specular} fillOpacity="0.3" />

              {/* Centre hub */}
              <circle cx="125" cy="130" r="6" fill="#030201" />
              {/* Hub specular dot */}
              <circle cx="123.5" cy="128.5" r="1.5"
                fill="white" fillOpacity="0.15" />
            </motion.g>

            {/* ── RIGHT REEL — tape fills as progress increases ── */}
            <motion.g
              animate={isPlaying ? "playing" : "paused"}
              variants={reelVariantsRight}
              style={{ originX: "295px", originY: "130px" }}
            >
              <circle cx="295" cy="130" r="56" fill="#080605" />
              <circle cx="295" cy="130" r="54" fill="none"
                stroke={colors.accent} strokeWidth="0.8" strokeOpacity="0.25" />

              {/* Tape wound on right reel — grows as progress increases */}
              {Array.from({ length: Math.max(2, Math.round(progress * 8)) }).map((_, i) => (
                <circle key={i} cx="295" cy="130"
                  r={rightThickness + i * 2.2}
                  fill="none" stroke="#3D2B1F" strokeWidth="1.8" strokeOpacity={0.55 - i * 0.04} />
              ))}

              <circle cx="295" cy="130" r="22" fill="url(#reelGrad)" />
              <circle cx="295" cy="130" r="14" fill="#0A0807" />

              <g filter={isFF ? "url(#spokeBlur)" : undefined}>
                {[0, 60, 120, 180, 240, 300].map(angle => {
                  const rad = (angle * Math.PI) / 180;
                  const x1 = +(295 + Math.cos(rad) * 14).toFixed(4);
                  const y1 = +(130 + Math.sin(rad) * 14).toFixed(4);
                  const x2 = +(295 + Math.cos(rad) * 22).toFixed(4);
                  const y2 = +(130 + Math.sin(rad) * 22).toFixed(4);
                  return (
                    <line
                      key={angle}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={colors.accent}
                      strokeWidth="2.5"
                      strokeOpacity="0.65"
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>

              <circle cx="295" cy="130" r="6" fill="#030201" />
              <circle cx="293.5" cy="128.5" r="1.5"
                fill="white" fillOpacity="0.15" />
            </motion.g>

            {/* ── SHELL GRIP BUMPS ── */}
            {[60, 90, 120, 150, 180].map((y, i) => (
              <g key={i}>
                <rect x="4"   y={y} width="5" height="10" rx="1.5"
                  fill={colors.accent} fillOpacity="0.12" />
                <rect x="4"   y={y} width="1.5" height="10" rx="0.75"
                  fill={colors.specular} fillOpacity="0.1" />
                <rect x="411" y={y} width="5" height="10" rx="1.5"
                  fill={colors.accent} fillOpacity="0.12" />
              </g>
            ))}

            {/* ── STATIC GRAIN OVERLAY — micro-texture ── */}
            {/* Rendered as a semi-opaque rect with a subtle noise pattern */}
            <rect x="4" y="4" width="412" height="252" rx="22"
              fill="none" stroke="white" strokeWidth="0" opacity="0.015"
              style={{ mixBlendMode: "overlay" }} />
          </svg>

          {/* Pointer-driven specular overlay — outside SVG for CSS flexibility */}
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 40% 20%, ${colors.specular}14 0%, transparent 55%)`,
              mixBlendMode: "screen",
            }}
          />
        </motion.div>

        {/* Side A / B flip button */}
        {onFlipSide && (
          <motion.button
            onClick={() => {
              playFlipSound();
              onFlipSide();
            }}
            className="absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-mono tracking-widest border"
            style={{
              background: "rgba(28,24,20,0.8)",
              borderColor: "rgba(245,240,232,0.2)",
              color: "#F5F0E8",
              backdropFilter: "blur(8px)",
            }}
            whileHover={{ scale: 1.05, borderColor: "rgba(245,240,232,0.4)" }}
            whileTap={{ scale: 0.92, y: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            aria-label={`Currently playing Side ${side}. Click to flip to Side ${side === "A" ? "B" : "A"}`}
          >
            FLIP →
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
