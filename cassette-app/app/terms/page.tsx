import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service & Community Guidelines — CASSETTE",
  description: "Read the Terms of Service, user content guidelines, moderation policies, and third-party API terms for creating and sharing digital mixtapes on Cassette.",
  alternates: {
    canonical: "https://cassette-share.vercel.app/terms",
  },
  openGraph: {
    title: "Terms of Service — CASSETTE",
    description: "Cassette Terms of Service, community rules, and moderation policy.",
    url: "https://cassette-share.vercel.app/terms",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Terms of Service — CASSETTE",
    description: "Cassette Terms of Service, community rules, and moderation policy.",
  },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen py-12 px-6 max-w-3xl mx-auto" style={{ background: "#FBFAF7", color: "#1D1D1F" }}>
      <div className="mb-8">
        <a href="/" className="text-xs font-mono tracking-widest text-[#8E8E93] hover:opacity-70 transition-opacity">
          ← BACK TO CASSETTE
        </a>
        <h1 className="text-3xl sm:text-4xl font-bold italic mt-4 font-serif">Terms of Service</h1>
        <p className="text-xs font-mono text-[#8E8E93] mt-1">Last Updated: August 2026</p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-[#3D3A36]">
        <section>
          <h2 className="text-lg font-bold text-[#1D1D1F] font-serif mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Cassette, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#1D1D1F] font-serif mb-2">2. User Conduct & Content Guidelines</h2>
          <p>
            You agree not to create or share mixtapes containing harassment, hate speech, explicit illegal content, copyright infringement, or spam. Cassette reserves the right to remove any mixtape flagged by users or automated moderation filters.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#1D1D1F] font-serif mb-2">3. Intellectual Property & Third-Party APIs</h2>
          <p>
            All media tracks are streamed from third-party services including YouTube via official APIs. Cassette does not claim ownership of third-party music tracks. Users retain rights to their personal handwritten notes and original voice recordings.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#1D1D1F] font-serif mb-2">4. Moderation & Abuse Reporting</h2>
          <p>
            Public and unlisted tapes can be reported via the built-in &ldquo;Report Content&rdquo; button. Tapes receiving multiple reports are automatically flagged for review and subject to removal.
          </p>
        </section>
      </div>
    </main>
  );
}
