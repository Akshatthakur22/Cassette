"use client";

import React, { useEffect, useRef, useState, useLayoutEffect } from "react";

export type CassetteSide = "A" | "B";
export type TapeColorKey = string;

interface CassetteObjectProps {
  side: CassetteSide;
  isPlaying: boolean;
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
      "https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Oswald:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

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
  useCassetteFont();

  const [isHydrated, setIsHydrated] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [counter, setCounter] = useState(Math.floor(progress * 999));
  const [localMode, setLocalMode] = useState<"stopped" | "playing" | "rewind" | "ff">("stopped");

  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const leftAngle = useRef(0);
  const rightAngle = useRef(0);
  const windRef = useRef(0.32);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [, forceTick] = useState(0);

  const powerOn = isPlaying || localMode === "playing";
  const mode = isPlaying ? "playing" : localMode;

  // Hydration check
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    setCounter(Math.floor(progress * 999));
  }, [progress]);

  useEffect(() => {
    if (mode === "stopped") {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const speed = mode === "playing" ? 130 : mode === "ff" ? 420 : -420;
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

      windRef.current = Math.max(0.06, Math.min(0.94, windRef.current + windSpeed * dt));

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

  const handlePlayClick = () => {
    setLocalMode(localMode === "playing" ? "stopped" : "playing");
  };

  const handleRewindClick = () => {
    setLocalMode("rewind");
  };

  const handleFFClick = () => {
    setLocalMode("ff");
  };

  const handleStopClick = () => {
    setLocalMode("stopped");
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
          <div
            style={{
              position: "relative",
              borderRadius: 10,
              padding: 8,
              background:
                "linear-gradient(155deg, #c9b98a 0%, #b7a476 45%, #a4905f 100%)",
              boxShadow: isHydrated
                ? `
                0 2px 0 rgba(255,255,255,0.4) inset,
                0 -6px 14px rgba(0,0,0,0.25) inset,
                ${6 + tilt.y * 0.6}px ${16 - tilt.x}px 36px rgba(20,15,4,0.45),
                0 3px 0 rgba(0,0,0,0.15)
              `
                : `
                0 2px 0 rgba(255,255,255,0.4) inset,
                0 -6px 14px rgba(0,0,0,0.25) inset,
                6px 16px 36px rgba(20,15,4,0.45),
                0 3px 0 rgba(0,0,0,0.15)
              `,
            }}
          >
            {/* Fine brushed texture */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 10,
                background:
                  "repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)",
                pointerEvents: "none",
              }}
            />

            {/* 3D Gloss highlight that responds to tilt */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 10,
                background: isHydrated
                  ? `radial-gradient(circle at ${
                      50 + tilt.y * 2.2
                    }% ${20 - tilt.x * 2}%, rgba(255,255,255,0.38), transparent 38%)`
                  : "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.38), transparent 38%)",
                pointerEvents: "none",
                mixBlendMode: "overlay",
              }}
            />

            {/* Brand watermark */}
            <div
              style={{
                position: "absolute",
                top: 4,
                right: 38,
                fontSize: 7.5,
                letterSpacing: 1,
                color: "rgba(60,50,25,0.35)",
                fontWeight: 600,
              }}
            >
              ◆ TDK
            </div>

            {/* Corner screws - more realistic 3D */}
            {[
              { top: 4, left: 4 },
              { top: 4, right: 4 },
              { bottom: 4, left: 4 },
              { bottom: 4, right: 4 },
            ].map((pos, i) => (
              <Screw key={i} style={{ position: "absolute", ...pos }} />
            ))}

            {/* Top label — compact cream paper */}
            <div
              style={{
                margin: "14px 18px 0",
                background: "linear-gradient(180deg,#f2ede1,#e6ded0)",
                borderRadius: 2.5,
                padding: "6px 8px",
                boxShadow:
                  "0 2px 6px rgba(0,0,0,0.45), inset 0 -1px 2px rgba(0,0,0,0.08)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {/* Side badge */}
              <div
                style={{
                  width: 24,
                  height: 24,
                  flexShrink: 0,
                  background: "linear-gradient(180deg,#5a2430,#42101c)",
                  color: "#f2ede1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 14,
                  borderRadius: 1.5,
                  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15), 0 2px 3px rgba(0,0,0,0.3)",
                }}
              >
                {side}
              </div>
              <div style={{ flex: 1, borderTop: "1px solid #8a2f2f" }} />
              <div
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: 19,
                  fontWeight: 700,
                  color: "#2a2620",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 130,
                }}
              >
                {title || "Untitled Tape"}
              </div>
            </div>

            {/* Reel window — rich colors, enhanced visual depth */}
            <div
              style={{
                position: "relative",
                margin: "7px 12px 0",
                background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 40%, #000 100%)",
                borderRadius: 5,
                padding: "12px 10px 10px",
                boxShadow:
                  "inset 0 4px 12px rgba(0,0,0,0.95), inset 0 -2px 6px rgba(100,100,100,0.08), 0 1px 3px rgba(0,0,0,0.5)",
                border: "1px solid #222",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0 8px",
                  position: "relative",
                  height: 60,
                  gap: 6,
                }}
              >
                {/* Left reel */}
                <div style={{ position: "relative", zIndex: 3 }}>
                  {isHydrated && <Reel angle={leftAngle.current} fullness={1 - windRef.current} />}
                  {!isHydrated && <Reel angle={0} fullness={0.68} />}
                </div>

                {/* Center tape area - Rich gradient with better visual effects */}
                <div
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 4,
                    position: "relative",
                    overflow: "hidden",
                    background:
                      "linear-gradient(90deg, #0a0a0a 0%, #1a1a1a 12%, #2d2d2d 20%, #353535 25%, #2d2d2d 30%, #1f1f1f 40%, #151515 50%, #1f1f1f 60%, #2d2d2d 70%, #353535 75%, #2d2d2d 80%, #1a1a1a 88%, #0a0a0a 100%)",
                    boxShadow:
                      "inset 0 3px 8px rgba(0,0,0,0.85), inset 0 -2px 5px rgba(150,150,150,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
                    border: "1px solid #282828",
                  }}
                >
                  {/* Dynamic tape shine - follows playback speed */}
                  {powerOn && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: "-100%",
                        right: "-100%",
                        height: "100%",
                        background:
                          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 25%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.15) 75%, transparent 100%)",
                        animation: `shine ${0.6 / (mode === "ff" ? 3.5 : 1)}s ease-in-out infinite`,
                        filter: "blur(1px)",
                      }}
                    />
                  )}

                  {/* Horizontal tape stripes */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage:
                        "repeating-linear-gradient(90deg, rgba(100,100,100,0.15) 0px, rgba(100,100,100,0.15) 2px, rgba(80,80,80,0.1) 2px, rgba(80,80,80,0.1) 4px)",
                      pointerEvents: "none",
                    }}
                  />

                  {/* Vertical scrolling tape motion lines */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage:
                        "repeating-linear-gradient(0deg, rgba(120,120,120,0.2) 0px, rgba(120,120,120,0.2) 1px, transparent 1px, transparent 4px)",
                      animation: powerOn
                        ? `scrollLines ${0.25 / (mode === "ff" ? 4 : mode === "rewind" ? 4 : 1)}s linear infinite`
                        : "none",
                      pointerEvents: "none",
                    }}
                  />

                  {/* Top glossy highlight */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "35%",
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
                      pointerEvents: "none",
                      borderRadius: "4px 4px 0 0",
                    }}
                  />

                  {/* Center warm glow when playing */}
                  {powerOn && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          mode === "playing"
                            ? "radial-gradient(ellipse at center, rgba(255,200,100,0.08) 0%, transparent 70%)"
                            : "radial-gradient(ellipse at center, rgba(255,150,80,0.06) 0%, transparent 70%)",
                        pointerEvents: "none",
                        animation: "pulse 2s ease-in-out infinite",
                      }}
                    />
                  )}
                </div>

                {/* Right reel */}
                <div style={{ position: "relative", zIndex: 3 }}>
                  {isHydrated && <Reel angle={rightAngle.current} fullness={windRef.current} />}
                  {!isHydrated && <Reel angle={0} fullness={0.32} />}
                </div>

                {/* Overall window gloss */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 4,
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.05) 100%)",
                    pointerEvents: "none",
                  }}
                />
              </div>

              {/* Keyframe animations */}
              <style>{`
                @keyframes shine {
                  0% { left: -100%; }
                  100% { left: 100%; }
                }
                @keyframes scrollLines {
                  0% { transform: translateY(0); }
                  100% { transform: translateY(4px); }
                }
                @keyframes pulse {
                  0%, 100% { opacity: 0.4; }
                  50% { opacity: 1; }
                }
              `}</style>
            </div>

            {/* Bottom brand stripe */}
            <div
              style={{
                margin: "7px 18px 0",
                background:
                  "linear-gradient(90deg,#e8dcb0 0%, #d8c99a 55%, #b9c0c2 78%, #e9edee 100%)",
                borderRadius: 2,
                padding: "5px 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 1.5px 4px rgba(0,0,0,0.4)",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#2a2214",
                  letterSpacing: 0.5,
                }}
              >
                ◆ TDK
              </span>
              <span style={{ fontSize: 8.5, color: "#3a3220", fontWeight: 500 }}>
                High Bias 70μs
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#4a7a3a" }}>
                90
              </span>
            </div>

            {/* Write-protect tabs */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                margin: "6px 26px 0",
                padding: "0 2px",
              }}
            >
              <Tab />
              <Tab />
              <Screw small style={{ position: "relative" }} />
              <Tab />
              <Tab />
            </div>

            {/* Control deck — compact */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 4px 1px" }}>
              {/* Power LED */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  marginRight: 1,
                }}
              >
                <div
                  title="Power"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: powerOn
                      ? "radial-gradient(circle at 35% 30%, #ffe29a, #ff9d1f 70%)"
                      : "radial-gradient(circle at 35% 30%, #5a5650, #302d28 70%)",
                    boxShadow: powerOn
                      ? "0 0 6px 1.5px rgba(255,157,31,0.65)"
                      : "inset 0 1px 2px rgba(0,0,0,0.5)",
                    transition: "all 150ms ease",
                  }}
                />
                <span style={{ fontSize: 7, letterSpacing: 0.8, color: "#8a8478" }}>
                  PWR
                </span>
              </div>

              {/* Tape counter */}
              <div
                style={{
                  background: "linear-gradient(180deg,#0c0c0c,#000)",
                  color: "#d8cf9e",
                  fontFamily: "'Oswald', monospace",
                  fontSize: 13,
                  letterSpacing: 3,
                  padding: "4px 7px",
                  borderRadius: 3,
                  minWidth: 50,
                  textAlign: "center",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.9)",
                }}
              >
                {String(counter).padStart(3, "0")}
              </div>

              <div style={{ flex: 1 }} />

              {/* Flip button */}
              {showFlipButton && (
                <button
                  onClick={handleFlip}
                  aria-label="Flip cassette to other side"
                  style={{
                    background: "linear-gradient(180deg,#f7f0dc,#e6d9b8)",
                    border: "1px solid #9c8a5c",
                    borderRadius: 999,
                    padding: "4px 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#3a3220",
                    cursor: "pointer",
                    boxShadow:
                      "0 1.5px 0 rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.7)",
                    transition: "transform 100ms ease",
                    minHeight: "36px",
                    touchAction: "manipulation",
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
                  onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  <span style={{ fontSize: 12 }}>↻</span> Flip
                </button>
              )}

              {/* Control buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, flex: 2 }}>
                <DeckButton label="RW" active={localMode === "rewind"} onClick={handleRewindClick}>
                  ⏮
                </DeckButton>
                <DeckButton label="▶ Play" onClick={handlePlayClick} active={localMode === "playing"}>
                  ⏯
                </DeckButton>
                <DeckButton label="FF" active={localMode === "ff"} onClick={handleFFClick}>
                  ⏭
                </DeckButton>
                <DeckButton label="Stop" onClick={handleStopClick}>
                  ⏹
                </DeckButton>
              </div>
            </div>

            <div
              style={{
                textAlign: "center",
                fontSize: 7,
                letterSpacing: 0.8,
                color: "#8a8478",
                marginTop: 0,
                paddingBottom: 1,
              }}
            >
              COUNTER
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeckButton({
  children,
  label,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <div
      role="button"
      aria-label={label}
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        height: 30,
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        cursor: "pointer",
        userSelect: "none",
        color: active ? "#f0e9c9" : "#c9c3b3",
        background: active
          ? "linear-gradient(180deg,#4a4020,#2a2410)"
          : "linear-gradient(180deg,#2e2e2e,#181818)",
        border: "1px solid #3a3a3a",
        boxShadow: pressed
          ? "inset 0 2px 4px rgba(0,0,0,0.6)"
          : active
          ? "inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.08)"
          : "0 1.5px 0 rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
        transition: "all 90ms ease",
        minHeight: "36px",
        touchAction: "manipulation",
      }}
    >
      {children}
    </div>
  );
}

function Screw({ style, small }: { style?: React.CSSProperties; small?: boolean }) {
  const s = small ? 11 : 15;
  return (
    <div
      style={{
        width: s,
        height: s,
        borderRadius: "50%",
        background: "radial-gradient(circle at 32% 30%, #f2e8cd, #a2915f 55%, #6e5f3a)",
        border: "1px solid #5c4f30",
        boxShadow: "0 1px 2px rgba(0,0,0,0.4), inset 0 -1px 1px rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      <div style={{ width: s * 0.6, height: 1.2, background: "#5c4f30", position: "absolute" }} />
      <div
        style={{
          width: s * 0.6,
          height: 1.2,
          background: "#5c4f30",
          position: "absolute",
          transform: "rotate(90deg)",
        }}
      />
    </div>
  );
}

function Tab() {
  return (
    <div
      style={{
        width: 20,
        height: 12,
        borderRadius: "2px 2px 0 0",
        background: "linear-gradient(180deg,#d8d4c8,#a8a498)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)",
      }}
    />
  );
}

function Reel({ angle, fullness }: { angle: number; fullness: number }) {
  const tapeOuterR = 8 + fullness * 12;

  return (
    <div
      style={{
        width: 58,
        height: 58,
        borderRadius: "50%",
        background: "radial-gradient(circle at 35% 35%, #e8e4d8 0%, #d4cfc0 20%, #c0b8a8 28%, #1a1a1a 32%)",
        boxShadow:
          "inset 0 0 0 2.5px #0a0a0a, inset 0 4px 10px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div style={{ width: 46, height: 46, borderRadius: "50%", position: "relative" }}>
        {/* Tape winding visualization */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: tapeOuterR * 2,
            height: tapeOuterR * 2,
            borderRadius: "50%",
            transform: "translate(-50%,-50%)",
            background:
              "repeating-conic-gradient(from 0deg, #0a0a0a 0deg 6deg, #1a1812 6deg 8deg)",
            boxShadow: "inset 0 0 8px rgba(0,0,0,0.9), inset 0 2px 4px rgba(0,0,0,0.7)",
          }}
        />

        {/* Rotating hub with spokes */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `rotate(${angle}deg)`,
          }}
        >
          {/* Hub center - metallic */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 22,
              height: 22,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 35% 35%, #f0ead8 0%, #d8cfc0 40%, #b0a890 70%, #8a7868 100%)",
              transform: "translate(-50%,-50%)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.2)",
            }}
          />

          {/* Prominent spokes - 8 for better visual effect */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 16,
                height: 5,
                background: "linear-gradient(180deg, #2a2420 0%, #0a0a0a 50%, #000 100%)",
                borderRadius: 2.5,
                transform: `translate(-50%,-50%) rotate(${i * 45}deg) translateX(12px)`,
                boxShadow: "0 1px 2px rgba(0,0,0,0.8)",
              }}
            />
          ))}

          {/* Center spindle */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "radial-gradient(circle at 30% 30%, #1a1a1a, #000)",
              transform: "translate(-50%,-50%)",
              boxShadow: "inset 0 1px 2px rgba(255,255,255,0.08)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function TapeGleam({ active }: { active: boolean }) {
  return (
    <div
      style={{
        width: 22,
        height: 38,
        borderRadius: 2,
        background: active
          ? "linear-gradient(115deg, #1a1a1a 0%, #3a3a3a 30%, #d8d4c8 48%, #3a3a3a 65%, #1a1a1a 100%)"
          : "linear-gradient(115deg, #141414 0%, #1e1e1e 45%, #3a3a3a 55%, #1e1e1e 100%)",
        boxShadow: "inset 0 0 3px rgba(0,0,0,0.6)",
        transition: "background 250ms ease",
      }}
    />
  );
}
