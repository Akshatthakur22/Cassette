"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import CassetteShelf, { type ShelfTape } from "./CassetteShelf";
import { PosterImage } from "./PosterImage";
import { DoodleBorder, DoodleScatter } from "./Doodle";

interface HomepageClientProps {
  tapes: ShelfTape[];
}

/* ─── Simple animated cassette icon for the nav ──────────────────────────── */
function NavCassetteIcon() {
  return (
    <svg viewBox="0 0 32 20" width="32" height="20" aria-hidden="true">
      <rect x="0.5" y="0.5" width="31" height="19" rx="2.5"
        fill="#D4882A" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
      <rect x="8" y="2" width="16" height="16" rx="1.5"
        fill="rgba(255,255,255,0.15)" />
      <circle cx="8" cy="10" r="5" fill="#C4503A" fillOpacity="0.6" />
      <circle cx="8" cy="10" r="2.5" fill="#0D0A07" />
      <circle cx="24" cy="10" r="5" fill="#C4503A" fillOpacity="0.6" />
      <circle cx="24" cy="10" r="2.5" fill="#0D0A07" />
      <rect x="12" y="12" width="8" height="5" rx="1"
        fill="rgba(0,0,0,0.25)" />
    </svg>
  );
}

/* ─── Top navigation ──────────────────────────────────────────────────────── */
function TopNav() {
  return (
    <header className="sticky top-0 z-40 w-full">
      <div
        className="w-full"
        style={{
          background: "rgba(251,250,247,0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(217,215,209,0.55)",
        }}
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 h-12 sm:h-14 flex items-center justify-between">
          {/* Logo — responsive */}
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-sm">
            <div className="w-6 sm:w-8">
              <NavCassetteIcon />
            </div>
            <span
              style={{
                fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)",
                fontWeight: 700,
                fontSize: "clamp(14px, 4vw, 17px)",
                letterSpacing: "0.12em",
                color: "#1D1D1F",
              }}
            >
              CASSETTE
            </span>
          </Link>

          {/* Desktop nav links — hidden on mobile */}
          <nav className="hidden sm:flex items-center gap-4 md:gap-6" aria-label="Main navigation">
            <Link href="/shelf"
              className="text-sm font-medium transition-colors"
              style={{ color: "#5F6065", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
            >
              Public Shelf
            </Link>
            <Link href="/"
              className="text-sm font-medium transition-colors"
              style={{ color: "#5F6065", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
            >
              Home
            </Link>
            <Link href="/create"
              className="text-sm font-medium transition-colors"
              style={{ color: "#5F6065", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
            >
              Make a Tape
            </Link>
          </nav>

          {/* Primary CTA — responsive */}
          <Link href="/create" className="btn-primary text-xs sm:text-sm px-3 py-2 sm:px-4 md:px-6 md:py-2.5 rounded-full whitespace-nowrap flex-shrink-0">
            Make
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ─── Hero section — Shelf is the hero ──────────────────────────────────── */
function HeroSection() {
  return (
    <section className="relative w-full py-4 sm:py-8 md:py-12 lg:py-16 overflow-visible">
      <div className="absolute inset-0 hidden lg:block opacity-35">
        <DoodleScatter count={7} minSize={10} maxSize={18} />
      </div>

      {/* Scattered poster images for nostalgic aesthetic — desktop only */}
      <div className="absolute -top-16 -left-16 z-0 opacity-60 hidden sm:block">
        <PosterImage imageNumber={1} width={70} height={100} rotation={-15} />
      </div>
      <div className="absolute -bottom-24 -right-20 z-0 opacity-65 hidden sm:block">
        <PosterImage imageNumber={2} width={80} height={110} rotation={20} />
      </div>
      <div className="absolute top-1/3 right-4 z-0 opacity-70 hidden lg:block">
        <PosterImage imageNumber={3} width={85} height={120} rotation={-8} />
      </div>

      {/* Warm marigold + terracotta radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(232,144,26,0.09) 0%, transparent 55%)," +
            "radial-gradient(ellipse at 20% 100%, rgba(196,80,58,0.07) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
        {/* Warm opening copy — personal, honest — responsive */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-4 sm:mb-6 md:mb-8"
        >
          <p
            className="text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-1.5 sm:mb-3"
            style={{
              color: "#8A7A68",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              letterSpacing: "0.22em",
            }}
          >
            Welcome back to cassette tapes
          </p>
          <h1
            style={{
              fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)",
              fontWeight: 900,
              fontStyle: "italic",
              fontSize: "clamp(24px, 5.5vw, 72px)",
              lineHeight: 1.1,
              letterSpacing: "-0.015em",
              color: "#1C140A",
            }}
          >
            Make someone feel<br />something real.
          </h1>
        </motion.div>

        {/* Two-column CTA layout — "Browse" vs "Create" — responsive */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-4 md:gap-6 mt-3 sm:mt-4"
        >
          {/* Browse shelf CTA */}
          <a
            href="/shelf"
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-3 rounded-full transition-all hover:opacity-90 active:scale-95"
            style={{
              background: "#FFFBF0",
              border: "1.5px solid #E8901A",
              color: "#7A4800",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              fontSize: "clamp(12px, 2vw, 14px)",
              fontWeight: 600,
              letterSpacing: "0.03em",
              textDecoration: "none",
              minHeight: "44px",
              touchAction: "manipulation",
            }}
          >
            <span>📼</span>
            <span>Explore Public Shelf</span>
          </a>

          {/* Create CTA */}
          <Link
            href="/create"
            className="btn-primary flex items-center justify-center py-3 sm:py-3 rounded-full px-6 sm:px-8 text-sm sm:text-base"
            style={{ minHeight: "44px", touchAction: "manipulation" }}
          >
            Make a Tape ❤
          </Link>
        </motion.div>

        {/* Honest tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-3 sm:mt-5 text-center"
          style={{
            fontSize: "clamp(11px, 2.2vw, 13px)",
            color: "#8A7A68",
            fontFamily: "var(--font-inter, Inter, sans-serif)",
            fontStyle: "italic",
          }}
          >
            No account. No algorithm. Just your voice.
          </motion.p>

        <div className="mt-6 flex justify-center">
          <DoodleBorder side="bottom" className="hidden sm:flex" height={18} />
        </div>
      </div>
    </section>
  );
}

/* ─── Discover & Share Section ────────────────────────────────────────── */
function DiscoverShareSection() {
  return (
    <section className="relative w-full py-14 sm:py-20" style={{ background: "#FFFBF0" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p
            className="tracking-widest uppercase mb-3"
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              color: "#8A7A68",
              letterSpacing: "0.22em",
            }}
          >
            Beyond Private
          </p>
          <h2
            style={{
              fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)",
              fontWeight: 900,
              fontStyle: "italic",
              fontSize: "clamp(28px, 5vw, 48px)",
              lineHeight: 1.15,
              color: "#1C140A",
              marginBottom: "16px",
            }}
          >
            Share Your Vibe Publicly
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: "#5A4A3A",
              lineHeight: 1.6,
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Create cassettes for the world. Make them from your favorite YouTube playlists or curate your own. 
            Set them public and they&apos;ll appear on our shared shelf — a place for mood-based music discovery.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Card 1: Create Public */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E8E5DF",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
              style={{ background: "rgba(212, 136, 42, 0.1)", color: "#D4882A", fontSize: "24px" }}
            >
              🎵
            </div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: "#1D1D1F",
                marginBottom: "8px",
                fontFamily: "'Playfair Display', serif",
              }}
            >
              From Playlists
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#5F6065",
                lineHeight: 1.6,
              }}
            >
              Search any YouTube playlist and convert it into a cassette instantly. All songs imported, ready to personalize.
            </p>
          </motion.div>

          {/* Card 2: Discover & Listen */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E8E5DF",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
              style={{ background: "rgba(212, 136, 42, 0.1)", color: "#D4882A", fontSize: "24px" }}
            >
              📼
            </div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: "#1D1D1F",
                marginBottom: "8px",
                fontFamily: "'Playfair Display', serif",
              }}
            >
              Public Shelf
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#5F6065",
                lineHeight: 1.6,
              }}
            >
              Browse cassettes made by the community. Find music by mood, theme, or vibe. Discover new creators and their stories.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 text-center space-y-4"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/create"
              className="btn-primary text-base px-8 py-3 rounded-full"
            >
              Create Public Cassette
            </Link>
            <Link
              href="/shelf"
              className="btn-ghost text-base px-8 py-3 rounded-full"
            >
              Explore Shelf →
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── How it works section ────────────────────────────────────────────────── */
function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Search & pick",
      description: "Find your songs on YouTube. YouTube only — no ads, just music. Or import a whole playlist at once.",
    },
    {
      number: "02",
      title: "Write something real",
      description: "Add a personal note to each song. Why you chose it. What it means. Then decide: share privately or make it public.",
    },
    {
      number: "03",
      title: "Send the tape",
      description: "Share a link privately or publish to the public shelf. Recipients open it like a gift. No app needed. No signup.",
    },
  ];

  return (
    <section className="relative w-full py-14 sm:py-20" style={{ background: "#FFFBF0" }}>
      {/* Scattered poster images */}
      <div className="absolute top-10 left-4 sm:left-8 z-0 opacity-55">
        <PosterImage imageNumber={7} width={80} height={110} rotation={-20} />
      </div>
      <div className="absolute bottom-20 right-4 sm:right-12 z-0 opacity-60 hidden md:block">
        <PosterImage imageNumber={8} width={85} height={120} rotation={15} />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-3 mb-10"
        >
          <div className="flex-1 h-px" style={{ background: "var(--color-hairline)" }} />
          <p
            className="tracking-widest uppercase"
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              color: "#8A7A68",
              letterSpacing: "0.22em",
            }}
          >
            How It Works
          </p>
          <div className="flex-1 h-px" style={{ background: "var(--color-hairline)" }} />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-2.5"
            >
              <span
                style={{
                  fontSize: "12px",
                  fontFamily: "var(--font-inter, Inter, sans-serif)",
                  fontWeight: 700,
                  color: "#E8901A",
                  letterSpacing: "0.18em",
                }}
              >
                {step.number}
              </span>
              <h3
                style={{
                  fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)",
                  fontWeight: 700,
                  fontSize: "20px",
                  color: "#1C140A",
                  lineHeight: 1.2,
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: "15px",
                  color: "#5A4A3A",
                  lineHeight: 1.68,
                  fontFamily: "var(--font-inter, Inter, sans-serif)",
                }}
              >
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA section ───────────────────────────────────────────────────── */
function FinalCtaSection() {
  return (
    <section className="relative w-full py-16 sm:py-28" style={{ background: "var(--color-paper)" }}>
      {/* Scattered poster images */}
      <div className="absolute top-8 left-6 z-0 opacity-50 hidden sm:block">
        <PosterImage imageNumber={9} width={90} height={125} rotation={-10} />
      </div>
      <div className="absolute bottom-12 right-4 z-0 opacity-55">
        <PosterImage imageNumber={10} width={95} height={130} rotation={12} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="tracking-widest uppercase mb-3"
          style={{
            fontSize: "10px",
            fontFamily: "var(--font-inter, Inter, sans-serif)",
            color: "#8A7A68",
            letterSpacing: "0.22em",
          }}
        >
          Ready?
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)",
            fontWeight: 900,
            fontStyle: "italic",
            fontSize: "clamp(28px, 5vw, 56px)",
            lineHeight: 1.15,
            letterSpacing: "-0.015em",
            color: "#1C140A",
            marginBottom: "20px",
          }}
        >
          Your feelings are worth<br />hearing.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8"
        >
          <Link href="/create" className="btn-primary text-base px-10 py-4 inline-flex">
            Start Now ❤
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer
      className="w-full py-6 px-4 sm:px-6 mt-auto text-center"
      style={{
        borderTop: "1px solid var(--color-hairline)",
        background: "#FFFBF0",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <p
          style={{
            fontSize: "12px",
            color: "#8A7A68",
            fontFamily: "var(--font-inter, Inter, sans-serif)",
            fontStyle: "italic",
          }}
        >
          Cassette — Put your feelings on tape.
        </p>
      </div>
    </footer>
  );
}

