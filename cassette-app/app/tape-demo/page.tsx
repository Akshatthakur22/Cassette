import type { Metadata } from "next";
import TapeDemoClient from "./TapeDemoClient";

export const metadata: Metadata = {
  title: "CASSETTE — A tape was made for you",
  description: "A digital mixtape from Arjun.",
  robots: { index: false, follow: false },
};

export default function TapeDemoPage() {
  return <TapeDemoClient />;
}
