import type { Metadata } from "next";
import CreateStartClient from "./CreateStartClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CASSETTE — Make a tape",
  robots: { index: false, follow: false },
};

export default function CreatePage() {
  return <CreateStartClient />;
}
