# YouTube-to-Audio Asset Pipeline & Native Background Playback
## Architecture Report & Implementation Analysis

**Status:** Pre-Implementation Analysis  
**Date:** August 24, 2026  
**Target:** Cassette v1 Media Ingestion & Background Playback System

---

## 1. Executive Summary

This document outlines the proposed architecture for extending Cassette with **native background playback** through a **YouTube-to-MP3 media ingestion pipeline**.

### Problem Statement
YouTube IFrame playback cannot reliably continue when:
- Browser tab is backgrounded (switched to another app)
- Device screen is locked
- User navigates away from the page

This fundamentally limits Cassette's use case for listening to curated mixtapes during commutes, workouts, or casual listening.

### Solution Overview
1. **Intercept YouTube track selection** during cassette creation
2. **Create async media processing job** that extracts audio from YouTube
3. **Convert to MP3** and store durably in object storage
4. **Replace YouTube IFrame playback with HTML5 Audio** for native background support
5. **Preserve all existing functionality** (voice messages, queue management, UI/UX)
6. **Maintain backward compatibility** with existing published tapes

### Key Architectural Principles
- **Separation of concerns:** YouTube (discovery) → Media Worker (processing) → Object Storage (delivery) → Playback (HTML5)
- **Non-blocking processing:** User can continue editing while background job runs
- **Provider abstraction:** Extend existing `track.provider` system to include `media_asset`
- **Reuse existing playback patterns:** Unify HTML5 audio handling for voice + processed YouTube
- **Graceful degradation:** If processing fails, tape remains playable (error state)

---

## 2. Existing Architecture Discovery

### 2.1 Current Data Flow

```
YouTube Search API
    ↓
    user selects result
    ↓
addTrack() server action
    ↓
    TapeTrack {
        provider: "youtube",
        providerTrackId: videoId,
        title, artist, thumbnail, duration
    }
    ↓
TapeViewClient renders
    ↓
PlaybackController detects provider
    ↓
YouTubeEngine instantiates IFrame
    ↓
YouTube IFrame API controls playback
```

### 2.2 Current Database Schema

```prisma
model Tape {
  id                String
  publicId          String      @unique
  draftToken        String      @unique
  status            String      // draft | published | deleted
  tracks            TapeTrack[]
  voiceMessageUrl   String?     // S3/local storage
  voiceMessageSize  Int?
  voiceMessageDuration Int?
  voiceMessageMimeType String?
  // ... other fields
}

model TapeTrack {
  id              String   @id
  tapeId          String
  tape            Tape     @relation(...)
  side            String   // "A" | "B"
  position        Int
  title           String
  artist          String?
  thumbnailUrl    String?
  provider        String   @default("youtube")  // EXTENSIBLE
  providerTrackId String   // YouTube ID or voice file ID
  personalNote    String?
  durationSec     Int?
  createdAt       DateTime
}
```

**Key Observation:** `TapeTrack.provider` is already extensible. Can add new providers without breaking existing data.

### 2.3 Current Playback System

```
PlaybackController (singleton)
    ├─ setQueue(tracks[], startIndex)
    ├─ playTrack(track, queue)
    ├─ play() / pause() / seek() / next() / previous()
    └─ subscribe(listener) → emit PlaybackState
         └─ currentTrack, queue, queueIndex, isPlaying, currentTime, duration

PlaybackEngine interface
    ├─ load(track)
    ├─ play() / pause() / seek()
    ├─ destroy()
    └─ onStateChange(callback)

YouTubeEngine
    ├─ Uses YT.Player IFrame API
    ├─ Polls currentTime every 500ms
    └─ Cannot survive tab backgrounding

VoiceEngine
    ├─ Uses HTMLAudioElement
    ├─ Listens to native audio events
    ├─ ALREADY supports background playback (browser-dependent)
    └─ Serves as reference implementation
```

### 2.4 Current Storage Implementation

**Voice Messages:**
- **Development:** Saved to `/public/voice-recordings/{id}.webm`
- **Production (Vercel):** Falls back to base64 data URLs (no persistent storage)
- **URL Resolution:** Files served with proper `Accept-Ranges: bytes` for HTTP range requests

**No existing:**
- R2/S3 abstraction layer
- Presigned URLs
- Durable external object storage
- Media asset tracking

### 2.5 Current Deployment Model

