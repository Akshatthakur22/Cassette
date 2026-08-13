"use client";

import { motion, useMotionValue, useSpring, animate as fmAnimate } from "framer-motion";
import { useRef, useState } from "react";

/**
 * Convert hex color to RGB string (for use in rgba())
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `${r},${g},${b}`;
  }
  return "212,136,42"; // fallback to accent color
}

/**
 * HeroScene — cinematic night-drive backdrop + interactive cassette reel.
 *
 * Reel drag: pointer-based drag with angular velocity tracking.
 * On release, applies inertia (exponential decay) then spring snap to 0.
 * Simulates mass + friction on a real spinning wheel.
 */
export default function HeroScene({ className = "", style = "classic" }: { className?: string; style?: "classic" | "y2k" | "love" | "road_trip" }) {
  // Reel rotation
  const rotation = useMotionValue(0);
  const springRotation = useSpring(rotation, { stiffness: 60, damping: 18, mass: 1.2 });

  // Style-specific color palettes
  const styleThemes = {
    classic: {
      bgGradient: "radial-gradient(ellipse at 30% 0%, #1a1230 0%, #0c0a18 40%, #060408 100%)",
      accentColor: "#D4882A",
      secondaryColor: "#C4503A",
      horizonColor: "#D4882A",
      bokehColors: ["#D4882A", "#C4503A", "#F5C842", "#5B7FA6"],
    },
    y2k: {
      bgGradient: "radial-gradient(ellipse at 30% 0%, #2a0850 0%, #1a0f3f 40%, #0a0515 100%)",
      accentColor: "#E040FB",
      secondaryColor: "#00E5FF",
      horizonColor: "#E040FB",
      bokehColors: ["#E040FB", "#00E5FF", "#FF80FF", "#00FFFF"],
    },
    love: {
      bgGradient: "radial-gradient(ellipse at 30% 0%, #3a1a2a 0%, #2a0f1f 40%, #0f0509 100%)",
      accentColor: "#D45A6A",
      secondaryColor: "#F7A8B0",
      horizonColor: "#D45A6A",
      bokehColors: ["#D45A6A", "#F7A8B0", "#FFC0C8", "#FF6B7A"],
    },
    road_trip: {
      bgGradient: "radial-gradient(ellipse at 30% 0%, #0f1a2a 0%, #0a0f1f 40%, #050609 100%)",
      accentColor: "#5B7FA6",
      secondaryColor: "#8BB8D4",
      horizonColor: "#5B7FA6",
      bokehColors: ["#5B7FA6", "#8BB8D4", "#A8D0E8", "#3D6B8B"],
    },
  };

  const theme = styleThemes[style] || styleThemes.classic;
  const lastAngle = useRef(0);
  const lastTime = useRef(0);
  const angularVelocity = useRef(0); // degrees/ms
  const reelRef = useRef<HTMLDivElement>(null);
  const inertiaAnimRef = useRef<ReturnType<typeof fmAnimate> | null>(null);
  const isDragging = useRef(false);
  const [isDraggingState, setIsDraggingState] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  function getAngle(e: React.PointerEvent | PointerEvent, el: HTMLElement): number {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!reelRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    setIsDraggingState(true);
    lastAngle.current = getAngle(e, reelRef.current);
    lastTime.current = e.timeStamp;
    angularVelocity.current = 0;
    setIsSpinning(true);
    // Cancel any running inertia animation
    if (inertiaAnimRef.current) inertiaAnimRef.current.stop();
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isDragging.current || !reelRef.current) return;
    const currentAngle = getAngle(e, reelRef.current);
    const dt = e.timeStamp - lastTime.current;
    if (dt < 4) return; // debounce tiny moves

    let delta = currentAngle - lastAngle.current;
    // Wrap around ±180
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    // Update velocity (deg/ms) with smoothing
    const rawVel = delta / dt;
    angularVelocity.current = angularVelocity.current * 0.6 + rawVel * 0.4;

    rotation.set(rotation.get() + delta);
    lastAngle.current = currentAngle;
    lastTime.current = e.timeStamp;
  }

  function onPointerUp() {
    if (!isDragging.current) return;
    isDragging.current = false;
    setIsDraggingState(false);

    const vel = angularVelocity.current; // deg/ms
    const speed = Math.abs(vel);

    if (speed < 0.05) {
      // Too slow — spring back to snap
      setIsSpinning(false);
      return;
    }

    // Apply inertia: animate with exponential decay
    const friction = 0.975; // per-frame decay
    let current = rotation.get();
    let currentVel = vel * 16; // scale to deg/frame at 60fps

    inertiaAnimRef.current = fmAnimate(current, current, {
      onUpdate: () => {
        currentVel *= friction;
        current += currentVel;
        rotation.set(current);
        if (Math.abs(currentVel) < 0.3) {
          inertiaAnimRef.current?.stop();
          setIsSpinning(false);
        }
      },
      duration: 3,
      ease: "linear",
    });
  }

  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Deep background */}
      <div
        className="absolute inset-0"
        style={{
          background: theme.bgGradient,
          transition: "background 0.6s ease-in-out",
        }}
      />

      {/* Subtle CRT scan lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.025,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 3px)",
        }}
      />

      {/* Rain streaks */}
      <svg
        className="absolute inset-0 w-full h-full opacity-18"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
      >
        {Array.from({ length: 44 }).map((_, i) => {
          const x = (i * 21 + 11) % 800;
          const delay = (i * 0.11) % 2;
          const dur = 0.55 + (i % 6) * 0.08;
          return (
            <line
              key={i} x1={x} y1={-20} x2={x - 9} y2={85}
              stroke={theme.secondaryColor} strokeWidth="0.7" strokeLinecap="round" opacity="0.55"
            >
              <animate attributeName="y1" values="-20;625" dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" />
              <animate attributeName="y2" values="85;730" dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" />
            </line>
          );
        })}
      </svg>

      {/* Bokeh city lights */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="bokeh" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <filter id="bokeh-sm" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
        </defs>
        {/* Horizon city glow */}
        <ellipse cx="400" cy="315" rx="380" ry="75" fill={theme.horizonColor} opacity="0.07" filter="url(#bokeh)" />
        {[
          { cx: 75,  cy: 278, r: 19, color: theme.bokehColors[0], o: 0.36 },
          { cx: 155, cy: 308, r: 11, color: theme.bokehColors[1], o: 0.26 },
          { cx: 255, cy: 288, r: 23, color: theme.bokehColors[2], o: 0.21 },
          { cx: 338, cy: 302, r: 9,  color: theme.bokehColors[0], o: 0.31 },
          { cx: 448, cy: 283, r: 17, color: theme.bokehColors[3], o: 0.23 },
          { cx: 525, cy: 298, r: 13, color: theme.bokehColors[2], o: 0.19 },
          { cx: 618, cy: 273, r: 21, color: theme.bokehColors[1], o: 0.29 },
          { cx: 698, cy: 293, r: 10, color: theme.bokehColors[0], o: 0.33 },
          { cx: 748, cy: 308, r: 15, color: theme.bokehColors[3], o: 0.21 },
          { cx: 118, cy: 338, r: 7,  color: theme.bokehColors[2], o: 0.16 },
          { cx: 378, cy: 268, r: 29, color: theme.bokehColors[0], o: 0.13 },
          { cx: 578, cy: 318, r: 8,  color: theme.bokehColors[1], o: 0.23 },
        ].map((dot, i) => (
          <circle key={i} cx={dot.cx} cy={dot.cy} r={dot.r}
            fill={dot.color} opacity={dot.o} filter="url(#bokeh)" />
        ))}
      </svg>

      {/* Dashboard glow */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: "42%",
          background: `radial-gradient(ellipse at 50% 100%, rgba(${hexToRgb(theme.accentColor)}, 0.20) 0%, rgba(${hexToRgb(theme.secondaryColor)}, 0.09) 40%, transparent 70%)`,
          transition: "background 0.6s ease-in-out",
        }}
      />

      {/* Dashboard silhouette */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 800 200"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          <filter id="bokeh-sm2" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
        </defs>
        <path
          d="M0 200 L0 140 Q100 88 200 104 Q280 116 320 98 Q400 73 480 98 Q520 110 600 104 Q700 88 800 140 L800 200 Z"
          fill="#0e0b07"
        />
        {/* Steering wheel */}
        <ellipse cx="320" cy="154" rx="56" ry="31" fill="none" stroke="#2A1F14" strokeWidth="11" opacity="0.95" />
        <ellipse cx="320" cy="154" rx="56" ry="31" fill="none" stroke="#3D2B1F" strokeWidth="6" opacity="0.65" />
        <line x1="320" y1="123" x2="320" y2="185" stroke="#3D2B1F" strokeWidth="4.5" opacity="0.5" />
        <line x1="264" y1="154" x2="376" y2="154" stroke="#3D2B1F" strokeWidth="4.5" opacity="0.5" />
        {/* Gauges */}
        <circle cx="178" cy="140" r="29" fill="none" stroke={theme.accentColor} strokeWidth="1.5" opacity="0.42" />
        <circle cx="178" cy="140" r="22" fill={`rgba(${hexToRgb(theme.accentColor)}, 0.06)`} />
        <circle cx="458" cy="138" r="25" fill="none" stroke={theme.accentColor} strokeWidth="1.5" opacity="0.32" />
        {/* Vents */}
        <rect x="350" y="94" width="82" height="31" rx="5" fill="#1a1410" opacity="0.82" />
        {[0,1,2,3,4].map(i => (
          <rect key={i} x={357 + i * 14} y={99} width={9} height={21} rx={2.5} fill="#2A1F14" opacity="0.92" />
        ))}
        {/* Instrument glows */}
        <circle cx="178" cy="140" r="19" fill={theme.accentColor} opacity="0.14" filter="url(#bokeh-sm2)" />
        <circle cx="458" cy="138" r="17" fill={theme.bokehColors[3]} opacity="0.14" filter="url(#bokeh-sm2)" />
      </svg>

      {/* Windshield vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, transparent 52%, rgba(6,4,8,0.75) 100%)",
        }}
      />

      {/* ── Interactive mini cassette reel ── */}
      <div
        className="absolute"
        style={{
          bottom: "calc(200px * 0.45 + 24px)",
          right: "clamp(20px, 8vw, 80px)",
          cursor: isDraggingState ? "grabbing" : "grab",
        }}
      >
        <motion.div
          ref={reelRef}
          style={{ rotate: springRotation, width: 56, height: 56 }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          whileHover={{ scale: 1.08 }}
          title="Drag to spin"
        >
          <svg viewBox="0 0 56 56" width="56" height="56">
            <circle cx="28" cy="28" r="26" fill="#1A1208" stroke={theme.accentColor} strokeWidth="1" strokeOpacity="0.35" />
            <circle cx="28" cy="28" r="18" fill="#2A1F14" />
            <circle cx="28" cy="28" r="11" fill="#0D0A07" />
            {[0, 60, 120, 180, 240, 300].map(angle => {
              const rad = (angle * Math.PI) / 180;
              const x1 = +(28 + Math.cos(rad) * 11).toFixed(4);
              const y1 = +(28 + Math.sin(rad) * 11).toFixed(4);
              const x2 = +(28 + Math.cos(rad) * 18).toFixed(4);
              const y2 = +(28 + Math.sin(rad) * 18).toFixed(4);
              return (
                <line
                  key={angle}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={theme.accentColor} strokeWidth="2" strokeLinecap="round" opacity="0.7"
                />
              );
            })}
            {[20, 23].map(r => (
              <circle key={r} cx="28" cy="28" r={r} fill="none" stroke="#3D2B1F" strokeWidth="1" opacity="0.35" />
            ))}
            <circle cx="28" cy="28" r="4.5" fill="#050402" />
            {/* Specular dot */}
            <circle cx="25.5" cy="25.5" r="2" fill="white" fillOpacity="0.12" />
          </svg>
        </motion.div>

        {/* Drag hint — fades after first interaction */}
        <motion.p
          initial={{ opacity: 0.5 }}
          animate={{ opacity: isDraggingState || isSpinning ? 0 : 0.4 }}
          transition={{ duration: 0.3 }}
          className="text-center mt-1"
          style={{ fontSize: "9px", fontFamily: "monospace", color: "#6B5E4E", letterSpacing: "0.15em" }}
        >
          drag
        </motion.p>
      </div>
    </div>
  );
}