/* ─── Main exported client page ───────────────────────────────────────────── */
export default function HomepageClient({ tapes }: HomepageClientProps) {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--color-paper)" }}>
      <TopNav />

      <main className="flex-1 flex flex-col">
        <HeroSection />

        {/* ── THE TAPE SHELF (HERO, NOT BELOW FOLD) ────────────────────────── */}
        <section
          id="shelf"
          className="w-full py-10 sm:py-14"
          aria-label="The Tape Shelf"
          style={{ background: "#F5EFE0" }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {/* Section label */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="flex items-center justify-center gap-3 mb-8"
            >
              <div className="flex-1 h-px" style={{ background: "var(--color-hairline)" }} />
              <p
                className="tracking-widest uppercase"
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--font-inter, Inter, sans-serif)",
                  color: "#8A7A68",
                  letterSpacing: "0.22em",
                }}
              >
                The Tape Shelf
              </p>
              <div className="flex-1 h-px" style={{ background: "var(--color-hairline)" }} />
            </motion.div>

            {/* Shelf + empty state */}
            {tapes.length > 0 ? (
              <>
                {/* Mobile doodles — show small doodles on sides of shelf on mobile */}
                <div className="relative">
                  {/* Left doodle — mobile only */}
                  <div className="absolute -left-8 top-8 z-0 opacity-50 sm:hidden block">
                    <PosterImage imageNumber={1} width={50} height={70} rotation={-20} />
                  </div>
                  
                  {/* Right doodle — mobile only */}
                  <div className="absolute -right-8 top-1/2 z-0 opacity-50 sm:hidden block">
                    <PosterImage imageNumber={2} width={55} height={75} rotation={15} />
                  </div>
                  
                  {/* Shelf */}
                  <CassetteShelf tapes={tapes} perRow={6} />
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="py-16 text-center"
              >
                <p
                  style={{
                    color: "#8A7A68",
                    fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)",
                    fontSize: "18px",
                    fontStyle: "italic",
                    marginBottom: "12px",
                  }}
                >
                  No tapes on the shelf yet.
                </p>
                <p
                  style={{
                    color: "#A89A88",
                    fontFamily: "var(--font-inter, Inter, sans-serif)",
                    fontSize: "14px",
                  }}
                >
                  Be the first to make one.
                </p>
              </motion.div>
            )}

            {/* CTA after shelf */}
            {tapes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-10 text-center"
              >
                <Link href="/create" className="btn-ghost">
                  Make yours too →
                </Link>
              </motion.div>
            )}
          </div>
        </section>

        {/* ── SECTION DIVIDER WITH POSTER IMAGES ─────────────────────────── */}
        <div className="relative py-8 sm:py-12 lg:py-16">
          {/* Spacer gradient on mobile */}
          <div className="sm:hidden h-8 bg-gradient-to-b from-white/0 to-white/0 mb-4" aria-hidden="true" />
          
          {/* Mobile-friendly subtitle */}
          <p className="sm:hidden text-center text-xs mb-6" style={{ color: "#8A7A68" }}>
            ✨ More from CASSETTE ✨
          </p>
          
          <div className="flex justify-center gap-4 sm:gap-6 lg:gap-10 flex-wrap px-2 sm:px-0">
            <PosterImage imageNumber={4} width={80} height={110} rotation={-12} opacity={0.95} className="hidden sm:block" />
            <PosterImage imageNumber={5} width={75} height={105} rotation={8} opacity={0.92} className="hidden sm:block" />
            <PosterImage imageNumber={6} width={85} height={115} rotation={-5} opacity={0.95} className="hidden sm:block" />
            
            {/* Mobile compact doodles */}
            <PosterImage imageNumber={4} width={60} height={85} rotation={-12} opacity={0.85} className="sm:hidden" />
            <PosterImage imageNumber={5} width={60} height={85} rotation={8} opacity={0.85} className="sm:hidden" />
          </div>
        </div>

        {/* ── DISCOVER & SHARE SECTION ──────────────────────────────────────── */}
        <DiscoverShareSection />

        {/* ── HOW IT WORKS (Below shelf) ─────────────────────────────────────── */}
        <HowItWorksSection />
        <FinalCtaSection />
      </main>

      <Footer />
    </div>
  );
}
