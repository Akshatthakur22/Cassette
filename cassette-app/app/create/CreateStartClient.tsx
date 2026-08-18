"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { createDraft } from "@/app/actions/tape";
import { BackgroundImage } from "@/app/components/BackgroundImage";
import { DoodleBorder, DoodleScatter } from "@/app/components/Doodle";
import { trackClientEvent, EVENTS as CLIENT_EVENTS } from "@/app/lib/client-posthog";

const RELATIONSHIPS = [
  { value: "partner",     label: "For My Love",     emoji: "❤️" },
  { value: "best_friend", label: "Best Friend",      emoji: "✨" },
  { value: "family",      label: "Family",           emoji: "🌿" },
  { value: "memory",      label: "A Memory",         emoji: "📷" },
  { value: "self",        label: "Just for Me",      emoji: "🌙" },
  { value: "other",       label: "Just Because",     emoji: "🎵" },
];

const TAPE_STYLES = [
  { value: "cream",       label: "Cream",       color: "#D4C4A8" },
  { value: "cherry",      label: "Cherry",      color: "#E84060" },
  { value: "peach",       label: "Peach",       color: "#E8703A" },
  { value: "butter",      label: "Butter",      color: "#F5D840" },
  { value: "sky",         label: "Sky",         color: "#5AC8FA" },
  { value: "pool",        label: "Pool",        color: "#1A9898" },
  { value: "lavender",    label: "Lavender",    color: "#B080E0" },
  { value: "mint",        label: "Mint",        color: "#34C759" },
  { value: "transparent", label: "Clear",       color: "rgba(190,215,235,0.8)" },
  { value: "smoky",       label: "Smoky",       color: "#4A4550" },
];

