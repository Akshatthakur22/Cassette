/**
 * Animation Utilities
 * 
 * Helper functions for timing, easing, and animation calculations
 */

/* ─────────────────────────────────────────────────────────────────────────── */
/* EASING CALCULATORS                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Cassette easing function (cubic-bezier(0.22, 1, 0.36, 1))
 * Used for all major cassette animations
 */
export const cassetteBezier = (t: number): number => {
  // Cubic bezier approximation for (0.22, 1, 0.36, 1)
  const t2 = t * t;
  const t3 = t2 * t;
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;

  return mt3 * 0 + 3 * mt2 * t * 0.22 + 3 * mt * t2 * 0.36 + t3 * 1;
};

/**
 * Linear easing for reel rotations
 */
export const linear = (t: number): number => t;

/**
 * Ease out for snappy button feedback
 */
export const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

/**
 * Ease in for anticipation
 */
export const easeIn = (t: number): number => t * t * t;

/**
 * Ease in-out for smooth transitions
 */
export const easeInOut = (t: number): number =>
  t < 0.5 ? 2 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/* ─────────────────────────────────────────────────────────────────────────── */
/* TIMING UTILITIES                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

export const ANIMATION_DURATIONS = {
  micro: 140,      // ms
  button: 120,     // ms
  panel: 280,      // ms
  cassette: 650,   // ms
  flip: 850,       // ms
  insert: 1000,    // ms
  gift: 1400,      // ms
} as const;

/**
 * Calculate delay between staggered animations
 * @example staggerDelay(5, 100) → 100ms between each of 5 items
 */
export const staggerDelay = (itemCount: number, delayBetween: number = 100): number[] => {
  return Array.from({ length: itemCount }, (_, i) => i * delayBetween);
};

/**
 * Create staggered animation delays for Framer Motion
 */
export const createStaggerConfig = (itemCount: number, delayBetween: number = 100) => ({
  staggerChildren: delayBetween / 1000,
  delayChildren: 0,
});

/**
 * Calculate animation progress as percentage
 */
export const getProgress = (elapsed: number, duration: number): number =>
  Math.min(Math.max(elapsed / duration, 0), 1);

/**
 * Check if animation is complete
 */
export const isAnimationComplete = (elapsed: number, duration: number): boolean =>
  elapsed >= duration;

/* ─────────────────────────────────────────────────────────────────────────── */
/* ROTATION CALCULATIONS                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Calculate reel rotation based on time elapsed
 * Assumes ~1 rotation per 6 seconds at normal playback
 */
export const calculateReelRotation = (
  timeElapsed: number,
  playbackRate: number = 1,
): number => {
  const rotationsPerSecond = playbackRate / 6;
  return (timeElapsed / 1000) * rotationsPerSecond * 360;
};

/**
 * Calculate tape position within cassette based on time
 * Used for visual tape movement in reel animation
 */
export const calculateTapePosition = (
  timeElapsed: number,
  totalDuration: number,
): number => {
  return (timeElapsed / totalDuration) * 100;
};

/**
 * Reverse reel rotation (for rewind effect)
 */
export const reverseReelRotation = (rotation: number): number => -rotation;

/* ─────────────────────────────────────────────────────────────────────────── */
/* INTERPOLATION HELPERS                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Linear interpolation between two values
 */
export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * Math.max(0, Math.min(1, t));

/**
 * Ease between two values
 */
export const easedLerp = (
  a: number,
  b: number,
  t: number,
  easing: (t: number) => number = easeInOut,
): number => a + (b - a) * easing(t);

/**
 * Map a value from one range to another
 */
export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number => {
  const normalized = (value - inMin) / (inMax - inMin);
  return outMin + normalized * (outMax - outMin);
};

/**
 * Clamp value between min and max
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

/* ─────────────────────────────────────────────────────────────────────────── */
/* SPRING PHYSICS HELPERS                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

interface SpringConfig {
  tension?: number;
  friction?: number;
  mass?: number;
}

/**
 * Calculate spring animation using basic physics
 * @param progress - 0 to 1
 * @param config - spring parameters
 */
