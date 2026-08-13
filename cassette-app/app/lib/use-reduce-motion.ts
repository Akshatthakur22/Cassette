"use client";

import { useEffect, useState } from "react";

/**
 * Returns true if the user has requested reduced motion via OS/browser settings.
 * Used to disable heavy animations (3D tilt, parallax, reel spin) for accessibility.
 *
 * PRD §4 Phase 4: "Respect `prefers-reduced-motion`"
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);

    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduceMotion;
}
