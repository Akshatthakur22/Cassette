/**
 * Cassette Animation Library
 * 
 * Complete animation system for Cassette application including:
 * - Framer Motion variants for all cassette interactions
 * - Transition definitions and timing
 * - Custom React hooks for animation state management
 * - Utility functions for calculations and formatting
 * 
 * @example
 * import {
 *   cassetteFlapVariants,
 *   transitions,
 *   useTapeSide,
 *   calculateReelRotation,
 * } from '@/lib/animations';
 */

// Export variants
export {
  cassettePlacementVariants,
  fullInsertionSequence,
  cassetteFlapVariants,
  reelRotationVariants,
  reelDecelerationVariants,
  shelfCassetteVariants,
  ejectVariants,
  recordingIndicatorVariants,
  progressBarVariants,
  tapeLabelVariants,
  buttonVariants,
  playButtonVariants,
} from "./cassette-variants";

export type { Variants } from "framer-motion";

// Export transitions
export {
  transitions,
  complexTransitions,
  easings,
  delays,
  sequences,
  interactionTransitions,
  createSequence,
  type SequenceConfig,
} from "./transitions";

// Export hooks
export {
  usePlaybackState,
  useTapeSide,
  useReelRotation,
  useRecordingSequence,
  useTiming,
  type PlaybackState,
  type TapeSide,
  type RecordingPhase,
} from "./hooks";

// Export utilities
export {
  cassetteBezier,
  linear,
  easeOut,
  easeIn,
  easeInOut,
  staggerDelay,
  createStaggerConfig,
  getProgress,
  isAnimationComplete,
  calculateReelRotation,
  calculateTapePosition,
  reverseReelRotation,
  lerp,
  easedLerp,
  mapRange,
  clamp,
  calculateSpringValue,
  msToSeconds,
  createDelaySequence,
  getAnimationPhase,
  getRecordingPhaseInfo,
  formatTime,
  parseTime,
  createAnimationFrameThrottle,
  canAnimate,
  getReducedDuration,
  ANIMATION_DURATIONS,
  type AnimationPhase,
  type RecordingPhaseInfo,
} from "./utils";
