import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy & Data Security Compliance — CASSETTE",
  description: "Learn how Cassette handles user privacy, data security, personal voice recordings, and YouTube API Services compliance in accordance with Google Privacy Policy.",
  alternates: {
    canonical: "https://cassette-share.vercel.app/privacy",
  },
  openGraph: {
    title: "Privacy Policy — CASSETTE",
    description: "Cassette data privacy policy and YouTube API compliance standards.",
    url: "https://cassette-share.vercel.app/privacy",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy — CASSETTE",
    description: "Cassette data privacy policy and YouTube API compliance standards.",
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen py-12 px-6 max-w-3xl mx-auto" style={{ background: "#FBFAF7", color: "#1D1D1F" }}>
      <div className="mb-8">
        <a href="/" className="text-xs font-mono tracking-widest text-[#8E8E93] hover:opacity-70 transition-opacity">
          ← BACK TO CASSETTE
        </a>
        <h1 className="text-3xl sm:text-4xl font-bold italic mt-4 font-serif">Privacy Policy</h1>
        <p className="text-xs font-mono text-[#8E8E93] mt-1">Last Updated: August 2026</p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-[#3D3A36]">
        <section>
          <h2 className="text-lg font-bold text-[#1D1D1F] font-serif mb-2">1. Overview</h2>
          <p>
            Cassette (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) provides an interactive digital mixtape creation and sharing platform. We respect your privacy and are committed to protecting the information you share with us.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#1D1D1F] font-serif mb-2">2. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>User-Provided Content:</strong> Names, tape titles, dedication letters, personal notes, and voice recordings you record directly on our platform.</li>
            <li><strong>YouTube Integration Data:</strong> Track titles, video IDs, and channel names fetched via the YouTube Data API.</li>
            <li><strong>Analytics & Technical Data:</strong> Session metrics, share counts, and browser analytics logged to optimize user experience.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#1D1D1F] font-serif mb-2">3. Use of YouTube API Services</h2>
          <p>
            Cassette uses YouTube API Services to allow users to search for music and play audio tracks. By using Cassette, you agree to be bound by the{" "}
            <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-[#D4882A] underline font-semibold">
              YouTube Terms of Service
            </a>{" "}
            and the{" "}
            <a href="http://www.google.com/policies/privacy" target="_blank" rel="noopener noreferrer" className="text-[#D4882A] underline font-semibold">
              Google Privacy Policy
            </a>.
          </p>
          <p className="mt-2">
            We do not store Google user account credentials or personal YouTube account data. Audio playback uses YouTube&rsquo;s official IFrame Player API with visible video containers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#1D1D1F] font-serif mb-2">4. Data Storage & Security</h2>
          <p>
            Tapes are stored in encrypted databases. Unlisted tapes are accessible only to individuals possessing the unique private link. We do not sell or monetize personal user data to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#1D1D1F] font-serif mb-2">5. Contact & Data Deletion</h2>
          <p>
            If you wish to request deletion of your tape or voice recording, you can manage or delete your mixtape using your private creator link (`/manage/[draftToken]`) or contact support at <a href="mailto:support@cassette.fm" className="text-[#D4882A] underline">support@cassette.fm</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
