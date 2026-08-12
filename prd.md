# CASSETTE — Build-Ready Product Spec
**For: Kiro AI (autonomous build agent)**
**Version:** 2.0 (Final MVP Spec)
**Status:** Ready for Phase 0 build
**One-line pitch:** A no-signup digital mixtape — pick songs, write why they matter, send a link. The recipient opens it and finds "someone made this for you."

---

## 0. What Changed From v1

This spec locks the two decisions that were previously open:

1. **Music engine = YouTube** (IFrame Player API + Data API v3). No premium account needed. No licensing negotiation needed for MVP. Full rationale in §6.
2. **Visual direction = "Deluxe Saloon" reference model** — cinematic, illustrated/AI-art nostalgic scene as the emotional hero, with a thin, minimal, modern UI chrome floating on top. Full spec in §3.

Everything below is scoped to what Kiro should actually build for Phase 0–1. Speculative future features (physical products, public discovery, AI writing assistant, voice notes) are listed once at the bottom under **Explicitly Not in MVP** and should not be built unless the person running Kiro says otherwise.

---

## 1. Product Definition

**CASSETTE** is a web app where a user creates a digital mixtape (a "tape") — a themed collection of songs organized into Side A / Side B, each with an optional personal note — and sends it to one specific person via a private link. The recipient opens it with zero friction (no login) and experiences it as an object, not a webpage: reels spin, sides flip, a label displays their name.

**Core loop:**
```
Create tape → Add songs + notes → Design label → Record (finalize) → Get link → Send
     ↓
Recipient opens → Plays → Reads notes → "Make One Back" → becomes a creator
```

**North star metric:** Tapes sent AND opened by the recipient. Not signups, not DAU.

---

## 2. Target User & Emotional Brief

- **Primary:** Gen Z (16–28), on Instagram/WhatsApp daily, drawn to Y2K/retro aesthetics, communicates feelings through curated media rather than direct text.
- **Secondary:** Millennials (28–40) who remember physical mixtapes and respond to genuine nostalgia rather than pastiche.
- **The unifying design insight (from the Deluxe Saloon reference):** both groups respond to the *same* aesthetic when it's done with sincerity — a richly atmospheric, illustrated/cinematic nostalgic scene, paired with restrained, modern, almost invisible UI. Old people recognize the world. Young people recognize the aesthetic. Nobody feels excluded.
- Relationship types to support from day one: partner, crush, best friend, sibling, parent, long-distance friend, ex, self. Never lock the product into "romance only."

---

## 3. Visual & UX Direction (Locked)

### 3.1 The core design principle
> **One large, atmospheric, illustrated/cinematic scene is the hero. The interface is almost invisible on top of it.**

This is exactly what the Deluxe Saloon reference does: a full-bleed nostalgic illustrated backdrop (old Indian street, barbershop, warm light) with only a handful of minimal floating UI elements — a clock, a live counter, two pill-shaped external links, a persistent thin player bar at the bottom. No cards, no dashboards, no visual clutter. **Adapt this exact pattern for CASSETTE**, replacing the barbershop scene with tape-specific nostalgic scenes (a bedroom wall with posters, a car dashboard at night, a school desk, a monsoon window) that change per tape theme/style.

### 3.2 Screen-by-screen visual spec

**Landing page**
- Full-bleed hero illustration/scene (warm, cinematic, slightly desaturated, film-grain texture) — establishes mood in one glance, no explaining needed.
- Centered, large display typography: `PUT YOUR FEELINGS ON TAPE.`
- One primary CTA pill button: `MAKE A TAPE`. One secondary text link: `Open a tape`.
- No navbar. No feature grid. No pricing. Trust the scene to do the work.

**Tape creation (editor)**
- The cassette itself is the visual centerpiece, rendered as an SVG/canvas object (not a photo) — transparent shell, visible reels, editable label area.
- Editing controls live in a **thin bottom sheet / floating bar**, never as a traditional form-heavy page. Mirror the Deluxe Saloon bottom player bar pattern: persistent, translucent, minimal — track name, prev/play/next, small progress bar.
- Side A / Side B toggle as a small pill switch near the cassette, not a full tab bar.
- Add-song search results appear as a lightweight overlay list (thumbnail + title + artist), not a new page.

