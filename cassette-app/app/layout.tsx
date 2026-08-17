import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegistrar from "./components/ServiceWorkerRegistrar";
import { PerformanceMonitor } from "./components/PerformanceMonitor";

export const metadata: Metadata = {
  title: "CASSETTE — Put your feelings on tape.",
  description:
    "A no-signup digital mixtape. Pick songs, write why they matter, send a link.",
  openGraph: {
    title: "CASSETTE",
    description: "A tape was made for you ❤️",
    type: "website",
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
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Structured data for search engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "CASSETTE",
              description: "A no-signup digital mixtape platform",
              url: "https://cassette.fm",
              applicationCategory: "MusicApplication",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              image: "https://cassette.fm/api/og-image",
            }),
          }}
        />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><rect fill='%23D4882A' width='48' height='48'/><text x='24' y='34' font-size='30' font-weight='bold' text-anchor='middle' fill='%23060408' font-family='serif'>♫</text></svg>"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <PerformanceMonitor />
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
