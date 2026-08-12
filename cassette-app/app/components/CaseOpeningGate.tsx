"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CassetteCase from "./CassetteCase";
import { playCaseOpenSound } from "@/app/lib/sounds";

interface CaseOpeningGateProps {
  title: string;
  senderName: string;
  recipientName: string;
  style: "classic" | "y2k" | "love" | "road_trip";
  onOpen: () => void;
}

export default function CaseOpeningGate({
  title,
  senderName,
  recipientName,
  style,
  onOpen,
}: CaseOpeningGateProps) {
  const [state, setState] = useState<"closed" | "opening" | "open">("closed");
  const [leaving, setLeaving] = useState(false);

  async function handleOpen() {
    if (state !== "closed") return;
    setState("opening");
    await playCaseOpenSound(true);

    setTimeout(() => setState("open"), 350);
    setTimeout(() => setLeaving(true), 1100);
    setTimeout(() => onOpen(), 1600);
  }

  // Accent colours per style for the ambient glow
  const accentGlow = {
    classic:   "rgba(212,136,42,0.12)",
    y2k:       "rgba(224,64,251,0.14)",
    love:      "rgba(212,90,106,0.14)",
    road_trip: "rgba(91,127,166,0.12)",
  }[style];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: leaving ? 0.5 : 0.5 }}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center px-6"
      style={{ background: "#060408" }}
    >
      {/* Ambient radial glow — style-tinted */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 1.2 }}
        style={{
          background: `radial-gradient(ellipse at 50% 42%, ${accentGlow} 0%, transparent 68%)`,
        }}
      />

      {/* Subtle floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              left: `${8 + i * 7.5}%`,
              top: `${20 + (i % 5) * 14}%`,
              background: "#D4882A",
              opacity: 0,
            }}
            animate={{
              opacity: [0, 0.18, 0],
              y: [0, -24, -48],
            }}
            transition={{
              duration: 3.5 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.55,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-7 w-full max-w-sm">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <p
            className="text-[10px] tracking-[0.35em] uppercase mb-3"
            style={{ color: "#A89880", fontFamily: "monospace" }}
          >
            a tape was made for
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold italic leading-tight"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: "#F5F0E8",
              textShadow: "0 2px 36px rgba(212,136,42,0.3)",
            }}
          >
            {recipientName || "You"} ❤
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="text-sm mt-2"
            style={{ color: "#6B5E4E", fontFamily: "monospace", letterSpacing: "0.1em" }}
          >
            from {senderName}
          </motion.p>
        </motion.div>

        {/* Cassette case — spring entrance */}
        <motion.div
          className="w-full cursor-pointer"
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          onClick={handleOpen}
          whileHover={state === "closed" ? { scale: 1.025, y: -2 } : {}}
          whileTap={state === "closed" ? { scale: 0.96 } : {}}
        >
          <CassetteCase
            state={state}
            style={style}
            title={title}
            recipientName={recipientName}
            senderName={senderName}
          />
        </motion.div>

        {/* CTA button */}
        <AnimatePresence>
          {state === "closed" && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ delay: 0.85, duration: 0.45 }}
              onClick={handleOpen}
              className="relative overflow-hidden px-12 py-3.5 rounded-full text-sm font-semibold"
              style={{
                background: "linear-gradient(135deg, #D4882A 0%, #C4503A 100%)",
                color: "#F5F0E8",
                fontFamily: "monospace",
                letterSpacing: "0.14em",
                boxShadow: "0 4px 36px rgba(212,136,42,0.35), 0 0 0 1px rgba(212,136,42,0.2)",
              }}
              whileHover={{ scale: 1.04, boxShadow: "0 6px 40px rgba(212,136,42,0.5), 0 0 0 1px rgba(212,136,42,0.3)" }}
              whileTap={{ scale: 0.95, y: 1.5 }}
            >
              {/* Shimmer sweep on hover */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
                }}
              />
              Open it
            </motion.button>
          )}
        </AnimatePresence>

        {/* "Taking you inside" hint */}
        <AnimatePresence>
          {state === "open" && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-xs text-center"
              style={{
                color: "#A89880",
                fontFamily: "'Playfair Display', serif",
                fontStyle: "italic",
                letterSpacing: "0.05em",
              }}
            >
              Taking you inside...
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
