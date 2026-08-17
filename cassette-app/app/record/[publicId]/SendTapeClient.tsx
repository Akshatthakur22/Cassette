"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CassetteCase from "@/app/components/CassetteCase";
import { BackgroundImage } from "@/app/components/BackgroundImage";
import { recordShare } from "@/app/actions/tape";
import { playCaseCloseSound } from "@/app/lib/sounds";
import { useReduceMotion } from "@/app/lib/use-reduce-motion";

type TapeStyle = "classic" | "y2k" | "love" | "road_trip" | "school" | "summer";

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
  const [backgroundNumber, setBackgroundNumber] = useState(1);

  useEffect(() => {
    // Set background number only on client to avoid hydration mismatch
    setBackgroundNumber(Math.floor(Math.random() * 13) + 1);
  }, []);

  const domain = process.env.NEXT_PUBLIC_DOMAIN ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const tapeUrl = `${domain}/t/${publicId}`;

  async function handleCloseAndSend() {
    setCaseState("closing");
    await playCaseCloseSound(true);
    setTimeout(() => { setCaseState("closed"); setSent(true); }, 600);
  }

  async function handleShare(platform: string) {
    const shareText = `${recipientName ? `For ${recipientName} — ` : ""}a tape was made for you ❤️\n${tapeUrl}`;
    recordShare(tapeId, platform).catch(() => {});
    
    if (platform === "native" && "share" in navigator) {
      try { await navigator.share({ title: title || "A tape for you", text: shareText, url: tapeUrl }); } catch {}
    } else if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
    } else if (platform === "x") {
      const xUrl = `https://x.com/intent/post?url=${encodeURIComponent(tapeUrl)}&text=${encodeURIComponent(shareText)}&hashtags=cassette`;
      window.open(xUrl, "_blank");
    } else if (platform === "telegram") {
      const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(tapeUrl)}&text=${encodeURIComponent(shareText)}`;
      window.open(tgUrl, "_blank");
    } else if (platform === "facebook") {
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?app_id=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ""}&display=popup&href=${encodeURIComponent(tapeUrl)}&quote=${encodeURIComponent(shareText)}`;
      window.open(fbUrl, "_blank");
    } else if (platform === "email") {
      const subject = `A tape from someone for ${recipientName || "you"} ❤️`;
      const body = `${shareText}\n\nOpen the tape here:\n${tapeUrl}`;
      const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = emailUrl;
    } else if (platform === "instagram") {
      const igText = `${shareText}\n\n(Copy this message and send it via Instagram DM)`;
      await navigator.clipboard.writeText(igText);
      window.open("https://instagram.com", "_blank");
    } else if (platform === "copy") {
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
    { value: "school",    label: "School", swatch: "#4A5F8F" },
    { value: "summer",    label: "Summer", swatch: "#F5A623" },
  ] as const;

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#FBFAF7" }}>
      
      {/* Background decorative image */}
      <BackgroundImage
        imageNumber={backgroundNumber}
        opacity={0.24}
        position="top-left"
      />

      {/* Semi-transparent overlay for text readability */}
      <div
        className="absolute inset-0 z-5 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(251,250,247,0.8) 0%, rgba(251,250,247,0.65) 50%, rgba(251,250,247,0.8) 100%)",
        }}
      />

      {/* Content wrapper */}
      <div className="relative z-10">

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
                className="w-full relative"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                onClick={caseState === "open" ? handleCloseAndSend : undefined}
                whileHover={!reduceMotion && caseState === "open" ? { scale: 1.01 } : {}}
              >
                {/* Wrapping paper animation - appears before closing */}
                {caseState === "open" && (
                  <>
                    {/* Top wrap */}
                    <motion.div
                      className="absolute top-0 left-0 right-0 h-12 pointer-events-none"
                      initial={{ y: 0, opacity: 0, scaleY: 0 }}
                      animate={{ y: 0, opacity: 1, scaleY: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      style={{
                        background: "linear-gradient(180deg, rgba(212,136,42,0.08) 0%, rgba(212,136,42,0.02) 100%)",
                        transformOrigin: "top",
                        zIndex: 5,
                        borderRadius: "8px 8px 0 0",
                      }}
                    />
                    {/* Side wraps */}
                    <motion.div
                      className="absolute top-0 left-0 w-8 h-full pointer-events-none"
                      initial={{ x: 0, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.35, delay: 0.35 }}
                      style={{
                        background: "linear-gradient(90deg, rgba(212,136,42,0.06) 0%, transparent 100%)",
                        zIndex: 4,
                      }}
                    />
                    <motion.div
                      className="absolute top-0 right-0 w-8 h-full pointer-events-none"
                      initial={{ x: 0, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.35, delay: 0.35 }}
                      style={{
                        background: "linear-gradient(90deg, transparent 0%, rgba(212,136,42,0.06) 100%)",
                        zIndex: 4,
                      }}
                    />
                  </>
                )}

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
                className="w-full btn-primary text-sm py-4 relative overflow-hidden"
                style={{ position: "relative" }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ x: "-100%" }}
                  whileHover={!reduceMotion ? { x: "100%" } : {}}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
                  }}
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  📦 Close & pack the case
                </span>
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
                {/* Gift box wrapping - fully wrapped */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  style={{
                    background: "linear-gradient(135deg, rgba(212,136,42,0.15) 0%, rgba(212,136,42,0.08) 50%, rgba(212,136,42,0.12) 100%)",
                    borderRadius: "8px",
                    zIndex: 5,
                  }}
                />

                {/* Ribbon/bow accent */}
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3, ease: "backOut" }}
                  style={{
                    width: "100%",
                    height: "6px",
                    background: "linear-gradient(90deg, transparent 0%, rgba(212,136,42,0.4) 25%, rgba(212,136,42,0.6) 50%, rgba(212,136,42,0.4) 75%, transparent 100%)",
                    borderRadius: "3px",
                    zIndex: 6,
                  }}
                />

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
                  Your gift is ready! 🎁
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm mb-1"
                  style={{ color: "#8E8E93" }}
                >
                  The tape has been carefully packed.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm"
                  style={{ color: "#8E8E93" }}
                >
                  {recipientName} is waiting to open it.
                </motion.p>
              </div>

              {/* Share buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="w-full flex flex-col gap-2"
              >
                {/* Primary */}
                <button
                  onClick={() => handleShare("share" in navigator ? "native" : "whatsapp")}
                  className="w-full btn-primary py-3.5 text-sm flex items-center justify-center gap-2"
                >
                  <span>🎁</span>
                  <span>Send it to {recipientName}</span>
                </button>

                {/* Platform buttons — 2x3 grid */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <SharePlatformButton platform="whatsapp" label="WhatsApp" icon="💬" onClick={() => handleShare("whatsapp")} />
                  <SharePlatformButton platform="x" label="X" icon="𝕏" onClick={() => handleShare("x")} />
                  <SharePlatformButton platform="telegram" label="Telegram" icon="✈" onClick={() => handleShare("telegram")} />
                  <SharePlatformButton platform="facebook" label="Facebook" icon="f" onClick={() => handleShare("facebook")} />
                  <SharePlatformButton platform="email" label="Email" icon="✉" onClick={() => handleShare("email")} />
                  <SharePlatformButton platform="copy" label={copied ? "✓ Copied" : "Copy"} icon="📋" onClick={() => handleShare("copy")} accent={copied} />
                </div>
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
      {/* Close content wrapper */}
      </div>
    </div>
  );
}