**Recipient view**
- Opens directly into the tape as object — the illustrated scene appropriate to the tape's chosen style (Classic / Y2K / Love / Summer / Road Trip / School) fills the background.
- Label text overlay: `FOR RIYA ❤️` in handwritten-style display font, top-of-scene, exactly like the Deluxe Saloon Hindi title placement — big, centered-ish, slightly imperfect.
- Persistent bottom player bar identical in structure to the reference: album-art-style thumbnail (auto-pulled YouTube thumbnail), track title + "from [Sender]'s tape", prev/play/next, volume, scrubber with elapsed/total time.
- Small, quiet metadata in a corner (tape date, or an optional "X tapes opened today" — see §3.4 on social proof).
- `Make One Back` appears only after some listening progress (not immediately) as a single warm pill button, not a banner.

**Install prompt**
- Adopt the same pattern shown in the reference (bottom toast: "Install [App], one-tap install, no app store") — CASSETTE should be a installable PWA so it can live on a phone home screen like a keepsake object, not just a browser tab.

### 3.3 Typography & Color
- One expressive/display font for titles and tape labels (should feel handwritten or vintage-printed, not corporate-geometric).
- One clean, highly legible UI font for controls/metadata.
- Palette: warm neutrals (off-white, cream, faded black) as the UI chrome color, with the *scene illustration itself* carrying the saturated nostalgic color (terracotta reds, warm ambers, dusty blues) — same balance as the reference screenshot: vivid background, monochrome/neutral UI floating on top.
- Motion: reel rotation while playing, subtle parallax on the background scene, smooth crossfade on Side A/B flip. Respect `prefers-reduced-motion`.

### 3.4 Social proof (small, optional, not core MVP)
The reference's `1110 online` live counter is a nice trust/warmth signal worth noting for later (e.g., "X tapes opened this week") — but do **not** build this in Phase 0/1. It requires infra (presence tracking) that isn't worth the cost until the core loop is validated. Flag as a v1 nice-to-have only.

### 3.5 What NOT to copy from the reference
- Its external "Spotify / YT Music" pill links exist because it's a radio-station site pointing users elsewhere. CASSETTE should NOT send users away — playback must stay inside the tape experience. Keep the *pattern* (small pill-shaped external actions), drop the *purpose*.

---

## 4. Information Architecture

```
/                       Landing
/create                 New tape — intention/style picker
/create/[draftId]       Tape editor (songs, notes, label, sides)
/create/[draftId]/preview
/t/[publicId]           Recipient view (also used for creator's own preview)
```
No `/me`, `/discover`, or accounts in MVP. Anonymous creation only — draft state persisted via a signed cookie/localStorage token + server-side draft record, not tied to a user account.

---

## 5. Core User Flows & Acceptance Criteria

### 5.1 Create a tape
User must be able to, without signing up:
- [ ] Start a tape and optionally pick an intention (For My Love / Best Friend / Family / Memory / Self / Just Because) — affects default style only, never locks category.
- [ ] Enter tape title, their name, recipient's name, optional short dedication (≤500 chars).
- [ ] Search songs via YouTube Data API (title/artist query) and add results to Side A or Side B.
- [ ] Reorder tracks via drag-and-drop within a side, and move tracks between sides.
- [ ] Add an optional personal note (short, e.g. ≤280 chars) per track.
- [ ] Enforce 12 tracks per side / 24 total.
- [ ] Choose a visual style (start with 4: Classic, Y2K, Love, Road Trip — trim the original 6 to keep v0 scope tight).
- [ ] Preview the full recipient experience before publishing.
- [ ] Hit "Record Tape" → see a short recording animation → get a unique share URL.

