"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Custom React hook for Screen Wake Lock API.
 * Keeps the screen awake during audio playback to prevent premature lock
 * while listening quietly.
 */
export function useWakeLock(isActive: boolean) {
  const wakeLockSentinelRef = useRef<any>(null);

  const requestLock = useCallback(async () => {
    if (typeof window === "undefined" || !("wakeLock" in navigator)) {
      return;
    }

    try {
      if (!wakeLockSentinelRef.current || wakeLockSentinelRef.current.released) {
        wakeLockSentinelRef.current = await (navigator as any).wakeLock.request("screen");
        
        wakeLockSentinelRef.current.addEventListener("release", () => {
          wakeLockSentinelRef.current = null;
        });
      }
    } catch (err: any) {
      // Wake lock requests can fail if tab is not active or low battery mode is on
      console.debug("[useWakeLock] Lock request skipped/failed:", err?.message || err);
    }
  }, []);

  const releaseLock = useCallback(async () => {
    try {
      if (wakeLockSentinelRef.current && !wakeLockSentinelRef.current.released) {
        await wakeLockSentinelRef.current.release();
        wakeLockSentinelRef.current = null;
      }
    } catch (err) {
      console.debug("[useWakeLock] Release error:", err);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      requestLock();
    } else {
      releaseLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isActive) {
        requestLock();
      } else if (document.visibilityState === "hidden") {
        releaseLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseLock();
    };
  }, [isActive, requestLock, releaseLock]);

  return { isSupported: typeof window !== "undefined" && "wakeLock" in navigator };
}
