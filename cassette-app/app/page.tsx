import { getPublicTapes } from "./actions/tape";
import { ImagePreloader } from "@/app/components/ImagePreloader";
import HomepageClient from "./components/HomepageClient";

// Shelf demo tapes — shown when no public tapes exist yet
const DEMO_TAPES = [
  { publicId: "demo-1", title: "Late Night Drive", senderName: "Arjun", recipientName: "Riya", style: "road_trip" as const, rotationDeg: -2, yOffset: 2 },
  { publicId: "demo-2", title: "Summer '23", senderName: "Maya", recipientName: "Priya", style: "sky" as const, rotationDeg: 1.5, yOffset: 0 },
  { publicId: "demo-3", title: "For You Always", senderName: "Dev", recipientName: "Sia", style: "cherry" as const, rotationDeg: -1, yOffset: 4 },
  { publicId: "demo-4", title: "Monsoon Feelings", senderName: "Nila", recipientName: "Rohan", style: "pool" as const, rotationDeg: 2.5, yOffset: 1 },
  { publicId: "demo-5", title: "Birthday Vol.1", senderName: "Adi", recipientName: "Mia", style: "butter" as const, rotationDeg: -3, yOffset: 3 },
  { publicId: "demo-6", title: "Miss You Already", senderName: "Zara", recipientName: "Kai", style: "lavender" as const, rotationDeg: 1, yOffset: 0 },
  { publicId: "demo-7", title: "Road Trip Mix", senderName: "Sam", recipientName: "Jay", style: "mint" as const, rotationDeg: -1.5, yOffset: 5 },
  { publicId: "demo-8", title: "Slow Mornings", senderName: "Tara", recipientName: "Nia", style: "cream" as const, rotationDeg: 2, yOffset: 2 },
  { publicId: "demo-9", title: "Hostel Nights", senderName: "Veer", recipientName: "Anu", style: "peach" as const, rotationDeg: -2, yOffset: 1 },
];

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CASSETTE — Make & Send Interactive Digital Mixtapes Online",
  description: "Create a nostalgic digital mixtape for someone special. Add YouTube songs, record personal voice notes, write handwritten liner notes, and send an interactive 3D cassette link.",
  alternates: {
    canonical: "https://cassette-share.vercel.app",
  },
  openGraph: {
    title: "CASSETTE — Put your feelings on tape ❤️",
    description: "A no-signup digital mixtape maker. Pick songs, record voice notes, write handwritten liner notes, send a link.",
    url: "https://cassette-share.vercel.app",
    type: "website",
    images: [{ url: "/api/og-image?title=CASSETTE&sender=Someone&recipient=You&style=classic", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CASSETTE — Digital Mixtape Maker",
    description: "Send an interactive retro 3D mixtape link to someone special.",
    images: ["/api/og-image?title=CASSETTE&sender=Someone&recipient=You&style=classic"],
  },
  keywords: [
    "digital mixtape maker",
    "make a playlist for someone",
    "y2k playlist website",
    "send a mixtape online",
    "nostalgic gift idea",
    "retro cassette player online",
    "virtual tape recorder",
    "music gift for best friend",
    "anniversary playlist gift",
  ],
};

export const revalidate = 60; // revalidate shelf every minute

export default async function LandingPage() {
  // Fetch real public tapes — require at least 1 to show real shelf
  let shelfTapes = await getPublicTapes(18).catch(() => []);

  const tapesForShelf = shelfTapes.length >= 1
    ? shelfTapes.map((t, i) => ({
        publicId: t.publicId,
        title: t.title ?? "Untitled",
        senderName: t.senderName,
        recipientName: t.recipientName,
        style: (t.style ?? "cream") as any,
        rotationDeg: ((i % 5) - 2) * 1.6,
        yOffset: (i % 3) * 4,
      }))
    : DEMO_TAPES;

  const preloadImages = [1, 2, 3, 4, 5, 6].map((num) => ({
    src: `/images/optimized/${num}.png`,
    format: "png" as const,
  }));

  return (
    <>
      <ImagePreloader images={preloadImages} />
      <HomepageClient tapes={tapesForShelf} />
    </>
  );
}