### 5.2 Recipient experience
- [ ] Open `/t/[publicId]` with zero login, zero interstitial.
- [ ] Immediately understand: "a tape was made for you, by [name]."
- [ ] Play / pause / scrub / skip tracks.
- [ ] Flip between Side A and Side B (animated).
- [ ] Read each track's personal note (revealed while that track plays, or tappable).
- [ ] Read the tape's overall dedication.
- [ ] Share the tape link onward (native Web Share API + copy link).
- [ ] See a "Make One Back" action after meaningful engagement (e.g. after playing ≥1 track or reaching end of Side A).

### 5.3 Sharing
- [ ] Unique, high-entropy `publicId` (not sequential — use nanoid or similar, 8–10 chars).
- [ ] Dynamic Open Graph image per tape (title, style, "made by X") generated server-side.
- [ ] OG title/description follow the brand voice: `"A tape was made for you ❤️" / "A digital mixtape from [Name]."`
- [ ] Never expose the dedication text or personal notes in the OG preview — only in-app after opening.

### 5.4 Privacy & deletion
- [ ] Default visibility = unlisted (accessible only via link, not indexed, `noindex` meta tag).
- [ ] Creator (via their draft token) can delete a tape; deleted tape URL shows "This tape no longer exists," never reveals prior content.

---

## 6. Music Architecture — YouTube (Final)

### 6.1 Why YouTube over alternatives
- No Premium/paid account required for either the creator or the recipient — playback via the IFrame Player API works exactly like watching an embedded YouTube video on any website: no login needed.
- Spotify's terms prohibit non-Premium playback and restrict syncing audio to visual media for commercial apps — ruled out as MVP foundation.
- Apple Music (MusicKit) requires user subscription/auth per listener — heavier friction than a share-and-open product can tolerate.
- YouTube's catalog coverage (official audio uploads, lyric videos, full tracks) is broad enough for a Bollywood + global MVP.