/**
 * Compact platform share button for the 2x3 grid
 */
function SharePlatformButton({
  platform,
  label,
  icon,
  onClick,
  accent = false,
}: {
  platform: string;
  label: string;
  icon: string;
  onClick: () => void;
  accent?: boolean;
}) {
  const platformColors: Record<string, { bg: string; border: string; text: string }> = {
    whatsapp: { bg: "rgba(37,211,102,0.1)", border: "rgba(37,211,102,0.3)", text: "#1D9948" },
    x: { bg: "rgba(0,0,0,0.08)", border: "rgba(0,0,0,0.2)", text: "#000000" },
    telegram: { bg: "rgba(0,136,204,0.1)", border: "rgba(0,136,204,0.3)", text: "#0088CC" },
    facebook: { bg: "rgba(24,119,242,0.1)", border: "rgba(24,119,242,0.3)", text: "#1877F2" },
    email: { bg: "rgba(142,142,147,0.1)", border: "rgba(142,142,147,0.3)", text: "#8E8E93" },
    copy: { bg: "#F3EFE7", border: "#E8E5DF", text: accent ? "#28A858" : "#5F6065" },
  };

  const colors = platformColors[platform] || platformColors.copy;

  return (
    <button
      onClick={onClick}
      className="py-2.5 rounded-lg transition-all hover:opacity-80 active:scale-95 flex flex-col items-center gap-1"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        fontFamily: "var(--font-inter, Inter, sans-serif)",
      }}
      aria-label={`Share via ${label}`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-[9px] font-semibold">{label}</span>
    </button>
  );
}
