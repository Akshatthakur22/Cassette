import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "A tape was made for you ❤️";
  const recipient = searchParams.get("recipient") ?? "Someone";
  const sender = searchParams.get("sender") ?? "Someone";
  const style = searchParams.get("style") ?? "classic";

  // Palette mapping for OG cards
  const styleColors: Record<
    string,
    { bg: string; accent: string; shell: string; labelBg: string; text: string }
  > = {
    classic:     { bg: "#2A2015", accent: "#D4882A", shell: "#C8A96E", labelBg: "#FFF9EE", text: "#1C0F05" },
    cherry:      { bg: "#280A12", accent: "#E84060", shell: "#E84060", labelBg: "#FFF0F4", text: "#1A0308" },
    peach:       { bg: "#2C140A", accent: "#E8703A", shell: "#E8703A", labelBg: "#FFF4EE", text: "#200C04" },
    butter:      { bg: "#28240A", accent: "#F5D840", shell: "#F5D840", labelBg: "#FFFFEE", text: "#242004" },
    sky:         { bg: "#0A1E2C", accent: "#5AC8FA", shell: "#5AC8FA", labelBg: "#F0F8FF", text: "#041420" },
    pool:        { bg: "#082424", accent: "#1A9898", shell: "#1A9898", labelBg: "#F0FFFF", text: "#021A1A" },
    lavender:    { bg: "#1E0E2E", accent: "#B080E0", shell: "#B080E0", labelBg: "#FBF5FF", text: "#160824" },
    mint:        { bg: "#082414", accent: "#34C759", shell: "#34C759", labelBg: "#F2FFF6", text: "#021A0C" },
    transparent: { bg: "#101824", accent: "#5AC8FA", shell: "#88B8E0", labelBg: "#F0F8FF", text: "#081828" },
    smoky:       { bg: "#141216", accent: "#8E8896", shell: "#4A4550", labelBg: "#F4F2F6", text: "#121014" },
    y2k:         { bg: "#1A062A", accent: "#00E5FF", shell: "#E040FB", labelBg: "#FCF0FF", text: "#0D0020" },
    love:        { bg: "#2C0810", accent: "#F7A8B0", shell: "#D45A6A", labelBg: "#FFF2F4", text: "#1A0305" },
    road_trip:   { bg: "#0A1828", accent: "#D4882A", shell: "#5B7FA6", labelBg: "#F0F6FC", text: "#050D18" },
    school:      { bg: "#0C1424", accent: "#7A8FB0", shell: "#4A5F8F", labelBg: "#F2F6FC", text: "#081020" },
    summer:      { bg: "#2A1808", accent: "#FFD966", shell: "#F5A623", labelBg: "#FFFDF0", text: "#201202" },
  };

  const palette = styleColors[style] ?? styleColors.classic;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          background: `linear-gradient(145deg, ${palette.bg} 0%, #08060A 100%)`,
          padding: "48px 64px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Glow behind cassette */}
        <div
          style={{
            position: "absolute",
            top: "140px",
            width: "600px",
            height: "280px",
            borderRadius: "140px",
            background: palette.accent,
            opacity: 0.18,
            filter: "blur(60px)",
          }}
        />

        {/* Top Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <span
            style={{
              fontSize: "20px",
              fontWeight: 800,
              letterSpacing: "6px",
              color: "#FBFAF7",
              opacity: 0.9,
            }}
          >
            CASSETTE.FM
          </span>
          <span
            style={{
              fontSize: "16px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: palette.accent,
              fontWeight: 700,
            }}
          >
            Digital Mixtape
          </span>
        </div>

        {/* Cassette Graphic Body */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "640px",
            height: "360px",
            borderRadius: "24px",
            background: palette.shell,
            border: `3px solid ${palette.accent}`,
            boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            padding: "24px",
            position: "relative",
            justifyContent: "space-between",
          }}
        >
          {/* Top Tape Screws */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div style={{ width: "12px", height: "12px", borderRadius: "6px", background: "rgba(0,0,0,0.3)" }} />
            <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "2px", color: "rgba(0,0,0,0.4)" }}>
              SIDE A
            </span>
            <div style={{ width: "12px", height: "12px", borderRadius: "6px", background: "rgba(0,0,0,0.3)" }} />
          </div>

          {/* Cassette Paper Label */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "170px",
              background: palette.labelBg,
              borderRadius: "14px",
              padding: "16px 28px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15) inset",
            }}
          >
            <span
              style={{
                fontSize: "30px",
                fontWeight: 800,
                fontStyle: "italic",
                color: palette.text,
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {title}
            </span>
            <span
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: palette.text,
                opacity: 0.75,
                marginTop: "8px",
                letterSpacing: "1px",
              }}
            >
              for {recipient} · from {sender}
            </span>
          </div>

          {/* Tape Spool Window */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              width: "360px",
              height: "70px",
              background: "#181412",
              borderRadius: "35px",
              border: "2px solid rgba(255,255,255,0.1)",
              padding: "0 24px",
            }}
          >
            {/* Left Spool */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "44px",
                height: "44px",
                borderRadius: "22px",
                background: "#FBFAF7",
              }}
            >
              <div style={{ width: "18px", height: "18px", borderRadius: "9px", background: "#181412" }} />
            </div>

            {/* Tape Bridge */}
            <div style={{ width: "160px", height: "10px", background: "#5C3A1E", borderRadius: "4px" }} />

            {/* Right Spool */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "44px",
                height: "44px",
                borderRadius: "22px",
                background: "#FBFAF7",
              }}
            >
              <div style={{ width: "18px", height: "18px", borderRadius: "9px", background: "#181412" }} />
            </div>
          </div>
        </div>

        {/* Bottom CTA footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              letterSpacing: "2px",
              color: "#FBFAF7",
              opacity: 0.85,
              fontWeight: 600,
            }}
          >
            Tap to unwrap and play your cassette 🎵
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