- **Framework:** Next.js 16 (App Router)
- **Hosting:** Vercel (serverless)
- **Database:** PostgreSQL (Neon)
- **Max request size:** 2MB (configured in next.config.ts)
- **No dedicated workers:** All processing must fit in Vercel function runtime (~30s timeout)

**Key Constraint:** Long-running media processing (download + convert + upload) cannot reliably run in Vercel serverless. Need external worker solution.

### 2.6 Existing Validation & Safety

- `validateYouTubeVideo()` server-side validation
- Rate limiting: 10 drafts per IP+session per hour
- Spam detection on publish
- YouTube geo-restriction checks

---

## 3. Proposed Architecture

### 3.1 New Data Flow (High Level)

```
YouTube Search API
    ↓ (existing)
User selects track
    ↓ (existing)
addTrack() server action
    ↓ (MODIFIED)
    ├─ Validate YouTube video (existing)
    ├─ CREATE MediaAsset record (NEW)
    │   status: PENDING
    │   providerTrackId: videoId
    │
    └─ TapeTrack {
        provider: "media_asset",    ← NEW
        providerTrackId: mediaAssetId,
        title, artist, thumbnail
    }
    ↓
    [Async Media Worker Job]
    ├─ Download audio from YouTube
    ├─ Extract MP3 stream
    ├─ Validate output
    ├─ Upload to R2 object storage
    ├─ Update MediaAsset: status=READY, storageKey
    └─ Record metadata: fileSize, checksum, finalDuration
    ↓
Tape View renders
    ↓
PlaybackController detects provider
    ├─ IF provider="youtube" → YouTubeEngine (legacy fallback)
    ├─ IF provider="voice" → VoiceEngine
    └─ IF provider="media_asset" → AudioAssetEngine (NEW, uses HTML5)
    ↓
AudioAssetEngine instantiates
    ├─ Get signed/public URL from MediaAsset.storageKey
    ├─ Create HTMLAudioElement
    ├─ Attach native event listeners (not polling)
    ↓
HTML5 Audio controls playback
    ├─ Supports background tab
    ├─ Supports screen-off playback
    └─ Integrates with MediaSession API
```

### 3.2 New Database Models

```prisma
// NEW: Track processing job & result
model MediaAsset {
  id              String   @id @default(cuid())
  
  // Source identification
  provider        String   // "youtube"
  providerTrackId String   // YouTube video ID
  
  // Metadata
  title           String
  artist          String?
  durationSec     Int      // Original duration
  
  // Processing state
  status          String   @default("PENDING")
  // Values: PENDING | VALIDATING | DOWNLOADING | CONVERTING | UPLOADING | READY | FAILED | EXPIRED
  
  // Attempt tracking (retries)
  attemptCount    Int      @default(0)
  lastAttemptAt   DateTime?
  nextAttemptAt   DateTime?
  
  // Error tracking
  error           String?  // Last error message
  errorDetails    String?  // Full stack or details
  
  // Storage
  storageProvider String?  // "r2" (for future multi-cloud support)
  storageKey      String?  // Path/key in R2 bucket: "media-assets/{id}.mp3"
  mimeType        String?  // "audio/mpeg"
  fileSize        Int?     // Bytes
  checksum        String?  // SHA-256 hash for integrity
  
  // Playback compatibility
  bitrate         Int?     // kbps, for UI
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  processedAt     DateTime?
  expiresAt       DateTime? // For temp storage cleanup
  
  // Relationships
  tracks          TapeTrack[]
  
  @@index([status])
  @@index([provider, providerTrackId])  // Duplicate prevention
  @@index([expiresAt])
}

// MODIFIED: Reference MediaAsset instead of duplicating metadata
model TapeTrack {
  id              String   @id @default(cuid())
  tapeId          String
  tape            Tape     @relation(fields: [tapeId], references: [id], onDelete: Cascade)
  side            String   // "A" | "B"
  position        Int
  
  // Playback metadata
  title           String
  artist          String?
  thumbnailUrl    String?
  personalNote    String?
  durationSec     Int?
  
  // Provider (EXTENDED)
  provider        String   @default("youtube")
  // Values: "youtube" (legacy) | "voice" | "media_asset" (NEW)
  
  // Provider-specific identifiers
  providerTrackId String   // YouTube ID, voice file ID, or mediaAssetId
  
  // NEW: Direct reference to processed asset (for provider="media_asset")
  mediaAssetId    String?
  mediaAsset      MediaAsset? @relation(fields: [mediaAssetId], references: [id], onDelete: SetNull)
  
  createdAt       DateTime @default(now())

  @@index([tapeId])
  @@index([mediaAssetId])
}
```

