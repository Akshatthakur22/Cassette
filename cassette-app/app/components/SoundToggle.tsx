"use client";

import { useState, useEffect } from "react";
import { getSoundsEnabled, setSoundsEnabled, playClickSound } from "@/app/lib/sounds";

export default function SoundToggle() {
  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setEnabled(getSoundsEnabled());
  }, []);

  if (!mounted) return null;

  async function handleToggle() {
    const newState = !enabled;
    setEnabled(newState);
    setSoundsEnabled(newState);
    if (newState) playClickSound(); // Preview sound when enabled
  }

  return (
    <button
      onClick={handleToggle}
      className="fixed bottom-24 right-4 z-40 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-80 active:scale-90"
      style={{
        background: "rgba(28,24,20,0.85)",
        border: "1px solid rgba(245,240,232,0.12)",
        color: enabled ? "#D4882A" : "#6B5E4E",
        backdropFilter: "blur(10px)",
      }}
      aria-label={`Sound ${enabled ? "on" : "off"}`}
      title={`Sound ${enabled ? "on" : "off"}`}
    >
      <span className="text-lg">{enabled ? "🔊" : "🔇"}</span>
    </button>
  );
}
