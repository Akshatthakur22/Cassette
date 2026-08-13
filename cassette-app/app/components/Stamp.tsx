"use client";

/**
 * Stamp.tsx — Reusable Indian postage stamp component
 *
 * Inspired by:
 * - India Post (BharatPost) red pillar-box aesthetic
 * - Vintage Indian postal stamps with ornate borders
 * - The "पत्र / LETTERS" signage from image 15
 * - Perforated edges, philatelic corner marks, cancellation lines
 *
 * Usage:
 *   <Stamp variant="post" label="Sent with love" color="red" />
 *   <Stamp variant="music" label="Side A" color="marigold" size="sm" />
 *   <Stamp variant="plain" canceled />
 */

import { motion } from "framer-motion";

type StampVariant = "post" | "music" | "heart" | "cassette" | "plain" | "flower";
type StampColor = "red" | "marigold" | "teal" | "forest" | "indigo" | "rose" | "cream";
type StampSize = "xs" | "sm" | "md" | "lg";

interface StampProps {
  variant?: StampVariant;
  label?: string;
  sublabel?: string;
  color?: StampColor;
  size?: StampSize;
  canceled?: boolean;
  /** Slight random tilt in degrees */
  tilt?: number;
  className?: string;
  onClick?: () => void;
  animate?: boolean;
}

/* ─── Color palette ──────────────────────────────────────────────────────── */
const STAMP_COLORS: Record<StampColor, {
  bg: string; border: string; text: string; icon: string; cancel: string;
}> = {
  red:      { bg: "#FFF5F0", border: "#C0392B", text: "#8B1A10", icon: "#C0392B", cancel: "rgba(192,57,43,0.55)" },
  marigold: { bg: "#FFFBF0", border: "#E8901A", text: "#7A4800", icon: "#E8901A", cancel: "rgba(232,144,26,0.55)" },
  teal:     { bg: "#F0FAFA", border: "#2A7A8C", text: "#0D3840", icon: "#2A7A8C", cancel: "rgba(42,122,140,0.55)" },
  forest:   { bg: "#F0FAF4", border: "#2D6A4F", text: "#0D2E1E", icon: "#2D6A4F", cancel: "rgba(45,106,79,0.55)"  },
  indigo:   { bg: "#F2F0FC", border: "#3D3589", text: "#18104A", icon: "#3D3589", cancel: "rgba(61,53,137,0.55)"  },
  rose:     { bg: "#FFF0F6", border: "#D4608A", text: "#6E1840", icon: "#D4608A", cancel: "rgba(212,96,138,0.55)" },
  cream:    { bg: "#FFFDF5", border: "#C4A050", text: "#5A3A10", icon: "#C4A050", cancel: "rgba(196,160,80,0.55)"  },
};

/* ─── Size dimensions ────────────────────────────────────────────────────── */
const STAMP_SIZES: Record<StampSize, { w: number; h: number; perf: number; fontSize: number; subSize: number; iconSize: number }> = {
  xs: { w: 52,  h: 64,  perf: 4,  fontSize: 5.5, subSize: 4,   iconSize: 16 },
  sm: { w: 70,  h: 86,  perf: 5,  fontSize: 7,   subSize: 5,   iconSize: 22 },
  md: { w: 90,  h: 110, perf: 6,  fontSize: 8.5, subSize: 6,   iconSize: 28 },
  lg: { w: 120, h: 148, perf: 8,  fontSize: 11,  subSize: 7.5, iconSize: 38 },
};

/* ─── Perforation path generator ─────────────────────────────────────────── */
function perforatedPath(w: number, h: number, perf: number): string {
  const r = perf / 2;
  const steps = Math.floor;
  const hCount = steps(w / (perf * 1.6));
  const vCount = steps(h / (perf * 1.6));
  const hGap = w / hCount;
  const vGap = h / vCount;

  let d = "";
  // Top edge
  for (let i = 0; i <= hCount; i++) {
    const x = i * hGap;
    d += `M ${x} 0 a ${r} ${r} 0 0 0 0 0 `;
  }
  // Bottom edge
  for (let i = 0; i <= hCount; i++) {
    const x = i * hGap;
    d += `M ${x} ${h} a ${r} ${r} 0 0 0 0 0 `;
  }
  // Left edge
  for (let i = 0; i <= vCount; i++) {
    const y = i * vGap;
    d += `M 0 ${y} a ${r} ${r} 0 0 0 0 0 `;
  }
  // Right edge
  for (let i = 0; i <= vCount; i++) {
    const y = i * vGap;
    d += `M ${w} ${y} a ${r} ${r} 0 0 0 0 0 `;
  }
  return d;
}

