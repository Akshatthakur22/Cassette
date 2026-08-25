# Direct Upload & Playback System

**Status:** ✅ Ready for Users

## Overview

Cassette now supports **two ways to add songs**:

### Method 1: Automatic Download (Existing)
- User searches YouTube and selects a song
- **System checks if song already exists in database**
- If YES: Reuses existing MediaAsset (no re-download)
- If NO: Creates new job, triggers background worker
- Worker downloads, converts, uploads to R2
- Song available for playback when complete

### Method 2: Direct Upload (New - Immediate Playback)
- User manually downloads MP3 from any source
- User uploads MP3 directly via API or CLI tool
- **Bypasses background worker completely**
- File uploaded directly to R2
- **Song playable immediately** ✅

## How It Works

### Duplicate Prevention (Method 1)

When a user searches YouTube and adds a song:

```typescript
// Check if this YouTube video is already in the database
const existing = await findExistingMediaAsset(track.providerTrackId);

if (existing) {
  // ✅ Song found! Reuse it
  mediaAssetId = existing.id;
  // Status could be: PENDING, VALIDATING, DOWNLOADING, CONVERTING, UPLOADING, or READY
} else {
  // ❌ Song not found. Create new job
  const asset = await createMediaAsset(videoId, title, artist, duration);
  mediaAssetId = asset.id;
  // Trigger worker to process it
  triggerMediaAssetProcessing(mediaAssetId);
}
```

**Result:** Same song never downloaded twice

### Direct Upload API (Method 2)

**Endpoint:** `POST /api/media-assets/upload`

**Request:**
```bash
curl -X POST https://cassette-share.vercel.app/api/media-assets/upload \
  -F "file=@song.mp3" \
  -F "title=Song Title" \
  -F "artist=Artist Name"
```

**Parameters:**
- `file` (required): MP3 audio file (max 50MB)
- `title` (required): Song title
- `artist` (optional): Artist name
- `durationSec` (optional): Duration in seconds (auto-detected if missing)

**Response:**
```json
{
  "success": true,
  "mediaAssetId": "cmt8bj6yt0001141uxlkgav3a",
  "title": "Song Title",
  "artist": "Artist Name",
  "status": "READY",
  "storageKey": "media-assets/cmt8bj6yt0001141uxlkgav3a.mp3",
  "playbackUrl": "https://cassette-share.vercel.app/api/media-assets/cmt8bj6yt0001141uxlkgav3a/stream",
  "fileSize": 3247104,
  "durationSec": 210,
  "message": "File uploaded and ready to play immediately"
}
```

**Status Codes:**
- `201 Created`: Upload successful, ready to play immediately
- `400 Bad Request`: Invalid file or missing required fields
- `500 Server Error`: R2 upload failed

## Usage

### For Users: Method 1 (Recommended for Most Cases)

**Just search YouTube on Cassette:**
1. Go to Cassette app
2. Create/edit a tape
3. Search for a song on YouTube
4. Click "Add to Tape"
5. System automatically:
   - Checks if song exists
   - Downloads if needed
   - Makes it playable

**Benefits:**
- Simple UI
- No manual work
- Reuses existing downloads
- Automatic processing

### For Power Users: Method 2 (Direct Upload)

**Use this if you have MP3 files:**
1. Download MP3 from any source (YouTube, Spotify, local files, etc.)
2. Upload via API or CLI script
3. **Get immediate playback URL** (no waiting)
4. Add to tape using returned `mediaAssetId`

**Benefits:**
- Instant availability (no background processing)
- Works with any audio source
- Good for testing
- Bypass processing delays

## CLI Tool: Download & Upload

**Script:** `scripts/download-and-upload-song.js`

**Usage:**
```bash
# Download from YouTube and upload directly
node scripts/download-and-upload-song.js <videoId> [title] [artist]

# Examples:
node scripts/download-and-upload-song.js "EaaeuLFk5rg" "Tere Bin" "Atif Aslam"
node scripts/download-and-upload-song.js "mW1h0UeysDg"  # Title auto-fetched
```

**What it does:**
1. Downloads audio from YouTube using yt-dlp
2. Converts to MP3 (64 kbps, 22050 Hz, mono)
3. Uploads directly to Cassette via API
4. Returns playback URL immediately

