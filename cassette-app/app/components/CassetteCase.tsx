"use client";

import { motion } from "framer-motion";
import type { TapeColorKey } from "./CassetteObject";

export type CaseCoverState = "closed" | "opening" | "open" | "closing";

interface CassetteCaseProps {
  state: CaseCoverState;
  style?: TapeColorKey | string;
  title?: string;
  recipientName?: string;
  senderName?: string;
  className?: string;
}

const CASE_TINTS: Record<string, { acrylic: string; spine: string; text: string; accent: string; highlight: string; labelBg: string }> = {
  cream:       { acrylic: "rgba(225, 210, 190, 0.40)", spine: "#C8A96E", text: "#2A1808", accent: "#D4882A", highlight: "rgba(255,255,255,0.75)", labelBg: "#FFFDF6" },
  cherry:      { acrylic: "rgba(232, 64, 96, 0.35)",   spine: "#E84060", text: "#24040A", accent: "#E84060", highlight: "rgba(255,235,240,0.75)", labelBg: "#FFF8F9" },
  peach:       { acrylic: "rgba(232, 112, 58, 0.35)",  spine: "#E8703A", text: "#280E04", accent: "#E8703A", highlight: "rgba(255,240,230,0.75)", labelBg: "#FFF9F5" },
  butter:      { acrylic: "rgba(245, 216, 64, 0.35)",  spine: "#F5D840", text: "#2E2404", accent: "#D4A820", highlight: "rgba(255,255,235,0.75)", labelBg: "#FFFDF0" },
  sky:         { acrylic: "rgba(90, 200, 250, 0.35)",  spine: "#5AC8FA", text: "#061A28", accent: "#38A8E8", highlight: "rgba(235,248,255,0.75)", labelBg: "#F5FBFF" },
  pool:        { acrylic: "rgba(26, 152, 152, 0.35)",  spine: "#1A9898", text: "#042020", accent: "#1A9898", highlight: "rgba(230,255,255,0.75)", labelBg: "#F2FFFF" },
  lavender:    { acrylic: "rgba(176, 128, 224, 0.35)", spine: "#B080E0", text: "#1E0B30", accent: "#9060C8", highlight: "rgba(250,240,255,0.75)", labelBg: "#FAF5FF" },
  mint:        { acrylic: "rgba(52, 199, 89, 0.35)",   spine: "#34C759", text: "#042210", accent: "#28A858", highlight: "rgba(235,255,245,0.75)", labelBg: "#F4FFF7" },
  transparent: { acrylic: "rgba(215, 235, 255, 0.30)", spine: "#7EA8D0", text: "#0A1E30", accent: "#5AC8FA", highlight: "rgba(255,255,255,0.85)", labelBg: "#F8FCFF" },
  smoky:       { acrylic: "rgba(45, 40, 50, 0.60)",    spine: "#3A3540", text: "#F0EDF5", accent: "#A070D8", highlight: "rgba(255,255,255,0.40)", labelBg: "#2A2530" },
  classic:     { acrylic: "rgba(210, 180, 130, 0.40)", spine: "#9E6D38", text: "#2A1808", accent: "#D4882A", highlight: "rgba(255,255,255,0.75)", labelBg: "#FFFDF6" },
  y2k:         { acrylic: "rgba(224, 64, 251, 0.35)",  spine: "#E040FB", text: "#150028", accent: "#00E5FF", highlight: "rgba(255,230,255,0.75)", labelBg: "#FFF5FF" },
  love:        { acrylic: "rgba(212, 90, 106, 0.35)",  spine: "#D45A6A", text: "#240408", accent: "#F7A8B0", highlight: "rgba(255,230,238,0.75)", labelBg: "#FFF5F7" },
  road_trip:   { acrylic: "rgba(91, 127, 166, 0.35)",  spine: "#5B7FA6", text: "#081420", accent: "#D4882A", highlight: "rgba(230,245,255,0.75)", labelBg: "#F5F9FF" },
  school:      { acrylic: "rgba(74, 95, 143, 0.35)",   spine: "#4A5F8F", text: "#0A1428", accent: "#7A8FB0", highlight: "rgba(230,240,255,0.75)", labelBg: "#F5F8FF" },
  summer:      { acrylic: "rgba(245, 166, 35, 0.35)",  spine: "#F5A623", text: "#281604", accent: "#FFD966", highlight: "rgba(255,250,230,0.75)", labelBg: "#FFFDF5" },
};

