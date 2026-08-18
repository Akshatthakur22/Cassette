"use client";

import { useState } from "react";
import { getQuickQRCodeUrl } from "@/app/lib/qr-code";
import Image from "next/image";

interface QRCodeShareProps {
  publicId: string;
  tapeName?: string;
  size?: number;
}

export function QRCodeShare({ publicId, tapeName, size = 300 }: QRCodeShareProps) {
  const [copied, setCopied] = useState(false);
  const qrUrl = getQuickQRCodeUrl(publicId, size);
  const tapeUrl = `${process.env.NEXT_PUBLIC_DOMAIN || "https://cassette-share.vercel.app"}/t/${publicId}`;

  const handleDownload = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cassette-${publicId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download QR code:", error);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(tapeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-gray-200 p-6 bg-white text-center">
      <h3 className="text-lg font-semibold mb-4">Share with QR Code</h3>

      {/* QR Code */}
      <div className="mb-6 flex justify-center">
        <div className="p-4 bg-white border-2 border-gray-100 rounded-lg">
          <Image
            src={qrUrl}
            alt="QR Code"
            width={size}
            height={size}
            priority
            unoptimized // External API, can't optimize
          />
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleDownload}
          className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition text-sm font-medium"
        >
          📥 Download QR Code
        </button>

        <button
          onClick={handleCopyLink}
          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
        >
          {copied ? "✓ Copied!" : "🔗 Copy Link"}
        </button>
      </div>

      {tapeName && (
        <p className="text-xs text-gray-600 mt-4">Tape: {tapeName}</p>
      )}
    </div>
  );
}

/**
 * Inline QR code badge (small, in header)
 */
export function QRCodeBadge({ publicId, size = 100 }: { publicId: string; size?: number }) {
  const qrUrl = getQuickQRCodeUrl(publicId, size);

  return (
    <button
      onClick={() => window.open(getQuickQRCodeUrl(publicId, 300))}
      title="View full QR code"
      className="relative group"
    >
      <Image
        src={qrUrl}
        alt="QR Code"
        width={size}
        height={size}
        unoptimized
        className="rounded border border-gray-200 group-hover:shadow-md transition"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition rounded" />
    </button>
  );
}