/* ─── SVG icon per variant ───────────────────────────────────────────────── */
function StampIcon({ variant, size, color }: { variant: StampVariant; size: number; color: string }) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  switch (variant) {
    case "post":
      // India Post horn / Bharat Post emblem
      return (
        <g>
          {/* Postbox silhouette */}
          <rect x={cx - s*0.3} y={cy - s*0.35} width={s*0.6} height={s*0.55} rx={s*0.08}
            fill={color} opacity="0.18" />
          <rect x={cx - s*0.3} y={cy - s*0.35} width={s*0.6} height={s*0.12} rx={s*0.04}
            fill={color} opacity="0.55" />
          <rect x={cx - s*0.12} y={cy - s*0.22} width={s*0.24} height={s*0.06} rx={s*0.02}
            fill={color} opacity="0.8" />
          {/* India Post swoosh */}
          <path d={`M ${cx - s*0.18} ${cy + s*0.12} Q ${cx} ${cy} ${cx + s*0.18} ${cy + s*0.12}`}
            stroke={color} strokeWidth={s*0.06} fill="none" strokeLinecap="round" opacity="0.9" />
        </g>
      );

    case "music":
      // Musical note
      return (
        <g>
          <path d={`M ${cx - s*0.05} ${cy - s*0.28} L ${cx + s*0.25} ${cy - s*0.38} L ${cx + s*0.25} ${cy - s*0.18} L ${cx - s*0.05} ${cy - s*0.08} Z`}
            fill={color} opacity="0.85" />
          <ellipse cx={cx - s*0.12} cy={cy + s*0.02} rx={s*0.13} ry={s*0.1}
            fill={color} opacity="0.85" transform={`rotate(-20 ${cx - s*0.12} ${cy + s*0.02})`} />
          <ellipse cx={cx + s*0.18} cy={cy - s*0.08} rx={s*0.13} ry={s*0.1}
            fill={color} opacity="0.85" transform={`rotate(-20 ${cx + s*0.18} ${cy - s*0.08})`} />
        </g>
      );

    case "heart":
      // Heart with small lotus dots
      return (
        <g>
          <path d={`M ${cx} ${cy + s*0.22} C ${cx - s*0.35} ${cy} ${cx - s*0.38} ${cy - s*0.28} ${cx} ${cy - s*0.1} C ${cx + s*0.38} ${cy - s*0.28} ${cx + s*0.35} ${cy} ${cx} ${cy + s*0.22} Z`}
            fill={color} opacity="0.82" />
          {/* Small dots inside */}
          {[-0.08, 0, 0.08].map((dx, i) => (
            <circle key={i} cx={cx + dx * s} cy={cy + s*0.04} r={s*0.025}
              fill="#FFFDF8" opacity="0.7" />
          ))}
        </g>
      );

    case "cassette":
      // Mini cassette
      return (
        <g>
          <rect x={cx - s*0.3} y={cy - s*0.2} width={s*0.6} height={s*0.38} rx={s*0.06}
            fill={color} opacity="0.2" stroke={color} strokeWidth={s*0.04} strokeOpacity="0.7" />
          <circle cx={cx - s*0.12} cy={cy + s*0.02} r={s*0.08}
            fill="none" stroke={color} strokeWidth={s*0.04} opacity="0.85" />
          <circle cx={cx + s*0.12} cy={cy + s*0.02} r={s*0.08}
            fill="none" stroke={color} strokeWidth={s*0.04} opacity="0.85" />
          <rect x={cx - s*0.08} y={cy - s*0.04} width={s*0.16} height={s*0.1} rx={s*0.02}
            fill={color} opacity="0.55" />
        </g>
      );

    case "flower":
      // Lotus-inspired flower
      return (
        <g>
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = cx + Math.cos(rad) * s * 0.08;
            const y1 = cy + Math.sin(rad) * s * 0.08;
            const x2 = cx + Math.cos(rad) * s * 0.28;
            const y2 = cy + Math.sin(rad) * s * 0.28;
            return (
              <ellipse key={i}
                cx={(x1 + x2) / 2} cy={(y1 + y2) / 2}
                rx={s * 0.08} ry={s * 0.14}
                fill={color} opacity="0.75"
                transform={`rotate(${angle} ${(x1 + x2) / 2} ${(y1 + y2) / 2})`}
              />
            );
          })}
          <circle cx={cx} cy={cy} r={s*0.1} fill={color} opacity="0.95" />
        </g>
      );

    case "plain":
    default:
      // Simple ornamental diamond
      return (
        <g>
          <path d={`M ${cx} ${cy - s*0.25} L ${cx + s*0.2} ${cy} L ${cx} ${cy + s*0.25} L ${cx - s*0.2} ${cy} Z`}
            fill={color} opacity="0.7" />
          <path d={`M ${cx} ${cy - s*0.15} L ${cx + s*0.12} ${cy} L ${cx} ${cy + s*0.15} L ${cx - s*0.12} ${cy} Z`}
            fill="#FFFDF8" opacity="0.6" />
        </g>
      );
  }
}