### 3.3 Storage Architecture

```
┌─────────────────────────────────────┐
│   Cassette Next.js App (Vercel)    │
│                                     │
│  addTrack() server action           │
│    ├─ Validate YouTube              │
│    ├─ Create MediaAsset (PENDING)   │
│    ├─ Create TapeTrack              │
│    └─ Emit job event                │
│                                     │
│  Playback request                   │
│    ├─ Check MediaAsset.status       │
│    ├─ Get signed URL from R2        │
│    └─ Pass to AudioAssetEngine      │
└─────────────────────────────────────┘
            ↑
            │ (poll for status)
            │ (publish job)
            │
    ┌───────────────┐
    │  PostgreSQL   │
    │  (Neon)       │
    │               │
    │  MediaAsset   │
    │  TapeTrack    │
    │  ...          │
    └───────────────┘
            ↑
            │ (read/write jobs)
            │
┌─────────────────────────────────────┐
│   External Media Worker             │
│   (Node.js + TypeScript)            │
│                                     │
│  Poll for PENDING jobs              │
│    ├─ Download from YouTube         │
│    │   (using yt-dlp)               │
│    ├─ Extract MP3 stream            │
│    ├─ Validate format               │
│    ├─ Upload to R2                  │
│    └─ Update MediaAsset (READY)     │
│                                     │
│  Max concurrent: 3 (configurable)   │
│  Retry: exponential backoff         │
│  Timeout: 5 min per job             │
└─────────────────────────────────────┘
            ↑
            │ (upload MP3)
            │
    ┌──────────────────┐
    │ Cloudflare R2    │
    │ (Object Storage) │
    │                  │
    │ /media-assets/   │
    │  {id}.mp3        │
    │                  │
    │ Signed URLs      │
    │ Range requests   │
    │ CORS enabled     │
    └──────────────────┘
            ↑
            │ (request MP3)
            │
    ┌──────────────────────────┐
    │  Browser / AudioElement  │
    │  (Client-side playback)  │
    │                          │
    │  AudioAssetEngine        │
    │  ├─ Load MP3 from URL    │
    │  ├─ Attach event list.   │
    │  └─ Play / pause / seek  │
    │                          │
    │  MediaSession API        │
    │  ├─ Lock screen controls │
    │  └─ Background support   │
    └──────────────────────────┘
```

### 3.4 Operational Flow: Adding a YouTube Track

