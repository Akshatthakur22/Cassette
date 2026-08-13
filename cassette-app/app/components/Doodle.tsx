"use client";

/**
 * Doodle.tsx — Reusable hand-drawn SVG decorative elements
 *
 * Inspired by:
 * - Auto-rickshaw folk-art doodles (image 16) — white dashes, triangles, zigzags on green
 * - Indian folk art borders (scalloped frames from elephant image 13)
 * - Buri Nazar poster decorative flowers (image 17)
 * - Vintage cassette sketch style from "Back to the Old Days" (image 11)
 * - Warm hand-drawn feel, organic imperfect lines
 *
 * Usage:
 *   <Doodle type="star" color="#E8901A" size={24} />
 *   <Doodle type="sparkle" size={18} />
 *   <DoodleBorder side="bottom" color="#E8901A" />
 *   <DoodleScatter count={6} types={["star","heart","note"]} />
 */

import { motion } from "framer-motion";

export type DoodleType =
  | "star"
  | "sparkle"
  | "heart"
  | "note"
  | "flower"
  | "diamond"
  | "squiggle"
  | "dot-trio"
  | "leaf"
  | "arrow"
  | "wave"
  | "lotus"
  | "om-dot"
  | "spiral";

interface DoodleProps {
  type: DoodleType;
  color?: string;
  size?: number;
  opacity?: number;
  tilt?: number;
  className?: string;
  animate?: boolean;
  delay?: number;
}

