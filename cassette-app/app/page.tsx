import Link from "next/link";
import { getPublicTapes } from "./actions/tape";
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

export const revalidate = 60; // revalidate shelf every minute

export default async function LandingPage() {
  // Fetch real public tapes — fall back to demo set if none exist
  let shelfTapes = await getPublicTapes(18).catch(() => []);

  const tapesForShelf = shelfTapes.length >= 3
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

  return <HomepageClient tapes={tapesForShelf} />;
}
