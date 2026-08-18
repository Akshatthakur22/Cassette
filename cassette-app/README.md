# 📼 CASSETTE — Nostalgic Digital Mixtape Platform

> **A modern, full-stack web application for creating, customizing, and gifting interactive digital cassette tapes.**  
> Built with **Next.js 16 (App Router + Turbopack)**, **React 19**, **Prisma ORM**, **PostgreSQL**, **Tailwind CSS v4**, and **Framer Motion 3D Physics**.

---

## 🌟 Executive Overview

**Cassette** bridges retro 1980s mixtape nostalgia with modern web engineering. It allows users to curate personal mixtapes containing YouTube tracks and in-browser voice recordings, write handwritten liner notes, choose custom 3D cassette shells, and share them via unlisted links or a public community shelf.

When a recipient opens a Cassette link, they experience a tactile digital unboxing sequence: opening an acrylic cassette case, inserting the tape into a vintage player deck, flipping between Side A and Side B, watching 100% mathematically centered spools spin in real-time, and reading handwritten post-it liner notes written specially for them.

---

## 📊 Project Status & Implementation Snapshot

| Parameter | Current Status | Description |
| :--- | :--- | :--- |
| **Framework Version** | `Next.js 16.3.0` | App Router with Turbopack & Server Actions |
| **UI Library** | `React 19.2.8` | Server Components + Client Hydration Guards |
| **Database & ORM** | `Prisma 5.22.0` + `PostgreSQL` | 7 Relational Models with Caching & Indexes |
| **Build & Type Health** | `0 Errors` | Clean `npm run build` with full TypeScript compliance |
| **Styling & Motion** | `Tailwind CSS v4` + `Framer Motion 11` | Pure CSS 3D Transforms + SVG Vector Engine |
| **Social / SEO** | `Edge OG Engine` | Dynamic `@vercel/og` 1200x630 social share cards |
| **Audio Engine** | `HTML5 Web Audio` + `YouTube API` | Multi-source playback with background sync |

---

## 🏗️ System Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Client Layer
        UI[Next.js App Router UI]
        Deck[3D Cassette Deck Engine]
        Audio[HTML5 Web Audio & YouTube API]
        Voice[MediaRecorder Voice Capture]
    end

    subgraph Server Layer
        SA[Next.js Server Actions /app/actions/tape.ts]
        API[API Routes /api/search, /api/og-image, /api/voice-messages]
        OG[Edge Open Graph Generator @vercel/og]
    end

    subgraph Data & Storage Layer
        DB[(PostgreSQL Database)]
        Prisma[Prisma ORM]
        Cache[YouTube Search & Playlist Caching]
        Storage[Local / S3 Voice Message Storage]
    end

    UI -->|Form Actions| SA
    UI -->|Async Requests| API
    SA --> Prisma
    API --> Prisma
    Prisma --> DB
    API --> Cache
    Voice -->|Upload WebM| API
    API --> Storage
    API --> OG
```

### Data Flow Lifecycle:
1. **Creation (`/create`)**: User specifies recipient, mixtape title, dedication letter, relationship, and cassette shell color. Server action creates a `Tape` record with status `draft`, generating a `publicId` and private `draftToken`.
2. **Curation (`/create/[draftId]`)**:
   - **YouTube Search & Playlist Import**: Real-time search powered by YouTube API with server-side caching (`YoutubeSearchCache` & `YoutubePlaylistCache`).
   - **Voice Recording**: User records personal audio directly in-browser using Web MediaRecorder API. Audio is uploaded to `/api/voice-messages/upload`, saved to disk/S3, and attached as a `TapeTrack` with `provider: "voice"`.
   - **Track Reordering**: Drag-and-drop position sorting backed by optimistic UI updates and batch `reorderTracks` server action.
3. **Sealing & Share Hub (`/record/[publicId]`)**: Tape status changes to `published`. User receives a 1-click shareable link (`/t/[publicId]`), native share buttons (**WhatsApp**, **SMS**, **Email**, **X**), an interactive acrylic case preview, and a private management link (`/manage/[draftToken]`).
4. **Playback (`/t/[publicId]`)**: Recipient opens the link -> Dynamic Edge OG preview rendered -> Interactive acrylic unboxing gate -> Cassette inserted into player deck -> Dual-side playback (Side A & Side B) with real-time vector spool spinning, LCD ticker, and handwritten post-it note cards.

---

## ✨ Key Features & Technical Highlights

### 1. 📼 Precision 3D Cassette Vector Engine (`CassetteObject.tsx`)
- **100% Mathematically Centered Reels**: Dual SVG spools (`PrecisionReel`) with center coordinates `(cx: 34, cy: 34)` and 6 precision drive teeth rotating seamlessly around the spindle axle without wobble or off-center alignment errors.
- **Dynamic Magnetic Tape Winding**: Spool radius scales dynamically (`fullness`) as audio plays, unwinding from the supply reel to the take-up reel in real-time.
- **Authentic Vintage Aesthetics**: Ribbed plastic side grip strips, philips steel screws, glass specular glare highlights, printed `100 50 0` tape scale marks, and 10 customizable color themes (*Cream, Cherry, Peach, Butter, Sky, Pool, Lavender, Mint, Clear, Smoky*).
- **Interactive 3D Tilt**: Real-time cursor/pointer tilt tracking with smooth spring physics (`rotateY` / `rotateX`).

### 2. 🎛️ Physical Player Deck Controls (`PlayerBar.tsx`)
- **Retro LCD Status Display**: Illuminated phosphorescent screen with blinking block cursor, scrolling track title ticker, elapsed/total duration (`0:42 / 3:19`), and animated VU meter bars.
- **`🎙️ VOICE` Note Badge**: Automatically detects voice recordings and displays a warm gold badge (`🎙️ VOICE`) alongside the audio waveform.
- **Tactile Hardware Buttons**: Beveled metallic buttons with active LED glow, mechanical click sound effects (`sounds.ts`), and spring feedback on tap.
- **Keyboard Shortcuts**: Global Spacebar play/pause toggle and Left/Right arrow scrubbing.

### 3. 💌 Personal Handwritten Liner Notes (`TrackList.tsx` & `TapeViewClient.tsx`)
- **Track-Level Notes**: Attach custom handwritten post-it cards to individual songs (`📌 “...note...” — Sender`).
- **Tape Dedication Letter**: Expandable luxury parchment card containing the sender's full dedication letter (*“— With love, Arjun”*).

### 4. 🖼️ Dynamic Edge Open Graph System (`/api/og-image`)
- Generates custom 1200x630 social preview images on Next.js Edge Runtime using `@vercel/og`, `satori`, and `sharp`.
- When shared on WhatsApp, iMessage, Twitter, or LinkedIn, recipients see a custom preview card featuring the mixtape title, sender name, recipient name, and retro cassette graphics.

### 5. 🔒 Privacy & Discovery Modes
- **Unlisted (Default)**: Private link access only (`/t/[publicId]`).
- **Public Community Shelf (`/shelf`)**: Opt-in showcase where public tapes are featured and discoverable by community users with filter controls by style and relationship.

---

## 🗄️ Database Schema & Models (`prisma/schema.prisma`)

```prisma
model Tape {
  id                String      @id @default(cuid())
  publicId          String      @unique
  draftToken        String      @unique
  title             String?
  dedication        String?
  senderName        String
  recipientName     String?
  relationship      String?     // partner | best_friend | family | memory | self | other
  style             String      @default("classic")
  visibility        String      @default("unlisted") // unlisted | public
  status            String      @default("draft")   // draft | published | deleted
  voiceMessageUrl   String?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  tracks            TapeTrack[]
  views             TapeView[]
  shareEvents       ShareEvent[]
  contentReports    ContentReport[]
}

