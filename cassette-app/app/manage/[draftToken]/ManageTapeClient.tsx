"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HeroScene from "@/app/components/HeroScene";
import CassetteObject from "@/app/components/CassetteObject";
import { deleteTape } from "@/app/actions/tape";
import type { TapeWithTracks, TapeStyle } from "@/app/lib/types";

interface Props {
  tape: TapeWithTracks;
  draftToken: string;
}

export default function ManageTapeClient({ tape, draftToken }: Props) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isPublished = tape.status === "published";
  const trackCount = tape.tracks.length;
  const sideA = tape.tracks.filter(t => t.side === "A").length;
  const sideB = tape.tracks.filter(t => t.side === "B").length;

  function handleDelete() {
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteTape(tape.id);
      if (result?.error) {
        setDeleteError(result.error);
      } else {
        // deleteTape redirects to home, but just in case:
        router.push("/");
      }
    });
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col" style={{ background: "#060408" }}>
      <HeroScene />

      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-8 pb-4">
          <Link href="/" className="text-xs font-mono tracking-widest" style={{ color: "#6B5E4E" }}>
            ← CASSETTE
          </Link>
          <h1 className="text-xs font-mono tracking-widest uppercase" style={{ color: "#A89880" }}>
            Manage Tape
          </h1>
          <div style={{ width: "60px" }} />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center px-4 py-10 gap-6">
          {/* Cassette preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <CassetteObject
              side="A"
              isPlaying={false}
              title={tape.title || "Untitled Tape"}
              recipientName={tape.recipientName || "Someone"}
              senderName={tape.senderName}
              style={(tape.style as TapeStyle) || "classic"}
            />
          </motion.div>

          {/* Tape info */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="w-full max-w-md"
          >
            <div
              className="rounded-xl p-4 space-y-3"
              style={{
                background: "rgba(28,24,20,0.6)",
                border: "1px solid rgba(245,240,232,0.07)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div>
                <p className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: "#6B5E4E" }}>
                  Title
                </p>
                <p className="text-sm" style={{ color: "#F5F0E8" }}>
                  {tape.title || "(No title)"}
                </p>
              </div>

              <div className="border-t border-t-white/5" />

              <div>
                <p className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: "#6B5E4E" }}>
                  From / To
                </p>
                <p className="text-sm" style={{ color: "#F5F0E8" }}>
                  {tape.senderName} → {tape.recipientName || "Someone"}
                </p>
              </div>

              <div className="border-t border-t-white/5" />

              <div>
                <p className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: "#6B5E4E" }}>
                  Tracks
                </p>
                <p className="text-sm" style={{ color: "#F5F0E8" }}>
                  {trackCount} total ({sideA}A / {sideB}B)
                </p>
              </div>

              <div className="border-t border-t-white/5" />

              <div>
                <p className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: "#6B5E4E" }}>
                  Status
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: isPublished ? "#D4882A" : "#6B5E4E",
                  }}
                >
                  {isPublished ? "✓ Published" : "Draft"}
                </p>
              </div>

              {isPublished && (
                <>
                  <div className="border-t border-t-white/5" />

                  <div>
                    <p className="text-xs font-mono tracking-widest uppercase mb-2" style={{ color: "#6B5E4E" }}>
                      Share Link
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${typeof window !== "undefined" ? window.location.origin : ""}/t/${tape.publicId}`}
                        className="flex-1 text-xs px-2 py-1.5 rounded bg-black/30 border border-white/5"
                        style={{ color: "#A89880", fontFamily: "monospace" }}
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${typeof window !== "undefined" ? window.location.origin : ""}/t/${tape.publicId}`
                          );
                        }}
                        className="px-3 py-1.5 rounded text-xs transition-all hover:opacity-80"
                        style={{
                          background: "rgba(212,136,42,0.15)",
                          border: "1px solid rgba(212,136,42,0.3)",
                          color: "#D4882A",
                          fontFamily: "monospace",
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="w-full max-w-md flex flex-col gap-2"
          >
            {!isPublished && (
              <Link
                href={`/create/${tape.id}`}
                className="w-full py-3 rounded-full text-sm font-semibold text-center transition-all hover:opacity-90 active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg, #D4882A, #C4503A)",
                  color: "#F5F0E8",
                  fontFamily: "monospace",
                  letterSpacing: "0.1em",
                }}
              >
                Continue Editing
              </Link>
            )}

            {isPublished && (
              <Link
                href={`/t/${tape.publicId}`}
                className="w-full py-3 rounded-full text-sm font-semibold text-center transition-all hover:opacity-90 active:scale-[0.97]"
                style={{
                  background: "rgba(245,240,232,0.08)",
                  border: "1px solid rgba(245,240,232,0.12)",
                  color: "#D4882A",
                  fontFamily: "monospace",
                  letterSpacing: "0.1em",
                }}
              >
                Open Tape
              </Link>
            )}

            {/* Delete button */}
            <AnimatePresence>
              {!showDeleteConfirm && (
                <motion.button
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3 rounded-full text-sm font-semibold transition-all hover:opacity-80 active:scale-[0.97]"
                  style={{
                    background: "rgba(196,80,58,0.10)",
                    border: "1px solid rgba(196,80,58,0.2)",
                    color: "#C4503A",
                    fontFamily: "monospace",
                    letterSpacing: "0.08em",
                  }}
                >
                  Delete Tape
                </motion.button>
              )}

              {showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-2"
                >
                  <p className="text-xs text-center" style={{ color: "#C4503A" }}>
                    Are you sure? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isPending}
                      className="flex-1 py-2 rounded-full text-xs transition-all hover:opacity-80 disabled:opacity-50"
                      style={{
                        background: "rgba(245,240,232,0.06)",
                        border: "1px solid rgba(245,240,232,0.10)",
                        color: "#A89880",
                        fontFamily: "monospace",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isPending}
                      className="flex-1 py-2 rounded-full text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                      style={{
                        background: "rgba(196,80,58,0.2)",
                        border: "1px solid rgba(196,80,58,0.3)",
                        color: "#FF4030",
                        fontFamily: "monospace",
                      }}
                    >
                      {isPending ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                  {deleteError && (
                    <p className="text-xs text-center" style={{ color: "#C4503A" }}>
                      {deleteError}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Info */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-center mt-4"
            style={{ color: "#6B5E4E", fontFamily: "monospace", maxWidth: "400px" }}
          >
            This page is only accessible to you with your private management link.
          </motion.p>
        </div>
      </div>
    </div>
  );
}
