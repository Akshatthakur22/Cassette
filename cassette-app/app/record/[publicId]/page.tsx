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

  return (
    <SendTapeClient
      publicId={publicId}
      tapeId={tape.id}
      title={tape.title ?? "Untitled Tape"}
      senderName={tape.senderName}
      recipientName={tape.recipientName ?? "Someone"}
      style={tape.style as any}
    />
  );
}
