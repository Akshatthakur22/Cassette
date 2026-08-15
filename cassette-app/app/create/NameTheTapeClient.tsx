"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface NameTheTapeClientProps {
  draftId: string;
  selectedColor?: string;
  selectedRelationship?: string;
}

const TAPE_COLOR_MAP: Record<string, string> = {
  cream: "#D4C4A8",
  cherry: "#E84060",
  peach: "#E8703A",
  butter: "#D4A820",
  sky: "#38A8E8",
  pool: "#1A9898",
  lavender: "#9060C8",
  mint: "#28A858",
  clear: "#D9D7D1",
  smoky: "#5A5050",
  transparent: "#C9BFB0",
};

export default function NameTheTapeClient({
  draftId,
  selectedColor = "cream",
  selectedRelationship = "partner",
}: NameTheTapeClientProps) {
  const router = useRouter();
  const [senderName, setSenderName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [tapeTitle, setTapeTitle] = useState("");
  const [dedication, setDedication] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const tapeColorValue = TAPE_COLOR_MAP[selectedColor] || "#D4C4A8";

  function handleBack() {
    router.back();
  }

  async function handleNext() {
    if (!senderName.trim()) {
      alert("Please enter your name");
      return;
    }

    setIsLoading(true);
    try {
      // Save metadata via server action
      // await updateTapeMeta(draftId, { senderName, recipientName, tapeTitle, dedication });
      router.push(`/create/${draftId}/step-3`);
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
      <div className="w-full max-w-2xl flex items-center justify-between mb-8">
        <button
          onClick={handleBack}
          className="text-sm transition-all hover:opacity-60"
          style={{ color: "#8E8E93", fontFamily: "monospace" }}
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold" style={{ fontFamily: "monospace", letterSpacing: "0.1em" }}>
          CASSETTE
        </h1>
        <div className="flex items-center gap-2" style={{ color: "#8E8E93", fontFamily: "monospace", fontSize: "12px" }}>
          <span style={{ opacity: 0.4 }}>1</span>
          <span>•</span>
          <span>2</span>
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
      <div className="w-full max-w-xl space-y-8 mt-4">
        {/* Tape Badge */}
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
            style={{
              background: tapeColorValue,
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            }}
          >
            <span className="text-2xl">🎵</span>
          </motion.div>
        </div>

        {/* Heading */}
        <div className="text-center space-y-2">
          <h2
            className="text-5xl sm:text-6xl font-bold italic leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#1D1D1F" }}
          >
            Name the tape.
          </h2>
          <p style={{ color: "#8E8E93", fontSize: "14px" }}>You can always change these later.</p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Your Name */}
          <div>
            <label
              className="block text-xs font-semibold tracking-widest uppercase mb-2"
              style={{ color: "#8E8E93" }}
            >
              Your Name *
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 sm:py-4 rounded-xl border transition-all focus:outline-none focus:ring-2"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E8E5DF",
                color: "#1D1D1F",
                minHeight: "44px",
                "--tw-ring-color": "#D4882A",
              } as any}
            />
          </div>

          {/* Recipient Name */}
          <div>
            <label
              className="block text-xs font-semibold tracking-widest uppercase mb-2"
              style={{ color: "#8E8E93" }}
            >
              Recipient's Name *
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder={selectedRelationship === "self" ? "You" : "Their name"}
              className="w-full px-4 py-3 sm:py-4 rounded-xl border transition-all focus:outline-none focus:ring-2"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E8E5DF",
                color: "#1D1D1F",
                minHeight: "44px",
                "--tw-ring-color": "#D4882A",
              } as any}
            />
          </div>

          {/* Tape Title */}
          <div>
            <label
              className="block text-xs font-semibold tracking-widest uppercase mb-2"
              style={{ color: "#8E8E93" }}
            >
              Tape Title
            </label>
            <input
              type="text"
              value={tapeTitle}
              onChange={(e) => setTapeTitle(e.target.value)}
              placeholder="e.g., Late Night Drive Vol. 1"
              className="w-full px-4 py-3 sm:py-4 rounded-xl border transition-all focus:outline-none focus:ring-2"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E8E5DF",
                color: "#1D1D1F",
                minHeight: "44px",
                "--tw-ring-color": "#D4882A",
              } as any}
            />
          </div>

          {/* Dedication */}
          <div>
            <label
              className="block text-xs font-semibold tracking-widest uppercase mb-2"
              style={{ color: "#8E8E93" }}
            >
              Dedication (Optional)
            </label>
            <textarea
              value={dedication}
              onChange={(e) => setDedication(e.target.value)}
              placeholder="Every song on here has a story…"
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 resize-none"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E8E5DF",
                color: "#1D1D1F",
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: "italic",
                minHeight: "100px",
                "--tw-ring-color": "#D4882A",
              } as any}
            />
            <p className="text-xs mt-1" style={{ color: "#A09A8A" }}>
              {dedication.length}/500
            </p>
          </div>
        </div>

        {/* Next Button */}
        <motion.button
          onClick={handleNext}
          disabled={isLoading || !senderName.trim()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 px-6 rounded-full font-semibold text-lg transition-all disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #E8901A 0%, #C4503A 100%)",
            color: "#FFFFFF",
            boxShadow: "0 4px 20px rgba(232,144,26,0.3)",
          }}
        >
          {isLoading ? "Loading…" : "Start adding songs →"}
        </motion.button>
      </div>
    </div>
  );
}
