"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function DeveloperTapeClient() {
  const [activeTrack, setActiveTrack] = useState("Intro");
  const [counterText, setCounterText] = useState("00:00");
  const reelLeftRef = useRef<HTMLDivElement>(null);
  const reelRightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animFrameId: number;
    let spin = 0;

    const handleScroll = () => {
      spin += 2.4;
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || window.scrollY;
      const scrollHeight = doc.scrollHeight - doc.clientHeight || 1;
      const scrollPct = Math.min(Math.max(scrollTop / scrollHeight, 0), 1);

      // Left reel unwinds (shrinks), right reel winds up (grows)
      const leftScale = 1 - scrollPct * 0.55;
      const rightScale = 0.55 + scrollPct * 0.55;

      if (reelLeftRef.current) {
        reelLeftRef.current.style.transform = `scale(${leftScale}) rotate(${spin}deg)`;
      }
      if (reelRightRef.current) {
        reelRightRef.current.style.transform = `scale(${rightScale}) rotate(${-spin}deg)`;
      }

      // Elapsed time counter (total 4:32 -> 272 seconds)
      const totalSeconds = 272;
      const elapsed = Math.floor(scrollPct * totalSeconds);
      const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const ss = String(elapsed % 60).padStart(2, "0");
      setCounterText(`${mm}:${ss}`);
    };

    const animateLoop = () => {
      handleScroll();
      animFrameId = requestAnimationFrame(animateLoop);
    };

    animFrameId = requestAnimationFrame(animateLoop);

    // Section Intersection Observer
    const sections = document.querySelectorAll("[data-track]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const trackName = entry.target.getAttribute("data-track");
            if (trackName) setActiveTrack(trackName);
          }
        });
      },
      { threshold: 0.3 }
    );

    sections.forEach((sec) => observer.observe(sec));

    return () => {
      cancelAnimationFrame(animFrameId);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className="min-h-screen text-[#241D16] font-sans relative selection:bg-[#C6923F] selection:text-white"
      style={{ background: "#EEE3D0", color: "#241D16" }}
    >
      {/* Preload Google Fonts for pixel-perfect typography */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Archivo+Narrow:ital,wght@0,500;0,600;0,700;1,600&family=Caveat:wght@500;600;700&family=Work+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Film grain noise overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-4 mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Cassette Widget Dock — Desktop top-right / Mobile fixed bottom */}
      <div className="fixed top-6 right-6 sm:top-9 sm:right-9 w-[220px] sm:w-[240px] z-50 perspective-[900px]">
        <div
          className="w-full aspect-[5/3.2] rounded-md relative shadow-2xl transition-transform duration-300 hover:rotate-0 border border-black/40"
          style={{
            background: "linear-gradient(160deg, #494039, #2A2521 60%)",
            transform: "rotateX(16deg) rotateZ(-4deg)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Cassette window */}
          <div className="absolute top-[16%] left-[10%] right-[10%] bottom-[38%] bg-black/40 rounded flex items-center justify-between px-[10%] overflow-hidden border border-white/10">
            <div
              ref={reelLeftRef}
              className="w-[34%] aspect-square rounded-full relative shadow-inner"
              style={{
                background: `radial-gradient(circle at 50% 50%, #CFC6BA 0 14%, #C6923F 15% 20%, transparent 21%), repeating-conic-gradient(#EEE3D0 0 20deg, transparent 20deg 40deg)`,
              }}
            >
              <div className="absolute inset-[38%] rounded-full bg-[#2A2521]" />
            </div>
            <div
              ref={reelRightRef}
              className="w-[34%] aspect-square rounded-full relative shadow-inner"
              style={{
                background: `radial-gradient(circle at 50% 50%, #CFC6BA 0 14%, #C6923F 15% 20%, transparent 21%), repeating-conic-gradient(#EEE3D0 0 20deg, transparent 20deg 40deg)`,
              }}
            >
              <div className="absolute inset-[38%] rounded-full bg-[#2A2521]" />
            </div>
          </div>

          {/* Cassette label */}
          <div className="absolute left-[8%] right-[8%] bottom-[10%] bg-[#EEE3D0] px-2 py-1.5 rounded-[2px] text-center shadow-md border border-[#D5C19C]">
            <div
              className="text-[9px] font-mono tracking-[0.14em] uppercase font-bold text-[#A73C2E]"
              style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
            >
              NOW PLAYING
            </div>
            <div
              className="font-bold text-base text-[#241D16] truncate leading-tight mt-0.5"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              {activeTrack}
            </div>
            <div
              className="text-[10px] font-mono text-[#55493A] tracking-wider mt-0.5 font-bold"
              style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
            >
              {counterText}
            </div>
          </div>
        </div>
      </div>

      {/* Main Page Content */}
      <div className="max-w-[760px] mx-auto px-6 sm:px-8 pb-40 relative z-10">

        {/* Top Header Navigation */}
        <header className="pt-8 sm:pt-10 flex items-center justify-between border-b border-[#241D16]/20 pb-4">
          <Link
            href="/"
            className="text-xs font-bold tracking-[0.16em] text-[#A73c2E] hover:opacity-75 transition-opacity uppercase"
            style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
          >
            ← CASSETTE HOME
          </Link>
          <span
            className="text-xs font-bold tracking-[0.14em] text-[#55493A] uppercase"
            style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
          >
            AKSHAT THAKUR // DEV TAPE
          </span>
        </header>

        {/* ── HERO SECTION ── */}
        <section
          data-track="Intro"
          className="min-h-[85vh] flex flex-col justify-center border-b border-[#241D16]/20 pt-10 pb-16"
          style={{ background: "#EEE3D0" }}
        >
          <p
            className="text-xs font-bold tracking-[0.16em] uppercase text-[#A73C2E] mb-4"
            style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
          >
            Side A — Track 1
          </p>

          <h1
            className="text-6xl sm:text-8xl font-bold leading-[0.95] text-[#241D16]"
            style={{ fontFamily: "'Caveat', cursive" }}
          >
            Hi, I&apos;m Akshat.
            <span className="block text-[#A73C2E] mt-1">This is my tape.</span>
          </h1>

          <p className="max-w-md mt-7 text-[#55493A] text-lg sm:text-xl leading-relaxed font-medium">
            Developer, engineer, and someone who still thinks a playlist is a poor substitute for a mixtape. Scroll down — the reels are keeping time.
          </p>

          <div
            className="mt-14 text-xs font-bold tracking-[0.14em] uppercase text-[#55493A] flex items-center gap-3"
            style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
          >
            <span>keep scrolling</span>
            <div className="w-8 h-px bg-[#55493A] animate-pulse" />
          </div>
        </section>

        {/* ── TRACKLIST (ABOUT) ── */}
        <section
          data-track="About"
          className="py-20 border-b border-[#241D16]/20"
          style={{ background: "#EEE3D0" }}
        >
          <div className="flex items-baseline gap-3.5 mb-10">
            <span
              className="font-bold text-xs tracking-[0.08em] bg-[#2A2521] text-[#EEE3D0] px-2.5 py-1 uppercase rounded-xs"
              style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
            >
              Side A
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#241D16]" style={{ fontFamily: "'Caveat', cursive" }}>
              About
            </h2>
          </div>

          <div className="space-y-0">
            {/* A1 */}
            <div className="grid grid-cols-[44px_1fr_auto] gap-4 items-start py-6 border-t border-[#241D16]/20">
              <div
                className="font-bold text-lg text-[#A73C2E]"
                style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
              >
                A1
              </div>
              <div>
                <h3
                  className="font-semibold text-lg text-[#241D16] mb-1 tracking-[0.02em]"
                  style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
                >
                  Who&apos;s playing
                </h3>
                <p className="text-[#55493A] text-base leading-relaxed font-normal">
                  Akshat Thakur — Full-stack developer passionate about crafting nostalgic, tactile web software, custom interactive audio players, and high-performance web applications.
                </p>
              </div>
              <div
                className="text-xs text-[#55493A] font-bold"
                style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
              >
                now
              </div>
            </div>

            {/* A2 */}
            <div className="grid grid-cols-[44px_1fr_auto] gap-4 items-start py-6 border-t border-[#241D16]/20">
              <div
                className="font-bold text-lg text-[#A73C2E]"
                style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
              >
                A2
              </div>
              <div>
                <h3
                  className="font-semibold text-lg text-[#241D16] mb-1 tracking-[0.02em]"
                  style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
                >
                  What I&apos;m building
                </h3>
                <p className="text-[#55493A] text-base leading-relaxed font-normal">
                  Full-stack software developer — Next.js, React, Prisma, PostgreSQL. Currently building <strong>Cassette</strong> (digital mixtape platform), <strong>MailMyCertificate</strong> (<a href="https://mailmycertificate.tech" target="_blank" rel="noopener noreferrer" className="underline text-[#A73C2E] font-semibold">mailmycertificate.tech</a> — automated certificate engine), <strong>Priya Sarvutthan</strong> (<a href="https://priyasarvutthan.org" target="_blank" rel="noopener noreferrer" className="underline text-[#A73C2E] font-semibold">priyasarvutthan.org</a> — community social portal), and <strong>SafeExam</strong> (<a href="https://safexam.in" target="_blank" rel="noopener noreferrer" className="underline text-[#A73C2E] font-semibold">safexam.in</a> — secure online exam platform).
                </p>
              </div>
              <div
                className="text-xs text-[#55493A] font-bold"
                style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
              >
                2026—
              </div>
            </div>

            {/* A3 */}
            <div className="grid grid-cols-[44px_1fr_auto] gap-4 items-start py-6 border-t border-b border-[#241D16]/20">
              <div
                className="font-bold text-lg text-[#A73C2E]"
                style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
              >
                A3
              </div>
              <div>
                <h3
                  className="font-semibold text-lg text-[#241D16] mb-1 tracking-[0.02em]"
                  style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
                >
                  Outside the editor
                </h3>
                <p className="text-[#55493A] text-base leading-relaxed font-normal">
                  Building open-source tools, designing retro visual interfaces, and curating timeless music playlists.
                </p>
              </div>
              <div
                className="text-xs text-[#55493A] font-bold"
                style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
              >
                —
              </div>
            </div>
          </div>
        </section>

        {/* ── LINER NOTE (WHY I BUILT THIS) ── */}
        <section
          data-track="Why"
          className="py-20 border-b border-[#241D16]/20"
          style={{ background: "#EEE3D0" }}
        >
          <div className="flex items-baseline gap-3.5 mb-10">
            <span
              className="font-bold text-xs tracking-[0.08em] bg-[#2A2521] text-[#EEE3D0] px-2.5 py-1 uppercase rounded-xs"
              style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
            >
              Side B
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#241D16]" style={{ fontFamily: "'Caveat', cursive" }}>
              Why I built this
            </h2>
          </div>

          <div
            className="bg-[#E1D1B3] border border-[#241D16]/20 p-8 sm:p-11 relative -rotate-1 shadow-2xl rounded-xs"
          >
            {/* Tape strip overlay */}
            <div className="absolute -top-3 left-9 w-20 h-6 bg-[#C6923F]/55 -rotate-3 shadow-xs" />

            <p className="text-2xl sm:text-3xl leading-[1.5] text-[#241D16] mb-6 font-semibold" style={{ fontFamily: "'Caveat', cursive" }}>
              I used to make mixtapes by hand. Picking the songs wasn&apos;t the hard part — deciding the order was, and what to write on the case, and whether it needed a second side. That process was the gift. Streaming didn&apos;t kill it, it just stopped making room for it. Cassette is my attempt to bring the object back, even though the tape itself is digital.
            </p>
            <div className="text-right text-2xl font-bold text-[#A73C2E]" style={{ fontFamily: "'Caveat', cursive" }}>
              — Akshat
            </div>
          </div>
        </section>

        {/* ── B-SIDES (PROJECTS GRID) ── */}
        <section
          data-track="B-Sides"
          className="py-20 border-b border-[#241D16]/20"
          style={{ background: "#EEE3D0" }}
        >
          <div className="flex items-baseline gap-3.5 mb-10">
            <span
              className="font-bold text-xs tracking-[0.08em] bg-[#2A2521] text-[#EEE3D0] px-2.5 py-1 uppercase rounded-xs"
              style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
            >
              B-Sides
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#241D16]" style={{ fontFamily: "'Caveat', cursive" }}>
              Other tapes I&apos;ve made
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Spine 1 */}
            <a
              href="https://cassette-share.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#2A2521] text-[#EEE3D0] p-6 min-h-[190px] flex flex-col justify-between relative shadow-xl rounded-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl text-left block no-underline group"
              style={{ background: "#2A2521", color: "#EEE3D0" }}
            >
              <div className="w-4 h-4 rounded-full bg-[#EEE3D0]/15 absolute top-4 right-4" />
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-[0.16em] text-[#C6923F]"
                  style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
                >
                  Flagship App
                </p>
                <h3
                  className="text-xl font-bold mt-1.5 text-[#EEE3D0] group-hover:text-[#C6923F] transition-colors"
                  style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
                >
                  Cassette
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#CFC6BA] leading-relaxed font-normal mt-3">
                Interactive digital mixtape platform with 3D spools, voice notes, and YouTube API sync.
              </p>
            </a>

            {/* Spine 2 */}
            <a
              href="https://mailmycertificate.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#2A2521] text-[#EEE3D0] p-6 min-h-[190px] flex flex-col justify-between relative shadow-xl rounded-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl text-left block no-underline group"
              style={{ background: "#2A2521", color: "#EEE3D0" }}
            >
              <div className="w-4 h-4 rounded-full bg-[#EEE3D0]/15 absolute top-4 right-4" />
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-[0.16em] text-[#C6923F]"
                  style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
                >
                  SaaS Platform
                </p>
                <h3
                  className="text-xl font-bold mt-1.5 text-[#EEE3D0] group-hover:text-[#C6923F] transition-colors"
                  style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
                >
                  MailMyCertificate
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#CFC6BA] leading-relaxed font-normal mt-3">
                Automated certificate generation & bulk email delivery system built for institutions.
              </p>
            </a>

            {/* Spine 3 */}
            <a
              href="https://priyasarvutthan.org"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#2A2521] text-[#EEE3D0] p-6 min-h-[190px] flex flex-col justify-between relative shadow-xl rounded-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl text-left block no-underline group"
              style={{ background: "#2A2521", color: "#EEE3D0" }}
            >
              <div className="w-4 h-4 rounded-full bg-[#EEE3D0]/15 absolute top-4 right-4" />
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-[0.16em] text-[#C6923F]"
                  style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
                >
                  NGO Portal
                </p>
                <h3
                  className="text-xl font-bold mt-1.5 text-[#EEE3D0] group-hover:text-[#C6923F] transition-colors"
                  style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
                >
                  Priya Sarvutthan
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#CFC6BA] leading-relaxed font-normal mt-3">
                Official web platform for Priya Sarvutthan NGO empowering community welfare.
              </p>
            </a>

            {/* Spine 4 — SafeExam (NEW) */}
            <a
              href="https://safexam.in"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#2A2521] text-[#EEE3D0] p-6 min-h-[190px] flex flex-col justify-between relative shadow-xl rounded-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl text-left block no-underline group"
              style={{ background: "#2A2521", color: "#EEE3D0" }}
            >
              <div className="w-4 h-4 rounded-full bg-[#EEE3D0]/15 absolute top-4 right-4" />
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-[0.16em] text-[#C6923F]"
                  style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
                >
                  Exam Platform
                </p>
                <h3
                  className="text-xl font-bold mt-1.5 text-[#EEE3D0] group-hover:text-[#C6923F] transition-colors"
                  style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
                >
                  SafeExam
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#CFC6BA] leading-relaxed font-normal mt-3">
                Secure online exam platform built for reliable, tamper-resistant test delivery.
              </p>
            </a>

            {/* Spine 5 */}
            <a
              href="https://github.com/akshatthakur22"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#2A2521] text-[#EEE3D0] p-6 min-h-[190px] flex flex-col justify-between relative shadow-xl rounded-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl text-left block no-underline group"
              style={{ background: "#2A2521", color: "#EEE3D0" }}
            >
              <div className="w-4 h-4 rounded-full bg-[#EEE3D0]/15 absolute top-4 right-4" />
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-[0.16em] text-[#C6923F]"
                  style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
                >
                  Open Source
                </p>
                <h3
                  className="text-xl font-bold mt-1.5 text-[#EEE3D0] group-hover:text-[#C6923F] transition-colors"
                  style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
                >
                  GitHub Projects
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#CFC6BA] leading-relaxed font-normal mt-3">
                Explore open-source utilities, experimental micro-apps, and full-stack repositories.
              </p>
            </a>
          </div>
        </section>

        {/* ── CREDITS (CONTACT) ── */}
        <section data-track="Credits" className="pt-20">
          <div
            className="bg-[#2A2521] text-[#EEE3D0] p-8 sm:p-12 shadow-2xl rounded-sm"
            style={{ background: "#2A2521", color: "#EEE3D0" }}
          >
            <p
              className="text-xs font-bold uppercase tracking-[0.16em] text-[#C6923F]"
              style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
            >
              End of side B
            </p>

            <h2
              className="text-4xl sm:text-5xl font-bold mt-2 mb-8 text-[#EEE3D0]"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              Credits
            </h2>

            <div className="space-y-0 font-sans">
              <div
                className="flex items-center justify-between py-4 border-t border-[#EEE3D0]/15 text-sm"
                style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
              >
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#A89A86]">
                  GitHub
                </span>
                <a
                  href="https://github.com/akshatthakur22"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#EEE3D0] hover:text-[#C6923F] transition-colors font-semibold no-underline"
                >
                  github.com/akshatthakur22
                </a>
              </div>

              <div
                className="flex items-center justify-between py-4 border-t border-[#EEE3D0]/15 text-sm"
                style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
              >
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#A89A86]">
                  Priya Sarvutthan
                </span>
                <a
                  href="https://priyasarvutthan.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#EEE3D0] hover:text-[#C6923F] transition-colors font-semibold no-underline"
                >
                  priyasarvutthan.org/developer
                </a>
              </div>

              <div
                className="flex items-center justify-between py-4 border-t border-[#EEE3D0]/15 text-sm"
                style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
              >
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#A89A86]">
                  MailMyCertificate
                </span>
                <a
                  href="https://mailmycertificate.tech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#EEE3D0] hover:text-[#C6923F] transition-colors font-semibold no-underline"
                >
                  mailmycertificate.tech/about
                </a>
              </div>

              <div
                className="flex items-center justify-between py-4 border-t border-[#EEE3D0]/15 text-sm"
                style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
              >
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#A89A86]">
                  SafeExam
                </span>
                <a
                  href="https://safexam.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#EEE3D0] hover:text-[#C6923F] transition-colors font-semibold no-underline"
                >
                  safexam.in
                </a>
              </div>

              <div
                className="flex items-center justify-between py-4 border-t border-b border-[#EEE3D0]/15 text-sm"
                style={{ fontFamily: "'Archivo Narrow', sans-serif" }}
              >
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#A89A86]">
                  Cassette URL
                </span>
                <a
                  href="https://cassette-share.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#EEE3D0] hover:text-[#C6923F] transition-colors font-semibold no-underline"
                >
                  cassette-share.vercel.app
                </a>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}