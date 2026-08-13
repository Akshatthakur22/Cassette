"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import type { TapeColorKey } from "./CassetteObject";
import { useReduceMotion } from "@/app/lib/use-reduce-motion";
import { PosterImage } from "./PosterImage";

export interface ShelfTape {
  publicId: string;
  title: string;
  senderName: string;
  recipientName?: string | null;
  style: TapeColorKey;
}

interface CassetteShelfProps {
  tapes: ShelfTape[];
  perRow?: number;
}

/* ─── Tape spine color palette ──────────────────────────────────────────── */
const SPINE_COLORS: Record<TapeColorKey, { 
  bg: string; accent: string; text: string; stripe: string;
}> = {
  cream:       { bg: "#F5EFE0", accent: "#A07840", text: "#3D2010", stripe: "#D4C4A8" },
  cherry:      { bg: "#E84060", accent: "#FFB0C0", text: "#FFFFFF", stripe: "#C42040" },
  peach:       { bg: "#FF9060", accent: "#FFD4B8", text: "#FFFFFF", stripe: "#E8703A" },
  butter:      { bg: "#F5D840", accent: "#806000", text: "#3D2800", stripe: "#E8C430" },
  sky:         { bg: "#5AC8FA", accent: "#B8E8FF", text: "#002848", stripe: "#38A8E8" },
  pool:        { bg: "#20B0B0", accent: "#88E8E8", text: "#002828", stripe: "#1A9898" },
  lavender:    { bg: "#B080E0", accent: "#E0C8FF", text: "#FFFFFF", stripe: "#9060C8" },
  mint:        { bg: "#34C759", accent: "#B0F0C8", text: "#002810", stripe: "#28A858" },
  transparent: { bg: "rgba(225,238,250,0.7)", accent: "rgba(120,175,220,0.9)", text: "#1A3050", stripe: "rgba(180,210,235,0.55)" },
  smoky:       { bg: "#484050", accent: "#888098", text: "#F0ECF4", stripe: "#2E2A30" },
  classic:     { bg: "#D4B878", accent: "#D4882A", text: "#1C0F05", stripe: "#C8A96E" },
  y2k:         { bg: "#D040F0", accent: "#00E5FF", text: "#F8E0FF", stripe: "#1A0D2E" },
  love:        { bg: "#D45A6A", accent: "#F7A8B0", text: "#FFFFFF", stripe: "#2C0A0A" },
  road_trip:   { bg: "#5B7FA6", accent: "#D4882A", text: "#E8F4FF", stripe: "#0D1A1A" },
};

function getSpineColor(style: TapeColorKey) {
  return SPINE_COLORS[style] ?? SPINE_COLORS.cream;
}