model TapeTrack {
  id              String   @id @default(cuid())
  tapeId          String
  side            String   // "A" | "B"
  position        Int
  title           String
  artist          String?
  provider        String   @default("youtube") // youtube | voice
  providerTrackId String
  personalNote    String?
  durationSec     Int?
}
```

---

## 🌐 SEO & Performance Architecture

- **Semantic HTML5 & Headings**: Single `<h1>` per view, proper heading hierarchy, ARIA accessibility labels (`aria-label`, `role="tablist"`).
- **JSON-LD Structured Data**: Embedded schema markup (`MusicPlaylist`, `CreativeWork`) for search engine indexers.
- **Dynamic Sitemap & Robots**: Automated XML sitemap generation at `/sitemap.xml` mapping all public shelf tapes.
- **Zero Hydration Mismatch**: Strict mounted guards and deterministic seeded generators (`seededRandom`) preventing SSR/client HTML divergence.
- **Fluid Mobile Ergonomics**: Safe-area bottom padding (`pb-36 sm:pb-44`) ensuring fixed audio controls never obscure content on mobile screens.

---

## 💰 Commercial & Monetization Potential

1. **Physical Cassette Fulfillment (Print-on-Demand)**:
   - Allow creators to order a real, playable physical cassette tape shipped to the recipient's door, packaged with custom printed J-card inserts and embedded NFC/QR codes linking back to the digital tape.
2. **Premium Cassette Shells & Metallic Packs**:
   - Unlock collector cassette designs (gold foil, chrome, neon glow-in-the-dark, transparent prism) via micro-transactions or subscription.
3. **Mixtape Gifting & Creator Tipping**:
   - Integrated digital tipping ("Buy Me a Coffee" / Stripe) allowing recipients to send monetary gifts along with a "Make One Back" tape reply.
4. **B2B & Event Partnerships**:
   - White-label mixtapes for wedding favors, corporate gifting, album launch promotional campaigns, and brand marketing.

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: `v18.x` or higher
- **PostgreSQL**: Local instance or cloud database (Supabase, Neon, Railway)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/akshatthakur22/Cassette.git
cd Cassette/cassette-app

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in `cassette-app/`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/cassette_db?schema=public"
DATABASE_URL_UNPOOLED="postgresql://user:password@localhost:5432/cassette_db?schema=public"
NEXT_PUBLIC_DOMAIN="http://localhost:3000"
YOUTUBE_API_KEY="your_youtube_api_key_here"
```

### 4. Database Initialization
```bash
# Run Prisma migrations
npx prisma db push

# (Optional) Seed initial data
npm run seed
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Verification & Build Commands

```bash
# Run production build validation
npm run build

# Run linter
npm run lint
```

---

## 👤 Author & Maintainer

**Akshat Thakur**  
- **GitHub**: [@akshatthakur22](https://github.com/akshatthakur22)  
- **Project**: Cassette Digital Mixtape Platform  

*Built with passion for retro music culture, tactile user interfaces, and modern web software engineering.*
