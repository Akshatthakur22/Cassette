import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "#FBFAF7", color: "#1D1D1F" }}
    >
      <div className="max-w-md w-full flex flex-col items-center gap-6">
        <div className="text-6xl select-none" role="img" aria-label="tape icon">
          📼
        </div>

        <div className="space-y-2">
          <p className="text-xs font-mono tracking-[0.3em] uppercase text-[#8E8E93]">
            ERROR 404 — TAPE NOT FOUND
          </p>
          <h1
            className="text-3xl sm:text-4xl font-bold italic"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#1D1D1F" }}
          >
            This tape is missing or rewound.
          </h1>
          <p className="text-xs sm:text-sm text-[#6B5B47] leading-relaxed">
            The tape link you followed may have been deleted, moved, or mistyped.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs mt-2">
          <Link
            href="/"
            className="btn-primary w-full py-3 text-xs sm:text-sm font-semibold rounded-full block text-center"
          >
            ← Back to Home
          </Link>
          <Link
            href="/create"
            className="btn-ghost w-full py-3 text-xs sm:text-sm font-medium rounded-full block text-center border border-[#E8E5DF]"
          >
            Make a New Tape 🎁
          </Link>
        </div>
      </div>
    </main>
  );
}