```
1. USER INTERFACE (Frontend)
   ├─ User searches for song
   ├─ Selects YouTube result
   ├─ Clicks "Add to Side A/B"
   └─ Optimistic UI update: "Preparing audio..."

2. SERVER ACTION: addTrack()
   ├─ Verify tape ownership (draft token)
   ├─ Validate YouTube video
   │   └─ Check availability, duration, geo-restrictions
   ├─ CREATE MediaAsset record
   │   ├─ status: PENDING
   │   ├─ providerTrackId: videoId
   │   ├─ title, artist from YouTube
   │   └─ attemptCount: 0
   ├─ CREATE TapeTrack record
   │   ├─ provider: "media_asset"
   │   ├─ mediaAssetId: newly created MediaAsset.id
   │   └─ durationSec: from YouTube validation
   ├─ Emit event / queue job
   │   └─ Signal worker: "process MediaAsset {id}"
   └─ RETURN to UI
       ├─ Track appears in tape with status badge "Preparing..."
       ├─ Position is locked (cannot remove yet, prevents race)
       └─ User can continue editing other tracks

3. WORKER POLLING LOOP (Every 5 seconds)
   ├─ Query MediaAsset WHERE status=PENDING AND nextAttemptAt <= NOW
   ├─ FOR each job:
   │   ├─ Lock row (UPDATE status=PROCESSING, workerId)
   │   ├─ Download phase
   │   │   ├─ Fetch audio stream from YouTube
   │   │   ├─ Save to temp file: /tmp/media-{id}.webm
   │   │   └─ Validate format (not corrupted, has audio)
   │   ├─ Convert phase
   │   │   ├─ FFmpeg convert to MP3 (128kbps or configured bitrate)
   │   │   ├─ Output: /tmp/media-{id}.mp3
   │   │   ├─ Validate MP3 integrity
   │   │   └─ Compute SHA-256 checksum
   │   ├─ Upload phase
   │   │   ├─ PUT to R2: /media-assets/{id}.mp3
   │   │   ├─ Verify upload (HEAD request)
   │   │   └─ Get R2 URL
   │   ├─ Update MediaAsset
   │   │   ├─ status: READY
   │   │   ├─ storageKey: media-assets/{id}.mp3
   │   │   ├─ fileSize: (from upload)
   │   │   ├─ checksum: (SHA-256)
   │   │   ├─ processedAt: NOW
   │   │   └─ attemptCount+1
   │   └─ Clean up temp files
   │
   └─ Handle errors
       ├─ status: FAILED
       ├─ error: human-readable message
       ├─ errorDetails: full stack trace
       ├─ nextAttemptAt: NOW + exponential backoff
       └─ if attemptCount > MAX_RETRIES: mark EXPIRED

4. FRONTEND: Polling MediaAsset Status
   ├─ Track details page polls /api/media-assets/{id}/status
   ├─ Status progresses: PENDING → DOWNLOADING → CONVERTING → UPLOADING → READY
   ├─ UI updates badge: "Preparing... 30%" → "Ready ✓"
   └─ On failure: "Failed to prepare" + "Retry" button

5. PLAYBACK TIME
   ├─ User presses Play on track
   ├─ PlaybackController detects provider="media_asset"
   ├─ Queries MediaAsset.storageKey
   ├─ Requests signed URL from Cassette API
   │   └─ /api/media-assets/{id}/url (server generates R2 signed URL)
   ├─ AudioAssetEngine loads URL
   ├─ Browser requests MP3 from R2
   │   ├─ HTTP range requests for seeking
   │   └─ Streaming playback
   └─ MediaSession + HTML5 Audio handles background/screen-off
```

### 3.5 Processing State Machine

```
                    ┌─────────────────────────────┐
                    │      PENDING                │
                    │  (job queued, not started)  │
                    └──────────────┬──────────────┘
                                   │ worker picks up
                                   ▼
                    ┌─────────────────────────────┐
                    │    VALIDATING / DOWNLOADING │
                    │   (fetching from YouTube)   │
                    └──────────────┬──────────────┘
                                   │ download successful
                                   ▼
                    ┌─────────────────────────────┐
                    │      CONVERTING             │
                    │   (FFmpeg to MP3)           │
                    └──────────────┬──────────────┘
                                   │ convert successful
                                   ▼
                    ┌─────────────────────────────┐
                    │      UPLOADING              │
                    │  (to R2 object storage)     │
                    └──────────────┬──────────────┘
                                   │ upload successful
                                   ▼
                    ┌─────────────────────────────┐
                    │      READY ✓                │
                    │ (playable, storageKey set)  │
                    └─────────────────────────────┘
                                   ▲
                    ┌──────────────┴──────────────┐
        ERROR 1     │                             │ RETRY
        (any phase) │                             │ (exponential backoff)
                    ▼                             │
                    ┌─────────────────────────────┐
                    │      FAILED                 │
                    │  (error message set)        │
                    │  (nextAttemptAt set)        │
                    └─────────────────────────────┘
                                   ▲
                                   │ max retries exceeded
                                   │ OR manual cleanup
                    ┌──────────────┴──────────────┐
                    │      EXPIRED                │
                    │  (do not retry further)     │
                    └─────────────────────────────┘
```

---

## 4. What Can Be Reused

### ✅ Reusable Components

1. **Existing Playback Architecture**
   - `PlaybackController` singleton (no changes needed)
   - `PlaybackEngine` interface (can add new implementation)
   - `MediaSession` integration (works with HTML5 audio)
   - `usePlaybackState()` hook (works with new engine)

2. **Existing Server Actions**
   - `addTrack()` logic (extended, not replaced)
   - `validateYouTubeVideo()` (used as-is)
   - Rate limiting infrastructure (applies to new jobs too)
   - Safety/spam checks (applied at publish time)

