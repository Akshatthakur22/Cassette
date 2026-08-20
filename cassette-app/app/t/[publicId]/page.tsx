import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTapeByPublicId } from "@/app/actions/tape";
import { ImagePreloader } from "@/app/components/ImagePreloader";
import TapeViewClient from "@/app/components/TapeViewClient";
import { getStableImageNumber } from "@/app/lib/accessibility";

// Opt out of static optimization for this dynamic route
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Don't cache

interface Props {
  params: Promise<{ publicId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { publicId } = await params;
    const tape = await getTapeByPublicId(publicId);

    if (!tape) {
      return { title: "Tape not found — CASSETTE" };
    }

    const title = `A tape was made for you ❤️`;
    const description = tape.senderName
      ? `A digital mixtape from ${tape.senderName}.`
      : "Open your tape on CASSETTE.";

    const domain = process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
    const ogImage = new URL(`/api/og-image`, domain);
    ogImage.searchParams.set("title", tape.title ?? title);
    ogImage.searchParams.set("recipient", tape.recipientName ?? "You");
    ogImage.searchParams.set("sender", tape.senderName);
    ogImage.searchParams.set("style", tape.style);

    // Enable indexing for public tapes only
    const isPublic = tape.visibility === "public";

    return {
      title,
      description,
      alternates: isPublic ? { canonical: `${domain}/t/${publicId}` } : undefined,
      robots: { 
        index: isPublic, 
        follow: isPublic,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
      openGraph: {
        title,
        description,
        type: "website",
        images: [
          {
            url: ogImage.toString(),
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage.toString()],
      },
      keywords: isPublic ? [
        "digital mixtape",
        "cassette",
        tape.senderName,
        tape.recipientName || "mixtape",
        tape.title || "tape",
        "music",
        "playlist",
        "emotional",
      ] : undefined,
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return { title: "CASSETTE — Digital mixtapes" };
  }
}

export default async function TapePage({ params }: Props) {
  try {
    const { publicId } = await params;
    console.log(`[TapePage] Starting render for publicId: ${publicId}`);
    
    const tape = await getTapeByPublicId(publicId);

    if (!tape) {
      console.log(`[TapePage] No tape found for publicId: ${publicId}`);
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center gap-4"
          style={{ background: "#060408", color: "#6B5E4E" }}
        >
          <p
            className="text-3xl font-bold italic"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#F5F0E8" }}
          >
            This tape no longer exists.
          </p>
          <p className="text-sm" style={{ fontFamily: "monospace" }}>
            It may have been deleted by the creator or the link is incorrect.
          </p>
          <a
            href="/"
            className="mt-4 px-6 py-2.5 rounded-full text-sm transition-all hover:opacity-80"
            style={{
              background: "rgba(212,136,42,0.15)",
              border: "1px solid rgba(212,136,42,0.3)",
              color: "#D4882A",
              fontFamily: "monospace",
            }}
          >
            Make your own tape →
          </a>
        </div>
      );
    }

    console.log(`[TapePage] Tape found:`, {
      id: tape.id,
      title: tape.title,
      status: tape.status,
      trackCount: tape.tracks?.length || 0,
      tracks: tape.tracks?.map(t => ({
        id: t.id,
        title: t.title,
        providerTrackId: t.providerTrackId,
        side: t.side,
      }))
    });

    // Ensure tape object is serializable
    const serializedTape = {
      ...tape,
      createdAt: tape.createdAt.toISOString(),
      updatedAt: tape.updatedAt.toISOString(),
      deletedAt: tape.deletedAt?.toISOString() || null,
      tracks: tape.tracks.map(track => ({
        ...track,
        createdAt: track.createdAt ? (typeof track.createdAt === 'string' ? track.createdAt : track.createdAt.toISOString()) : new Date().toISOString(),
        // Ensure all fields are properly set
        id: track.id,
        tapeId: track.tapeId,
        side: track.side,
        position: track.position,
        title: track.title,
        artist: track.artist || null,
        thumbnailUrl: track.thumbnailUrl || null,
        provider: track.provider || "youtube",
        providerTrackId: track.providerTrackId,
        personalNote: track.personalNote || null,
        durationSec: track.durationSec || null,
        audioUrl: track.provider === "voice"
          ? (track.providerTrackId.endsWith(".webm") ? `/voice-recordings/${track.providerTrackId}` : `/voice-recordings/${track.providerTrackId}.webm`)
          : `/api/audio/${track.providerTrackId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
      }))
    };

    const backgroundImageNumber = getStableImageNumber(publicId, 20);
    const bgSrc = `/images/optimized/${backgroundImageNumber}.png`;
    const preloadImages = Array.from(
      new Set([bgSrc, "/images/optimized/14.png"])
    ).map((src) => ({ src, format: "png" as const }));

    console.log(`[TapePage] Rendering TapeViewClient`);
    return (
      <>
        <ImagePreloader images={preloadImages} />
        <TapeViewClient tape={serializedTape as any} />
      </>
    );
  } catch (error) {
    console.error(`[TapePage] Fatal error:`, error);
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 p-6"
        style={{ background: "#060408", color: "#6B5E4E" }}
      >
        <p
          className="text-3xl font-bold italic"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#F5F0E8" }}
        >
          Something went wrong
        </p>
        <p className="text-sm text-center max-w-md" style={{ fontFamily: "monospace" }}>
          We couldn't load this tape. Please try refreshing the page.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <p className="text-xs opacity-50 mt-2 font-mono">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        )}
        <div className="flex gap-3">
          <a
            href="/"
            className="mt-4 px-6 py-2.5 rounded-full text-sm transition-all hover:opacity-80"
            style={{
              background: "rgba(212,136,42,0.15)",
              border: "1px solid rgba(212,136,42,0.3)",
              color: "#D4882A",
              fontFamily: "monospace",
            }}
          >
            Refresh
          </a>
          <a
            href="/"
            className="mt-4 px-6 py-2.5 rounded-full text-sm transition-all hover:opacity-80"
            style={{
              background: "rgba(212,136,42,0.15)",
              border: "1px solid rgba(212,136,42,0.3)",
              color: "#D4882A",
              fontFamily: "monospace",
            }}
          >
            Go home →
          </a>
        </div>
      </div>
    );
  }
}
