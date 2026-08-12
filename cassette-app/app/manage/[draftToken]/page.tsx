import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTapeByDraftToken } from "@/app/actions/tape";
import ManageTapeClient from "./ManageTapeClient";

export const metadata: Metadata = {
  title: "Manage your tape — CASSETTE",
  robots: { index: false, follow: false },
};

export default async function ManageTapePage({
  params,
}: {
  params: Promise<{ draftToken: string }>;
}) {
  const { draftToken } = await params;
  const tape = await getTapeByDraftToken(draftToken);

  if (!tape) {
    return notFound();
  }

  return <ManageTapeClient tape={tape as any} draftToken={draftToken} />;
}