3. **Existing Database Patterns**
   - Tape + TapeTrack relationships (extended, not replaced)
   - Prisma ORM and migrations
   - Indexes and query patterns

4. **Existing Voice Message Flow**
   - VoiceEngine HTML5 audio handling
   - Audio event patterns (can reuse in new AudioAssetEngine)
   - Storage URL resolution pattern

5. **Existing UI Components**
   - PlayerBar (works with new engine)
   - TapeViewClient (no changes needed)
   - TrackList rendering (shows processing status)

### ❌ What Must Change

1. **Database Schema**
   - Add MediaAsset model
   - Add mediaAssetId foreign key to TapeTrack
   - Prisma migration required

2. **Server Actions** (`app/actions/tape.ts`)
   - `addTrack()`: Create MediaAsset record on YouTube tracks
   - New action: `getMediaAssetStatus()` (status polling)
   - New action: `retryMediaAsset()` (manual retry)

3. **Playback System** (`lib/playback/`)
   - NEW: `AudioAssetEngine.ts` (HTML5 audio wrapper)
   - MODIFIED: `PlaybackController.ts` (instantiate AudioAssetEngine for provider="media_asset")
   - MODIFIED: `types.ts` (extend TrackProvider type)

4. **API Routes** (`app/api/`)
   - NEW: `/api/media-assets/[id]/status` (fetch job status)
   - NEW: `/api/media-assets/[id]/url` (generate signed R2 URL)
   - NEW: `/api/media-assets/[id]/retry` (retry failed job)

5. **Worker** (NEW, external)
   - Standalone Node.js service with TypeScript
   - Connects to Neon PostgreSQL
   - Runs yt-dlp + FFmpeg
   - Uploads to Cloudflare R2
   - Runs in Docker container (not Vercel)

6. **Storage** (NEW)
   - R2 bucket configuration
   - Presigned URL generation
   - CORS settings for browser playback
   - Range request support

---

## 5. What Must NOT Change

1. ✅ YouTube search remains unchanged
2. ✅ Voice recording flow unchanged
3. ✅ Cassette creation/publishing UX unchanged
4. ✅ Recipient playback experience unchanged (only improvements)
5. ✅ MediaSession integration (works as-is with HTML5)
6. ✅ Existing published tapes continue to work
7. ✅ Draft tokens and authorization (no schema changes)
8. ✅ Rate limiting and safety systems

---

## 6. New Files & Modifications Summary

### New Files

```
lib/playback/AudioAssetEngine.ts           (≈300 lines)
lib/storage/R2Service.ts                   (≈150 lines)
lib/media-asset.ts                         (utilities, ≈100 lines)
app/api/media-assets/[id]/status/route.ts  (≈100 lines)
app/api/media-assets/[id]/url/route.ts     (≈100 lines)
app/api/media-assets/[id]/retry/route.ts   (≈100 lines)
prisma/migrations/[timestamp]_add_media_asset/migration.sql
worker/                                    (≈2000 lines total)
  ├─ package.json
  ├─ tsconfig.json
  ├─ src/index.ts                          (main worker loop)
  ├─ src/processors/youtube.ts             (yt-dlp wrapper)
  ├─ src/processors/ffmpeg.ts              (conversion logic)
  ├─ src/storage/R2Client.ts               (upload logic)
  └─ src/database.ts                       (Prisma client)
```

### Modified Files

```
app/actions/tape.ts                        (+50 lines)
app/lib/types.ts                           (+3 lines, extend TrackProvider)
lib/playback/PlaybackController.ts         (+20 lines)
lib/playback/types.ts                      (+1 line)
prisma/schema.prisma                       (+40 lines)
next.config.ts                             (+5 lines, for media asset routes)
.env.example                               (+8 lines, new vars)
package.json                               (+2 dependencies)
```

---

## 7. Environment Variables & Configuration

### New .env Variables (App)

```bash
# R2 Object Storage
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_key_id
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET_NAME=cassette-media-assets
R2_PUBLIC_BASE_URL=https://media.cassette-share.com

# Media Worker Communication
MEDIA_WORKER_SECRET=random_secret_key_for_worker_auth
MEDIA_WORKER_POLL_INTERVAL_SEC=5

# Processing Limits
MAX_CONCURRENT_DOWNLOADS=3
MAX_RETRIES=3
RETRY_BACKOFF_BASE_MINUTES=1
MAX_FILE_SIZE_MB=50
TARGET_BITRATE_KBPS=128
```

