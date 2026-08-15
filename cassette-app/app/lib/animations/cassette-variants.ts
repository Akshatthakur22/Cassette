/**
 * Cassette Animation Variants
 * 
 * Framer Motion variants for all cassette object interactions
 * including insertion, flip, reel rotation, and shelf placement.
 * 
 * All animations use the Cassette easing: cubic-bezier(0.22, 1, 0.36, 1)
 */

import { Variants } from "framer-motion";

const CASSETTE_EASING = [0.22, 1, 0.36, 1] as const;

/* ─────────────────────────────────────────────────────────────────────────── */
/* CASSETTE INSERTION ANIMATION                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

export const cassettePlacementVariants: Variants = {
  atRest: {
    y: 0,
    x: 0,
    rotate: 0,
    opacity: 1,
    scale: 1,
  },
  
  lifting: {
    y: -12,
    rotate: 2,
    scale: 1.02,
    transition: {
      duration: 0.1,
      ease: CASSETTE_EASING,
    },
  },
  
  movingToSlot: {
    x: 0,
    y: -20,
    rotate: 0,
    scale: 1.01,
    transition: {
      duration: 0.2,
      ease: CASSETTE_EASING,
    },
  },
  
  insertingInDeck: {
    y: 0,
    x: 0,
    rotate: 0,
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.25,
      ease: CASSETTE_EASING,
    },
  },

  inDeck: {
    y: 0,
    rotate: 0,
    scale: 1,
    opacity: 1,
  },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* COMPLETE INSERTION SEQUENCE                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

export const fullInsertionSequence: Variants = {
  initial: {
    y: 0,
    rotate: 0,
    scale: 1,
    opacity: 0,
  },
  
  animate: {
    y: [0, -12, -20, 0],
    rotate: [0, 2, 0, 0],
    scale: [1, 1.02, 1.01, 1],
    opacity: 1,
    transition: {
      duration: 0.9,
      ease: CASSETTE_EASING,
      times: [0, 0.15, 0.4, 1],
    },
  },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* CASSETTE FLIP ANIMATION (Side A ↔ Side B)                                */
/* ─────────────────────────────────────────────────────────────────────────── */

