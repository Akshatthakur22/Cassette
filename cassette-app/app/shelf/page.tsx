import { Metadata } from "next";
import { getPublicTapes } from "@/app/actions/tape";
import CassetteShelf from "@/app/components/CassetteShelf";
import { BackgroundImage } from "@/app/components/BackgroundImage";

export const metadata: Metadata = {
  title: "Public Cassettes | CASSETTE",
  description: "Discover public cassettes made by creators. Find mood-based playlists and mixtapes shared by the community.",
};

export default async function ShelfPage() {
  const publicTapes = await getPublicTapes(50);

  return (
    <div style={{ background: "#FBFAF7", minHeight: "100vh" }} className="relative overflow-hidden">
      {/* Background decorative image */}
      <BackgroundImage
        imageNumber={Math.floor(Math.random() * 13) + 1}
        opacity={0.2}
        position="top-right"
      />

      {/* Semi-transparent overlay for text readability */}
      <div
        className="absolute inset-0 z-5 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(251,250,247,0.85) 0%, rgba(251,250,247,0.7) 50%, rgba(251,250,247,0.85) 100%)",
        }}
      />

      {/* Content wrapper */}
      <div className="relative z-10">
      
      {/* Header */}
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
        <h1 className="text-sm font-semibold"
          style={{ color: "#1D1D1F", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
          Public Shelf
        </h1>
        <div className="w-12" />
      </div>

      {/* Content */}
      <div className="flex flex-col items-center px-4 py-10 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12 max-w-2xl">
          <h2 className="text-4xl font-bold mb-3 italic"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#1D1D1F" }}>
            Discover Cassettes
          </h2>
          <p className="text-base mb-6" style={{ color: "#5F6065", lineHeight: "1.6" }}>
            Browse mood-based playlists and mixtapes created by our community.
            Find the perfect vibe for any moment.
          </p>
          <a href="/create"
            className="inline-block px-6 py-3 rounded-full font-semibold text-sm transition-all hover:opacity-85"
            style={{
              background: "#D4882A",
              color: "#FBFAF7",
              textDecoration: "none",
            }}>
            Create Your Own →
          </a>
        </div>

        {/* Shelf */}
        {publicTapes && publicTapes.length > 0 ? (
          <CassetteShelf tapes={publicTapes as any} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg mb-4" style={{ color: "#8E8E93", fontStyle: "italic" }}>
              No public cassettes yet.
            </p>
            <p className="text-sm mb-6" style={{ color: "#AAAAAA" }}>
              Be the first to create one and share your vibe with the community.
            </p>
            <a href="/create"
              className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-85"
              style={{
                background: "#F3EFE7",
                color: "#D4882A",
                textDecoration: "none",
                border: "1px solid #E8E5DF",
              }}>
              + Start Creating
            </a>
          </div>
        )}
      </div>
      {/* Close content wrapper */}
      </div>
    </div>
  );
}