### New .env Variables (Worker)

```bash
# Database
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...

# R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=cassette-media-assets

# Processing
MAX_CONCURRENT_DOWNLOADS=3
TEMP_DIR=/tmp/cassette-media-processing
LOG_LEVEL=info
WORKER_ID=worker-1  # for coordinated multi-worker setup
```

---

## 8. Migration & Backward Compatibility Strategy

### No Breaking Changes

1. **Existing YouTube tracks** remain playable with YouTubeEngine
2. **New tracks** use MediaAsset provider automatically
3. **Voice messages** unaffected (separate VoiceEngine)
4. **Existing published tapes** continue working
5. **Database migration** adds tables, no deletes/modifications

### Graceful Degradation

```
IF provider="youtube"
  IF mediaAsset exists AND status=READY
    use AudioAssetEngine (NEW) → better background support
  ELSE
    use YouTubeEngine (LEGACY) → fallback works always

IF provider="voice"
  use VoiceEngine (EXISTING)

IF provider="media_asset"
  use AudioAssetEngine (NEW) → primary path
```

### Migration Path

When updating:
1. Deploy Prisma migration (adds MediaAsset + mediaAssetId)
2. Deploy updated addTrack() (creates MediaAsset records)
3. Deploy new API routes + AudioAssetEngine
4. Deploy worker (starts processing PENDING jobs)
5. Old tapes continue working (YouTubeEngine as fallback)
6. New tapes automatically process in background

---

## 9. Key Architectural Decisions & Tradeoffs

### Decision 1: Provider Abstraction vs. Complete Replacement
**Choice:** Extend existing provider system  
**Rationale:**
- Requires minimal database changes
- Avoids breaking existing tapes
- Allows gradual migration
- Familiar to existing codebase

**Alternative Rejected:** Replace YouTubeEngine completely
- Would require backfilling all existing tapes
- Higher risk of regression
- More complex migration

---

### Decision 2: External Worker vs. Vercel Serverless
**Choice:** Separate external worker service  
**Rationale:**
- Media processing (download + convert + upload) takes 1-5 minutes
- Vercel function timeout is ≈30 seconds
- Polling/retries require persistent state
- yt-dlp + FFmpeg require binary execution (not available on Vercel)

**Alternative Rejected:** Use Vercel Functions
- Would timeout on most conversions
- Cannot reliably retry across function boundaries
- No native system binary support

**Implementation Options:**
- Railway.app (recommended: simple, affordable, supports Docker)
- Fly.io (scalable, good for distributed workers)
- Self-hosted VPS (more control, more ops burden)
- AWS Lambda (complex, overkill for MVP)

---

### Decision 3: MP3 Only vs. Multiple Formats
**Choice:** MP3 only for MVP  
**Rationale:**
- Universal browser support
- Mature codec, stable
- Predictable file sizes
- Can add formats later without schema changes

**Future:** Support WAV, AAC, OGG via configurable bitrate

---

### Decision 4: R2 vs. S3 vs. Local Storage
**Choice:** Cloudflare R2 (S3-compatible)  
**Rationale:**
- S3 API compatibility (can migrate later)
- Presigned URL support
- CORS configuration
- Cost-effective (no egress fees)
- Zero setup complexity (managed service)

**Local storage not viable:**
- Vercel functions are read-only
- Need durable, distributed storage
- Need CORS for browser playback

---

### Decision 5: Synchronous vs. Async Processing
**Choice:** Async (fire-and-forget)  
**Rationale:**
- User doesn't wait for 5-minute processing
- Better UX ("Preparing audio...")
- Prevents request timeouts
- Aligns with REST/serverless constraints

**Status polling:** Frontend polls MediaAsset.status every 3 seconds

---

### Decision 6: Job Queue vs. Database-Driven Polling
**Choice:** Database-driven polling  
**Rationale:**
- Minimal infra (no Redis, RabbitMQ)
- Durable (survives worker restart)
- Simple coordination (database locking)
- Suitable for MVP concurrency (3 concurrent jobs)

**Trade-off:** Slight latency (5-second poll interval) is acceptable

**Future Upgrade Path:** Can swap for Redis + Bull if needed

---

## 10. Security Considerations

