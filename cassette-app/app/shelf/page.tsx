import { Metadata } from "next";
import { searchPublicTapes, getAvailableStyles, getAvailableRelationships, getPublicTapeCount } from "@/app/lib/shelf-discovery";
import CassetteShelf from "@/app/components/CassetteShelf";
import { BackgroundImage } from "@/app/components/BackgroundImage";
import ShelfClientPage from "./ShelfClientPage";

export const metadata: Metadata = {
  title: "Public Cassettes | CASSETTE",
  description: "Discover public cassettes made by creators. Find mood-based playlists and mixtapes shared by the community.",
  openGraph: {
    title: "Public Cassettes | CASSETTE",
    description: "Discover tapes made by creators around the world. Digital mixtapes filled with emotion.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function ShelfPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; style?: string; relationship?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const style = params.style || "";
  const relationship = params.relationship || "";
  const sortBy = (params.sort || "recent") as "recent" | "popular" | "trending";

  const [publicTapes, availableStyles, availableRelationships, tapeCount] = await Promise.all([
    searchPublicTapes({
      search,
      style: style || undefined,
      relationship: relationship || undefined,
      sortBy,
      limit: 50,
    }),
    getAvailableStyles(),
    getAvailableRelationships(),
    getPublicTapeCount(),
  ]);

  // Use a stable hash for server-rendered page to avoid hydration mismatches
  const stableImageNumber = (search + style + relationship).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 13 + 1;

  return (
    <div style={{ background: "#FBFAF7", minHeight: "100vh" }} className="relative overflow-x-hidden pb-20">
      {/* Background decorative image */}
      <BackgroundImage
        imageNumber={stableImageNumber}
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
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/create"
              className="inline-block px-6 py-3 rounded-full font-semibold text-sm transition-all hover:opacity-85"
              style={{
                background: "#D4882A",
                color: "#FBFAF7",
                textDecoration: "none",
              }}>
              Create Your Own →
            </a>
            <span className="text-xs px-4 py-3 rounded-full" style={{ color: "#8E8E93", background: "#F3EFE7" }}>
              {tapeCount} tapes discovered
            </span>
          </div>
        </div>

        {/* Client-side search/filter */}
        <ShelfClientPage
          initialTapes={publicTapes}
          availableStyles={availableStyles}
          availableRelationships={availableRelationships}
          initialSearch={search}
          initialStyle={style}
          initialRelationship={relationship}
          initialSort={sortBy}
        />
      </div>
      {/* Close content wrapper */}
      </div>
    </div>
  );
}