/* ─── Realistic 3D cassette with depth, shadow, and physical materials ──── */
function RealisticCassetteTape({ tape, index }: { tape: ShelfTape; index: number }) {
  const [hovered, setHovered] = useState(false);
  const reduceMotion = useReduceMotion();
  const colors = getSpineColor(tape.style);

  // Slight random tilt per tape for organic shelf feel
  const tiltAngle = (index % 7 - 3) * 1.2;

  return (
    <Link href={`/t/${tape.publicId}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 rounded-sm">
      <motion.div
        className="relative w-full perspective"
        initial={false}
        animate={reduceMotion ? {} : {
          y: hovered ? -8 : 0,
          rotateZ: hovered ? tiltAngle * 0.3 : tiltAngle,
          scale: hovered ? 1.06 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 280,
          damping: 22,
          mass: 1.2,
        }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        style={{
          minHeight: "68px",
          transformStyle: "preserve-3d",
        }}
        aria-label={`Open "${tape.title}" by ${tape.senderName}`}
      >
        {/* CASSETTE 3D STRUCTURE ──────────────────────────────────────────── */}
        
        {/* Top edge shadow (3D depth indicator) */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 100%)`,
            borderRadius: "3px 3px 0 0",
            zIndex: 3,
          }}
        />

        {/* Main cassette body — with beveled edges for 3D feel */}
        <div
          className="relative w-full rounded-md overflow-hidden flex items-stretch"
          style={{
            background: `linear-gradient(135deg, ${colors.stripe} 0%, ${colors.bg} 12%, ${colors.bg} 88%, ${colors.stripe} 100%)`,
            boxShadow: `
              /* Main shadow: left side */
              -2px 4px 12px rgba(0,0,0,0.18),
              /* Top rim light */
              inset 0 1px 0 rgba(255,255,255,0.3),
              /* Bottom depth */
              inset 0 -1px 2px rgba(0,0,0,0.15),
              /* Right side subtle shadow */
              2px 6px 16px rgba(0,0,0,0.14)
            `,
            minHeight: "clamp(56px, 15vw, 64px)",
            perspective: "1200px",
          }}
        >
          {/* Left leader tab — cassette "40" indicator — responsive, hidden on mobile */}
          <motion.div
            className="hidden sm:flex items-center justify-center px-2 sm:px-3 text-xs font-black tracking-widest flex-shrink-0"
            style={{
              background: colors.stripe,
              color: colors.text,
              minWidth: "clamp(45px, 10vw, 56px)",
              fontFamily: "monospace",
              fontSize: "clamp(10px, 2.2vw, 12px)",
              boxShadow: "inset -1px 0 2px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.1)",
            }}
            animate={hovered ? { scale: 1.05 } : { scale: 1 }}
          >
            40
          </motion.div>

          {/* Main label area — responsive, handwritten title with personality */}
          <div
            className="flex-1 flex flex-col justify-center px-2 sm:px-3 md:px-4 relative overflow-hidden"
            style={{
              background: `linear-gradient(90deg, ${colors.bg} 0%, ${colors.bg} 100%)`,
            }}
          >
            {/* Title in handwritten Playfair italic — responsive size */}
            <div
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: "italic",
                fontWeight: 700,
                fontSize: "clamp(13px, 3.5vw, 17px)",
                color: colors.text,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                letterSpacing: "-0.5px",
                textShadow: "0 1px 2px rgba(255,255,255,0.5)",
              }}
            >
              {tape.title}
            </div>

            {/* Subtle sender label below — responsive */}
            <div
              style={{
                fontSize: "clamp(8px, 1.8vw, 10px)",
                color: colors.text,
                opacity: 0.5,
                marginTop: "1px",
                fontFamily: "monospace",
                letterSpacing: "0.5px",
              }}
            >
              @{tape.senderName.slice(0, 14).toLowerCase()}
            </div>

            {/* Paper grain texture overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "repeating-linear-gradient(90deg, transparent 0px, rgba(0,0,0,0.02) 1px, transparent 2px)",
                opacity: 0.4,
              }}
            />
          </div>

          {/* Right end cap — play indicator with accent color — responsive, hidden on mobile */}
          <motion.div
            className="hidden sm:flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(90deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.08) 100%)`,
              minWidth: "clamp(50px, 12vw, 64px)",
              paddingRight: "clamp(6px, 1.5vw, 10px)",
              paddingLeft: "clamp(6px, 1.5vw, 10px)",
              boxShadow: "inset 1px 0 2px rgba(0,0,0,0.12)",
            }}
            animate={hovered ? { scale: 1.1, x: 2 } : { scale: 1, x: 0 }}
          >
            {/* Play button with chrome effect — responsive */}
            <div
              className="rounded flex items-center justify-center flex-shrink-0"
              style={{
                width: "clamp(20px, 5vw, 24px)",
                height: "clamp(20px, 5vw, 24px)",
                background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.stripe} 100%)`,
                boxShadow: `
                  0 2px 6px rgba(0,0,0,0.2),
                  inset -1px -1px 2px rgba(0,0,0,0.2),
                  inset 1px 1px 2px rgba(255,255,255,0.1)
                `,
              }}
            >
              <span
                style={{
                  fontSize: "clamp(7px, 1.8vw, 9px)",
                  color: colors.bg,
                  fontWeight: "bold",
                }}
              >
                ▶
              </span>
            </div>
          </motion.div>
        </div>

        {/* Bottom shadow — cassette sits on the rack */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-2 pointer-events-none"
          animate={{
            boxShadow: hovered
              ? "0 8px 20px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.15)"
              : "0 3px 8px rgba(0,0,0,0.12)",
            scaleY: hovered ? 0.9 : 1,
          }}
          style={{
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, transparent 70%)",
            borderRadius: "50%",
            transformOrigin: "center bottom",
          }}
        />

        {/* Realistic 3D depth — slight right-side shadow */}
        <div
          className="absolute top-0 right-0 bottom-0 w-1 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.08) 100%)`,
            borderRadius: "0 3px 3px 0",
          }}
        />
      </motion.div>
    </Link>
  );
}

/* ─── Shelf display — realistic cassette rack with depth ──────────────────── */
function ShelfStack({ tapes }: { tapes: ShelfTape[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay: 0, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col gap-2 sm:gap-3 w-full"
      style={{
        perspective: "1000px",
      }}
    >
      {/* Poster gallery decoration above shelf — hidden on mobile */}
      <div className="hidden sm:flex justify-center gap-2 sm:gap-3 flex-wrap mb-6 sm:mb-8 -mx-4">
        <PosterImage imageNumber={11} width={70} height={100} rotation={-15} opacity={0.85} />
        <PosterImage imageNumber={12} width={75} height={110} rotation={8} opacity={0.88} />
        <PosterImage imageNumber={13} width={68} height={98} rotation={-6} opacity={0.85} />
      </div>

      {/* Background rack texture */}
      <div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.05) 100%)",
          zIndex: -1,
        }}
      />

      {tapes.map((tape, i) => (
        <motion.div
          key={tape.publicId}
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{
            duration: 0.5,
            delay: Math.min(i * 0.08, 0.4),
            type: "spring",
            stiffness: 200,
            damping: 20,
          }}
          style={{
            perspective: "1200px",
            transformStyle: "preserve-3d",
          }}
        >
          <RealisticCassetteTape tape={tape} index={i} />
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ─── Main shelf component — responsive ─────────────────────────────────────────────────── */
export default function CassetteShelf({ tapes, perRow }: CassetteShelfProps) {
  if (tapes.length === 0) {
    return (
      <div className="py-8 sm:py-12 px-4 text-center">
        <p
          style={{
            color: "#8A7A68",
            fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)",
            fontSize: "clamp(14px, 4vw, 16px)",
            fontStyle: "italic",
          }}
        >
          No tapes on the shelf yet.
        </p>
        <p
          style={{
            color: "#A89A88",
            fontFamily: "var(--font-inter, Inter, sans-serif)",
            fontSize: "clamp(12px, 3vw, 13px)",
            marginTop: "6px",
          }}
        >
          Be the first to make one.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-3 md:px-4 py-4 sm:py-6">
      <ShelfStack tapes={tapes} />
    </div>
  );
}
