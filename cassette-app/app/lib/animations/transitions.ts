/**
 * Transition Effects Library
 * 
 * Reusable Framer Motion transition objects for consistent
 * timing and easing across the Cassette application.
 */

import { Transition } from "framer-motion";

const CASSETTE_EASING = [0.22, 1, 0.36, 1] as const;

/* ─────────────────────────────────────────────────────────────────────────── */
/* BASE TRANSITIONS                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

export const transitions = {
  /* Micro-interactions: 140ms */
  micro: {
    duration: 0.14,
    ease: CASSETTE_EASING,
  } as Transition,

  /* Button interactions: 120ms */
  button: {
    duration: 0.12,
    ease: CASSETTE_EASING,
  } as Transition,

  /* Panel slides: 280ms */
  panel: {
    duration: 0.28,
    ease: CASSETTE_EASING,
  } as Transition,

  /* Cassette object animation: 650ms */
  cassette: {
    duration: 0.65,
    ease: CASSETTE_EASING,
  } as Transition,

  /* Cassette flip: 850ms */
  flip: {
    duration: 0.85,
    ease: CASSETTE_EASING,
  } as Transition,

  /* Cassette insertion: 1000ms */
  insert: {
    duration: 1.0,
    ease: CASSETTE_EASING,
  } as Transition,

  /* Gift unwrap: 1400ms */
  gift: {
    duration: 1.4,
    ease: CASSETTE_EASING,
  } as Transition,

  /* Linear for continuous rotation */
  linear: {
    duration: 1,
    ease: "linear",
  } as Transition,

  /* Easing out for fast completion */
  easeOut: {
    duration: 0.2,
    ease: "easeOut",
  } as Transition,

  /* Spring-like for playful feel */
  spring: {
    type: "spring",
    damping: 8,
    stiffness: 100,
    mass: 0.8,
  } as Transition,

  /* Smooth deceleration */
  decelerate: {
    duration: 0.4,
    ease: CASSETTE_EASING,
  } as Transition,

  /* Snappy immediate feedback */
  snap: {
    duration: 0.08,
    ease: "easeOut",
  } as Transition,
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* COMPLEX TRANSITIONS (Multiple phases)                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

export const complexTransitions = {
  /* Cassette insertion with multiple phases */
  fullInsertion: {
    duration: 0.9,
    ease: CASSETTE_EASING,
    times: [0, 0.15, 0.4, 1],
  } as Transition,

  /* Tape flip with proper 3D rotation */
  tapeFold: {
    duration: 0.85,
    ease: CASSETTE_EASING,
    times: [0, 0.5, 1],
  } as Transition,

  /* Recording progress smooth advancement */
  recordingProgress: {
    duration: 2,
    ease: "easeInOut",
    repeat: Infinity,
  } as Transition,

  /* Reel spinning at natural speed */
  reelSpin: {
    duration: 6,
    ease: "linear",
    repeat: Infinity,
  } as Transition,

  /* Fast rewind effect */
  rewindEffect: {
    duration: 3,
    ease: "linear",
    repeat: Infinity,
  } as Transition,

  /* Reel deceleration smooth stop */
  reelStop: {
    duration: 0.4,
    ease: CASSETTE_EASING,
  } as Transition,

  /* Envelope flap opening animation */
  envelopeOpen: {
    duration: 1.2,
    ease: CASSETTE_EASING,
  } as Transition,

  /* Page transition entrance */
  pageEnter: {
    duration: 0.4,
    ease: CASSETTE_EASING,
    delay: 0.05,
  } as Transition,

  /* Staggered list animations */
  staggerContainer: {
    staggerChildren: 0.1,
    delayChildren: 0.2,
  } as Transition,

  staggerItem: {
    duration: 0.3,
    ease: CASSETTE_EASING,
  } as Transition,
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* EASING PRESETS                                                            */
/* ─────────────────────────────────────────────────────────────────────────── */

export const easings = {
  cassette: CASSETTE_EASING,
  linear: "linear" as const,
  easeIn: "easeIn" as const,
  easeOut: "easeOut" as const,
  easeInOut: "easeInOut" as const,
  circIn: "circIn" as const,
  circOut: "circOut" as const,
  circInOut: "circInOut" as const,
  backIn: "backIn" as const,
  backOut: "backOut" as const,
  backInOut: "backInOut" as const,
  anticipate: "anticipate" as const,
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* DELAY UTILITIES                                                           */
/* ─────────────────────────────────────────────────────────────────────────── */

export const delays = {
  none: 0,
  micro: 0.05,
  xs: 0.1,
  sm: 0.15,
  md: 0.2,
  lg: 0.3,
  xl: 0.4,
  "2xl": 0.5,
  cassette: 0.65,
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* ANIMATION SEQUENCER                                                       */
/* Creates sequences of animations with proper timing                       */
/* ─────────────────────────────────────────────────────────────────────────── */

export interface SequenceConfig {
  duration: number;
  delay?: number;
  repeat?: number;
  onComplete?: () => void;
}

export const createSequence = (
  configs: SequenceConfig[],
): Transition => {
  const totalDuration = configs.reduce((sum, config) => {
    return sum + (config.duration || 0) + (config.delay || 0);
  }, 0);

  return {
    duration: totalDuration,
    ease: CASSETTE_EASING,
  };
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* PRESET SEQUENCES                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

export const sequences = {
  /* Complete cassette insertion: lift → move → insert */
  insertionSequence: {
    lift: 0.1,
    move: 0.2,
    insert: 0.25,
    total: 0.55,
  },

  /* Complete flip sequence: pause → rotate → display */
  flipSequence: {
    pause: 0.1,
    rotate: 0.85,
    display: 0.15,
    total: 1.1,
  },

  /* Recording phase sequence */
  recordSequence: {
    prepare: 0.2,
    recordSideA: 2.5,
    pause: 0.3,
    recordSideB: 2.5,
    finish: 0.3,
    total: 5.8,
  },

  /* Gift opening sequence */
  giftSequence: {
    envelopeOpen: 1.2,
    cardSlide: 0.6,
    cassetteLift: 0.5,
    total: 2.3,
  },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* HOVER/TAP TRANSITION HELPERS                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

export const interactionTransitions = {
  /* Standard hover state */
  hover: {
    duration: 0.2,
    ease: CASSETTE_EASING,
  } as Transition,

  /* Tap/click feedback */
  tap: {
    duration: 0.1,
    ease: "easeOut",
  } as Transition,

  /* Hold state */
  hold: {
    duration: 0.15,
    ease: "easeInOut",
  } as Transition,

  /* Release back to normal */
  release: {
    duration: 0.25,
    ease: CASSETTE_EASING,
  } as Transition,

  /* Focus indicator */
  focus: {
    duration: 0.15,
    ease: CASSETTE_EASING,
  } as Transition,
};

export default {
  transitions,
  complexTransitions,
  easings,
  delays,
  sequences,
  interactionTransitions,
};
