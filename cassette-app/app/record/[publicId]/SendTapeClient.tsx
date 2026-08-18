"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CassetteCase from "@/app/components/CassetteCase";
import { BackgroundImage } from "@/app/components/BackgroundImage";
import { recordShare } from "@/app/actions/tape";
import { playCaseOpenSound, playCaseCloseSound, playClickSound } from "@/app/lib/sounds";
import { useReduceMotion } from "@/app/lib/use-reduce-motion";

type TapeStyle = "classic" | "y2k" | "love" | "road_trip" | "school" | "summer";

interface Props {
  publicId: string;
  tapeId: string;
  draftToken?: string;
  visibility?: "unlisted" | "public";
  title: string;
  senderName: string;
  recipientName: string;
  style: TapeStyle;
}

export default function SendTapeClient({
  publicId,
  tapeId,
  draftToken,
  visibility = "unlisted",
  title,
  senderName,
  recipientName,
  style: initialStyle,
}: Props) {
  const reduceMotion = useReduceMotion();
  const [caseStyle, setCaseStyle] = useState<TapeStyle>(initialStyle);
  const [caseClosed, setCaseClosed] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedManage, setCopiedManage] = useState(false);
  const [backgroundNumber, setBackgroundNumber] = useState(1);

  useEffect(() => {
    setBackgroundNumber(Math.floor(Math.random() * 13) + 1);
  }, []);

  const domain =
    process.env.NEXT_PUBLIC_DOMAIN ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const tapeUrl = `${domain}/t/${publicId}`;
  const manageUrl = draftToken ? `${domain}/manage/${draftToken}` : "";

  async function handleToggleCase() {
    if (caseClosed) {
      await playCaseOpenSound(true);
    } else {
      await playCaseCloseSound(true);
    }
    setCaseClosed(v => !v);
  }

  async function handleShare(platform: string) {
    const shareText = `${recipientName ? `For ${recipientName} — ` : ""}a tape was made for you ❤️\n${tapeUrl}`;
    recordShare(tapeId, platform).catch(() => {});

    if (platform === "native" && "share" in navigator) {
      try {
        await navigator.share({
          title: title || "A tape for you",
          text: shareText,
          url: tapeUrl,
        });
      } catch {}
    } else if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
    } else if (platform === "sms") {
      window.location.href = `sms:?&body=${encodeURIComponent(shareText)}`;
    } else if (platform === "x") {
      const xUrl = `https://x.com/intent/post?url=${encodeURIComponent(tapeUrl)}&text=${encodeURIComponent(shareText)}&hashtags=cassette`;
      window.open(xUrl, "_blank");
    } else if (platform === "telegram") {
      const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(tapeUrl)}&text=${encodeURIComponent(shareText)}`;
      window.open(tgUrl, "_blank");
    } else if (platform === "email") {
      const subject = `A mixtape from ${senderName || "someone"} for ${recipientName || "you"} ❤️`;
      const body = `${shareText}\n\nListen to your tape here:\n${tapeUrl}`;
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else if (platform === "copy") {
      await playClickSound(true);
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
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto" style={{ background: "#FBFAF7" }}>
      {/* Background decorative image */}
      <BackgroundImage
        imageNumber={backgroundNumber}
        opacity={0.18}
        position="top-left"
      />

      {/* Semi-transparent parchment overlay */}
      <div
        className="absolute inset-0 z-5 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(251,250,247,0.88) 0%, rgba(251,250,247,0.72) 50%, rgba(251,250,247,0.88) 100%)",
        }}
      />

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Sticky top nav */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3.5"
          style={{
            background: "rgba(251,250,247,0.94)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderBottom: "1px solid #E8E5DF",
          }}
        >
          <a
            href="/"
            className="text-xs tracking-[0.2em] uppercase transition-opacity hover:opacity-60 font-mono text-[#8E8E93]"
          >
            ← CASSETTE
          </a>

          <div className="flex items-center gap-2">
            <span
              className="text-[10px] sm:text-xs px-3 py-1 rounded-full font-mono font-semibold border flex items-center gap-1.5"
              style={{
                background: "#F0FDF4",
                borderColor: "#BBF7D0",
                color: "#166534",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] inline-block animate-pulse" />
              Tape Sealed & Ready
            </span>
          </div>
        </header>

        {/* Main Sendable Hub */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-6 sm:pt-10 pb-24 sm:pb-16 gap-6 sm:gap-8 max-w-lg mx-auto w-full">
          
          {/* Header Title */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center flex flex-col items-center gap-1.5"
          >
            <p className="text-[10px] sm:text-xs font-mono tracking-[0.25em] uppercase text-[#8E8E93]">
              YOUR MIXTAPE IS PACKED & READY
            </p>
            <h1
              className="text-3xl sm:text-4xl font-bold italic"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: "#1D1D1F",
                lineHeight: 1.2,
              }}
            >
              {title || "Untitled Tape"}
            </h1>
            <p className="text-xs sm:text-sm text-[#6B5B47] mt-0.5">
              for <strong className="font-semibold text-[#1D1D1F]">{recipientName}</strong> from{" "}
              <strong className="font-semibold text-[#1D1D1F]">{senderName}</strong>
            </p>
          </motion.div>

          {/* ── INTERACTIVE CASSETTE CASE ─────────────────────────────────── */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="w-full flex flex-col items-center gap-3"
          >
            <div
              onClick={handleToggleCase}
              className="w-full max-w-sm cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
              title={caseClosed ? "Click to open case" : "Click to close case"}
            >
              <CassetteCase
                state={caseClosed ? "closed" : "open"}
                style={caseStyle}
                title={title}
                recipientName={recipientName}
                senderName={senderName}
              />
            </div>

            {/* Tap to open/close caption */}
            <button
              onClick={handleToggleCase}
              className="text-[11px] font-mono text-[#8E8E93] hover:text-[#D4882A] transition-colors flex items-center gap-1.5 mt-1"
            >
              <span>{caseClosed ? "🔓 Tap case to open" : "📦 Tap case to snap shut"}</span>
            </button>

            {/* Color Accent Picker */}
            <div className="flex items-center gap-2.5 mt-1 p-2 rounded-full bg-[#FFFFFF]/70 border border-[#E8E5DF] shadow-sm">
              <span className="text-[9px] font-mono tracking-widest uppercase text-[#8E8E93] px-1.5">
                Case Tint:
              </span>
              <div className="flex items-center gap-2">
                {CASE_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setCaseStyle(c.value)}
                    aria-label={c.label}
                    title={c.label}
                    className="w-5 h-5 rounded-full border transition-all"
                    style={{
                      background: c.swatch,
                      borderColor: caseStyle === c.value ? "#1D1D1F" : "transparent",
                      boxShadow: caseStyle === c.value ? `0 0 0 2px #FFFFFF, 0 0 0 3.5px ${c.swatch}` : "none",
                      transform: caseStyle === c.value ? "scale(1.25)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── PRIMARY SHARING CARD ───────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-xl"
            style={{
              background: "#FFFFFF",
              border: "1.5px solid #D4882A",
              boxShadow: "0 12px 36px rgba(212,136,42,0.14)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎁</span>
                <h2 className="text-xs sm:text-sm font-semibold tracking-wide uppercase font-mono text-[#D4882A]">
                  Sendable Mixtape Link
                </h2>
              </div>

              <span
                className="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-medium border"
                style={{
                  background: visibility === "public" ? "#EFF6FF" : "#F3EFE7",
                  borderColor: visibility === "public" ? "#93C5FD" : "#E8E5DF",
                  color: visibility === "public" ? "#1D4ED8" : "#5F6065",
                }}
              >
                {visibility === "public" ? "🌍 Public Shelf" : "🔒 Private Link"}
              </span>
            </div>

            {/* URL bar with 1-click Copy */}
            <div
              className="flex items-center rounded-xl p-1.5 pl-3.5 border gap-2 transition-all focus-within:border-[#D4882A]"
              style={{ background: "#FBFAF7", borderColor: "#E8E5DF" }}
            >
              <span className="text-xs text-[#8E8E93] font-mono select-none">🔗</span>
              <input
                type="text"
                readOnly
                value={tapeUrl}
                className="flex-1 bg-transparent text-xs sm:text-sm font-mono outline-none text-[#1D1D1F] select-all truncate"
              />
              <button
                onClick={() => handleShare("copy")}
                className="px-4 sm:px-5 py-2.5 rounded-lg text-xs font-semibold text-white transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0 shadow-sm"
                style={{
                  background: copied ? "#16A34A" : "linear-gradient(135deg, #D4882A 0%, #C4503A 100%)",
                }}
              >
                <span>{copied ? "✓" : "📋"}</span>
                <span>{copied ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>

            {/* Primary Action Button (Native Mobile Share / WhatsApp) */}
            <motion.button
              onClick={() => handleShare("share" in navigator ? "native" : "whatsapp")}
              whileHover={reduceMotion ? {} : { scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              className="w-full py-3.5 rounded-xl font-semibold text-sm sm:text-base text-white flex items-center justify-center gap-2 shadow-md transition-all"
              style={{
                background: "linear-gradient(135deg, #1D1D1F 0%, #302A24 100%)",
                minHeight: "48px",
              }}
            >
              <span>🚀</span>
              <span>Send directly to {recipientName}</span>
            </motion.button>

            {/* Quick Share Channels (4 essential apps) */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#F0EDE7]">
              <p className="text-[10px] font-mono tracking-wider uppercase text-[#8E8E93]">
                Or send directly via:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <ShareChannelButton
                  label="WhatsApp"
                  icon="💬"
                  onClick={() => handleShare("whatsapp")}
                />
                <ShareChannelButton
                  label="SMS / Text"
                  icon="📱"
                  onClick={() => handleShare("sms")}
                />
                <ShareChannelButton
                  label="Email"
                  icon="✉️"
                  onClick={() => handleShare("email")}
                />
                <ShareChannelButton
                  label="X (Twitter)"
                  icon="𝕏"
                  onClick={() => handleShare("x")}
                />
              </div>
            </div>
          </motion.div>

          {/* ── PUBLIC SHELF PROMO CARD (If Public) ─────────────────────────── */}
          {visibility === "public" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full px-4 py-3.5 rounded-2xl flex items-center justify-between gap-3 border shadow-sm"
              style={{
                background: "#EFF6FF",
                borderColor: "#BFDBFE",
              }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🌍</span>
                <div>
                  <p className="text-xs font-semibold text-[#1E40AF]">
                    Published to the Community Shelf
                  </p>
                  <p className="text-[11px] text-[#3B82F6]">
                    Anyone on CASSETTE can discover and play this tape.
                  </p>
                </div>
              </div>
              <a
                href="/shelf"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#2563EB] text-white transition-opacity hover:opacity-90 whitespace-nowrap shadow-sm"
              >
                View Shelf →
              </a>
            </motion.div>
          )}

          {/* ── CREATOR PRIVATE MANAGEMENT LINK ─────────────────────────────── */}
          {manageUrl && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full px-4 py-3.5 rounded-2xl flex flex-col gap-2 border"
              style={{
                background: "#FFFDF6",
                borderColor: "#FDE68A",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-[#B45309] flex items-center gap-1.5">
                  <span>🔒</span> Private Management Link (For You Only)
                </span>
                <button
                  onClick={async () => {
                    await playClickSound(true);
                    await navigator.clipboard.writeText(manageUrl);
                    setCopiedManage(true);
                    setTimeout(() => setCopiedManage(false), 2400);
                  }}
                  className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-md bg-white border border-[#FDE68A] transition-all hover:bg-neutral-50 active:scale-95"
                  style={{ color: copiedManage ? "#16A34A" : "#B45309" }}
                >
                  {copiedManage ? "✓ Copied" : "Copy Manage Link"}
                </button>
              </div>
              <p className="text-[11px] text-[#78350F] leading-relaxed">
                Bookmark this link to check listen count, edit tracks, or manage this tape later:
              </p>
              <a
                href={manageUrl}
                className="text-xs font-mono truncate underline text-[#B45309] transition-opacity hover:opacity-75"
              >
                {manageUrl}
              </a>
            </motion.div>
          )}

          {/* Footer Quick Links */}
          <footer className="flex items-center justify-center gap-6 text-xs font-mono text-[#8E8E93] pt-2">
            <a href={`/t/${publicId}`} className="hover:text-[#1D1D1F] transition-colors">
              ▶ Listen as Recipient
            </a>
            <span>•</span>
            <a href="/create" className="hover:text-[#1D1D1F] transition-colors">
              + Make Another Tape
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
}

function ShareChannelButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: string;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border font-mono text-[11px] font-medium transition-all hover:bg-neutral-50 active:scale-95 shadow-2xs"
      style={{
        background: "#FFFFFF",
        borderColor: "#E8E5DF",
        color: "#1D1D1F",
      }}
    >
      <span className="text-sm">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}
