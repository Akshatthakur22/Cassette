"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";

interface Intention {
  id: string;
  label: string;
  emoji: string;
  description: string;
  style: "classic" | "y2k" | "love" | "road_trip";
}

const INTENTIONS: Intention[] = [
  {
    id: "someone",
    label: "For Someone",
    emoji: "❤️",
    description: "A person who matters",
    style: "classic",
  },
  {
    id: "best_friend",
    label: "For My Best Friend",
    emoji: "👯",
    description: "Your ride or die",
    style: "y2k",
  },
  {
    id: "love",
    label: "For My Love",
    emoji: "💕",
    description: "Your person",
    style: "love",
  },
  {
    id: "family",
    label: "For Family",
    emoji: "👨‍👩‍👧‍👦",
    description: "Your people",
    style: "classic",
  },
  {
    id: "memory",
    label: "For a Memory",
    emoji: "🎞️",
    description: "A moment in time",
    style: "road_trip",
  },
  {
    id: "self",
    label: "For Myself",
    emoji: "🎧",
    description: "Your personal mixtape",
    style: "y2k",
  },
  {
    id: "just_because",
    label: "Just Because",
    emoji: "✨",
    description: "No reason needed",
    style: "classic",
  },
];

interface IntentionSelectorProps {
  onSelect?: (intention: Intention) => void;
}

export default function IntentionSelector({ onSelect }: IntentionSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
      style={{ background: "rgba(5,3,8,0.85)" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl w-full rounded-2xl p-8"
        style={{
          background: "linear-gradient(180deg, rgba(20,16,12,0.95) 0%, rgba(10,8,7,0.95) 100%)",
          border: "1px solid rgba(212,136,42,0.15)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-xs tracking-[0.35em] uppercase mb-4"
            style={{ color: "#6B5E4E", fontFamily: "monospace" }}
          >
            Choose An Intention
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-3xl sm:text-4xl font-bold mb-3"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              color: "#F5F0E8",
              textShadow: "0 2px 12px rgba(212,136,42,0.15)",
            }}
          >
            What's this tape for?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-sm"
            style={{ color: "#A89880" }}
          >
            (Or skip this and just start creating)
          </motion.p>
        </div>

        {/* Grid of intentions */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8"
        >
          {INTENTIONS.map((intention) => (
            <motion.div
              key={intention.id}
              variants={itemVariants}
              onMouseEnter={() => setHoveredId(intention.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <Link
                href={`/create?intention=${intention.id}&style=${intention.style}`}
                onClick={() => onSelect?.(intention)}
                className="block relative px-4 py-4 rounded-lg transition-all duration-200 cursor-pointer group"
                style={{
                  background:
                    hoveredId === intention.id
                      ? "rgba(212, 136, 42, 0.25)"
                      : "rgba(28, 24, 20, 0.6)",
                  border:
                    hoveredId === intention.id
                      ? "1px solid rgba(212, 136, 42, 0.6)"
                      : "1px solid rgba(212, 136, 42, 0.15)",
                  boxShadow:
                    hoveredId === intention.id
                      ? "0 8px 24px rgba(212, 136, 42, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)"
                      : "inset 0 1px 0 rgba(255,255,255,0.02)",
                }}
              >
                <motion.div
                  animate={{
                    scale: hoveredId === intention.id ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  className="text-3xl mb-2"
                >
                  {intention.emoji}
                </motion.div>
                <p
                  className="text-xs font-mono tracking-widest uppercase mb-1 font-semibold transition-colors duration-200"
                  style={{
                    color: hoveredId === intention.id ? "#D4882A" : "#C4B8A8",
                  }}
                >
                  {intention.label}
                </p>
                <p
                  className="text-[10px] transition-colors duration-200"
                  style={{
                    color: hoveredId === intention.id ? "#C4B8A8" : "#8B8077",
                  }}
                >
                  {intention.description}
                </p>

                {/* Hover indicator line */}
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 rounded-full"
                  animate={{
                    width: hoveredId === intention.id ? "100%" : "0%",
                    background: hoveredId === intention.id ? "#D4882A" : "transparent",
                  }}
                  transition={{ duration: 0.2 }}
                  style={{
                    boxShadow:
                      hoveredId === intention.id
                        ? "0 0 8px rgba(212,136,42,0.5)"
                        : "none",
                  }}
                />
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Skip option */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="flex items-center justify-center pt-6 border-t"
          style={{ borderColor: "rgba(212,136,42,0.1)" }}
        >
          <Link
            href="/create"
            className="inline-block text-xs px-4 py-2 rounded-full transition-all hover:opacity-80 active:scale-95"
            style={{
              color: "#6B5E4E",
              textDecoration: "underline",
              textDecorationColor: "rgba(212,136,42,0.3)",
              textDecorationThickness: "1px",
              textUnderlineOffset: "4px",
              fontFamily: "monospace",
              letterSpacing: "0.1em",
            }}
          >
            Skip for now →
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
