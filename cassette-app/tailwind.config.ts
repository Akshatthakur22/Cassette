import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* ── Typography ── */
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        ui: ["var(--font-inter)", "system-ui", "sans-serif"],
        label: ["var(--font-playfair)", "Georgia", "serif"],
      },

      /* ── Color System ── */
      colors: {
        /* Core UI — Aged paper warm surface */
        paper: "#FAF6EF",
        "warm-white": "#FFFDF8",
        cream: {
          DEFAULT: "#F5EFE0",
          mid: "#EDE4D0",
          dim: "#EDE7D9",
        },
        ink: {
          DEFAULT: "#1C140A",
          soft: "#4A3828",
          muted: "#6B5E4E",
          faint: "#A89880",
        },
        muted: "#8A7A68",
        hairline: {
          DEFAULT: "#D9CDB8",
          mid: "#E8E0D0",
        },

        /* Indian accent palette */
        marigold: "#E8901A",
        terracotta: "#C4503A",
        "bharat-red": "#C0392B",
        turmeric: "#D4A520",
        lotus: "#D4608A",
        forest: "#2D6A4F",
        teal: "#2A7A8C",
        indigo: "#3D3589",
        "dusty-rose": "#E8B4A0",
        henna: "#8B3A1A",

        /* Legacy accent aliases */
        coral: "#E8703A",
        strawberry: "#C4503A",
        sunshine: "#E8C430",
        sky: "#5AC8FA",
        blue: "#2A7A8C",
        mint: "#34C759",
        lavender: "#B080E0",
        peach: "#E8703A",
        amber: "#E8901A",

        /* Tape shell accent colors */
        tape: {
          cream: "#F5EFE0",
          cherry: "#E8384F",
          peach: "#FF8C54",
          butter: "#F5C842",
          sky: "#5AC8FA",
          pool: "#2DBFBF",
          lavender: "#C084FC",
          mint: "#34C759",
          transparent: "rgba(200,220,240,0.55)",
          smoky: "#4A4550",
        },
      },

      /* ── Spacing ── */
      spacing: {
        "xs": "4px",
        "sm": "8px",
        "md": "12px",
        "lg": "16px",
        "xl": "24px",
        "2xl": "32px",
        "3xl": "40px",
        "4xl": "48px",
        "5xl": "64px",
        "6xl": "80px",
        "7xl": "96px",
        "8xl": "128px",
      },

      /* ── Border Radius ── */
      borderRadius: {
        "cassette-sm": "10px",
        "cassette-md": "16px",
        "cassette-lg": "24px",
        "cassette-xl": "32px",
      },

      /* ── Box Shadow System ── */
      boxShadow: {
        "soft-object": "0 8px 30px rgba(0,0,0,0.08)",
        "raised-cassette": "0 20px 60px rgba(0,0,0,0.14)",
        "cassette": "0 16px 48px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.12)",
        "pressed": "0 4px 12px rgba(0,0,0,0.1)",
        "subtle": "0 2px 8px rgba(0,0,0,0.05)",
        "stamp": "0 0 0 1.5px #FFFDF8, 0 0 0 3px #C0392B, 0 2px 8px rgba(192,57,43,0.15)",
        "jcard": "3px 3px 10px rgba(80,40,0,0.08), -1px -1px 4px rgba(80,40,0,0.04)",
        "note": "2px 3px 8px rgba(80,40,0,0.09)",
        "envelope": "0 8px 32px rgba(80,40,0,0.12), 0 2px 8px rgba(80,40,0,0.08)",
      },

      /* ── Transition & Animation Timing ── */
      transitionDuration: {
        "micro": "140ms",
        "button": "120ms",
        "panel": "280ms",
        "cassette": "650ms",
        "flip": "850ms",
        "insert": "1000ms",
        "gift": "1400ms",
      },

      /* ── Animation Easing ── */
      transitionTimingFunction: {
        "cassette": "cubic-bezier(0.22, 1, 0.36, 1)",
      },

      /* ── Keyframe Animations ── */
      keyframes: {
        /* Page entry animation */
        pageEnter: {
          from: {
            opacity: "0",
            transform: "translateY(12px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },

        /* Reel spin animation */
        reelSpin: {
          from: {
            transform: "rotate(0deg)",
          },
          to: {
            transform: "rotate(360deg)",
          },
        },

        /* Tape hiss shimmer */
        labelShimmer: {
          "0%": {
            backgroundPosition: "-200% center",
          },
          "100%": {
            backgroundPosition: "200% center",
          },
        },

        /* Marigold pulse for indicators */
        marigoldPulse: {
          "0%, 100%": {
            boxShadow: "0 0 6px 0 rgba(232,144,26,0.6)",
          },
          "50%": {
            boxShadow: "0 0 14px 4px rgba(232,144,26,0.3)",
          },
        },

        /* Envelope open animation */
        envelopeFlap: {
          "0%": {
            transform: "rotateX(0deg)",
          },
          "40%": {
            transform: "rotateX(-140deg)",
          },
          "100%": {
            transform: "rotateX(-180deg)",
          },
        },

        /* Doodle wiggle */
        doodleWiggle: {
          "0%, 100%": {
            transform: "rotate(-3deg) scale(1)",
          },
          "25%": {
            transform: "rotate(3deg) scale(1.05)",
          },
          "75%": {
            transform: "rotate(-2deg) scale(0.97)",
          },
        },

        /* Cassette insertion animation */
        cassetteLift: {
          from: {
            opacity: "0",
            transform: "translateY(20px) scale(0.95)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0) scale(1)",
          },
        },

        /* Cassette rotation for flip */
        cassetteFold: {
          "0%": {
            transform: "rotateY(0deg)",
          },
          "50%": {
            transform: "rotateY(90deg)",
          },
          "100%": {
            transform: "rotateY(180deg)",
          },
        },

        /* Track slide in */
        trackSlideIn: {
          from: {
            opacity: "0",
            transform: "translateX(-20px)",
          },
          to: {
            opacity: "1",
            transform: "translateX(0)",
          },
        },

        /* Tape reel deceleration */
        reelDecelerate: {
          "0%": {
            transform: "rotate(0deg)",
          },
          "40%": {
            transform: "rotate(180deg)",
          },
          "100%": {
            transform: "rotate(120deg)",
          },
        },

        /* Cassette hover lift */
        shelfLift: {
          from: {
            transform: "translateY(0) rotate(0deg)",
          },
          to: {
            transform: "translateY(-8px) rotate(1deg)",
          },
        },

        /* Gift unwrap animation */
        unwrap: {
          "0%": {
            transform: "scale(0.8) rotateX(0deg)",
            opacity: "0",
          },
          "50%": {
            transform: "scale(1.05) rotateX(20deg)",
          },
          "100%": {
            transform: "scale(1) rotateX(0deg)",
            opacity: "1",
          },
        },

        /* Fade in */
        fadeIn: {
          from: {
            opacity: "0",
          },
          to: {
            opacity: "1",
          },
        },

        /* Slide up */
        slideUp: {
          from: {
            transform: "translateY(20px)",
            opacity: "0",
          },
          to: {
            transform: "translateY(0)",
            opacity: "1",
          },
        },

        /* Pulse loading */
        pulseSkeleton: {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.6",
          },
        },

        /* Note pop */
        notePop: {
          "0%": {
            transform: "scale(0.95) rotateZ(-2deg)",
            opacity: "0",
          },
          "50%": {
            transform: "scale(1.08)",
          },
          "100%": {
            transform: "scale(1) rotateZ(0deg)",
            opacity: "1",
          },
        },
      },

      animation: {
        "page-enter": "pageEnter 400ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "reel-spin": "reelSpin 6s linear infinite",
        "label-shimmer": "labelShimmer 2s ease-in-out infinite",
        "marigold-pulse": "marigoldPulse 2s ease-in-out infinite",
        "envelope-flap": "envelopeFlap 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
        "doodle-wiggle": "doodleWiggle 3s ease-in-out infinite",
        "cassette-lift": "cassetteLift 400ms cubic-bezier(0.22, 1, 0.36, 1)",
        "cassette-fold": "cassetteFold 650ms cubic-bezier(0.22, 1, 0.36, 1)",
        "track-slide-in": "trackSlideIn 300ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "reel-decelerate": "reelDecelerate 400ms cubic-bezier(0.22, 1, 0.36, 1)",
        "shelf-lift": "shelfLift 300ms cubic-bezier(0.22, 1, 0.36, 1)",
        "unwrap": "unwrap 800ms cubic-bezier(0.22, 1, 0.36, 1)",
        "fade-in": "fadeIn 200ms ease-in-out",
        "slide-up": "slideUp 300ms cubic-bezier(0.22, 1, 0.36, 1)",
        "pulse-skeleton": "pulseSkeleton 2s ease-in-out infinite",
        "note-pop": "notePop 400ms cubic-bezier(0.22, 1, 0.36, 1)",
      },

      /* ── Perspective for 3D effects ── */
      perspective: {
        1000: "1000px",
        800: "800px",
        500: "500px",
      },

      /* ── Transform origin ── */
      transformOrigin: {
        "center-x": "center bottom",
      },

      /* ── Gradient stops ── */
      backgroundImage: {
        "gradient-marigold": "linear-gradient(135deg, #E8901A 0%, #C4503A 100%)",
        "gradient-sunset": "linear-gradient(180deg, #E8901A 0%, #C4503A 100%)",
        "gradient-deck": "linear-gradient(180deg, #E8E0D4 0%, #D4C8B8 100%)",
        "gradient-wood": "linear-gradient(180deg, #C4874A 0%, #A86A2C 35%, #8C5018 60%, #703A08 100%)",
        "gradient-envelope": "linear-gradient(145deg, #FFF8E8 0%, #F5EDD4 50%, #EDE4C4 100%)",
      },

      /* ── Min/Max width ── */
      width: {
        "cassette-player": "350px",
        "track-list": "400px",
      },

      /* ── Aspect ratios ── */
      aspectRatio: {
        cassette: "1.3 / 1",
      },
    },
  },
  plugins: [],
};

export default config;
