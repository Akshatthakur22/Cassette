import { notFound } from "next/navigation";
import { getTapeByPublicId } from "@/app/actions/tape";
import SendTapeClient from "./SendTapeClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CASSETTE — Your tape is ready",
  robots: { index: false, follow: false },
};

export default async function RecordSuccessPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const tape = await getTapeByPublicId(publicId);
  if (!tape) notFound();

  // Validate style against all 6 supported styles
  const VALID_STYLES = new Set(["classic", "y2k", "love", "road_trip", "school", "summer"]);
  const safeStyle = VALID_STYLES.has(tape.style ?? "") ? (tape.style as any) : "classic";

  return (
    <SendTapeClient
      publicId={publicId}
      tapeId={tape.id}
      draftToken={tape.draftToken}
      visibility={tape.visibility === "public" ? "public" : "unlisted"}
      title={tape.title ?? "Untitled Tape"}
      senderName={tape.senderName}
      recipientName={tape.recipientName ?? "Someone"}
      style={safeStyle}
    />
  );
}
