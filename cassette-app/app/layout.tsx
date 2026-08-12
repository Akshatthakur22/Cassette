import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistrar from "./components/ServiceWorkerRegistrar";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "CASSETTE — Put your feelings on tape.",
  description:
    "A no-signup digital mixtape. Pick songs, write why they matter, send a link.",
  openGraph: {
    title: "CASSETTE",
    description: "A tape was made for you ❤️",
    type: "website",
  },
  robots: { index: false, follow: false },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CASSETTE",
  },
  formatDetection: { telephone: false },
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
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full`}
    >
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><rect fill='%23D4882A' width='48' height='48'/><text x='24' y='34' font-size='30' font-weight='bold' text-anchor='middle' fill='%23060408' font-family='serif'>♫</text></svg>"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
