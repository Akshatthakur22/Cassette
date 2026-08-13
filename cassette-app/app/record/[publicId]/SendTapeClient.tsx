"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CassetteCase from "@/app/components/CassetteCase";
import { recordShare } from "@/app/actions/tape";
import { playCaseCloseSound } from "@/app/lib/sounds";
import { useReduceMotion } from "@/app/lib/use-reduce-motion";

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
  publicId, tapeId, title, senderName, recipientName, style: initialStyle,
}: Props) {
  const reduceMotion = useReduceMotion();
  const [caseStyle, setCaseStyle] = useState<TapeStyle>(initialStyle);
  const [caseState, setCaseState] = useState<"open" | "closing" | "closed">("open");
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const domain = process.env.NEXT_PUBLIC_DOMAIN ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const tapeUrl = `${domain}/t/${publicId}`;

  async function handleCloseAndSend() {
    setCaseState("closing");
    await playCaseCloseSound(true);
    setTimeout(() => { setCaseState("closed"); setSent(true); }, 600);
  }

  async function handleShare(platform: "native" | "whatsapp" | "copy") {
    const shareText = `${recipientName ? `For ${recipientName} — ` : ""}a tape was made for you ❤️\n${tapeUrl}`;
    recordShare(tapeId, platform).catch(() => {});
    if (platform === "native" && "share" in navigator) {
      try { await navigator.share({ title: title || "A tape for you", text: shareText, url: tapeUrl }); } catch {}
    } else if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
    } else {
      await navigator.clipboard.writeText(tapeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  }

  const CASE_COLORS = [
    { value: "classic",   label: "Amber",  swatch: "#C8A96E" },
    { value: "road_trip", label: "Slate",  swatch: "#5B7FA6" },
    { value: "love",      label: "Rouge",  swatch: "#D45A6A" },
    { value: "y2k",       label: "Neon",   swatch: "#E040FB" },
  ] as const;

  return (
    <div className="relative min-h-screen" style={{ background: "#FBFAF7" }}>

      {/* Nav */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-5 py-4"
        style={{
          background: "rgba(251,250,247,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid #E8E5DF",
        }}
      >
        <span className="text-xs tracking-[0.2em] uppercase"
          style={{ color: "#8E8E93", fontFamily: "monospace" }}>
          CASSETTE
        </span>
        {!sent && (
          <span className="text-xs" style={{ color: "#8E8E93", fontFamily: "monospace" }}>
            Your tape is ready
          </span>
        )}
      </div>

      <div className="flex flex-col items-center px-5 py-10 gap-6 max-w-sm mx-auto">
        <AnimatePresence mode="wait">

          {/* ── Before sending ── */}
          {!sent && (
            <motion.div
              key="pre-send"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-6 w-full"
            >
              <div className="text-center">
                <p className="text-xs tracking-[0.3em] uppercase mb-1"
                  style={{ color: "#8E8E93", fontFamily: "monospace" }}>
                  your tape is ready
                </p>
                <h1 className="text-3xl font-bold italic"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#1D1D1F" }}>
                  {title || "Untitled Tape"}
                </h1>
                <p className="text-sm mt-1" style={{ color: "#8E8E93" }}>
                  for {recipientName}
                </p>
              </div>

              {/* Cassette case */}
              <motion.div
                className="w-full"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                onClick={caseState === "open" ? handleCloseAndSend : undefined}
                whileHover={!reduceMotion && caseState === "open" ? { scale: 1.01 } : {}}
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
                  style={{ color: "#8E8E93" }}>
                  Choose a case colour
                </p>
                <div className="flex gap-4">
                  {CASE_COLORS.map(c => (
                    <button key={c.value} onClick={() => setCaseStyle(c.value)} aria-label={c.label}
                      className="flex flex-col items-center gap-1.5 transition-all active:scale-90">
                      <span
                        className="w-7 h-7 rounded-full border-2 transition-all"
                        style={{
                          background: c.swatch,
                          borderColor: caseStyle === c.value ? "#1D1D1F" : "transparent",
                          boxShadow: caseStyle === c.value ? `0 0 0 2px white, 0 0 0 3.5px ${c.swatch}` : "0 1px 4px rgba(0,0,0,0.1)",
                          transform: caseStyle === c.value ? "scale(1.15)" : "scale(1)",
                        }}
                      />
                      <span className="text-[9px] font-mono" style={{ color: "#8E8E93" }}>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Close case CTA */}
              <motion.button
                onClick={handleCloseAndSend}
                whileTap={{ scale: 0.93 }}
                className="w-full btn-primary text-sm py-4"
              >
                Close the case →
              </motion.button>
            </motion.div>
          )}

          {/* ── After sending ── */}
          {sent && (
            <motion.div
              key="post-send"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-6 w-full"
            >
              <motion.div
                className="w-full"
                initial={{ y: 8 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.35 }}
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
                  transition={{ delay: 0.15, duration: 0.45 }}
                  className="text-3xl font-bold italic mb-1"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#1D1D1F" }}
                >
                  Send it to them. ❤
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm"
                  style={{ color: "#8E8E93" }}
                >
                  {recipientName} is waiting for this.
                </motion.p>
              </div>

              {/* Share buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="w-full flex flex-col gap-3"
              >
                {/* Primary */}
                <button
                  onClick={() => handleShare("share" in navigator ? "native" : "whatsapp")}
                  className="w-full btn-primary py-3.5 text-sm flex items-center justify-center gap-2"
                >
                  <span>🎁</span>
                  <span>Send it to {recipientName}</span>
                </button>

                {/* WhatsApp */}
                <button
                  onClick={() => handleShare("whatsapp")}
                  className="w-full py-3 rounded-full text-sm flex items-center justify-center gap-2 transition-all hover:opacity-80"
                  style={{
                    background: "rgba(37,211,102,0.1)",
                    border: "1.5px solid rgba(37,211,102,0.3)",
                    color: "#1D9948",
                    fontFamily: "var(--font-inter, Inter, sans-serif)",
                  }}
                >
                  <span>💬</span> Send via WhatsApp
                </button>

                {/* Copy link */}
                <button
                  onClick={() => handleShare("copy")}
                  className="w-full py-3 rounded-full text-sm transition-all hover:opacity-80"
                  style={{
                    background: "#F3EFE7",
                    border: "1.5px solid #E8E5DF",
                    color: copied ? "#28A858" : "#5F6065",
                    fontFamily: "monospace",
                    letterSpacing: "0.06em",
                  }}
                >
                  {copied ? "✓ Link copied" : "Copy link"}
                </button>
              </motion.div>

              {/* Tape URL */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="w-full px-4 py-3 rounded-xl"
                style={{ background: "#F3EFE7", border: "1px solid #E8E5DF" }}
              >
                <p className="text-[10px] font-mono mb-1" style={{ color: "#8E8E93" }}>YOUR TAPE LINK</p>
                <p className="text-xs truncate font-mono" style={{ color: "#5F6065" }}>{tapeUrl}</p>
              </motion.div>

              {/* View link */}
              <motion.a
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                href={`/t/${publicId}`}
                className="text-xs transition-all hover:opacity-60"
                style={{ color: "#8E8E93", fontFamily: "monospace" }}
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