### Input Validation
- YouTube video IDs: Validated before MediaAsset creation
- File size limits: 50MB max (configurable)
- Duration limits: 10 minutes max (prevents abuse)
- Rate limiting: Inherits existing 10 drafts/hour limit

### Secrets Management
- R2 credentials: Environment variables (never in code)
- Signed URLs: Generated server-side (expire after 1 hour)
- Worker auth: HMAC-SHA256 signature on job updates

### File Security
- Temp files: Stored in isolated `/tmp/cassette-media-processing/{worker-id}/`
- Cleanup: Aggressive deletion after upload
- Permissions: Worker runs as unprivileged user

### Command Injection Prevention
- yt-dlp: Called with argument array (not shell exec)
- FFmpeg: Called with argument array (not shell exec)
- No user input in shell commands

---

## 11. Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Track addition latency | <500ms | User sees track added immediately |
| Job pickup latency | <10s | Worker polls every 5s |
| Download phase | <1min | YouTube stream extraction |
| FFmpeg conversion | <2min | MP3 @ 128kbps |
| R2 upload | <30s | 10-40 MB files |
| Total processing | <5min | End-to-end |
| Playback start latency | <1s | Presigned URL + buffering |
| Background playback reliability | >95% | Browser/OS dependent |
| Concurrent jobs | 3 (configurable) | Memory/CPU bound |

---

## 12. Testing Strategy

### Unit Tests
- MediaAsset state transitions
- R2Service URL generation
- AudioAssetEngine event handling

### Integration Tests
- addTrack() creates MediaAsset
- Worker polling finds PENDING jobs
- yt-dlp download succeeds
- FFmpeg conversion produces valid MP3
- R2 upload succeeds
- Signed URL generation works

### End-to-End Tests
- User adds YouTube track → status badge appears
- Status updates from "Preparing..." → "Ready"
- Click play → AudioAssetEngine loads → plays
- Scrub works → Range requests to R2
- Background tab → audio continues (browser-dependent)
- Screen off → audio continues (browser/OS-dependent)

### Regression Tests
- Existing YouTube tracks (YouTubeEngine) still playable
- Voice messages still playable
- Existing published tapes unchanged
- MediaSession controls work
- Playlist import unaffected

---

## 13. Error Handling & Resilience

### Failure Scenarios

| Scenario | Handling |
|----------|----------|
| YouTube video unavailable | Fail job, show "Video no longer available" |
| Download network timeout | Retry with exponential backoff |
| FFmpeg crash | Fail job, log error, alert |
| R2 upload fails | Retry with exponential backoff |
| R2 authentication fails | Fail job, check credentials, alert |
| Temp disk full | Fail job, clean up, alert |
| Malformed MP3 output | Validate before upload, fail if invalid |
| Worker crashes mid-job | Lock released (timeout-based), job retried |
| Presigned URL expires | Generate new URL on-demand |

### User Experience

```
User adds track
    ↓ (immediately)
"Preparing audio..." appears
    ↓
IF processing succeeds:
    "Ready ✓"
    ↓
    User can play

IF processing fails:
    "Failed to prepare audio"
    + Retry button
    + Error details (user-friendly)
```

---

## 14. Deployment & Operations

### Deployment Checklist

- [ ] Create Cloudflare R2 bucket
- [ ] Generate R2 API credentials
- [ ] Create PostgreSQL migration
- [ ] Deploy Prisma schema
- [ ] Deploy Next.js API routes
- [ ] Deploy AudioAssetEngine
- [ ] Deploy worker service (Docker container)
- [ ] Configure worker environment variables
- [ ] Run initial worker batch job (empty queue)
- [ ] Monitor processing latency
- [ ] Verify signed URL generation
- [ ] Test background playback

### Monitoring & Observability

```
Metrics to track:
- Media jobs created per day
- Processing success rate
- Average processing time (by phase)
- R2 upload errors
- yt-dlp errors
- FFmpeg errors
- Worker uptime
- Retry rate
- Presigned URL hits

Logs:
- Job state transitions
- Errors with full context
- Performance metrics
```

---

