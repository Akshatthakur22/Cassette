# Playlist Metadata Guide — CASSETTE

## Overview

CASSETTE tracks and displays playlist source information when tapes are created from YouTube playlists. This allows users to:
- See where a tape came from
- Visit the original YouTube playlist
- Understand the context of the tape

## Database Schema

Added to `Tape` model in Prisma:

```prisma
model Tape {
  // ... existing fields
  
  // Playlist metadata (optional, for playlists created from YouTube)
  playlistSourceId  String?     // YouTube playlist ID
  playlistSourceUrl String?     // Original YouTube playlist URL
  playlistName      String?     // Original playlist name from YouTube
}
```

## Implementation

### 1. Utility Functions

**File:** `app/lib/playlist-metadata.ts`

Provides:
- `isFromPlaylist()` — Check if tape was created from a playlist
- `getPlaylistSourceBadge()` — Get badge display info
- `getPlaylistDisplayInfo()` — Get detailed display data
- `getPlaylistLink()` — Get YouTube link
- `trackPlaylistView()` — Analytics event for playlist views
- `getPlaylistShareDescription()` — Generate share text
- `enrichTapeWithPlaylistData()` — Add helpers to tape object

### 2. Display Components

#### PlaylistMetadataBadge

Small badge showing playlist source (displayed in header):

```tsx
<PlaylistMetadataBadge
  playlistSourceId={tape.playlistSourceId}
  playlistSourceUrl={tape.playlistSourceUrl}
  playlistName={tape.playlistName}
  size="small"  // or "medium", "large"
  showIcon={true}
/>
```

**Output:**
```
🎵 From: My Favorite Songs
```

#### PlaylistMetadataSection

Detailed section for inside tape view (displayed after tracklist):

```tsx
<PlaylistMetadataSection
  playlistSourceId={tape.playlistSourceId}
  playlistSourceUrl={tape.playlistSourceUrl}
  playlistName={tape.playlistName}
  senderName="Alice"
/>
```

**Output:**
```
🎵 Playlist Source

Playlist Name
"My Favorite Songs"

From YouTube playlist

🔗 View original playlist on YouTube

Alice curated this tape from "My Favorite Songs"
```

### 3. Integration in TapeViewClient

Added to `TapeViewClient.tsx`:

1. **Header badge** — Shows just below the recipient name
   - Appears only if tape has playlist metadata
   - Links to YouTube playlist
   - Animated entrance

2. **Detailed section** — Appears after tracklist
   - Full playlist information
   - Click to visit original playlist
   - Shows sender's name + playlist

3. **Analytics tracking** — On tape view
   - Tracks when users view tapes with playlist metadata
   - Sends to PostHog analytics

## Data Flow

### Creating a Tape from Playlist

When user imports songs from YouTube playlist:

```
YouTube API
  ↓
/api/youtube/playlists/search
  ↓
Get playlistId, playlistName, playlistUrl
  ↓
Store in Tape.playlistSourceId, playlistSourceUrl, playlistName
  ↓
Display in UI
```

### Displaying Tape

When user views a tape:

```
Fetch Tape (includes playlistSourceId, playlistSourceUrl, playlistName)
  ↓
Check isFromPlaylist() → show badge if true
  ↓
Animate badge in header
  ↓
Display detailed section after tracklist
  ↓
Track analytics event
```

## UI/UX

### Visual Hierarchy

1. **Badge in header** (high visibility)
   - Small, non-intrusive
   - Shows key info at a glance
   - Links to source

2. **Detailed section** (contextual)
   - After tracklist, before actions
   - Blue theme to distinguish
   - Educational copy

### Responsive Design

- **Mobile**: Badge stacks below sender info
- **Tablet**: Badge inline with header
- **Desktop**: Full spacing with icon

## Analytics

Track these events:

```typescript
// When tape with playlist metadata is viewed
{
  event: "playlist_metadata_viewed",
  tapeId: "tape-123",
  playlistSourceId: "PLxxx",
  playlistName: "My Favorites",
  hasSourceUrl: true
}
```

## API Integration

### YouTube Playlists API

When fetching playlist information:

```
GET /api/youtube/playlists/search?q=something
GET /api/youtube/playlists/items?playlistId=PLxxx
```

Response includes:
- `playlistId` → stored in `Tape.playlistSourceId`
- `playlistName` → stored in `Tape.playlistName`
- `playlistUrl` → stored in `Tape.playlistSourceUrl`

## Edge Cases

### Missing Data

If `playlistSourceId` exists but `playlistName` is null:
- Badge still shows: "🎵 From YouTube playlist"
- Detailed section not shown
- Link still works if URL exists

### Old Tapes

Tapes created before this feature won't have playlist metadata:
- Badge not shown (null fields)
- No playlist section displayed
- Works seamlessly with existing tapes

### Privacy

- Playlist URLs are public YouTube links
- Only user who owns tape can modify metadata
- Analytics track aggregate stats, not individual users

## Testing

### Manual Testing

1. Create a tape from a YouTube playlist
2. Visit the tape page
3. Verify badge appears below sender name
4. Verify detailed section appears after tracklist
5. Click "View on YouTube" → should open playlist
6. Check browser DevTools → verify analytics event sent

### Test Cases

- [ ] Tape WITH playlist metadata shows badge and section
- [ ] Tape WITHOUT playlist metadata doesn't show anything
- [ ] Badge links to correct YouTube URL
- [ ] Playlist name displays correctly
- [ ] Analytics event fires on page load
- [ ] Share text includes playlist name
- [ ] Mobile layout is responsive
- [ ] Dark mode contrast is acceptable

## Future Enhancements

Possible improvements:

1. **Playlist sync** — Auto-update if original playlist changes
2. **Playlist stats** — Show view count, subscriber count
3. **Related tapes** — "Other tapes from this playlist"
4. **Curation badge** — Special badge for popular playlists
5. **Playlist comparison** — "How does this tape compare to original?"
6. **Archive warning** — If original playlist is deleted

## References

- YouTube Data API: https://developers.google.com/youtube/v3
- Playlist Search Endpoint: `/api/youtube/playlists/search`
- Playlist Items Endpoint: `/api/youtube/playlists/items`
- Tape data model: `prisma/schema.prisma`
- Related files:
  - `app/lib/playlist-metadata.ts`
  - `app/components/PlaylistMetadataBadge.tsx`
  - `app/components/PlaylistMetadataSection.tsx`
  - `app/components/TapeViewClient.tsx`
