import { notFound, redirect } from "next/navigation";
import { getTapeForEditor } from "@/app/actions/tape";
import TapeEditorClient from "./TapeEditorClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CASSETTE — Edit your tape",
  robots: { index: false, follow: false },
};

export default async function TapeEditorPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;
  const tape = await getTapeForEditor(draftId);

  if (!tape) notFound();
  if (tape.status === "published") redirect(`/t/${tape.publicId}`);

  return <TapeEditorClient tape={tape as any} />;
}
