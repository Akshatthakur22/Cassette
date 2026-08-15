"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface SetTheMoodClientProps {
  draftId: string;
  initialRelationship?: string;
  initialStyle?: string;
}

const RELATIONSHIPS = [
  { value: "partner", label: "For My Love", emoji: "❤️", description: "Songs that remind me of you." },
  { value: "best_friend", label: "Best Friend", emoji: "✨", description: "Our stupid, iconic soundtrack." },
  { value: "family", label: "Family", emoji: "🌿", description: "For the people who made me." },
  { value: "memory", label: "A Memory", emoji: "📷", description: "Capture a moment in music." },
  { value: "self", label: "Just for Me", emoji: "🌙", description: "My soundtrack, my story." },
  { value: "other", label: "Just Because", emoji: "🎵", description: "No reason. Just because." },
];

const TAPE_COLORS = [
  { value: "cream", label: "Cream", color: "#D4C4A8" },
  { value: "cherry", label: "Cherry", color: "#E84060" },
  { value: "peach", label: "Peach", color: "#E8703A" },
  { value: "butter", label: "Butter", color: "#D4A820" },
  { value: "sky", label: "Sky", color: "#38A8E8" },
  { value: "pool", label: "Pool", color: "#1A9898" },
  { value: "lavender", label: "Lavender", color: "#9060C8" },
  { value: "mint", label: "Mint", color: "#28A858" },
  { value: "clear", label: "Clear", color: "#D9D7D1" },
  { value: "smoky", label: "Smoky", color: "#5A5050" },
  { value: "transparent", label: "Transparent", color: "#C9BFB0" },
];

export default function SetTheMoodClient({
  draftId,
  initialRelationship = "partner",
  initialStyle = "classic",
}: SetTheMoodClientProps) {
  const router = useRouter();
  const [selectedRelationship, setSelectedRelationship] = useState(initialRelationship);
  const [selectedColor, setSelectedColor] = useState(initialStyle);
  const [isLoading, setIsLoading] = useState(false);

  async function handleNext() {
    setIsLoading(true);
    try {
      // Save relationship and style preference
      // This would be done via a server action in real implementation
      router.push(`/create/${draftId}/step-2`);
    } catch (error) {
      console.error("Error advancing to next step:", error);
      setIsLoading(false);
    }
  }

  return (
    <div
      className="relative min-h-screen flex flex-col items-center py-8 px-4 sm:px-6 overflow-hidden"
      style={{ background: "#FBFAF7" }}
    >
      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-12">
        <h1 className="text-xl font-bold" style={{ fontFamily: "monospace", letterSpacing: "0.1em" }}>
          CASSETTE
        </h1>
        <div className="flex items-center gap-2" style={{ color: "#8E8E93", fontFamily: "monospace", fontSize: "12px" }}>
          <span>1</span>
          <span>•</span>
          <span style={{ opacity: 0.4 }}>2</span>
          <span>•</span>
          <span style={{ opacity: 0.4 }}>3</span>
        </div>
        <button
          className="text-xs px-4 py-2 rounded-full transition-all"
          style={{
            background: "#F3EFE7",
            color: "#8E8E93",
            border: "1px solid #E8E5DF",
          }}
        >
          Save Draft
        </button>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-2xl space-y-10">
        {/* Heading */}
        <div className="text-center space-y-2">
          <p style={{ color: "#A09A8A", fontFamily: "monospace", fontSize: "11px", letterSpacing: "0.15em" }}>
            WHO IS THIS TAPE FOR?
          </p>
          <h2
            className="text-5xl sm:text-6xl font-bold italic leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#1D1D1F" }}
          >
            Set the mood.
          </h2>
        </div>

        {/* Relationship Cards Grid */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {RELATIONSHIPS.map((rel) => (
            <motion.button
              key={rel.value}
              onClick={() => setSelectedRelationship(rel.value)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="p-6 rounded-2xl transition-all duration-200 text-center"
              style={{
                background: selectedRelationship === rel.value ? "#F3EFE7" : "#FFFFFF",
                border: selectedRelationship === rel.value ? "2px solid #D4882A" : "1px solid #E8E5DF",
                boxShadow: selectedRelationship === rel.value ? "0 4px 16px rgba(212,136,42,0.1)" : "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <p className="text-3xl mb-3">{rel.emoji}</p>
              <p className="font-semibold text-sm" style={{ color: "#1D1D1F" }}>
                {rel.label}
              </p>
              <p className="text-xs mt-1" style={{ color: "#8E8E93" }}>
                {rel.description}
              </p>
            </motion.button>
          ))}
        </div>

        {/* Color Selector */}
        <div className="space-y-6">
          <p style={{ color: "#A09A8A", fontFamily: "monospace", fontSize: "11px", letterSpacing: "0.15em" }}>
            CHOOSE A TAPE COLOUR
          </p>

          {/* Color circles - split into rows for mobile */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
            {TAPE_COLORS.map((tape) => (
              <motion.button
                key={tape.value}
                onClick={() => setSelectedColor(tape.value)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-2 transition-all"
              >
                <div
                  className="w-12 h-12 rounded-full transition-all duration-200 cursor-pointer flex-shrink-0"
                  style={{
                    background: tape.color,
                    border: selectedColor === tape.value ? "3px solid #1D1D1F" : "2px solid rgba(0,0,0,0.1)",
                    boxShadow:
                      selectedColor === tape.value
                        ? `0 0 0 2px white, 0 0 0 4px ${tape.color}, 0 4px 12px rgba(0,0,0,0.15)`
                        : "none",
                    transform: selectedColor === tape.value ? "scale(1.1)" : "scale(1)",
                  }}
                />
                <span className="text-xs font-medium text-center" style={{ color: "#8E8E93", minWidth: "60px" }}>
                  {tape.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Next Button */}
        <motion.button
          onClick={handleNext}
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 px-6 rounded-full font-semibold text-lg transition-all disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #E8901A 0%, #C4503A 100%)",
            color: "#FFFFFF",
            boxShadow: "0 4px 20px rgba(232,144,26,0.3)",
          }}
        >
          {isLoading ? "Loading…" : "Next →"}
        </motion.button>
      </div>
    </div>
  );
}
