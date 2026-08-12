"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import HeroScene from "@/app/components/HeroScene";
import { createDraft } from "@/app/actions/tape";

const RELATIONSHIPS = [
  { value: "partner",     label: "For My Love",     emoji: "❤️" },
  { value: "best_friend", label: "Best Friend",      emoji: "✨" },
  { value: "family",      label: "Family",           emoji: "🌿" },
  { value: "memory",      label: "A Memory",         emoji: "📷" },
  { value: "self",        label: "Just for Me",      emoji: "🌙" },
  { value: "other",       label: "Just Because",     emoji: "🎵" },
];

const STYLES = [
  { value: "classic",   label: "Classic",   desc: "Warm. Timeless.",       color: "#C8A96E" },
  { value: "y2k",       label: "Y2K",       desc: "Neon. Nostalgic.",      color: "#E040FB" },
  { value: "love",      label: "Love",      desc: "Tender. Cinematic.",    color: "#D45A6A" },
  { value: "road_trip", label: "Road Trip", desc: "Open road. Warm night.", color: "#5B7FA6" },
];

export default function CreateStartClient() {
  const searchParams = useSearchParams();
  const forName = searchParams.get("for")?.trim() || "";

  const [step, setStep] = useState<"intention" | "details">("intention");
  const [relationship, setRelationship] = useState("other");
  const [style, setStyle] = useState("classic");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("relationship", relationship);
    fd.set("style", style);
    startTransition(async () => {
      const result = await createDraft(fd);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col" style={{ background: "#060408" }}>
      <HeroScene />

      <div className="relative z-10 flex flex-col flex-1">
        {/* Back link */}
        <div className="pt-7 px-6">
          <a href="/" className="text-xs font-mono tracking-widest" style={{ color: "#6B5E4E" }}>
            ← CASSETTE
          </a>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
          <AnimatePresence mode="wait">

            {/* ── Step 1: intention ── */}
            {step === "intention" && (
              <motion.div
                key="intention"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md"
              >
                <p className="text-xs tracking-[0.3em] uppercase text-center mb-3" style={{ color: "#6B5E4E", fontFamily: "monospace" }}>
                  Who is this tape for?
                </p>
                <h1 className="text-3xl font-bold italic text-center mb-8" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#F5F0E8" }}>
                  Set the mood.
                </h1>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {RELATIONSHIPS.map(r => (
                    <button
                      key={r.value}
                      onClick={() => setRelationship(r.value)}
                      className="flex flex-col items-center gap-1.5 py-4 px-3 rounded-xl transition-all active:scale-95"
                      style={{
                        background: relationship === r.value ? "rgba(212,136,42,0.15)" : "rgba(28,24,20,0.55)",
                        border: `1px solid ${relationship === r.value ? "rgba(212,136,42,0.5)" : "rgba(245,240,232,0.07)"}`,
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <span className="text-2xl">{r.emoji}</span>
                      <span className="text-xs font-medium" style={{ color: relationship === r.value ? "#D4882A" : "#C4B8A8", fontFamily: "var(--font-inter)" }}>
                        {r.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Style picker */}
                <p className="text-xs tracking-[0.2em] uppercase text-center mb-3" style={{ color: "#6B5E4E", fontFamily: "monospace" }}>
                  Choose a style
                </p>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {STYLES.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setStyle(s.value)}
                      className="flex items-center gap-3 py-3 px-4 rounded-xl transition-all active:scale-95 text-left"
                      style={{
                        background: style === s.value ? "rgba(212,136,42,0.12)" : "rgba(28,24,20,0.55)",
                        border: `1px solid ${style === s.value ? s.color + "80" : "rgba(245,240,232,0.07)"}`,
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      <div>
                        <p className="text-xs font-semibold" style={{ color: style === s.value ? "#F5F0E8" : "#A89880" }}>{s.label}</p>
                        <p className="text-[10px]" style={{ color: "#6B5E4E" }}>{s.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep("details")}
                  className="w-full py-3.5 rounded-full text-sm font-semibold tracking-wide transition-all hover:opacity-90 active:scale-[0.97]"
                  style={{
                    background: "linear-gradient(135deg, #D4882A 0%, #C4503A 100%)",
                    color: "#F5F0E8",
                    fontFamily: "var(--font-inter)",
                    boxShadow: "0 4px 24px rgba(212,136,42,0.25)",
                  }}
                >
                  Next →
                </button>
              </motion.div>
            )}

            {/* ── Step 2: details ── */}
            {step === "details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md"
              >
                <button
                  onClick={() => setStep("intention")}
                  className="text-xs font-mono tracking-widest mb-6 block"
                  style={{ color: "#6B5E4E" }}
                >
                  ← back
                </button>

                <h1 className="text-3xl font-bold italic text-center mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#F5F0E8" }}>
                  Name the tape.
                </h1>
                <p className="text-xs text-center mb-8" style={{ color: "#6B5E4E" }}>
                  You can always change these later.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <input type="hidden" name="relationship" value={relationship} />
                  <input type="hidden" name="style" value={style} />

                  <Field label="Your name *" htmlFor="senderName">
                    <input
                      id="senderName"
                      name="senderName"
                      type="text"
                      placeholder="Arjun"
                      required
                      maxLength={60}
                      className="cassette-input"
                    />
                  </Field>

                  <Field label="Recipient's name" htmlFor="recipientName">
                    <input
                      id="recipientName"
                      name="recipientName"
                      type="text"
                      placeholder="Riya"
                      defaultValue={forName}
                      maxLength={60}
                      className="cassette-input"
                    />
                  </Field>

                  <Field label="Tape title" htmlFor="title">
                    <input
                      id="title"
                      name="title"
                      type="text"
                      placeholder="Late Night Drive Vol. 1"
                      maxLength={80}
                      className="cassette-input"
                    />
                  </Field>

                  <Field label="Dedication (optional)" htmlFor="dedication">
                    <textarea
                      id="dedication"
                      name="dedication"
                      placeholder="Every song on here has a story..."
                      maxLength={500}
                      rows={3}
                      className="cassette-input resize-none"
                    />
                  </Field>

                  {error && (
                    <p className="text-xs text-center" style={{ color: "#C4503A" }}>{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-3.5 rounded-full text-sm font-semibold tracking-wide transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    style={{
                      background: "linear-gradient(135deg, #D4882A 0%, #C4503A 100%)",
                      color: "#F5F0E8",
                      fontFamily: "var(--font-inter)",
                      boxShadow: "0 4px 24px rgba(212,136,42,0.25)",
                    }}
                  >
                    {isPending ? "Creating…" : "Start adding songs →"}
                  </button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      <style jsx global>{`
        .cassette-input {
          width: 100%;
          background: rgba(28,24,20,0.6);
          border: 1px solid rgba(245,240,232,0.10);
          border-radius: 10px;
          padding: 12px 14px;
          color: #F5F0E8;
          font-size: 14px;
          font-family: var(--font-inter, Inter, sans-serif);
          outline: none;
          transition: border-color 0.15s;
          backdrop-filter: blur(8px);
        }
        .cassette-input::placeholder { color: #6B5E4E; }
        .cassette-input:focus { border-color: rgba(212,136,42,0.45); }
      `}</style>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-mono tracking-widest uppercase" style={{ color: "#6B5E4E" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
