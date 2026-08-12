"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

interface HandwrittenTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  /** ms between characters — default 55 */
  charDelay?: number;
  /** Enable organic jitter — default true */
  jitter?: boolean;
}

/**
 * Renders text letter-by-letter with organic timing jitter.
 * Looks like something being written in real-time on the cassette label.
 */
export default function HandwrittenText({
  text,
  className = "",
  style = {},
  charDelay = 55,
  jitter = true,
}: HandwrittenTextProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [displayText, setDisplayText] = useState(text);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When text changes, animate the difference (new chars appended)
  useEffect(() => {
    if (text.length > displayText.length) {
      // New chars typed — animate them in
      const start = visibleCount;
      let i = visibleCount;

      function typeNext() {
        if (i < text.length) {
          setDisplayText(text.slice(0, i + 1));
          setVisibleCount(i + 1);
          i++;
          // Organic jitter: vary speed per character
          const base = charDelay;
          const variance = jitter ? (Math.random() - 0.5) * charDelay * 0.7 : 0;
          // Slightly slower after spaces and punctuation
          const char = text[i - 1];
          const pause = char === " " ? charDelay * 1.5 : char === "," || char === "." ? charDelay * 2.5 : 0;
          timeoutRef.current = setTimeout(typeNext, base + variance + pause);
        }
      }

      typeNext();
    } else if (text.length < displayText.length) {
      // Deletion — snap immediately (backspace should feel instant)
      setDisplayText(text);
      setVisibleCount(text.length);
    } else {
      setDisplayText(text);
      setVisibleCount(text.length);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  // Split into rendered chars with per-character micro-positioning jitter
  const chars = displayText.split("");

  return (
    <span className={`inline ${className}`} style={style} aria-label={text}>
      {chars.map((char, i) => {
        // Seed per-character jitter deterministically so it doesn't re-render
        const seed = (i * 7 + 13) % 100;
        const yOff = jitter ? (seed % 3 === 0 ? 0.8 : seed % 3 === 1 ? -0.6 : 0) : 0;
        const rot = jitter ? (seed % 5 === 0 ? 1.2 : seed % 5 === 1 ? -0.8 : seed % 5 === 2 ? 0.5 : 0) : 0;

        return (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: yOff + 4, rotate: rot + 4 }}
            animate={{ opacity: 1, y: yOff, rotate: rot }}
            transition={{
              duration: 0.12,
              ease: "easeOut",
            }}
            style={{
              display: "inline-block",
              whiteSpace: char === " " ? "pre" : "normal",
            }}
          >
            {char}
          </motion.span>
        );
      })}
      {/* Blinking pen cursor after the text */}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: "loop" }}
        style={{
          display: "inline-block",
          width: "1px",
          height: "1em",
          verticalAlign: "text-bottom",
          background: "currentColor",
          marginLeft: "1px",
          opacity: displayText === text && text.length > 0 ? 0 : 1,
        }}
        aria-hidden="true"
      />
    </span>
  );
}