/* ─── Main stamp component ────────────────────────────────────────────────── */
export default function Stamp({
  variant = "post",
  label,
  sublabel,
  color = "red",
  size = "md",
  canceled = false,
  tilt = 0,
  className = "",
  onClick,
  animate: doAnimate = false,
}: StampProps) {
  const c = STAMP_COLORS[color];
  const dim = STAMP_SIZES[size];
  const { w, h, perf, fontSize, subSize, iconSize } = dim;

  const inner = 6; // inner margin
  const iw = w - inner * 2;
  const ih = h - inner * 2;

  const stamp = (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      xmlns="http://www.w3.org/2000/svg"
      className={`block ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
      style={{ transform: `rotate(${tilt}deg)`, transformOrigin: "center" }}
      role={onClick ? "button" : "img"}
      aria-label={label ? `Stamp: ${label}` : "Decorative stamp"}
    >
      <defs>
        {/* Perforation clip mask */}
        <mask id={`perf-mask-${variant}-${color}-${size}`}>
          <rect x={perf} y={perf} width={w - perf * 2} height={h - perf * 2} rx="3" fill="white" />
          {/* Perforation holes along edges */}
          {Array.from({ length: Math.floor(w / (perf * 1.6)) + 1 }).map((_, i) => {
            const x = (i / Math.floor(w / (perf * 1.6))) * w;
            return (
              <g key={`ht-${i}`}>
                <circle cx={x} cy={0} r={perf / 2} fill="black" />
                <circle cx={x} cy={h} r={perf / 2} fill="black" />
              </g>
            );
          })}
          {Array.from({ length: Math.floor(h / (perf * 1.6)) + 1 }).map((_, i) => {
            const y = (i / Math.floor(h / (perf * 1.6))) * h;
            return (
              <g key={`vp-${i}`}>
                <circle cx={0} cy={y} r={perf / 2} fill="black" />
                <circle cx={w} cy={y} r={perf / 2} fill="black" />
              </g>
            );
          })}
        </mask>

        {/* Drop shadow */}
        <filter id={`stamp-shadow-${variant}-${size}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1.5" dy="2" stdDeviation="2" floodColor="rgba(80,40,0,0.2)" />
        </filter>
      </defs>

      {/* Stamp body with perforations */}
      <g mask={`url(#perf-mask-${variant}-${color}-${size})`}
         filter={`url(#stamp-shadow-${variant}-${size})`}>
        {/* Background */}
        <rect x={0} y={0} width={w} height={h} fill={c.bg} />

        {/* Aged paper grain */}
        <rect x={0} y={0} width={w} height={h} fill={c.border} opacity="0.04" />

        {/* Inner border frame */}
        <rect x={inner} y={inner} width={iw} height={ih} rx="2"
          fill="none" stroke={c.border} strokeWidth="1.2" opacity="0.8" />

        {/* Corner ornaments */}
        {[[inner+2, inner+2], [w-inner-2, inner+2], [inner+2, h-inner-2], [w-inner-2, h-inner-2]].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r={fontSize * 0.38} fill={c.border} opacity="0.55" />
            <circle cx={cx} cy={cy} r={fontSize * 0.18} fill={c.bg} opacity="0.9" />
          </g>
        ))}

        {/* Main icon */}
        <StampIcon variant={variant} size={iconSize} color={c.icon} />

        {/* Label text */}
        {label && (
          <text
            x={w / 2} y={h - inner - (sublabel ? fontSize * 2.2 : fontSize * 1.4)}
            textAnchor="middle"
            fill={c.text}
            fontSize={fontSize}
            fontWeight="700"
            fontFamily="'Playfair Display', Georgia, serif"
            letterSpacing="0.5"
          >
            {label.toUpperCase()}
          </text>
        )}

        {/* Sub-label */}
        {sublabel && (
          <text
            x={w / 2} y={h - inner - subSize * 0.6}
            textAnchor="middle"
            fill={c.text}
            fontSize={subSize}
            fontFamily="'Inter', monospace"
            letterSpacing="1"
            opacity="0.7"
          >
            {sublabel}
          </text>
        )}

        {/* Cancellation lines — diagonal wavy */}
        {canceled && (
          <g opacity="0.5">
            {[0.3, 0.5, 0.7].map((t, i) => (
              <path key={i}
                d={`M ${w * t - 4} ${inner + 2} Q ${w * t} ${h / 2} ${w * t + 4} ${h - inner - 2}`}
                stroke={c.cancel} strokeWidth="1.5" fill="none" strokeLinecap="round"
              />
            ))}
            <text x={w / 2} y={h / 2 + fontSize * 0.4}
              textAnchor="middle"
              fill={c.cancel}
              fontSize={fontSize * 0.85}
              fontFamily="'Inter', monospace"
              fontWeight="700"
              letterSpacing="1.5"
              transform={`rotate(-25 ${w/2} ${h/2})`}
            >
              SENT
            </text>
          </g>
        )}
      </g>
    </svg>
  );

  if (doAnimate) {
    return (
      <motion.div
        whileHover={{ scale: 1.06, rotate: tilt + 2 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 280, damping: 18 }}
        className="inline-block"
      >
        {stamp}
      </motion.div>
    );
  }

  return <div className="inline-block">{stamp}</div>;
}

