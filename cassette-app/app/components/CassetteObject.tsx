"use client";

import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { usePlaybackState } from "@/lib/playback/usePlaybackState";

export type CassetteSide = "A" | "B";
export type TapeColorKey = string;

interface CassetteObjectProps {
  side: CassetteSide;
  isPlaying?: boolean;
  title: string;
  recipientName: string;
  senderName: string;
  style?: string;
  onFlipSide?: () => void;
  isTyping?: boolean;
  className?: string;
  progress?: number;
  cassetteState?: string;
  showFlipButton?: boolean;
  size?: "sm" | "md" | "lg";
}

const FONT_LINK_ID = "cassette-tape-font-link";

function useCassetteFont() {
  useLayoutEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Oswald:wght@500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

const TAPE_THEMES: Record<string, { body: string; bodyDark: string; labelBg: string; text: string; accent: string; sideBg: string; sideText: string }> = {
  cream:       { body: "#C5B288", bodyDark: "#9A8556", labelBg: "#FFFDF6", text: "#2A1808", accent: "#D4882A", sideBg: "#5A2430", sideText: "#FFF8F0" },
  cherry:      { body: "#D63854", bodyDark: "#9E1C34", labelBg: "#FFF8F9", text: "#24040A", accent: "#E84060", sideBg: "#24040A", sideText: "#FFF8F0" },
  peach:       { body: "#D86835", bodyDark: "#9E4218", labelBg: "#FFF9F5", text: "#280E04", accent: "#E8703A", sideBg: "#3A1508", sideText: "#FFF8F0" },
  butter:      { body: "#DEC035", bodyDark: "#9E8518", labelBg: "#FFFDF0", text: "#2E2404", accent: "#D4A820", sideBg: "#3A2A08", sideText: "#FFF8F0" },
  sky:         { body: "#4BA8DE", bodyDark: "#2674A4", labelBg: "#F5FBFF", text: "#061A28", accent: "#38A8E8", sideBg: "#0C2E46", sideText: "#FFF8F0" },
  pool:        { body: "#1A8C8C", bodyDark: "#0F5A5A", labelBg: "#F2FFFF", text: "#042020", accent: "#1A9898", sideBg: "#062E2E", sideText: "#FFF8F0" },
  lavender:    { body: "#9E70D0", bodyDark: "#683E96", labelBg: "#FAF5FF", text: "#1E0B30", accent: "#9060C8", sideBg: "#280E42", sideText: "#FFF8F0" },
  mint:        { body: "#32B254", bodyDark: "#1C7A34", labelBg: "#F4FFF7", text: "#042210", accent: "#28A858", sideBg: "#083418", sideText: "#FFF8F0" },
  transparent: { body: "#587898", bodyDark: "#304860", labelBg: "#F8FCFF", text: "#0A1E30", accent: "#5AC8FA", sideBg: "#12283A", sideText: "#FFF8F0" },
  smoky:       { body: "#3A3540", bodyDark: "#222026", labelBg: "#2A2530", text: "#F0EDF5", accent: "#A070D8", sideBg: "#16141A", sideText: "#F0EDF5" },
  classic:     { body: "#C5B288", bodyDark: "#9A8556", labelBg: "#FFFDF6", text: "#2A1808", accent: "#D4882A", sideBg: "#5A2430", sideText: "#FFF8F0" },
  y2k:         { body: "#CC38E8", bodyDark: "#8E18A4", labelBg: "#FFF5FF", text: "#150028", accent: "#00E5FF", sideBg: "#150028", sideText: "#00E5FF" },
  love:        { body: "#C84E60", bodyDark: "#8E2434", labelBg: "#FFF5F7", text: "#240408", accent: "#F7A8B0", sideBg: "#3A0610", sideText: "#FFF8F0" },
  road_trip:   { body: "#52759A", bodyDark: "#344E68", labelBg: "#F5F9FF", text: "#081420", accent: "#D4882A", sideBg: "#122030", sideText: "#FFF8F0" },
  school:      { body: "#425682", bodyDark: "#283858", labelBg: "#F5F8FF", text: "#0A1428", accent: "#7A8FB0", sideBg: "#141E34", sideText: "#FFF8F0" },
  summer:      { body: "#DE9420", bodyDark: "#9E640E", labelBg: "#FFFDF5", text: "#281604", accent: "#FFD966", sideBg: "#422204", sideText: "#FFF8F0" },
};

export default function CassetteObject({
  side,
  isPlaying,
  title,
  recipientName,
  senderName,
  style = "cream",
  onFlipSide,
  className = "",
  progress,
  showFlipButton = true,
}: CassetteObjectProps) {
  useCassetteFont();
  const playbackState = usePlaybackState();

  const activeIsPlaying = isPlaying ?? playbackState.isPlaying;
  const activeDuration = playbackState.duration || 0;
  const computedProgress =
    activeDuration > 0
      ? playbackState.currentTime / activeDuration
      : progress ?? 0;

  const [isHydrated, setIsHydrated] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [counter, setCounter] = useState(Math.floor(computedProgress * 999));
  const [localMode, setLocalMode] = useState<"stopped" | "playing" | "rewind" | "ff">("stopped");

  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const leftAngle = useRef(0);
  const rightAngle = useRef(0);
  const windRef = useRef(0.32);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [, forceTick] = useState(0);

  const theme = TAPE_THEMES[style] ?? TAPE_THEMES.cream;
  const powerOn = activeIsPlaying || localMode === "playing";
  const mode = activeIsPlaying ? "playing" : localMode;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    setCounter(Math.floor(computedProgress * 999));
    windRef.current = Math.max(0.1, Math.min(0.9, 0.15 + computedProgress * 0.7));
  }, [computedProgress]);

  useEffect(() => {
    if (mode === "stopped") {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const speed = mode === "playing" ? 140 : mode === "ff" ? 440 : -440;
    const windSpeed = mode === "playing" ? 0.012 : mode === "ff" ? 0.05 : -0.05;

    lastTickRef.current = performance.now();
    let counterAccum = 0;

    const step = (now: number) => {
      const dt = Math.min((now - lastTickRef.current) / 1000, 0.05);
      lastTickRef.current = now;

      const leftFullness = 1 - windRef.current;
      const rightFullness = windRef.current;

      leftAngle.current += speed * dt * (0.6 + (1 - leftFullness) * 0.8);
      rightAngle.current += speed * dt * (0.6 + (1 - rightFullness) * 0.8);

      windRef.current = Math.max(0.08, Math.min(0.92, windRef.current + windSpeed * dt));

      counterAccum += dt * (mode === "playing" ? 4 : mode === "ff" ? 14 : -14);
      if (Math.abs(counterAccum) >= 1) {
        const delta = Math.trunc(counterAccum);
        counterAccum -= delta;
        setCounter((c) => Math.max(0, Math.min(999, c + delta)));
      }

      forceTick((t) => (t + 1) % 1000000);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mode]);

  const handleFlip = () => {
    setFlipping(true);
    setTimeout(() => {
      onFlipSide?.();
      setCounter(0);
      windRef.current = 0.32;
      setFlipping(false);
    }, 300);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isHydrated) return;
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: py * -8, y: px * 10 });
  };

  const handlePointerLeave = () => {
    if (!isHydrated) return;
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      className={className}
      style={{
        fontFamily: "'Oswald', sans-serif",
        width: 380,
        maxWidth: "100%",
        margin: "0 auto",
        padding: "6px 10px",
      }}
    >
      <div style={{ perspective: 1800 }}>
        <div
          ref={wrapRef}
          onPointerMove={isHydrated ? handlePointerMove : undefined}
          onPointerLeave={isHydrated ? handlePointerLeave : undefined}
          style={{
            transformStyle: "preserve-3d",
            transition: flipping
              ? "transform 560ms cubic-bezier(.4,.1,.2,1)"
              : "transform 220ms cubic-bezier(.2,.6,.3,1)",
            transform: `rotateY(${isHydrated && flipping ? 90 : isHydrated ? tilt.y : 0}deg) rotateX(${
              isHydrated && flipping ? 0 : isHydrated ? tilt.x : 0
            }deg)`,
          }}
        >
          {/* ── 3D CASSETTE BODY CHASSIS ─────────────────────────────────── */}
          <div
            style={{
              position: "relative",
              borderRadius: 12,
              padding: "10px 10px 14px",
              background: `linear-gradient(155deg, ${theme.body} 0%, ${theme.bodyDark} 100%)`,
              boxShadow: isHydrated
                ? `
                0 2px 0 rgba(255,255,255,0.4) inset,
                0 -6px 14px rgba(0,0,0,0.3) inset,
                ${6 + tilt.y * 0.6}px ${16 - tilt.x}px 36px rgba(18,12,4,0.45),
                0 3px 0 rgba(0,0,0,0.2)
              `
                : `
                0 2px 0 rgba(255,255,255,0.4) inset,
                0 -6px 14px rgba(0,0,0,0.3) inset,
                6px 16px 36px rgba(18,12,4,0.45),
                0 3px 0 rgba(0,0,0,0.2)
              `,
              border: "1px solid rgba(0,0,0,0.25)",
            }}
          >
            {/* Fine tactile textured finish */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 12,
                backgroundImage:
                  "repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 4px)",
                pointerEvents: "none",
              }}
            />

            {/* Left & Right Authentic Ribbed Grip Strips */}
            <div
              style={{
                position: "absolute",
                top: 24,
                left: 3,
                width: 5,
                height: 140,
                backgroundImage:
                  "repeating-linear-gradient(180deg, rgba(0,0,0,0.25) 0px, rgba(0,0,0,0.25) 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)",
                borderRadius: 2,
                opacity: 0.7,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 24,
                right: 3,
                width: 5,
                height: 140,
                backgroundImage:
                  "repeating-linear-gradient(180deg, rgba(0,0,0,0.25) 0px, rgba(0,0,0,0.25) 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)",
                borderRadius: 2,
                opacity: 0.7,
              }}
            />

            {/* 3D Specular glare highlight responding to tilt */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 12,
                background: isHydrated
                  ? `radial-gradient(circle at ${50 + tilt.y * 2.2}% ${20 - tilt.x * 2}%, rgba(255,255,255,0.36), transparent 42%)`
                  : "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.36), transparent 42%)",
                pointerEvents: "none",
                mixBlendMode: "overlay",
              }}
            />

            {/* 5 Precision Corner Screws (4 corners + 1 bottom-center) */}
            {[
              { top: 5, left: 5 },
              { top: 5, right: 5 },
              { bottom: 5, left: 5 },
              { bottom: 5, right: 5 },
              { bottom: 38, left: "50%", transform: "translateX(-50%)" },
            ].map((pos, i) => (
              <Screw key={i} style={{ position: "absolute", ...pos }} />
            ))}

            {/* ── TOP PAPER J-CARD LABEL ─────────────────────────────────── */}
            <div
              style={{
                margin: "12px 14px 0",
                background: theme.labelBg,
                borderRadius: 4,
                padding: "8px 10px",
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                position: "relative",
                border: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              {/* Side Badge (A or B) */}
              <div
                style={{
                  width: 26,
                  height: 26,
                  flexShrink: 0,
                  background: theme.sideBg,
                  color: theme.sideText,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 15,
                  borderRadius: 3,
                  boxShadow: "inset 0 1px 2px rgba(255,255,255,0.25), 0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                {side}
              </div>

              {/* Title rule line & handwritten title */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(180,40,40,0.6)" }} />
                  <span style={{ fontSize: 7, letterSpacing: "0.15em", color: "#8E8E93", fontWeight: 700 }}>
                    CASSETTE.FM
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: 20,
                    fontWeight: 700,
                    color: theme.text,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.1,
                  }}
                >
                  {title || "Untitled Tape"}
                </div>
              </div>
            </div>

            {/* ── CENTER TRANSPARENT VIEWING WINDOW & SPOOLS ────────────── */}
            <div
              style={{
                position: "relative",
                margin: "8px 10px 0",
                background: "linear-gradient(180deg, #181614 0%, #0D0C0A 40%, #050403 100%)",
                borderRadius: 7,
                padding: "8px 12px 6px",
                boxShadow:
                  "inset 0 4px 14px rgba(0,0,0,0.95), inset 0 -2px 6px rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.4)",
                border: "1.5px solid #201D1A",
              }}
            >
              {/* Specular Diagonal Glass Glare */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 6,
                  background:
                    "linear-gradient(125deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 28%, transparent 45%, rgba(255,255,255,0.08) 85%, transparent 100%)",
                  pointerEvents: "none",
                  zIndex: 4,
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  position: "relative",
                  height: 68,
                  gap: 8,
                }}
              >
                {/* Left Reel Spool (Supply) */}
                <div style={{ position: "relative", zIndex: 2, flexShrink: 0 }}>
                  <PrecisionReel
                    angle={leftAngle.current}
                    fullness={1 - windRef.current}
                    accentColor={theme.accent}
                  />
                </div>

                {/* Center Tape Window & Bridge */}
                <div
                  style={{
                    flex: 1,
                    height: 52,
                    borderRadius: 4,
                    position: "relative",
                    overflow: "hidden",
                    background:
                      "linear-gradient(180deg, #0A0806 0%, #1A1510 50%, #0A0806 100%)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "inset 0 3px 8px rgba(0,0,0,0.9)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "3px 4px",
                  }}
                >
                  {/* Top scale markings */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 6.5,
                      fontFamily: "monospace",
                      color: "rgba(255,255,255,0.45)",
                      letterSpacing: "0.08em",
                      fontWeight: 700,
                    }}
                  >
                    <span>100</span>
                    <span>50</span>
                    <span>0</span>
                  </div>

                  {/* Tape bridge line */}
                  <div
                    style={{
                      height: 18,
                      background:
                        "linear-gradient(180deg, #1E1610 0%, #2A1E14 45%, #18100A 100%)",
                      boxShadow: "inset 0 1px 2px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.6)",
                      borderRadius: 1,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Scrolling shine when playing */}
                    {powerOn && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
                          animation: "tapeShine 1.2s ease-in-out infinite",
                        }}
                      />
                    )}
                  </div>

                  {/* Bottom graduation ticks */}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "0 2px" }}>
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: 1,
                          height: i % 4 === 0 ? 4 : 2.5,
                          background: "rgba(255,255,255,0.3)",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Right Reel Spool (Take-Up) */}
                <div style={{ position: "relative", zIndex: 2, flexShrink: 0 }}>
                  <PrecisionReel
                    angle={rightAngle.current}
                    fullness={windRef.current}
                    accentColor={theme.accent}
                  />
                </div>
              </div>
            </div>

            {/* ── LOWER SPEC LABEL BAR ────────────────────────────────────── */}
            <div
              style={{
                margin: "8px 14px 0",
                background: theme.labelBg,
                borderRadius: 3,
                padding: "4px 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 8.5,
                fontWeight: 700,
                color: theme.text,
                letterSpacing: "0.08em",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ color: theme.accent }}>◆</span> TDK
              </span>
              <span style={{ color: "#8E8E93", fontSize: 7.5 }}>
                High Bias 70µs · Type II
              </span>
              <span style={{ color: "#2E7D32", fontWeight: 800 }}>
                90
              </span>
            </div>

            {/* ── BOTTOM TRAPEZOID CHIN / CONTROLS ────────────────────────── */}
            <div
              style={{
                marginTop: 8,
                padding: "0 4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {/* Power LED & 3-Digit Mechanical Tape Counter */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: powerOn ? "#FF9800" : "#554433",
                    boxShadow: powerOn ? "0 0 8px #FF9800, 0 0 3px #FFA726" : "none",
                    transition: "all 0.2s ease",
                  }}
                  title={powerOn ? "Tape Running" : "Standby"}
                />
                <div
                  style={{
                    background: "#080706",
                    border: "1.5px solid #1E1A16",
                    borderRadius: 4,
                    padding: "2px 6px",
                    fontSize: 11,
                    fontFamily: "'Courier New', monospace",
                    fontWeight: 800,
                    color: "#FFB74D",
                    letterSpacing: "0.18em",
                    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.8)",
                  }}
                >
                  {String(counter).padStart(3, "0")}
                </div>
              </div>

              {/* Flip Tape Button */}
              {showFlipButton && (
                <button
                  onClick={handleFlip}
                  className="transition-all active:scale-95 cursor-pointer"
                  style={{
                    background: "#F5EFE4",
                    border: "1px solid #D8CFC0",
                    borderRadius: 16,
                    padding: "4px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#2C2620",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.25), inset 0 1px 0 #FFFFFF",
                  }}
                >
                  <span>↻ Flip</span>
                  <span style={{ fontSize: 8, color: "#8E8E93" }}>Side {side === "A" ? "B" : "A"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 100% MATHEMATICALLY CENTERED PRECISION CASSETTE REEL ───────────────── */
function PrecisionReel({
  angle,
  fullness,
  accentColor = "#D4882A",
}: {
  angle: number;
  fullness: number;
  accentColor?: string;
}) {
  // Center is locked at (34, 34) in a 68x68 SVG viewBox
  const cx = 34;
  const cy = 34;

  // Tape spool radius scales smoothly with fullness
  const tapeRadius = 15 + fullness * 16; // from 15px (empty) to 31px (full)

  return (
    <svg
      width="68"
      height="68"
      viewBox="0 0 68 68"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <defs>
        {/* Dark Magnetic Tape Gradient */}
        <radialGradient id="magneticTape" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#120E0A" />
          <stop offset="60%" stopColor="#1E1610" />
          <stop offset="90%" stopColor="#281E16" />
          <stop offset="100%" stopColor="#120C08" />
        </radialGradient>

        {/* Ivory White Hub Gradient (Centered) */}
        <radialGradient id="ivoryHub" cx="42%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#F5EFE0" />
          <stop offset="85%" stopColor="#D8CFBF" />
          <stop offset="100%" stopColor="#B0A694" />
        </radialGradient>

        {/* Center Hole Shadow */}
        <radialGradient id="holeShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#080706" />
          <stop offset="100%" stopColor="#181410" />
        </radialGradient>
      </defs>

      {/* 1. Magnetic Tape Outer Spool Coil */}
      <circle
        cx={cx}
        cy={cy}
        r={tapeRadius}
        fill="url(#magneticTape)"
        stroke="#0A0806"
        strokeWidth="0.8"
      />

      {/* Tape Coil Micro-groove Rings */}
      {fullness > 0.2 && (
        <>
          <circle cx={cx} cy={cy} r={tapeRadius - 2} fill="none" stroke="#2C2016" strokeWidth="0.5" opacity="0.6" />
          <circle cx={cx} cy={cy} r={tapeRadius - 5} fill="none" stroke="#2C2016" strokeWidth="0.5" opacity="0.5" />
          <circle cx={cx} cy={cy} r={tapeRadius - 8} fill="none" stroke="#2C2016" strokeWidth="0.5" opacity="0.4" />
        </>
      )}

      {/* 2. Ivory White Cog Hub Base */}
      <circle
        cx={cx}
        cy={cy}
        r="15"
        fill="url(#ivoryHub)"
        stroke="#9E9484"
        strokeWidth="0.6"
      />
      <circle cx={cx} cy={cy} r="13.5" fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.8" />

      {/* 3. Center Spindle Drive Hole */}
      <circle
        cx={cx}
        cy={cy}
        r="7.5"
        fill="url(#holeShadow)"
        stroke="#5A5040"
        strokeWidth="0.8"
      />

      {/* 4. Six Precision Drive Teeth (Rotating centered at cx, cy) */}
      <g transform={`rotate(${angle} ${cx} ${cy})`}>
        {[0, 60, 120, 180, 240, 300].map((toothAngle) => {
          const rad = (toothAngle * Math.PI) / 180;
          const x1 = +(cx + Math.cos(rad) * 6.5).toFixed(2);
          const y1 = +(cy + Math.sin(rad) * 6.5).toFixed(2);
          const x2 = +(cx + Math.cos(rad) * 14.5).toFixed(2);
          const y2 = +(cy + Math.sin(rad) * 14.5).toFixed(2);

          return (
            <line
              key={toothAngle}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#2A241E"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          );
        })}

        {/* Center Axle Dot */}
        <circle cx={cx} cy={cy} r="2.8" fill="#080706" />
      </g>
    </svg>
  );
}

function Screw({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: "radial-gradient(circle at 35% 32%, #EAE4D2, #A89C80 60%, #685E48)",
        border: "1px solid #483E28",
        boxShadow: "0 1px 2px rgba(0,0,0,0.5), inset 0 -1px 1px rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        ...style,
      }}
    >
      <div style={{ width: 7, height: 1.2, background: "#3A301E", position: "absolute" }} />
      <div
        style={{
          width: 7,
          height: 1.2,
          background: "#3A301E",
          position: "absolute",
          transform: "rotate(90deg)",
        }}
      />
    </div>
  );
}