## 15. Risk Assessment & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| R2 outage | No new tracks playable | Low | Graceful fallback to YouTubeEngine |
| Worker crash | Queue builds up | Low | Auto-restart, alerting |
| FFmpeg bug | Conversion fails | Low | Version pinning, validation |
| yt-dlp outdated | YouTube blocks | Medium | Regular updates, version matrix |
| Runaway processes | OOM/CPU spike | Low | Process limits, timeouts |
| Storage quota exceeded | Upload fails | Low | Quota monitoring, alerts |
| Presigned URL abuse | Potential DoS | Medium | Rate limiting, IP-based access |
| Disk space exhausted | Job fails | Low | Cleanup policies, monitoring |

---

## 16. Success Criteria

### Phase 3 (This Implementation)

✅ **Must Have:**
- MediaAsset database model working
- addTrack() creates MediaAsset records
- Worker successfully processes YouTube → MP3
- R2 storage integration complete
- AudioAssetEngine plays MP3 files
- Background playback works (browser-dependent)
- Status UI shows processing state
- Error recovery works (retry button)
- Backward compatibility preserved
- No existing features broken

⚠️ **Should Have:**
- Processing latency <5 minutes average
- Success rate >95%
- Graceful fallback if worker unavailable
- Comprehensive error messages
- Worker autoscaling prepared (for future)

❌ **Nice to Have (Future):**
- Multiple audio formats
- Adaptive bitrate
- Parallel processing optimization
- Analytics on processing performance

---

## 17. Implementation Estimate

| Phase | Component | Effort | Dependency |
|-------|-----------|--------|-----------|
| Schema | Prisma migration | 4h | —— |
| API | Media asset endpoints | 12h | Schema |
| Engine | AudioAssetEngine | 8h | Types |
| Integration | Server actions | 6h | Engine |
| Storage | R2Service | 6h | —— |
| Worker | Job processing loop | 16h | Storage + DB |
| Testing | E2E validation | 12h | All above |
| Docs | README + guides | 8h | —— |
| **TOTAL** | | **~72h** | ~2 weeks (1 FTE) |

---

## 18. Next Steps

### Upon Approval:

1. **Phase 3 (Schema):** Add MediaAsset model, create Prisma migration
2. **Phase 4 (Ingestion Service):** Implement media job management in server actions
3. **Phase 5 (Worker):** Build media processing service
4. **Phase 6 (Storage):** Integrate R2, presigned URLs
5. **Phase 7 (Engine):** Implement AudioAssetEngine
6. **Phase 8 (Integration):** Connect all components, UI updates
7. **Phase 9 (Testing):** End-to-end validation
8. **Phase 10 (Deployment):** Production rollout

---

## 19. Appendix: File Structure

```
cassette-app/
├── prisma/
│   ├── schema.prisma               (MediaAsset + mediaAssetId added)
│   └── migrations/
│       └── [timestamp]_add_media_asset/
│           └── migration.sql
├── app/
│   ├── actions/
│   │   └── tape.ts                 (addTrack modified, new retryMediaAsset)
│   ├── api/
│   │   └── media-assets/
│   │       └── [id]/
│   │           ├── status/
│   │           │   └── route.ts    (NEW)
│   │           ├── url/
│   │           │   └── route.ts    (NEW)
│   │           └── retry/
│   │               └── route.ts    (NEW)
│   └── lib/
│       └── media-asset.ts          (NEW utilities)
├── lib/
│   ├── playback/
│   │   ├── AudioAssetEngine.ts     (NEW)
│   │   ├── PlaybackController.ts   (modified)
│   │   └── types.ts                (modified)
│   └── storage/
│       └── R2Service.ts            (NEW)
├── worker/                         (NEW external service)
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── src/
│   │   ├── index.ts                (main loop)
│   │   ├── database.ts
│   │   ├── processors/
│   │   │   ├── youtube.ts
│   │   │   └── ffmpeg.ts
│   │   └── storage/
│   │       └── R2Client.ts
│   └── README.md
├── .env.example                    (new vars)
├── next.config.ts                  (minor updates)
└── package.json                    (minor deps)
```

---

## 20. Approval & Sign-Off

**Document Status:** Ready for Implementation Phase 3

**Approved by:** [Awaiting User Confirmation]

**To proceed, confirm:**
- [ ] Architecture aligns with Cassette vision
- [ ] External worker deployment acceptable
- [ ] R2 storage provider acceptable
- [ ] Backward compatibility strategy acceptable
- [ ] Risk mitigation sufficient

---

**End of Architecture Report**

Next step: User approval → Phase 3 implementation (Database Schema Extension)