**Output:**
```
Cassette: MANUAL DOWNLOAD & UPLOAD
================================================================================

📝 Starting download and upload process...
   Video ID: EaaeuLFk5rg
   Title: Tere Bin
   Artist: Atif Aslam

📥 Downloading audio from YouTube...
✅ Download complete

🔄 Converting to MP3 (64kbps)...
✅ Conversion complete

📤 Uploading to Cassette server...
✅ Upload complete

================================================================================
✅ SUCCESS! Song is now ready to play
================================================================================

📊 Upload Details:
   Media Asset ID: cmt8bj6yt0001141uxlkgav3a
   Title: Tere Bin
   Artist: Atif Aslam
   Status: READY
   File Size: 3.11 MB
   Duration: 210s

🎵 Playback URL:
   https://cassette-share.vercel.app/api/media-assets/cmt8bj6yt0001141uxlkgav3a/stream

✨ You can now add this song to your tapes!
```

## Architecture

### Database Deduplication (Method 1)

```
MediaAsset Table Schema:
┌─────────────────────────────────────────────────────────┐
│ id                                                       │
│ provider: "youtube"                                      │
│ providerTrackId: "EaaeuLFk5rg"  ← UNIQUE per video     │
│ status: "READY" | "PENDING" | "FAILED" ...             │
│ storageKey: "media-assets/{id}.mp3"  ← R2 location     │
│ fileSize: 3247104                                       │
│ checksum: "sha256hash"                                   │
│ createdAt, processedAt, attemptCount, etc.              │
└─────────────────────────────────────────────────────────┘

Unique Constraint:
  @@unique([provider, providerTrackId])
  
This ensures: Only ONE MediaAsset per YouTube video
```

### Query Flow

```
addTrack() called with YouTube video ID
     ↓
SELECT * FROM MediaAsset 
  WHERE provider='youtube' 
    AND providerTrackId='{videoId}'
    AND status IN ('PENDING', 'VALIDATING', ..., 'READY')
     ↓
Found? ┌─YES──→ Use existing ID
       │
       └─NO──→ Create new MediaAsset
```

## Current Status

✅ **Duplicate Prevention:** WORKING
- Songs checked before re-download
- Same video ID never processes twice
- Database constraint enforces uniqueness

✅ **Direct Upload:** READY
- Endpoint created and tested
- CLI tool provided
- Immediate playback after upload

✅ **Worker Pipeline:** OPTIMIZED
- Background processing works correctly
- 3 concurrent jobs
- Exponential backoff on failures

## Benefits

### For Users
- **No duplicate downloads** - save bandwidth
- **Faster playback** - already processed songs play immediately
- **Simple experience** - just search and add
- **Optional power tool** - direct upload for advanced users

### For Server
- **Reduced bandwidth usage** - same song downloaded once
- **Reduced R2 storage** - one file per unique video
- **Better resource usage** - worker processes new videos only
- **Scalable** - handled at database level with unique constraints

## Testing

**Verify deduplication works:**
```bash
# Add same song twice
curl "https://cassette-share.vercel.app/api/youtube/search?q=Tere%20Bin"

# Check database
SELECT COUNT(*) FROM MediaAsset WHERE providerTrackId='EaaeuLFk5rg'
# Should return: 1

# Both tapes reference same MediaAsset ID
SELECT mediaAssetId FROM TapeTrack WHERE title='Tere Bin'
# Should all have same mediaAssetId
```

**Test direct upload:**
```bash
node scripts/test-direct-upload.js
```

## Troubleshooting

**Q: Why is my song status still PENDING?**
A: The background worker hasn't processed it yet. It could be:
- Worker queue is full (max 3 concurrent)
- Network issue during download
- Video unavailable or restricted

Solution: Check `/api/analytics/worker` for metrics, or retry manually

**Q: Can I add the same song to multiple tapes?**
A: Yes! The TapeTrack table links to the same MediaAsset. When one tape plays the song, it references the same file in R2.

**Q: Does direct upload also check for duplicates?**
A: Yes. The upload endpoint stores the file with mediaAssetId as filename. If you upload the same file twice, the second upload will update the first MediaAsset record.

**Q: Why are some videos failing to download?**
A: Common reasons:
- Video deleted or private
- Copyright protected
- Geo-restricted or age-restricted
- Network error

These are legitimate failures - user should choose different song.

## Future Improvements

1. **Batch upload** - Upload multiple MP3 files at once
2. **Audio normalization** - Improve audio quality before upload
3. **Metadata extraction** - Auto-fetch artist/album from MP3 tags
4. **Pre-processing** - Validate audio before upload
5. **Storage optimization** - Deduplicate based on audio hash (not just video ID)
6. **Alternative sources** - Support Spotify, SoundCloud, etc.

---

## Summary

✅ Cassette now efficiently handles songs:
- **Automatic deduplication** - Same video never processed twice
- **Direct upload** - Immediate playback for user files
- **Optimized worker** - Processes only new videos
- **Better scaling** - Database enforces constraints

Users get a simple experience: search, select, add, play. ✨
