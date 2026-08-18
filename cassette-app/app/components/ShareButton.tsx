"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { recordShare } from "@/app/actions/tape";
import { shareTowardsPlatform, SHARE_PLATFORMS, getPlatformColor } from "@/app/lib/share-platforms";

interface ShareButtonProps {
  title: string;
  senderName: string;
  publicId: string;
  tapeId: string;
  recipientName?: string;
  onShare?: (platform: string) => void;
}

export default function ShareButton({ title, senderName, publicId, tapeId, recipientName, onShare }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharedPlatform, setSharedPlatform] = useState<string | null>(null);

  const domain =
    process.env.NEXT_PUBLIC_DOMAIN ||
    (typeof window !== "undefined" ? window.location.origin : "https://cassette-share.vercel.app");
  const tapeUrl = `${domain}/t/${publicId}`;
  const shareText = `A tape was made for me ❤️ — from ${senderName}`;

  async function handleShare(platform: string) {
    recordShare(tapeId, platform).catch(() => {});
    onShare?.(platform);

    const result = await shareTowardsPlatform(platform, {
      url: tapeUrl,
      title: title || "A tape was made for you",
      text: shareText,
      recipientName,
      tapeId,
    });

    if (platform === "copy" && result.success) {
      setCopied(true);
      setSharedPlatform(platform);
      setTimeout(() => {
        setCopied(false);
        setSharedPlatform(null);
      }, 2000);
    }
    setShowMenu(false);
  }

  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;
  
  // Curated list of most important platforms to show
  const priorityPlatforms = [
    hasNativeShare && "native",
    "whatsapp",
    "x",
    "telegram",
    "facebook",
    "email",
    "copy",
  ].filter(Boolean) as string[];

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(v => !v)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:opacity-80 active:scale-95"
        style={{
          background: "#F3EFE7",
          border: "1.5px solid #D9D7D1",
          color: "#5F6065",
          fontFamily: "var(--font-inter, Inter, sans-serif)",
          letterSpacing: "0.02em",
        }}
        aria-label="Share this tape"
        aria-expanded={showMenu}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="11" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
          <circle cx="3" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
          <circle cx="11" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M4.5 7.8L9.5 10.2M9.5 3.8L4.5 6.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        Share
      </button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            className="absolute bottom-full left-0 mb-2 rounded-xl overflow-hidden z-50"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E8E5DF",
              boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
              minWidth: "180px",
            }}
            role="menu"
          >
            {priorityPlatforms.map((platform) => {
              const config = SHARE_PLATFORMS[platform];
              if (!config) return null;
              
              return (
                <ShareMenuItem
                  key={platform}
                  platform={platform}
                  config={config}
                  onClick={() => handleShare(platform)}
                  isSelected={sharedPlatform === platform}
                  isCopied={copied && platform === "copy"}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShareMenuItem({
  platform,
  config,
  onClick,
  isSelected = false,
  isCopied = false,
}: {
  platform: string;
  config: any;
  onClick: () => void;
  isSelected?: boolean;
  isCopied?: boolean;
}) {
  const label = isCopied && platform === "copy" ? "✓ Copied!" : config.label;
  
  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-2.5 text-sm text-left transition-colors hover:bg-gray-50 flex items-center gap-3"
      style={{
        color: isCopied ? "#28A858" : config.color || "#3D3D3F",
        fontFamily: "var(--font-inter, Inter, sans-serif)",
        borderBottom: "1px solid #F3EFE7",
        background: isSelected ? "#F9F8F5" : "transparent",
      }}
      role="menuitem"
      aria-label={`Share via ${config.label}`}
    >
      <span>{config.icon}</span>
      <span>{label}</span>
    </button>
  );
}