/* ─── Individual doodle paths ─────────────────────────────────────────────── */
function DoodlePath({
  type,
  size,
  color,
}: {
  type: DoodleType;
  size: number;
  color: string;
}) {
  const s = size;
  const h = size / 2; // half
  const q = size / 4; // quarter

  switch (type) {
    case "star":
      // 6-pointed hand-drawn star — slightly wobbly
      return (
        <g fill={color} opacity="0.85">
          <path d={`M ${h} ${q*0.4} L ${h+q*0.5} ${h-q*0.3} L ${h+q*1.4} ${h-q*0.5} L ${h+q*0.6} ${h+q*0.4} L ${h+q*0.9} ${h+q*1.4} L ${h} ${h+q*0.9} L ${h-q*0.9} ${h+q*1.4} L ${h-q*0.6} ${h+q*0.4} L ${h-q*1.4} ${h-q*0.5} L ${h-q*0.5} ${h-q*0.3} Z`}
            strokeWidth="0.5" stroke={color} strokeOpacity="0.3"
          />
        </g>
      );

    case "sparkle":
      // 4-pointed glint — like a Bollywood sparkle
      return (
        <g stroke={color} strokeWidth={Math.max(1.2, s * 0.06)} strokeLinecap="round" fill="none" opacity="0.9">
          <line x1={h} y1={s*0.05} x2={h} y2={s*0.95} />
          <line x1={s*0.05} y1={h} x2={s*0.95} y2={h} />
          <line x1={s*0.2} y1={s*0.2} x2={s*0.8} y2={s*0.8} strokeWidth={Math.max(0.8, s*0.04)} />
          <line x1={s*0.8} y1={s*0.2} x2={s*0.2} y2={s*0.8} strokeWidth={Math.max(0.8, s*0.04)} />
          <circle cx={h} cy={h} r={s*0.08} fill={color} stroke="none" />
        </g>
      );

    case "heart":
      // Hand-drawn heart — slightly uneven like a doodle
      return (
        <path
          d={`M ${h} ${h*1.5} C ${h-s*0.4} ${h*1.1} ${h-s*0.48} ${h*0.45} ${h} ${h*0.7} C ${h+s*0.48} ${h*0.45} ${h+s*0.4} ${h*1.1} ${h} ${h*1.5} Z`}
          fill={color} opacity="0.82"
          stroke={color} strokeWidth="0.5" strokeOpacity="0.2"
        />
      );

    case "note":
      // Musical note — eighth note
      return (
        <g fill={color} opacity="0.85">
          {/* Stem */}
          <line x1={h+q*0.6} y1={h+q*0.9} x2={h+q*0.6} y2={h-q*1.1}
            stroke={color} strokeWidth={Math.max(1.5, s*0.07)} strokeLinecap="round" />
          {/* Flag */}
          <path d={`M ${h+q*0.6} ${h-q*1.1} Q ${h+q*1.5} ${h-q*0.7} ${h+q*0.9} ${h-q*0.2}`}
            stroke={color} strokeWidth={Math.max(1.2, s*0.06)} fill="none" strokeLinecap="round" />
          {/* Note head */}
          <ellipse cx={h+q*0.3} cy={h+q*0.95} rx={q*0.6} ry={q*0.45}
            transform={`rotate(-18 ${h+q*0.3} ${h+q*0.95})`} />
        </g>
      );

    case "flower":
      // Simple 5-petal folk flower
      return (
        <g opacity="0.8">
          {[0, 72, 144, 216, 288].map((angle, i) => {
            const rad = ((angle - 90) * Math.PI) / 180;
            const cx_ = h + Math.cos(rad) * q * 1.1;
            const cy_ = h + Math.sin(rad) * q * 1.1;
            return (
              <ellipse key={i}
                cx={cx_} cy={cy_}
                rx={q * 0.55} ry={q * 0.8}
                fill={color}
                transform={`rotate(${angle} ${cx_} ${cy_})`}
                opacity="0.75"
              />
            );
          })}
          <circle cx={h} cy={h} r={q * 0.5} fill={color} opacity="0.95" />
          <circle cx={h} cy={h} r={q * 0.22} fill="#FFFDF8" opacity="0.8" />
        </g>
      );

    case "diamond":
      // Folk-art diamond with dot centre
      return (
        <g>
          <path
            d={`M ${h} ${s*0.08} L ${s*0.9} ${h} L ${h} ${s*0.92} L ${s*0.1} ${h} Z`}
            fill={color} opacity="0.75"
            stroke={color} strokeWidth="0.8" strokeOpacity="0.4"
          />
          <path
            d={`M ${h} ${s*0.25} L ${s*0.74} ${h} L ${h} ${s*0.75} L ${s*0.26} ${h} Z`}
            fill="none" stroke="#FFFDF8" strokeWidth="1" strokeOpacity="0.6"
          />
          <circle cx={h} cy={h} r={s * 0.06} fill="#FFFDF8" opacity="0.8" />
        </g>
      );

    case "squiggle":
      // Wavy line — like ink squiggle on a notebook
      return (
        <path
          d={`M ${s*0.05} ${h} Q ${s*0.2} ${h-q*0.9} ${s*0.35} ${h} Q ${s*0.5} ${h+q*0.9} ${s*0.65} ${h} Q ${s*0.8} ${h-q*0.9} ${s*0.95} ${h}`}
          stroke={color} strokeWidth={Math.max(1.5, s * 0.07)} fill="none"
          strokeLinecap="round" opacity="0.8"
        />
      );

    case "dot-trio":
      // Three dots in a triangular arrangement
      return (
        <g fill={color} opacity="0.85">
          <circle cx={h} cy={h - q * 0.8} r={Math.max(2, s * 0.09)} />
          <circle cx={h - q * 0.7} cy={h + q * 0.5} r={Math.max(2, s * 0.09)} />
          <circle cx={h + q * 0.7} cy={h + q * 0.5} r={Math.max(2, s * 0.09)} />
        </g>
      );

    case "leaf":
      // Single pointed leaf
      return (
        <path
          d={`M ${h} ${s*0.08} Q ${s*0.85} ${h} ${h} ${s*0.92} Q ${s*0.15} ${h} ${h} ${s*0.08} Z`}
          fill={color} opacity="0.78"
        />
      );

    case "arrow":
      // Hand-drawn curved arrow
      return (
        <g stroke={color} strokeWidth={Math.max(1.5, s*0.07)} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
          <path d={`M ${s*0.15} ${h*1.3} Q ${h} ${h*0.2} ${s*0.82} ${h*0.8}`} />
          <path d={`M ${s*0.82} ${h*0.8} L ${s*0.7} ${h*0.55} M ${s*0.82} ${h*0.8} L ${s*0.95} ${h*0.65}`} />
        </g>
      );

    case "wave":
      // Double wave — like a fabric trim
      return (
        <g stroke={color} strokeWidth={Math.max(1.2, s*0.055)} fill="none" strokeLinecap="round" opacity="0.8">
          <path d={`M ${s*0.05} ${h*0.7} Q ${s*0.2} ${h*0.3} ${s*0.35} ${h*0.7} Q ${s*0.5} ${h*1.1} ${s*0.65} ${h*0.7} Q ${s*0.8} ${h*0.3} ${s*0.95} ${h*0.7}`} />
          <path d={`M ${s*0.05} ${h*1.1} Q ${s*0.2} ${h*0.7} ${s*0.35} ${h*1.1} Q ${s*0.5} ${h*1.5} ${s*0.65} ${h*1.1} Q ${s*0.8} ${h*0.7} ${s*0.95} ${h*1.1}`}
            opacity="0.55" />
        </g>
      );

    case "lotus":
      // Simplified lotus — from Pichwai/Mughal art
      return (
        <g opacity="0.82">
          {/* Stem */}
          <line x1={h} y1={s*0.95} x2={h} y2={h*1.1}
            stroke={color} strokeWidth={Math.max(1.5, s*0.07)} strokeLinecap="round" />
          {/* Petals */}
          {[-30, -15, 0, 15, 30].map((angle, i) => {
            const rad = ((angle - 90) * Math.PI) / 180;
            const tip = { x: h + Math.cos(rad) * q * 2, y: h + Math.sin(rad) * q * 2 };
            return (
              <path key={i}
                d={`M ${h} ${h+q*0.2} Q ${h + Math.cos(rad+0.4)*q*1.5} ${h + Math.sin(rad+0.4)*q*1.5} ${tip.x} ${tip.y} Q ${h + Math.cos(rad-0.4)*q*1.5} ${h + Math.sin(rad-0.4)*q*1.5} ${h} ${h+q*0.2} Z`}
                fill={color} opacity={0.65 + i * 0.05}
              />
            );
          })}
          <circle cx={h} cy={h+q*0.2} r={q*0.35} fill={color} opacity="0.95" />
        </g>
      );

    case "om-dot":
      // Simple bindi/tilak dot
      return (
        <g opacity="0.85">
          <circle cx={h} cy={h} r={s * 0.32} fill={color} opacity="0.18" />
          <circle cx={h} cy={h} r={s * 0.2} fill={color} opacity="0.55" />
          <circle cx={h} cy={h} r={s * 0.1} fill={color} opacity="0.95" />
        </g>
      );

    case "spiral":
      // Clockwise spiral — Indian folk scroll motif
      return (
        <path
          d={`M ${h} ${h} Q ${h+q*0.8} ${h-q*0.8} ${h+q*1.4} ${h} Q ${h+q*1.4} ${h+q*1.6} ${h} ${h+q*1.6} Q ${h-q*1.8} ${h+q*1.6} ${h-q*1.8} ${h} Q ${h-q*1.8} ${h-q*1.8} ${h} ${h-q*1.9}`}
          stroke={color} strokeWidth={Math.max(1.2, s*0.055)} fill="none"
          strokeLinecap="round" opacity="0.78"
        />
      );

    default:
      return <circle cx={h} cy={h} r={q} fill={color} opacity="0.7" />;
  }
}

