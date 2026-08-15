"use client";

import { motion, useAnimation } from "framer-motion";
import { playCaseOpenSound, playCaseCloseSound } from "@/app/lib/sounds";

export type CaseCoverState = "closed" | "opening" | "open" | "closing";

interface CassetteCaseProps {
  state: CaseCoverState;
  style?: "classic" | "y2k" | "love" | "road_trip" | "school" | "summer";
  title?: string;
  recipientName?: string;
  senderName?: string;
  /** Only used in closed state */
  label?: React.ReactNode;
  className?: string;
}

const STYLE_COLORS = {
  classic:   { shell: "#C8A96E", spine: "#8B5E3C", text: "#1C0F05", accent: "#D4882A" },
  y2k:       { shell: "#2D0A4E", spine: "#E040FB", text: "#F5E6FF", accent: "#00E5FF" },
  love:      { shell: "#3D0A14", spine: "#D45A6A", text: "#FFE8EC", accent: "#F7A8B0" },
  road_trip: { shell: "#0A1A2E", spine: "#5B7FA6", text: "#E8F0F8", accent: "#D4882A" },
  school:    { shell: "#1A2535", spine: "#4A5F8F", text: "#E0E8F0", accent: "#7A8FB0" },
  summer:    { shell: "#3A2A1A", spine: "#F5A623", text: "#FFFAF0", accent: "#FFD966" },
};

export default function CassetteCase({
  state,
  style = "road_trip",
  title = "Untitled Tape",
  recipientName = "Someone",
  senderName = "Someone",
  className = "",
}: CassetteCaseProps) {
  const colors = STYLE_COLORS[style] ?? STYLE_COLORS["classic"];

  // Lid rotation: 0 = closed, -160 = fully open (perspective flip)
  const lidAngle = state === "open" ? -162 : state === "opening" ? -162 : 0;
  const lidTransition =
    state === "opening"
      ? { duration: 0.65, ease: [0.22, 1, 0.36, 1] }
      : state === "closing"
      ? { duration: 0.5, ease: [0.4, 0, 0.6, 1] }
      : { duration: 0 };

  return (
    <div
      className={`relative select-none ${className}`}
      style={{ perspective: "900px" }}
    >
      <svg
        viewBox="0 0 320 210"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-2xl"
        aria-label={`Cassette case — ${title}`}
        role="img"
      >
        <defs>
          <linearGradient id="caseBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.shell} stopOpacity="0.9" />
            <stop offset="100%" stopColor={colors.spine} stopOpacity="1" />
          </linearGradient>
          <linearGradient id="caseLid" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={colors.shell} stopOpacity="1" />
            <stop offset="100%" stopColor={colors.spine} stopOpacity="0.75" />
          </linearGradient>
          <filter id="caseInner">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* ── CASE BODY (bottom half, always visible) ── */}
        <rect x="4" y="100" width="312" height="106" rx="12" fill="url(#caseBody)"
          stroke={colors.accent} strokeWidth="0.8" strokeOpacity="0.3" />

        {/* Body inner recess */}
        <rect x="14" y="108" width="292" height="90" rx="8"
          fill="#0A0807" fillOpacity="0.6" filter="url(#caseInner)" />

        {/* Cassette sitting in case (visible when lid is open) */}
        {(state === "open" || state === "opening") && (
          <g opacity={state === "open" ? 1 : 0.6}>
            {/* Tape shell */}
            <rect x="30" y="112" width="260" height="80" rx="8"
              fill="#2A1F14" stroke={colors.accent} strokeWidth="0.8" strokeOpacity="0.4" />
            {/* Left reel */}
            <circle cx="100" cy="152" r="28" fill="#0A0807" />
            <circle cx="100" cy="152" r="20" fill="#1A1208" />
            <circle cx="100" cy="152" r="8" fill="#050402" />
            {[0,60,120,180,240,300].map(a => {
              const r = (a * Math.PI) / 180;
              return <line key={a}
                x1={100 + Math.cos(r)*8} y1={152 + Math.sin(r)*8}
                x2={100 + Math.cos(r)*20} y2={152 + Math.sin(r)*20}
                stroke={colors.accent} strokeWidth="2" strokeOpacity="0.6" strokeLinecap="round" />;
            })}
            {/* Right reel */}
            <circle cx="220" cy="152" r="28" fill="#0A0807" />
            <circle cx="220" cy="152" r="20" fill="#1A1208" />
            <circle cx="220" cy="152" r="8" fill="#050402" />
            {[0,60,120,180,240,300].map(a => {
              const r = (a * Math.PI) / 180;
              return <line key={a}
                x1={220 + Math.cos(r)*8} y1={152 + Math.sin(r)*8}
                x2={220 + Math.cos(r)*20} y2={152 + Math.sin(r)*20}
                stroke={colors.accent} strokeWidth="2" strokeOpacity="0.6" strokeLinecap="round" />;
            })}
            {/* Label */}
            <rect x="118" y="130" width="84" height="44" rx="5"
              fill={colors.shell} fillOpacity="0.8" />
            <text x="160" y="149" textAnchor="middle" fill={colors.text}
              fontSize="7.5" fontWeight="700" fontFamily="'Playfair Display',serif" fontStyle="italic">
              {title.length > 16 ? title.slice(0,16) + "…" : title}
            </text>
            <text x="160" y="162" textAnchor="middle" fill={colors.text}
              fontSize="5.5" fontFamily="monospace" opacity="0.7">
              FOR {recipientName.toUpperCase()}
            </text>
          </g>
        )}

        {/* Case spine text */}
        <text x="160" y="196" textAnchor="middle" fill={colors.text}
          fontSize="6.5" fontFamily="monospace" letterSpacing="3" opacity="0.4">
          CASSETTE
        </text>

        {/* Hinge line */}
        <line x1="14" y1="100" x2="306" y2="100"
          stroke={colors.accent} strokeWidth="0.8" strokeOpacity="0.25" />

        {/* ── LID (top half) — rotates open ── */}
        <motion.g
          style={{ originX: "160px", originY: "100px" }}
          animate={{ rotateX: lidAngle }}
          transition={lidTransition}
        >
          <rect x="4" y="4" width="312" height="100" rx="12" fill="url(#caseLid)"
            stroke={colors.accent} strokeWidth="0.8" strokeOpacity="0.35" />

          {/* Clear window in lid */}
          <rect x="80" y="14" width="160" height="70" rx="6"
            fill="#0D0B09" fillOpacity="0.5"
            stroke={colors.accent} strokeWidth="0.5" strokeOpacity="0.3" />

          {/* Printed label on lid inner face */}
          <text x="160" y="42" textAnchor="middle" fill={colors.text}
            fontSize="9" fontFamily="monospace" letterSpacing="2" opacity="0.5">
            FOR
          </text>
          <text x="160" y="60" textAnchor="middle" fill={colors.text}
            fontSize="14" fontWeight="900"
            fontFamily="'Playfair Display',serif" fontStyle="italic">
            {recipientName.length > 14 ? recipientName.slice(0,14) + "…" : recipientName}
          </text>
          <text x="160" y="75" textAnchor="middle" fill={colors.text}
            fontSize="7" fontFamily="monospace" opacity="0.5">
            from {senderName}
          </text>

          {/* Lid edge highlight */}
          <rect x="4" y="4" width="312" height="2" rx="1"
            fill="white" fillOpacity="0.07" />
          {/* Latch tab */}
          <rect x="146" y="98" width="28" height="6" rx="3"
            fill={colors.accent} fillOpacity="0.5" />
        </motion.g>
      </svg>
    </div>
  );
}