export default function CassetteCase({
  state,
  style = "classic",
  title = "Untitled Tape",
  recipientName = "Someone",
  senderName = "Someone",
  className = "",
}: CassetteCaseProps) {
  const tint = CASE_TINTS[style] ?? CASE_TINTS.classic;
  const isClosed = state === "closed";

  // Lid angle: 0deg when closed, -145deg when fully open
  const lidAngle = state === "open" || state === "opening" ? -145 : 0;
  const lidTransition =
    state === "opening"
      ? { duration: 0.65, ease: [0.22, 1, 0.36, 1] }
      : state === "closing"
      ? { duration: 0.5, ease: [0.4, 0, 0.6, 1] }
      : { duration: 0 };

  return (
    <div
      className={`relative select-none ${className}`}
      style={{ perspective: "1000px" }}
    >
      <svg
        viewBox="0 0 340 220"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-xl"
        aria-label={`Cassette case — ${title}`}
        role="img"
      >
        <defs>
          {/* Acrylic Glass Gradients */}
          <linearGradient id="acrylicGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="30%" stopColor={tint.acrylic} stopOpacity="0.7" />
            <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.2" />
            <stop offset="100%" stopColor={tint.acrylic} stopOpacity="0.55" />
          </linearGradient>

          <linearGradient id="trayGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tint.spine} stopOpacity="0.9" />
            <stop offset="100%" stopColor="#181410" stopOpacity="0.98" />
          </linearGradient>

          {/* High-gloss diagonal glare */}
          <linearGradient id="glareGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.0" />
            <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
          </linearGradient>

          {/* Soft shadow */}
          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* ── CASE TRAY / BASE (Bottom half) ── */}
        <rect
          x="8"
          y="105"
          width="324"
          height="108"
          rx="12"
          fill="url(#trayGrad)"
          stroke={tint.accent}
          strokeWidth="1"
          strokeOpacity="0.35"
        />

        {/* Molded Inner Tray */}
        <rect
          x="18"
          y="114"
          width="304"
          height="92"
          rx="8"
          fill="#0C0A08"
          fillOpacity="0.8"
          filter="url(#softShadow)"
        />

        {/* ── CASSETTE TAPE SHELL (Inside Tray) ── */}
        <g id="cassetteInTray">
          {/* Shell body */}
          <rect
            x="32"
            y="120"
            width="276"
            height="80"
            rx="8"
            fill={tint.spine}
            fillOpacity="0.88"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
          />

          {/* Left Spool Reel Hub */}
          <circle cx="106" cy="160" r="26" fill="#14100C" stroke={tint.accent} strokeWidth="1" strokeOpacity="0.3" />
          <circle cx="106" cy="160" r="18" fill="#241E18" />
          <circle cx="106" cy="160" r="7" fill="#0A0806" />
          {[0, 60, 120, 180, 240, 300].map(a => {
            const rad = (a * Math.PI) / 180;
            return (
              <line
                key={`l-${a}`}
                x1={106 + Math.cos(rad) * 7}
                y1={160 + Math.sin(rad) * 7}
                x2={106 + Math.cos(rad) * 18}
                y2={160 + Math.sin(rad) * 18}
                stroke={tint.accent}
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}

          {/* Right Spool Reel Hub */}
          <circle cx="234" cy="160" r="26" fill="#14100C" stroke={tint.accent} strokeWidth="1" strokeOpacity="0.3" />
          <circle cx="234" cy="160" r="18" fill="#241E18" />
          <circle cx="234" cy="160" r="7" fill="#0A0806" />
          {[0, 60, 120, 180, 240, 300].map(a => {
            const rad = (a * Math.PI) / 180;
            return (
              <line
                key={`r-${a}`}
                x1={234 + Math.cos(rad) * 7}
                y1={160 + Math.sin(rad) * 7}
                x2={234 + Math.cos(rad) * 18}
                y2={160 + Math.sin(rad) * 18}
                stroke={tint.accent}
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}

          {/* Center Paper Label */}
          <rect
            x="126"
            y="136"
            width="88"
            height="48"
            rx="6"
            fill={tint.labelBg}
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="0.8"
          />
          <text
            x="170"
            y="154"
            textAnchor="middle"
            fill={tint.text}
            fontSize="8.5"
            fontWeight="800"
            fontFamily="'Playfair Display', Georgia, serif"
            fontStyle="italic"
          >
            {title.length > 15 ? title.slice(0, 15) + "…" : title}
          </text>
          <text
            x="170"
            y="169"
            textAnchor="middle"
            fill={tint.text}
            fontSize="6"
            fontWeight="700"
            fontFamily="monospace"
            opacity="0.8"
          >
            FOR {recipientName.toUpperCase()}
          </text>
        </g>

        {/* Molded Hinge Side Tabs */}
        <rect x="8" y="98" width="12" height="14" rx="3" fill="#2C2620" stroke={tint.accent} strokeWidth="0.6" />
        <rect x="320" y="98" width="12" height="14" rx="3" fill="#2C2620" stroke={tint.accent} strokeWidth="0.6" />
        <line x1="20" y1="105" x2="320" y2="105" stroke={tint.accent} strokeWidth="1" strokeOpacity="0.4" />

        {/* ── ROTATING TRANSPARENT ACRYLIC LID ── */}
        <motion.g
          style={{ originX: "170px", originY: "105px" }}
          animate={{ rotateX: lidAngle }}
          transition={lidTransition}
        >
          {/* Main transparent acrylic front cover */}
          <rect
            x="8"
            y="6"
            width="324"
            height="100"
            rx="12"
            fill="url(#acrylicGrad)"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.2"
          />

          {/* High-gloss glare streak */}
          <polygon points="8,6 180,6 60,106 8,106" fill="url(#glareGrad)" />

          {/* Inside J-Card Cover Print — visible right-side up when closed */}
          {isClosed && (
            <g id="jcardClosed">
              <rect
                x="26"
                y="18"
                width="288"
                height="76"
                rx="8"
                fill={tint.labelBg}
                fillOpacity="0.94"
                stroke="rgba(0,0,0,0.08)"
                strokeWidth="1"
              />
              {/* J-card vintage spine band */}
              <rect x="26" y="18" width="10" height="76" rx="4" fill={tint.accent} fillOpacity="0.9" />

              {/* J-card Typography */}
              <text
                x="50"
                y="38"
                fill="#8E8E93"
                fontSize="6.5"
                fontFamily="monospace"
                letterSpacing="2"
                fontWeight="700"
              >
                CASSETTE.FM · MIXTAPE
              </text>
              <text
                x="50"
                y="58"
                fill={tint.text}
                fontSize="14"
                fontWeight="800"
                fontFamily="'Playfair Display', Georgia, serif"
                fontStyle="italic"
              >
                {recipientName.length > 18 ? recipientName.slice(0, 18) + "…" : recipientName}
              </text>
              <text
                x="50"
                y="74"
                fill={tint.text}
                fontSize="7.5"
                fontFamily="monospace"
                opacity="0.75"
              >
                from {senderName}
              </text>
            </g>
          )}

          {/* Acrylic top highlight bevel */}
          <line x1="18" y1="8" x2="322" y2="8" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.7" strokeLinecap="round" />

          {/* Front Center Latch Tab */}
          <rect
            x="152"
            y="99"
            width="36"
            height="8"
            rx="4"
            fill={tint.accent}
            fillOpacity="0.85"
            stroke="#FFFFFF"
            strokeWidth="0.8"
          />
        </motion.g>
      </svg>
    </div>
  );
}
