"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { recordShare } from "@/app/actions/tape";

interface ShareButtonProps {
  title: string;
  senderName: string;
  publicId: string;
  tapeId: string;
  onShare?: (platform: string) => void;
}

export default function ShareButton({ title, senderName, publicId, tapeId, onShare }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const domain = process.env.NEXT_PUBLIC_DOMAIN || (typeof window !== "undefined" ? window.location.origin : "https://cassette.fm");
  const tapeUrl = `${domain}/t/${publicId}`;
  const shareText = `A tape was made for me ❤️ from ${senderName}`;

  async function handleShare(platform: string) {
    // Record the share event
    recordShare(tapeId, platform).catch(err => {
      console.warn("Failed to record share:", err);
    });

    onShare?.(platform);

    if (platform === "native" && navigator.share) {
      try {
        await navigator.share({
          title: title || "A tape was made for you",
          text: shareText,
          url: tapeUrl,
        });
      } catch (e) {
        // User cancelled
      }
    } else if (platform === "whatsapp") {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${tapeUrl}`)}`;
      window.open(waUrl, "_blank");
    } else if (platform === "copy") {
      await navigator.clipboard.writeText(tapeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    setShowMenu(false);
  }

  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(v => !v)}
        className="px-5 py-2.5 rounded-full text-sm font-mono tracking-widest transition-all hover:opacity-80 active:scale-95"
        style={{
          background: "rgba(245,240,232,0.08)",
          border: "1px solid rgba(245,240,232,0.12)",
          color: "#D4882A",
        }}
      >
        SHARE ⤴
      </button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 rounded-lg overflow-hidden z-50"
            style={{
              background: "rgba(18,14,10,0.95)",
              border: "1px solid rgba(245,240,232,0.12)",
              backdropFilter: "blur(12px)",
              minWidth: "160px",
            }}
          >
            <div className="flex flex-col">
              {hasNativeShare && (
                <button
                  onClick={() => handleShare("native")}
                  className="px-4 py-2.5 text-xs font-mono tracking-wide transition-all hover:bg-opacity-70 text-left"
                  style={{
                    background: "transparent",
                    color: "#A89880",
                    borderBottom: "1px solid rgba(245,240,232,0.08)",
                  }}
                >
                  Share…
                </button>
              )}

              <button
                onClick={() => handleShare("whatsapp")}
                className="px-4 py-2.5 text-xs font-mono tracking-wide transition-all hover:bg-opacity-70 text-left"
                style={{
                  background: "transparent",
                  color: "#A89880",
                  borderBottom: hasNativeShare ? "1px solid rgba(245,240,232,0.08)" : "none",
                }}
              >
                WhatsApp
              </button>

              <button
                onClick={() => handleShare("copy")}
                className="px-4 py-2.5 text-xs font-mono tracking-wide transition-all hover:bg-opacity-70 text-left"
                style={{ background: "transparent", color: "#A89880" }}
              >
                {copied ? "✓ Copied" : "Copy link"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