export default function CreateStartClient() {
  const searchParams = useSearchParams();
  const forName = searchParams.get("for")?.trim() || "";
  const fromTapeId = searchParams.get("from") || "";
  const initialStyle = searchParams.get("style") || "cream";

  const [step, setStep] = useState<"intention" | "details">("intention");
  const [relationship, setRelationship] = useState("other");
  const [style, setStyle] = useState(initialStyle);
  const [visibility, setVisibility] = useState<"unlisted" | "public">("unlisted");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [backgroundNumber, setBackgroundNumber] = useState(1);

  useEffect(() => {
    if (fromTapeId) {
      trackClientEvent(CLIENT_EVENTS.RECIPIENT_CREATED_TAPE, { fromTapeId, source: "make_one_back" });
    }
    // Set background number only on client to avoid hydration mismatch
    setBackgroundNumber(Math.floor(Math.random() * 13) + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    const fd = new FormData(e.currentTarget);
    fd.set("relationship", relationship);
    fd.set("style", style);
    if (fromTapeId) {
      fd.set("fromTapeId", fromTapeId);
    }
    try {
      const result = await createDraft(fd);
      if (result?.error) { setError(result.error); setIsPending(false); return; }
      setError("Something went wrong. Please try again.");
      setIsPending(false);
    } catch (err: any) {
      if (err && typeof err === "object" && "digest" in err) throw err;
      setError("Something went wrong. Please try again.");
      setIsPending(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: "#FBFAF7" }}>
      <div className="absolute inset-0 hidden lg:block opacity-20">
        <DoodleScatter count={6} minSize={10} maxSize={16} />
      </div>
      
      {/* Background decorative image */}
      <BackgroundImage
        imageNumber={backgroundNumber}
        opacity={0.22}
        position="bottom-left"
      />

      {/* Semi-transparent overlay for text readability */}
      <div
        className="absolute inset-0 z-5 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(251,250,247,0.8) 0%, rgba(251,250,247,0.65) 50%, rgba(251,250,247,0.8) 100%)",
        }}
      />

      {/* Content wrapper */}
      <div className="relative z-10 pb-28 sm:pb-20">
      {/* Sticky nav */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-5 py-4"
        style={{
          background: "rgba(251,250,247,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid #E8E5DF",
        }}
      >
        <a href="/" className="text-xs tracking-[0.2em] uppercase transition-opacity hover:opacity-60"
          style={{ color: "#8E8E93", fontFamily: "monospace" }}>
          ← CASSETTE
        </a>
        <span className="text-xs" style={{ color: "#8E8E93", fontFamily: "monospace" }}>
          {step === "intention" ? "1 / 2" : "2 / 2"}
        </span>
      </div>

      {/* Steps */}
      <div className="flex flex-col items-center px-4 sm:px-5 pt-6 sm:pt-10 pb-16 max-w-md mx-auto">
        <AnimatePresence mode="wait">

          {/* Step 1 — Intention + colour */}
          {step === "intention" && (
            <motion.div
              key="intention"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <p className="text-xs tracking-[0.3em] uppercase text-center mb-2"
                style={{ color: "#8E8E93", fontFamily: "monospace" }}>
                Who is this for?
              </p>
              <h1 className="text-3xl font-bold italic text-center mb-8"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#1D1D1F" }}>
                Set the mood.
              </h1>

              <div className="mb-6 flex justify-center">
                <DoodleBorder side="bottom" className="hidden sm:flex" height={16} />
              </div>

              {/* Relationship grid */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {RELATIONSHIPS.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setRelationship(r.value)}
                    className="flex flex-col items-center gap-2 py-4 px-3 rounded-2xl transition-all active:scale-95"
                    style={{
                      background: relationship === r.value ? "rgba(212,136,42,0.08)" : "#FFFFFF",
                      border: `1.5px solid ${relationship === r.value ? "#D4882A" : "#E8E5DF"}`,
                      boxShadow: relationship === r.value ? "0 2px 12px rgba(212,136,42,0.12)" : "0 1px 4px rgba(0,0,0,0.03)",
                    }}
                  >
                    <span className="text-2xl">{r.emoji}</span>
                    <span className="text-xs font-medium"
                      style={{ color: relationship === r.value ? "#D4882A" : "#5F6065",
                        fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
                      {r.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Tape colour picker */}
              <p className="text-xs tracking-[0.2em] uppercase text-center mb-3"
                style={{ color: "#8E8E93", fontFamily: "monospace" }}>
                Choose a tape colour
              </p>
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {TAPE_STYLES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setStyle(s.value)}
                    className="flex flex-col items-center gap-1.5 transition-all active:scale-90"
                    aria-label={s.label}
                  >
                    <span
                      className="w-8 h-8 rounded-full border-2 transition-all"
                      style={{
                        background: s.color,
                        borderColor: style === s.value ? "#1D1D1F" : "rgba(0,0,0,0.06)",
                        boxShadow: style === s.value ? `0 0 0 2.5px white, 0 0 0 4px ${s.color}` : "0 1px 4px rgba(0,0,0,0.1)",
                        transform: style === s.value ? "scale(1.18)" : "scale(1)",
                      }}
                    />
                    <span className="text-[9px] leading-none"
                      style={{ color: style === s.value ? "#1D1D1F" : "#8E8E93", fontFamily: "monospace",
                        fontWeight: style === s.value ? 600 : 400 }}>
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep("details")}
                className="w-full btn-primary text-sm py-3.5"
              >
                Next →
              </button>
            </motion.div>
          )}

          {/* Step 2 — Tape details */}
          {step === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <button onClick={() => setStep("intention")}
                className="text-xs tracking-widest mb-6 block hover:opacity-60 transition-opacity"
                style={{ color: "#8E8E93", fontFamily: "monospace" }}>
                ← back
              </button>

              {/* Tape colour preview dot */}
              <div className="flex justify-center mb-5">
                <span
                  className="w-10 h-10 rounded-full"
                  style={{
                    background: TAPE_STYLES.find(s => s.value === style)?.color ?? "#D4C4A8",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.14), 0 1px 0 rgba(255,255,255,0.4) inset",
                  }}
                />
              </div>

              <h1 className="text-3xl font-bold italic text-center mb-1"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#1D1D1F" }}>
                Name the tape.
              </h1>
              <p className="text-xs text-center mb-8" style={{ color: "#8E8E93" }}>
                You can always change these later.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input type="hidden" name="relationship" value={relationship} />
                <input type="hidden" name="style" value={style} />

                <FormField label="Your name *" htmlFor="senderName">
                  <input id="senderName" name="senderName" type="text"
                    placeholder="Arjun" required maxLength={60}
                    className="cassette-input" />
                </FormField>

                <FormField label="Recipient's name" htmlFor="recipientName">
                  <input id="recipientName" name="recipientName" type="text"
                    placeholder="Riya" defaultValue={forName} maxLength={60}
                    className="cassette-input" />
                </FormField>

                <FormField label="Tape title" htmlFor="title">
                  <input id="title" name="title" type="text"
                    placeholder="Late Night Drive Vol. 1" maxLength={80}
                    className="cassette-input" />
                </FormField>

                <FormField label="Dedication (optional)" htmlFor="dedication">
                  <textarea id="dedication" name="dedication"
                    placeholder="Every song on here has a story…"
                    maxLength={500} rows={3} className="cassette-input resize-none" />
                </FormField>

                {/* Visibility & Discovery Setting */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs tracking-widest uppercase"
                    style={{ color: "#8E8E93", fontFamily: "monospace" }}>
                    Tape Visibility
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Unlisted (Private Link) */}
                    <label
                      className="flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all"
                      style={{
                        background: visibility === "unlisted" ? "#FFFDF6" : "#FFFFFF",
                        borderColor: visibility === "unlisted" ? "#D4882A" : "#E8E5DF",
                        boxShadow: visibility === "unlisted" ? "0 0 0 1.5px #D4882A" : "none",
                      }}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value="unlisted"
                        checked={visibility === "unlisted"}
                        onChange={() => setVisibility("unlisted")}
                        className="mt-0.5 accent-[#D4882A]"
                      />
                      <div>
                        <p className="text-xs font-semibold text-[#1D1D1F]">🔒 Unlisted (Default)</p>
                        <p className="text-[11px] text-[#8E8E93] mt-0.5 leading-snug">
                          Only people with your link can listen.
                        </p>
                      </div>
                    </label>

                    {/* Public Shelf */}
                    <label
                      className="flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all"
                      style={{
                        background: visibility === "public" ? "#FFFDF6" : "#FFFFFF",
                        borderColor: visibility === "public" ? "#D4882A" : "#E8E5DF",
                        boxShadow: visibility === "public" ? "0 0 0 1.5px #D4882A" : "none",
                      }}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        checked={visibility === "public"}
                        onChange={() => setVisibility("public")}
                        className="mt-0.5 accent-[#D4882A]"
                      />
                      <div>
                        <p className="text-xs font-semibold text-[#1D1D1F]">🌍 Public Shelf</p>
                        <p className="text-[11px] text-[#8E8E93] mt-0.5 leading-snug">
                          Feature on the community shelf for all.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-center" style={{ color: "#C4503A" }}>{error}</p>
                )}

                <button
                  type="submit" disabled={isPending}
                  className="w-full btn-primary text-sm py-3.5 mt-1 disabled:opacity-50"
                >
                  {isPending ? "Creating…" : "Start adding songs →"}
                </button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
      {/* Close content wrapper */}
      </div>
    </div>
  );
}

function FormField({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs tracking-widest uppercase"
        style={{ color: "#8E8E93", fontFamily: "monospace" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