### 6.2 What to set up
1. Google Cloud project → enable **YouTube Data API v3** → generate an API key. Used server-side only, for song search (title/artist → candidate video results with id, title, channel, thumbnail).
2. **IFrame Player API** — no key required — used client-side to actually load and control playback once a video ID is chosen. Free.
3. Add a **privacy policy page** (required by YouTube's API terms).
4. Track and cache quota usage — Data API default quota is limited (search costs ~100 units/call against a default ~10,000/day budget) — implement search result caching (store `title/artist → videoId` mappings after first lookup) to avoid repeat-searching the same songs.

### 6.3 Hard constraints that shape the UI (compliance, not optional)
- **The embedded player must be visibly present, minimum 200×200px, and not hidden behind other elements or overlays.** This means CASSETTE cannot pretend to be "pure audio" with the video fully hidden — design a small, stylized "tape window" into which the real YouTube player sits (this actually fits the cassette metaphor well: a little visible screen behind the reels).
- No autoplay before the player is visible on screen.
- No scraping/downloading video or audio streams — always play live through the official embedded player.
- Referrer header must not be suppressed (`Referrer-Policy: strict-origin-when-cross-origin`, don't use `noreferrer`).
- Standard YouTube branding must remain visible/accessible within the embedded surface.

### 6.4 Data model implication
Store only references, never audio:
```
provider: "youtube"
provider_track_id: <videoId>
title / artist / thumbnail_url: cached from search at add-time
```
Never store or re-host the underlying media. This also future-proofs a provider swap (see §8.3).

---

## 7. Tech Stack (Locked for Kiro)

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router) + React + TypeScript |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Backend | Next.js server actions / API routes (no separate service for MVP) |
| Database | PostgreSQL (Supabase-hosted for MVP speed) |
| ORM | Prisma |
| Storage | Supabase Storage (or Cloudflare R2 later) — for OG images, custom label assets |
| Auth | None required for MVP — anonymous draft tokens only |
| Hosting | Vercel |
| Analytics | PostHog (privacy-conscious event tracking) |
| Music | YouTube Data API v3 (search) + IFrame Player API (playback) |

---

## 8. Data Model (Prisma-ready)

```prisma
model Tape {
  id            String   @id @default(cuid())
  publicId      String   @unique // high-entropy, e.g. nanoid(10)
  draftToken    String   @unique // anonymous-creator auth
  title         String?
  dedication    String?  // max 500 chars, enforce in app layer
  senderName    String
  recipientName String?
  relationship  String?  // partner | best_friend | family | memory | self | other
  style         String   // classic | y2k | love | road_trip
  visibility    String   @default("unlisted") // unlisted | private | public(future)
  memoryDate    DateTime?
  status        String   @default("draft") // draft | published | deleted
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?
  tracks        TapeTrack[]
}

model TapeTrack {
  id               String @id @default(cuid())
  tapeId           String
  tape             Tape   @relation(fields: [tapeId], references: [id])
  side             String // "A" | "B"
  position         Int
  title            String
  artist           String?
  thumbnailUrl     String?
  provider         String @default("youtube")
  providerTrackId  String // YouTube videoId
  personalNote     String? // max 280 chars
  createdAt        DateTime @default(now())
}

model ShareEvent {
  id        String   @id @default(cuid())
  tapeId    String
  platform  String   // whatsapp | copy_link | native_share | other
  createdAt DateTime @default(now())
}

model TapeView {
  id        String   @id @default(cuid())
  tapeId    String
  sessionId String
  createdAt DateTime @default(now())
}
```

---

## 9. Build Phases (Order Kiro Should Follow)

### Phase 0 — Prototype (no backend)
- Landing page with hero scene + CTA.
- Static/interactive cassette component: play/pause visual state, Side A/B flip animation, reel rotation.
- Use 3–5 hardcoded fake tracks. No real API calls yet.
- **Goal:** prove the object-interaction feels magical before anything else is built.

### Phase 1 — Core creation + storage
- Prisma schema + Postgres (Supabase) wired up.
- Tape editor: title/sender/recipient/dedication, style picker, add/reorder/delete tracks (still fake data or manual entry, YouTube not wired yet).
- Publish → generates `publicId` → `/t/[publicId]` renders the recipient view from real DB data.
- Draft-token-based anonymous edit/delete.

### Phase 2 — YouTube integration
- Data API v3 search wired into "add song" flow (server route, cached results).
- IFrame Player API wired into both editor preview and recipient player — respecting the visible-player, 200×200 minimum, no-autoplay-until-visible constraints from §6.3.
- Real playback replaces fake data end to end.

### Phase 3 — Share loop
- Dynamic OG image generation per tape.
- Native Web Share API + copy link + WhatsApp share shortcut.
- "Make One Back" flow: recipient → new `/create` session pre-filled with roles reversed.
- PostHog events wired per §10.

### Phase 4 — Polish
- Sound design (subtle mechanical clicks — off by default).
- Reduced-motion support.
- Performance pass (target Lighthouse 90+ across the board).
- PWA install prompt (mirroring the reference's install toast pattern).

**Do not start Phase 5 (accounts, public discovery/"Tape Shelf", voice notes, physical products) until Phases 0–4 are live and the core loop (creator → recipient → Make One Back) is validated with real users.**

---

## 10. Minimum Analytics Events

```
create_started
track_added
tape_published
share_clicked
tape_opened
play_started
make_one_back_clicked
```
Funnel to watch: Landing → Create Started → Published → Shared → Opened → Played → Make One Back.

---

## 11. Explicitly Not in MVP
Accounts, followers/likes, public feed/"Tape Shelf," AI writing assistance, voice messages, physical cassette fulfillment, memory-date reminders, multi-language UI, live "X online" counters. All are reasonable v1/v2 ideas — none should block or dilute the Phase 0–4 build above.

---

## 12. Definition of Done for MVP
The product is ready to test with real users when this entire path works with no rough edges:

```
Open cassette.fm → Make a tape → Add real YouTube songs + notes →
Design label → Record → Get link → Send it → Recipient opens with
zero friction → Plays it → Reads notes → Taps Make One Back
```
If that loop feels genuinely good, everything else is negotiable. If it doesn't, no additional feature will fix it.