/* ─── Main exported Doodle component ─────────────────────────────────────── */
export default function Doodle({
  type,
  color = "#E8901A",
  size = 24,
  opacity = 1,
  tilt = 0,
  className = "",
  animate: doAnimate = false,
  delay = 0,
}: DoodleProps) {
  const svgEl = (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: `rotate(${tilt}deg)`, opacity }}
      aria-hidden="true"
      className={`block pointer-events-none ${className}`}
    >
      <DoodlePath type={type} size={size} color={color} />
    </svg>
  );

  if (doAnimate) {
    return (
      <motion.div
        className="inline-block"
        initial={{ opacity: 0, scale: 0.5, rotate: tilt - 15 }}
        animate={{ opacity, scale: 1, rotate: tilt }}
        transition={{
          delay,
          duration: 0.5,
          type: "spring",
          stiffness: 200,
          damping: 15,
        }}
        whileHover={{
          scale: 1.15,
          rotate: tilt + 10,
          transition: { duration: 0.2 },
        }}
      >
        {svgEl}
      </motion.div>
    );
  }

  return <div className="inline-block">{svgEl}</div>;
}

/* ─── Doodle Border — a decorative row/column of repeating doodle elements ── */
interface DoodleBorderProps {
  side?: "top" | "bottom" | "left" | "right";
  color?: string;
  accent?: string;
  height?: number;
  className?: string;
}