export const calculateSpringValue = (
  progress: number,
  config: SpringConfig = {},
): number => {
  const tension = config.tension ?? 170;
  const friction = config.friction ?? 26;
  const mass = config.mass ?? 1;

  // Simple spring approximation
  const x = progress * 2 * Math.PI;
  const damped = Math.exp(-friction * progress);
  return 1 - damped * Math.cos(x * (tension / 100));
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* DELAY UTILITIES                                                           */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Convert milliseconds to seconds for Framer Motion
 */
export const msToSeconds = (ms: number): number => ms / 1000;

/**
 * Create delay sequence for cascading animations
 */
export const createDelaySequence = (
  count: number,
  baseDelay: number,
  increment: number = baseDelay,
): number[] => {
  return Array.from({ length: count }, (_, i) => (baseDelay + i * increment) / 1000);
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* ANIMATION STATE HELPERS                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

export type AnimationPhase = "preparing" | "starting" | "playing" | "stopping" | "completed";

/**
 * Determine animation phase based on progress
 */
export const getAnimationPhase = (progress: number): AnimationPhase => {
  if (progress === 0) return "preparing";
  if (progress < 0.1) return "starting";
  if (progress < 0.9) return "playing";
  if (progress < 1) return "stopping";
  return "completed";
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* RECORDING ANIMATION HELPERS                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

export interface RecordingPhaseInfo {
  phase: string;
  progress: number;
  eta: number; // seconds remaining
}

/**
 * Calculate recording phase info based on overall progress
 * Total recording sequence: 5.8 seconds (2.5s Side A + 0.3s flip + 2.5s Side B + 0.5s finish)
 */
export const getRecordingPhaseInfo = (
  overallProgress: number,
): RecordingPhaseInfo => {
  const totalDuration = 5800; // ms

  if (overallProgress < 0.1) {
    return { phase: "inserting", progress: overallProgress / 0.1, eta: 0.5 };
  }
  if (overallProgress < 0.5) {
    const phaseProgress = (overallProgress - 0.1) / 0.4;
    return {
      phase: "recordingSideA",
      progress: phaseProgress,
      eta: (1 - phaseProgress) * 2.5,
    };
  }
  if (overallProgress < 0.55) {
    return { phase: "flipping", progress: (overallProgress - 0.5) / 0.05, eta: 0.3 };
  }
  if (overallProgress < 0.95) {
    const phaseProgress = (overallProgress - 0.55) / 0.4;
    return {
      phase: "recordingSideB",
      progress: phaseProgress,
      eta: (1 - phaseProgress) * 2.5,
    };
  }

  return { phase: "finishing", progress: (overallProgress - 0.95) / 0.05, eta: 0 };
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* TIME FORMATTING                                                           */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Format milliseconds to MM:SS format
 */
export const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * Convert time string (MM:SS) to milliseconds
 */
export const parseTime = (timeString: string): number => {
  const [minutes, seconds] = timeString.split(":").map(Number);
  return (minutes * 60 + seconds) * 1000;
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* PERFORMANCE HELPERS                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Debounce animation frame updates to prevent excessive re-renders
 */
export const createAnimationFrameThrottle = (
  callback: (timestamp: number) => void,
  frameRate: number = 60,
): ((timestamp: number) => void) => {
  let lastCallTime = 0;
  const frameInterval = 1000 / frameRate;

  return (timestamp: number) => {
    const elapsed = timestamp - lastCallTime;
    if (elapsed >= frameInterval) {
      lastCallTime = timestamp;
      callback(timestamp);
    }
  };
};

/**
 * Check if animation can run (respects prefers-reduced-motion)
 */
export const canAnimate = (): boolean => {
  if (typeof window === "undefined") return true;

  return (
    window.matchMedia("(prefers-reduced-motion: no-preference)").matches
  );
};

/**
 * Get reduced animation duration for accessibility
 */
export const getReducedDuration = (
  duration: number,
  reduceMotion: boolean = !canAnimate(),
): number => {
  if (reduceMotion) {
    // Instant or minimal animation
    return duration < 200 ? 0 : 100;
  }
  return duration;
};

export default {
  // Easing functions
  cassetteBezier,
  linear,
  easeOut,
  easeIn,
  easeInOut,

  // Timing
  staggerDelay,
  createStaggerConfig,
  getProgress,
  isAnimationComplete,

  // Rotation
  calculateReelRotation,
  calculateTapePosition,
  reverseReelRotation,

  // Interpolation
  lerp,
  easedLerp,
  mapRange,
  clamp,

  // Spring
  calculateSpringValue,

  // Delays
  msToSeconds,
  createDelaySequence,

  // State
  getAnimationPhase,
  getRecordingPhaseInfo,

  // Formatting
  formatTime,
  parseTime,

  // Performance
  createAnimationFrameThrottle,
  canAnimate,
  getReducedDuration,
};
