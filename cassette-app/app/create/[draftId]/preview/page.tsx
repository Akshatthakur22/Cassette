import { notFound } from "next/navigation";
import { getTapeForEditor } from "@/app/actions/tape";
import TapeViewClient from "@/app/components/TapeViewClient";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CASSETTE — Preview your tape",
  robots: { index: false, follow: false },
};

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;
  const tape = await getTapeForEditor(draftId);
  if (!tape) notFound();

  return (
    <div className="relative">
      {/* Preview banner */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-2.5"
        style={{
          background: "rgba(18,14,10,0.92)",
          borderBottom: "1px solid rgba(212,136,42,0.2)",
          backdropFilter: "blur(12px)",
        }}
      >
        <span className="text-xs font-mono tracking-widest" style={{ color: "#D4882A" }}>
          ◎ PREVIEW MODE
        </span>
        <div className="flex items-center gap-3">
          <Link
            href={`/create/${draftId}`}
            className="text-xs font-mono tracking-widest transition-all hover:opacity-70"
            style={{ color: "#A89880" }}
          >
            ← Edit
          </Link>
        </div>
      </div>

      {/* Tape recipient view (offset for preview bar) */}
      <div className="pt-10">
        <TapeViewClient tape={tape as any} isPreview />
      </div>
    </div>
  );
}
