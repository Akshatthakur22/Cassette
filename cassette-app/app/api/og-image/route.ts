import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const recipient = searchParams.get("recipient") ?? "Someone";
  const sender = searchParams.get("sender") ?? "Someone";
  const style = searchParams.get("style") ?? "classic";

  // Style-specific colors
  const styleColors: Record<string, { bg: string; accent: string; text: string }> = {
    classic:   { bg: "#C8A96E", accent: "#8B5E3C", text: "#1C0F05" },
    y2k:       { bg: "#E040FB", accent: "#00E5FF", text: "#0D0020" },
    love:      { bg: "#D45A6A", accent: "#F7A8B0", text: "#1A0305" },
    road_trip: { bg: "#5B7FA6", accent: "#D4882A", text: "#050D05" },
  };

  const colors = styleColors[style] ?? styleColors.classic;

  try {
    // Generate SVG dynamically
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.bg};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.accent};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#grad)"/>
        <text x="600" y="150" text-anchor="middle" font-size="36" font-weight="600" fill="${colors.text}" fill-opacity="0.6" font-family="monospace" letter-spacing="4">CASSETTE</text>
        <text x="600" y="310" text-anchor="middle" font-size="72" font-weight="700" fill="${colors.text}" font-family="'Playfair Display', serif" font-style="italic">A tape was made for you ❤️</text>
        <text x="600" y="390" text-anchor="middle" font-size="48" fill="${colors.text}" font-family="'Playfair Display', serif" font-style="italic">${recipient}</text>
        <text x="600" y="450" text-anchor="middle" font-size="32" fill="${colors.text}" fill-opacity="0.7">from ${sender}</text>
        <text x="600" y="530" text-anchor="middle" font-size="24" fill="${colors.text}" fill-opacity="0.6" font-family="monospace" letter-spacing="2">Open to listen →</text>
      </svg>
    `;

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("OG image generation error:", error);
    return NextResponse.json({ error: "Failed to generate OG image" }, { status: 500 });
  }
}
