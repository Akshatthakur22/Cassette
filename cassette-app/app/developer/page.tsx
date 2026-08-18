import React from "react";
import type { Metadata } from "next";
import DeveloperTapeClient from "./DeveloperTapeClient";

export const metadata: Metadata = {
  title: "Akshat Thakur — Full-Stack Developer & Creator of Cassette",
  description: "Developer tape profile of Akshat Thakur. Full-stack software developer building Cassette, MailMyCertificate, Priya Sarvutthan, and SafeExam.",
  alternates: {
    canonical: "https://cassette-share.vercel.app/developer",
  },
  openGraph: {
    title: "Akshat Thakur — Full-Stack Developer & Creator of Cassette",
    description: "Full-stack software developer building nostalgic, tactile web experiences.",
    url: "https://cassette-share.vercel.app/developer",
    images: [{ url: "/api/og-image?title=Akshat%20Thakur&sender=Developer&recipient=You&style=classic", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Akshat Thakur — Developer Tape",
    description: "Creator of Cassette, MailMyCertificate, Priya Sarvutthan, and SafeExam.",
  },
};

export default function DeveloperPage() {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Akshat Thakur",
    jobTitle: "Full-Stack Software Developer",
    url: "https://cassette-share.vercel.app/developer",
    knowsAbout: ["Web Development", "Next.js", "React", "TypeScript", "Audio Engineering", "Prisma"],
    sameAs: [
      "https://github.com/akshatthakur22",
      "https://mailmycertificate.tech",
      "https://priyasarvutthan.org",
      "https://safexam.in",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <DeveloperTapeClient />
    </>
  );
}
