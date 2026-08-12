import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTapeByPublicId } from "@/app/actions/tape";
import TapeViewClient from "@/app/components/TapeViewClient";

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

    return {
      title,
      description,
      robots: { index: false, follow: false },
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
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return { title: "CASSETTE — Digital mixtapes" };
  }
}

export default async function TapePage({ params }: Props) {
  const { publicId } = await params;
  const tape = await getTapeByPublicId(publicId);

  if (!tape) {
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
          It may have been deleted by the creator.
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

  return <TapeViewClient tape={tape as any} />;
}
