import type { Metadata } from "next";
import CreateStartClient from "./CreateStartClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create Digital Mixtape Online — 3D Retro Tape Maker | CASSETTE",
  description: "Curate songs from YouTube, record custom voice messages, write handwritten liner notes, and share an interactive 3D mixtape gift link.",
  alternates: {
    canonical: "https://cassette-share.vercel.app/create",
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Create Digital Mixtape Online — CASSETTE",
    description: "Make a nostalgic 3D digital mixtape with YouTube tracks and voice notes.",
    url: "https://cassette-share.vercel.app/create",
    type: "website",
    images: [{ url: "/api/og-image?title=Create%20a%20Tape&sender=You&recipient=Someone&style=classic", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Digital Mixtape Online — CASSETTE",
    description: "Make a nostalgic 3D digital mixtape with YouTube tracks and voice notes.",
    images: ["/api/og-image?title=Create%20a%20Tape&sender=You&recipient=Someone&style=classic"],
  },
  keywords: [
    "digital mixtape creator",
    "online tape maker",
    "custom playlist gift",
    "record voice note playlist",
    "nostalgic mixtape online",
  ],
};

export default function CreatePage() {
  return <CreateStartClient />;
}