export function DoodleBorder({
  side = "bottom",
  color = "#E8901A",
  accent = "#C0392B",
  height = 20,
  className = "",
}: DoodleBorderProps) {
  const isHorizontal = side === "top" || side === "bottom";
  const elementSize = height * 0.9;

  const elements: DoodleType[] = [
    "flower", "diamond", "dot-trio", "sparkle", "flower",
    "diamond", "dot-trio", "sparkle", "flower",
  ];

  return (
    <div
      className={`flex ${isHorizontal ? "flex-row" : "flex-col"} items-center justify-center gap-0 ${className}`}
      style={{
        [isHorizontal ? "height" : "width"]: `${height}px`,
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      {/* Left/top end cap */}
      <Doodle type="spiral" color={accent} size={elementSize} />

      {/* Repeating pattern */}
      {elements.map((t, i) => (
        <Doodle
          key={i}
          type={t}
          color={i % 2 === 0 ? color : accent}
          size={elementSize * (t === "flower" ? 0.85 : 0.7)}
          tilt={i % 3 === 0 ? 15 : i % 3 === 1 ? -10 : 0}
          opacity={0.7}
        />
      ))}

      {/* Right/bottom end cap */}
      <Doodle type="spiral" color={accent} size={elementSize} tilt={180} />
    </div>
  );
}

/* ─── DoodleScatter — sprinkle doodles around a region ──────────────────── */
interface DoodleScatterProps {
  count?: number;
  types?: DoodleType[];
  colors?: string[];
  minSize?: number;
  maxSize?: number;
  className?: string;
  animate?: boolean;
}

const SCATTER_DEFAULTS: DoodleType[] = [
  "star", "sparkle", "heart", "note", "flower", "dot-trio", "diamond",
];
const SCATTER_COLORS = ["#E8901A", "#C0392B", "#D4608A", "#E8C430", "#2A7A8C", "#2D6A4F"];

// Deterministic pseudo-random based on index
function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export function DoodleScatter({
  count = 8,
  types = SCATTER_DEFAULTS,
  colors = SCATTER_COLORS,
  minSize = 12,
  maxSize = 28,
  className = "",
  animate: doAnimate = true,
}: DoodleScatterProps) {
  const items = Array.from({ length: count }, (_, i) => ({
    type: types[Math.floor(seededRandom(i * 7) * types.length)] as DoodleType,
    color: colors[Math.floor(seededRandom(i * 13) * colors.length)],
    size: minSize + Math.floor(seededRandom(i * 3) * (maxSize - minSize)),
    top: `${5 + seededRandom(i * 11) * 88}%`,
    left: `${3 + seededRandom(i * 17) * 92}%`,
    tilt: Math.floor(seededRandom(i * 5) * 60) - 30,
    delay: seededRandom(i * 9) * 0.5,
  }));

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      {items.map((item, i) => (
        <div
          key={i}
          className="absolute"
          style={{ top: item.top, left: item.left, opacity: 0.55 }}
        >
          <Doodle
            type={item.type}
            color={item.color}
            size={item.size}
            tilt={item.tilt}
            delay={item.delay}
            animate={doAnimate}
          />
        </div>
      ))}
    </div>
  );
}

/* ─── Marigold garland row ───────────────────────────────────────────────── */
interface GarlandProps {
  color?: string;
  className?: string;
}

export function MarigoldGarland({ color = "#E8901A", className = "" }: GarlandProps) {
  const flowers: DoodleType[] = ["flower", "dot-trio", "flower", "dot-trio", "flower"];
  return (
    <div className={`flex items-center justify-center gap-1 ${className}`} aria-hidden="true">
      <Doodle type="wave" color={color} size={16} opacity={0.5} />
      {flowers.map((t, i) => (
        <Doodle
          key={i}
          type={t}
          color={i % 2 === 0 ? color : "#C0392B"}
          size={t === "flower" ? 14 : 10}
          opacity={0.7}
        />
      ))}
      <Doodle type="wave" color={color} size={16} opacity={0.5} tilt={180} />
    </div>
  );
}
