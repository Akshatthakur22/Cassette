"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HeroScene from "@/app/components/HeroScene";
import CassetteCase from "@/app/components/CassetteCase";
import { recordShare } from "@/app/actions/tape";
import { playCaseCloseSound, setSoundsEnabled, getSoundsEnabled } from "@/app/lib/sounds";

const CASE_COLORS = [
  { value: "classic",   label: "Amber",  swatch: "#C8A96E" },
  { value: "road_trip", label: "Slate",  swatch: "#5B7FA6" },
  { value: "love",      label: "Rouge",  swatch: "#D45A6A" },
  { value: "y2k",       label: "Neon",   swatch: "#E040FB" },
];

type TapeStyle = "classic" | "y2k" | "love" | "road_trip";

interface Props {
  publicId: string;
  tapeId: string;
  title: string;
  senderName: string;
  recipientName: string;
  style: TapeStyle;
}

export default function SendTapeClient({
  publicId,
  tapeId,
  title,
  senderName,
  recipientName,
  style: initialStyle,
}: Props) {
  const [caseStyle, setCaseStyle] = useState<TapeStyle>(initialStyle);
  const [caseState, setCaseState] = useState<"open" | "closing" | "closed">("open");
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const domain = process.env.NEXT_PUBLIC_DOMAIN || (typeof window !== "undefined" ? window.location.origin : "");
  const tapeUrl = `${domain}/t/${publicId}`;

  // Slide open animation on first mount — case starts open (tape just came out of recording)
  // Then user "closes" the case before sending
  useEffect(() => {
    // Small delay so the scene fades in first
    const t = setTimeout(() => {
      setCaseState("open");
    }, 300);
    return () => clearTimeout(t);
  }, []);

  async function handleCloseAndSend() {
    // 1. Close the case
    setCaseState("closing");
    await playCaseCloseSound(true);
    setTimeout(() => {
      setCaseState("closed");
      setSent(true);
    }, 600);
  }

  async function handleShare(platform: "native" | "whatsapp" | "copy") {
    const shareText = `A tape was made for you ❤️ — from ${senderName}`;
    
    // Record the share event
    recordShare(tapeId, platform).catch(err => {
      console.warn("Failed to record share:", err);
    });

    if (platform === "native" && "canShare" in navigator) {
      try { await (navigator as any).share({ title, text: shareText, url: tapeUrl }); } catch {}
    } else if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${tapeUrl}`)}`, "_blank");
    } else {
      await navigator.clipboard.writeText(tapeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col" style={{ background: "#060408" }}>
      <HeroScene />

      <div className="relative z-10 flex flex-col flex-1 items-center justify-center px-4 py-10">

        <AnimatePresence mode="wait">

          {/* ── STATE 1: case open, ready to close ── */}
          {!sent && (
            <motion.div
              key="pre-send"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-6 w-full max-w-sm"
            >
              <div className="text-center">
                <p className="text-xs tracking-[0.3em] uppercase mb-2"
                  style={{ color: "#A89880", fontFamily: "monospace" }}>
                  your tape is ready
                </p>
                <h1 className="text-3xl font-bold italic"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#F5F0E8" }}>
                  {title || "Untitled Tape"}
                </h1>
                <p className="text-sm mt-1" style={{ color: "#6B5E4E" }}>
                  for {recipientName}
                </p>
              </div>

              {/* Cassette case — open state */}
              <motion.div
                className="w-full"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <CassetteCase
                  state={caseState === "open" ? "open" : caseState === "closing" ? "closing" : "closed"}
                  style={caseStyle}
                  title={title}
                  recipientName={recipientName}
                  senderName={senderName}
                />
              </motion.div>

              {/* Case colour picker */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-[10px] font-mono tracking-widest uppercase"
                  style={{ color: "#6B5E4E" }}>
                  Choose a case colour
                </p>
                <div className="flex gap-3">
                  {CASE_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setCaseStyle(c.value as TapeStyle)}
                      className="flex flex-col items-center gap-1.5 transition-all active:scale-90"
                      aria-label={c.label}
                    >
                      <span
                        className="w-7 h-7 rounded-full border-2 transition-all"
                        style={{
                          background: c.swatch,
                          borderColor: caseStyle === c.value ? "#F5F0E8" : "transparent",
                          boxShadow: caseStyle === c.value ? `0 0 12px ${c.swatch}80` : "none",
                        }}
                      />
                      <span className="text-[9px] font-mono" style={{ color: "#6B5E4E" }}>
                        {c.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Close & send CTA */}
              <motion.button
                onClick={handleCloseAndSend}
                whileTap={{ scale: 0.93 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                className="w-full py-4 rounded-full font-semibold text-sm transition-all hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #D4882A 0%, #C4503A 100%)",
                  color: "#F5F0E8",
                  fontFamily: "monospace",
                  letterSpacing: "0.12em",
                  boxShadow: "0 4px 32px rgba(212,136,42,0.3)",
                }}
              >
                Close the case →
              </motion.button>
            </motion.div>
          )}

          {/* ── STATE 2: case closed, send actions ── */}
          {sent && (
            <motion.div
              key="post-send"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-6 w-full max-w-sm"
            >
              <motion.div
                className="w-full"
                initial={{ y: 10 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <CassetteCase
                  state="closed"
                  style={caseStyle}
                  title={title}
                  recipientName={recipientName}
                  senderName={senderName}
                />
              </motion.div>

              <div className="text-center">
                <motion.h1
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  className="text-3xl font-bold italic mb-2"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#F5F0E8" }}
                >
                  Send it to them. ❤
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="text-sm"
                  style={{ color: "#A89880" }}
                >
                  {recipientName} is waiting for this.
                </motion.p>
              </div>

              {/* Share actions */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full flex flex-col gap-3"
              >
                {/* Primary: native share or WhatsApp */}
                <button
                  onClick={() => handleShare("canShare" in navigator ? "native" : "whatsapp")}
                  className="w-full py-3.5 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.97]"
                  style={{
                    background: "linear-gradient(135deg, #D4882A 0%, #C4503A 100%)",
                    color: "#F5F0E8",
                    fontFamily: "monospace",
                    letterSpacing: "0.1em",
                    boxShadow: "0 4px 24px rgba(212,136,42,0.3)",
                  }}
                >
                  <span>🎁</span>
                  <span>Send it to {recipientName}</span>
                </button>

                {/* WhatsApp (always visible) */}
                <button
                  onClick={() => handleShare("whatsapp")}
                  className="w-full py-3 rounded-full text-sm flex items-center justify-center gap-2 transition-all hover:opacity-80 active:scale-[0.97]"
                  style={{
                    background: "rgba(37,211,102,0.12)",
                    border: "1px solid rgba(37,211,102,0.3)",
                    color: "#25D366",
                    fontFamily: "monospace",
                  }}
                >
                  <span>💬</span>
                  <span>Send via WhatsApp</span>
                </button>

                {/* Copy link */}
                <button
                  onClick={() => handleShare("copy")}
                  className="w-full py-3 rounded-full text-sm transition-all hover:opacity-80 active:scale-[0.97]"
                  style={{
                    background: "rgba(245,240,232,0.06)",
                    border: "1px solid rgba(245,240,232,0.10)",
                    color: "#A89880",
                    fontFamily: "monospace",
                    letterSpacing: "0.08em",
                  }}
                >
                  {copied ? "✓ Link copied" : "Copy link"}
                </button>
              </motion.div>

              {/* Link preview */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="w-full px-4 py-3 rounded-xl"
                style={{
                  background: "rgba(28,24,20,0.5)",
                  border: "1px solid rgba(245,240,232,0.06)",
                }}
              >
                <p className="text-[10px] font-mono mb-1" style={{ color: "#6B5E4E" }}>
                  YOUR TAPE LINK
                </p>
                <p className="text-xs truncate" style={{ color: "#A89880", fontFamily: "monospace" }}>
                  {tapeUrl}
                </p>
              </motion.div>

              {/* View your tape link */}
              <motion.a
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                href={`/t/${publicId}`}
                className="text-xs transition-all hover:opacity-70"
                style={{ color: "#6B5E4E", fontFamily: "monospace" }}
              >
                Preview your tape →
              </motion.a>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
