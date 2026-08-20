import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import ServiceWorkerRegistrar from "./components/ServiceWorkerRegistrar";
import { PerformanceMonitor } from "./components/PerformanceMonitor";
import { PlaybackDiagnosticsPanel } from "@/lib/playback/diagnostics/PlaybackDiagnosticsPanel";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_DOMAIN || "https://cassette-share.vercel.app"),
  title: "CASSETTE — Put your feelings on tape.",
  description:
    "A no-signup digital mixtape platform. Pick songs from YouTube, record voice notes, write handwritten liner notes, and share retro 3D tapes.",
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: "CASSETTE — Interactive Digital Mixtape Maker",
    description: "Put your feelings on tape. A no-signup 3D digital mixtape gift creator.",
    url: "https://cassette-share.vercel.app",
    siteName: "CASSETTE",
    locale: "en_US",
    type: "website",
    images: [{ url: "/api/og-image?title=CASSETTE&sender=Someone&recipient=You&style=classic", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CASSETTE — Put your feelings on tape",
    description: "Send an interactive retro 3D mixtape link to someone special.",
    images: ["/api/og-image?title=CASSETTE&sender=Someone&recipient=You&style=classic"],
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  verification: {
    google: "Q_4iJe2-dQi-PaSKqqaQZW0Hijwbaid7u-VAEglI0ww",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CASSETTE",
  },
  formatDetection: { telephone: false },
  keywords: [
    "digital mixtape",
    "music playlist",
    "cassette tape",
    "emotional music",
    "song notes",
    "music gift",
    "playlist maker",
    "tape creator",
    "mixtape generator",
    "music memories",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#D4882A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "CASSETTE",
    description: "A no-signup digital mixtape platform for creating retro 3D interactive tapes.",
    url: "https://cassette-share.vercel.app",
    applicationCategory: "MusicApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    image: "https://cassette-share.vercel.app/api/og-image",
    author: {
      "@type": "Person",
      name: "Akshat Thakur",
      url: "https://cassette-share.vercel.app/developer",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Cassette Digital Mixtape",
    url: "https://cassette-share.vercel.app",
    logo: "https://cassette-share.vercel.app/logo.png",
    founder: {
      "@type": "Person",
      name: "Akshat Thakur",
    },
    sameAs: [
      "https://github.com/akshatthakur22",
      "https://cassette-share.vercel.app/developer",
      "https://mailmycertificate.tech",
      "https://priyasarvutthan.org",
    ],
  };

  return (
    <html lang="en" className="h-full">
      <head>
        {/* Structured data for search engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="google-site-verification" content="Q_4iJe2-dQi-PaSKqqaQZW0Hijwbaid7u-VAEglI0ww" />
      </head>
      <body className="min-h-full flex flex-col">
        {/* Google Analytics (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-W6EFSFWMPB"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-W6EFSFWMPB');
          `}
        </Script>
        <PerformanceMonitor />
        {children}
        <PlaybackDiagnosticsPanel />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
