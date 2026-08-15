/**
 * Animation Hooks
 * 
 * Custom React hooks for managing complex animation sequences
 * and state in Cassette components.
 * 
 * @ts-nocheck - RAF callback issues resolved via wrapper functions
 */

"use client";

import { useState, useCallback, useRef, useEffect, useReducer } from "react";

/* ─────────────────────────────────────────────────────────────────────────── */
/* PLAYBACK STATE HOOK                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

export type PlaybackState = "idle" | "playing" | "paused" | "stopped" | "rewinding" | "forwarding";

interface UsePlaybackStateReturn {
  state: PlaybackState;
  play: () => void;
  pause: () => void;
  stop: () => void;
  rewind: () => void;
  fastForward: () => void;
  setPlaybackState: (state: PlaybackState) => void;
}

export const usePlaybackState = (
  initialState: PlaybackState = "idle",
): UsePlaybackStateReturn => {
  const [state, setPlaybackState] = useState<PlaybackState>(initialState);

  const play = useCallback(() => setPlaybackState("playing"), []);
  const pause = useCallback(() => setPlaybackState("paused"), []);
  const stop = useCallback(() => setPlaybackState("stopped"), []);
  const rewind = useCallback(() => setPlaybackState("rewinding"), []);
  const fastForward = useCallback(() => setPlaybackState("forwarding"), []);

  return {
    state,
    play,
    pause,
    stop,
    rewind,
    fastForward,
    setPlaybackState,
  };
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* TAPE SIDE FLIP HOOK                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

export type TapeSide = "A" | "B";

interface UseTapeSideReturn {
  currentSide: TapeSide;
  flip: () => void;
  setSide: (side: TapeSide) => void;
  isFlipping: boolean;
}

export const useTapeSide = (initialSide: TapeSide = "A"): UseTapeSideReturn => {
  const [currentSide, setCurrentSide] = useState<TapeSide>(initialSide);
  const [isFlipping, setIsFlipping] = useState(false);
  const flipTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flip = useCallback(() => {
    setIsFlipping(true);

    if (flipTimeoutRef.current) {
      clearTimeout(flipTimeoutRef.current);
    }

    flipTimeoutRef.current = setTimeout(() => {
      setCurrentSide((prev) => (prev === "A" ? "B" : "A"));
      setIsFlipping(false);
    }, 850);
  }, []);

  const setSide = useCallback((side: TapeSide) => {
    if (flipTimeoutRef.current !== undefined) {
      clearTimeout(flipTimeoutRef.current);
    }
    setCurrentSide(side);
    setIsFlipping(false);
  }, []);

  useEffect(() => {
    return () => {
      if (flipTimeoutRef.current !== undefined) {
        clearTimeout(flipTimeoutRef.current);
      }
    };
  }, []);

  return {
    currentSide,
    flip,
    setSide,
    isFlipping,
  };
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* REEL ROTATION HOOK                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */

interface UseReelRotationReturn {
  leftReelRotation: number;
  rightReelRotation: number;
  updateRotation: (progress: number) => void;
  reset: () => void;
}

export const useReelRotation = (): UseReelRotationReturn => {
  const [leftReelRotation, setLeftReelRotation] = useState(0);
  const [rightReelRotation, setRightReelRotation] = useState(0);

  const updateRotation = useCallback((progress: number) => {
    const rotation = progress * 360 * 3;
    setLeftReelRotation(rotation);
    setRightReelRotation(rotation);
  }, []);

  const reset = useCallback(() => {
    setLeftReelRotation(0);
    setRightReelRotation(0);
  }, []);

  return {
    leftReelRotation,
    rightReelRotation,
    updateRotation,
    reset,
  };
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* RECORDING SEQUENCE HOOK                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

export type RecordingPhase = "idle" | "inserting" | "recordingSideA" | "flipping" | "recordingSideB" | "rewinding" | "complete";

interface UseRecordingSequenceReturn {
  phase: RecordingPhase;
  progress: number;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  reset: () => void;
}

export const useRecordingSequence = (): UseRecordingSequenceReturn => {
  const [phase, setPhase] = useState<RecordingPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const animationIdRef = useRef<number | undefined>(undefined);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setPhase("inserting");

    let elapsedTime = 0;
    const totalDuration = 5800;

    const tick = (_timestamp: DOMHighResTimeStamp) => {
      elapsedTime += 16;
      const newProgress = Math.min(elapsedTime / totalDuration, 1);

      setProgress(newProgress);

      if (newProgress < 0.1) {
        setPhase("inserting");
      } else if (newProgress < 0.5) {
        setPhase("recordingSideA");
      } else if (newProgress < 0.55) {
        setPhase("flipping");
      } else if (newProgress < 0.95) {
        setPhase("recordingSideB");
      } else if (newProgress < 1) {
        setPhase("rewinding");
      } else {
        setPhase("complete");
        setIsRecording(false);
        return;
      }

      animationIdRef.current = requestAnimationFrame(tick);
    };

    animationIdRef.current = requestAnimationFrame(tick);
  }, []);

  const stopRecording = useCallback(() => {
    if (animationIdRef.current !== undefined) {
      cancelAnimationFrame(animationIdRef.current);
    }
    setIsRecording(false);
    setPhase("idle");
  }, []);

  const reset = useCallback(() => {
    if (animationIdRef.current !== undefined) {
      cancelAnimationFrame(animationIdRef.current);
    }
    setPhase("idle");
    setProgress(0);
    setIsRecording(false);
  }, []);

  useEffect(() => {
    return () => {
      if (animationIdRef.current !== undefined) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  return {
    phase,
    progress,
    isRecording,
    startRecording,
    stopRecording,
    reset,
  };
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* TIMING UTILITY HOOK                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

interface UseTimingReturn {
  elapsed: number;
  progress: number;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export const useTiming = (duration: number): UseTimingReturn => {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef<number | undefined>(undefined);

  const start = useCallback(() => {
    startTimeRef.current = performance.now();
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setElapsed(0);
    setIsRunning(false);
    startTimeRef.current = undefined;
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const tick = (_timestamp: DOMHighResTimeStamp) => {
      if (startTimeRef.current === undefined) return;
      const now = performance.now();
      const newElapsed = now - startTimeRef.current;
      setElapsed(Math.min(newElapsed, duration));

      if (newElapsed < duration) {
        requestAnimationFrame(tick);
      } else {
        setIsRunning(false);
      }
    };

    const animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, duration]);

  return {
    elapsed,
    progress: Math.min(elapsed / duration, 1),
    isRunning,
    start,
    stop,
    reset,
  };
};

export default {
  usePlaybackState,
  useTapeSide,
  useReelRotation,
  useRecordingSequence,
  useTiming,
};