/* ─── Stamp cluster — place multiple stamps in a natural scatter ─────────── */
interface StampClusterProps {
  stamps: Array<Omit<StampProps, "className"> & { key?: string }>;
  className?: string;
}

export function StampCluster({ stamps, className = "" }: StampClusterProps) {
  return (
    <div className={`relative inline-block ${className}`}>
      {stamps.map((props, i) => {
        const { key, ...rest } = props;
        return (
          <div
            key={key ?? i}
            className="absolute"
            style={{
              top: `${(i * 28) % 40}px`,
              right: `${(i * 18) % 32}px`,
              zIndex: i,
            }}
          >
            <Stamp {...rest} animate />
          </div>
        );
      })}
    </div>
  );
}

/* ─── BharatPost stamp — faithful India Post aesthetic ─────────────────── */
interface BharatPostStampProps {
  label?: string;
  value?: string; /** e.g. "Re. 1" */
  size?: StampSize;
  tilt?: number;
  canceled?: boolean;
  className?: string;
}

export function BharatPostStamp({
  label = "INDIA",
  value = "Re. 1",
  size = "md",
  tilt = 0,
  canceled = false,
  className = "",
}: BharatPostStampProps) {
  const dim = STAMP_SIZES[size];
  const { w, h, perf, fontSize, subSize } = dim;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      xmlns="http://www.w3.org/2000/svg"
      className={`block ${className}`}
      style={{ transform: `rotate(${tilt}deg)`, transformOrigin: "center" }}
      aria-label={`India Post stamp: ${label}`}
    >
      <defs>
        <mask id={`bp-perf-${size}-${label}`}>
          <rect x={perf} y={perf} width={w - perf*2} height={h - perf*2} rx="2" fill="white" />
          {Array.from({ length: Math.floor(w / (perf * 1.6)) + 1 }).map((_, i) => {
            const x = (i / Math.floor(w / (perf * 1.6))) * w;
            return (
              <g key={i}>
                <circle cx={x} cy={0} r={perf/2} fill="black" />
                <circle cx={x} cy={h} r={perf/2} fill="black" />
              </g>
            );
          })}
          {Array.from({ length: Math.floor(h / (perf * 1.6)) + 1 }).map((_, i) => {
            const y = (i / Math.floor(h / (perf * 1.6))) * h;
            return (
              <g key={i}>
                <circle cx={0} cy={y} r={perf/2} fill="black" />
                <circle cx={w} cy={y} r={perf/2} fill="black" />
              </g>
            );
          })}
        </mask>
      </defs>

      <g mask={`url(#bp-perf-${size}-${label})`}>
        {/* Background — India Post red */}
        <rect x={0} y={0} width={w} height={h} fill="#C0392B" />
        {/* Inner cream panel */}
        <rect x={perf+2} y={perf+2} width={w-perf*2-4} height={h-perf*2-4} rx="1.5"
          fill="#FFF8EE" />

        {/* India Post swoosh/logo area */}
        <rect x={perf+2} y={perf+2} width={w-perf*2-4} height={(h-perf*2-4)*0.32} rx="1.5"
          fill="#C0392B" />
        {/* Swoosh path */}
        <path
          d={`M ${w*0.22} ${perf + (h-perf*2)*0.12} Q ${w*0.5} ${perf + (h-perf*2)*0.24} ${w*0.78} ${perf + (h-perf*2)*0.12}`}
          stroke="#E8C050" strokeWidth={Math.max(1.5, fontSize*0.45)} fill="none" strokeLinecap="round"
        />
        {/* "INDIA POST" text on red band */}
        <text x={w/2} y={perf + (h-perf*2)*0.27}
          textAnchor="middle" fill="#E8C050"
          fontSize={fontSize * 0.75} fontWeight="700"
          fontFamily="'Inter', monospace" letterSpacing="1.2"
        >
          INDIA POST
        </text>

        {/* Ashoka Pillar wheel placeholder (simplified) */}
        <circle cx={w/2} cy={perf + (h-perf*2)*0.58} r={fontSize*1.2}
          fill="none" stroke="#2D6A4F" strokeWidth={fontSize*0.18} opacity="0.6" />
        {[0,45,90,135,180,225,270,315].map((a,i) => {
          const rad = (a * Math.PI)/180;
          const r1 = fontSize*0.5;
          const r2 = fontSize*1.15;
          const cx_ = w/2 + Math.cos(rad)*r1;
          const cy_ = perf + (h-perf*2)*0.58 + Math.sin(rad)*r1;
          const x2 = w/2 + Math.cos(rad)*r2;
          const y2 = perf + (h-perf*2)*0.58 + Math.sin(rad)*r2;
          return <line key={i} x1={cx_} y1={cy_} x2={x2} y2={y2}
            stroke="#2D6A4F" strokeWidth={fontSize*0.1} opacity="0.55" />;
        })}

        {/* Country label */}
        <text x={w/2} y={perf + (h-perf*2)*0.78}
          textAnchor="middle" fill="#1C140A"
          fontSize={fontSize} fontWeight="700"
          fontFamily="'Playfair Display', Georgia, serif"
          letterSpacing="0.8"
        >
          {label.toUpperCase()}
        </text>

        {/* Denomination */}
        <text x={w/2} y={h - perf - subSize*0.5}
          textAnchor="middle" fill="#C0392B"
          fontSize={subSize} fontWeight="700"
          fontFamily="'Inter', monospace"
          letterSpacing="0.5"
        >
          {value}
        </text>

        {/* Cancellation */}
        {canceled && (
          <g opacity="0.6">
            {[0.3, 0.5, 0.68].map((t, i) => (
              <path key={i}
                d={`M ${w*t-3} ${perf*2} L ${w*t+3} ${h-perf*2}`}
                stroke="rgba(28,20,10,0.55)" strokeWidth="1.2" strokeLinecap="round"
              />
            ))}
          </g>
        )}
      </g>
    </svg>
  );
}