export const cassetteFlapVariants: Variants = {
  sideA: {
    rotateY: 0,
    transition: {
      duration: 0.85,
      ease: CASSETTE_EASING,
    },
  },
  
  sideB: {
    rotateY: 180,
    transition: {
      duration: 0.85,
      ease: CASSETTE_EASING,
    },
  },
  
  flipping: {
    rotateY: [0, 90, 180],
    transition: {
      duration: 0.85,
      ease: CASSETTE_EASING,
      times: [0, 0.5, 1],
    },
  },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* TAPE REEL ROTATION                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */

export const reelRotationVariants: Variants = {
  playing: {
    rotate: 360,
    transition: {
      duration: 6,
      ease: "linear",
      repeat: Infinity,
    },
  },
  
  paused: {
    rotate: 0,
    transition: {
      duration: 0.4,
      ease: CASSETTE_EASING,
    },
  },

  rewinding: {
    rotate: -360,
    transition: {
      duration: 3,
      ease: "linear",
      repeat: Infinity,
    },
  },

  fastForwarding: {
    rotate: 360,
    transition: {
      duration: 2,
      ease: "linear",
      repeat: Infinity,
    },
  },

  stopped: {
    rotate: 0,
    transition: {
      duration: 0.3,
      ease: CASSETTE_EASING,
    },
  },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* REEL DECELERATION (Smooth stop)                                           */
/* ─────────────────────────────────────────────────────────────────────────── */

export const reelDecelerationVariants: Variants = {
  spinning: {
    rotate: 0,
    opacity: 1,
  },

  decelerating: {
    rotate: 120,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: CASSETTE_EASING,
    },
  },

  stopped: {
    rotate: 120,
    opacity: 1,
  },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* CASSETTE ON SHELF                                                         */
/* ─────────────────────────────────────────────────────────────────────────── */

export const shelfCassetteVariants: Variants = {
  atRest: {
    y: 0,
    rotate: 0,
    scale: 1,
    filter: "drop-shadow(0 8px 30px rgba(0,0,0,0.08))",
  },

  hover: {
    y: -8,
    rotate: 1,
    scale: 1.02,
    filter: "drop-shadow(0 24px 70px rgba(0,0,0,0.18))",
    transition: {
      duration: 0.3,
      ease: CASSETTE_EASING,
    },
  },

  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: "easeInOut",
    },
  },

  clicked: {
    y: -12,
    scale: 1.05,
    transition: {
      duration: 0.4,
      ease: CASSETTE_EASING,
    },
  },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* CASSETTE EJECT ANIMATION                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

export const ejectVariants: Variants = {
  inDeck: {
    y: 0,
    scale: 1,
    opacity: 1,
  },

  ejecting: {
    y: -30,
    scale: 1.05,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: CASSETTE_EASING,
    },
  },

  ejected: {
    y: -50,
    scale: 1.08,
    opacity: 0.8,
    transition: {
      duration: 0.3,
      ease: CASSETTE_EASING,
    },
  },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* RECORDING SEQUENCE ANIMATIONS                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

export const recordingIndicatorVariants: Variants = {
  idle: {
    scale: 1,
    boxShadow: "0 0 6px 0 rgba(192,57,43,0)",
  },

  recording: {
    scale: [1, 1.2, 1],
    boxShadow: [
      "0 0 6px 0 rgba(192,57,43,0.6)",
      "0 0 14px 4px rgba(192,57,43,0.3)",
      "0 0 6px 0 rgba(192,57,43,0.6)",
    ],
    transition: {
      duration: 2,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },

  completed: {
    scale: 1,
    boxShadow: "0 0 0 0 rgba(192,57,43,0)",
    transition: {
      duration: 0.3,
      ease: CASSETTE_EASING,
    },
  },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* PROGRESS BAR ANIMATIONS                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

export const progressBarVariants: Variants = {
  idle: {
    scaleX: 0,
    opacity: 0.5,
  },

  playing: {
    opacity: 1,
    transition: {
      duration: 0.1,
      ease: "easeOut",
    },
  },

  paused: {
    opacity: 0.7,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },

  seeking: {
    opacity: 0.9,
  },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* TAPE LABEL ANIMATION                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

export const tapeLabelVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },

  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: CASSETTE_EASING,
    },
  },

  shimmer: {
    backgroundPosition: ["-200% center", "200% center"],
    transition: {
      duration: 2,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* BUTTON INTERACTIONS                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

export const buttonVariants: Variants = {
  idle: {
    scale: 1,
    y: 0,
  },

  hover: {
    scale: 1.02,
    y: -2,
    boxShadow: "0 6px 28px rgba(232,144,26,0.42)",
    transition: {
      duration: 0.2,
      ease: CASSETTE_EASING,
    },
  },

  tap: {
    scale: 0.97,
    y: 1,
    boxShadow: "0 2px 8px rgba(232,144,26,0.15)",
    transition: {
      duration: 0.1,
      ease: "easeInOut",
    },
  },

  active: {
    scale: 1,
    y: 0,
  },

  disabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* CONTROL BUTTON ANIMATIONS (Play, Pause, etc.)                            */
/* ─────────────────────────────────────────────────────────────────────────── */

export const playButtonVariants: Variants = {
  rest: {
    scale: 1,
    rotate: 0,
  },

  playing: {
    rotate: [0, 8, -8, 0],
    transition: {
      duration: 0.4,
      ease: CASSETTE_EASING,
    },
  },

  paused: {
    rotate: 0,
    transition: {
      duration: 0.3,
      ease: CASSETTE_EASING,
    },
  },

  pressed: {
    scale: 0.9,
    transition: {
      duration: 0.1,
    },
  },
};

export default {
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
};
