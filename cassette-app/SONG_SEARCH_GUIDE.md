# 🎵 Song Search Library - User Guide

## Overview

The Song Search Library is an external component that allows users to:
- 🔍 Search your database library of 249+ songs
- 📺 Search YouTube for any song
- 🎯 Filter and sort results
- ✨ Create custom cassettes from selected songs
- 📤 Share public playlists

## Features

### 1. Search Both Sources
- **Library**: Pre-downloaded, ready-to-play songs (READY status)
- **YouTube**: Any video accessible via YouTube API
- **All**: Combined results from both sources

### 2. Advanced Filtering
- Duration range (min/max seconds)
- Status filter (READY, FAILED)
- Sort by relevance or duration
- Real-time search with debouncing

### 3. Song Selection
- Select up to 100 songs at once
- Preview available for library songs
- Quick visual indicators (badges show source/status)
- Easy add/remove interface

### 4. Cassette Creation
- Name your cassette
- Auto-split tracks into Side A & B
- Instantly shareable link
- Public visibility for discovery

## How to Use

### 1. Access the Search Library
```
http://localhost:3000/search-library
```

### 2. Search for Songs
- Type in the search box (min 2 characters)
- Results show immediately with 300ms debounce
- Switch between tabs: All / Library / YouTube

### 3. Filter Results (Optional)
- Click "Filter" button
- Set duration range
- Check "Library Only" for READY songs only

### 4. Select Songs
- Click checkbox next to each song
- Selected songs appear in sidebar
- Max 100 songs per cassette

### 5. Create Cassette
- Enter cassette name
- Review selected songs in sidebar
- Click "🎬 Create Cassette"
- Redirects to public cassette link

## Component Props

```typescript
interface SongSearchLibraryProps {
  onSongsSelected?: (songs: Song[]) => void;  // Callback when songs added
  maxSelections?: number;                      // Max songs (default 100)
  mode?: 'single' | 'multiple';               // Selection mode
}
```

## API Endpoints

### Search API
```
GET /api/search?q=<query>&source=<source>&limit=<limit>
```

**Query Parameters:**
- `q`: Search query (min 2 chars, required)
- `source`: 'youtube' | 'library' | 'all' (default: 'all')
- `limit`: Results per source (default: 20, max: 50)

**Response:**
```json
{
  "query": "string",
  "source": "string",
  "count": 20,
  "songs": [
    {
      "id": "abc123",
      "title": "Song Title",
      "artist": "Artist Name",
      "thumbnailUrl": "...",
      "durationSec": 180,
      "source": "library",
      "status": "READY"
    }
  ]
}
```

## Database Integration

### Library Songs
- Source: `MediaAsset` table
- Filter: `status = 'READY'`
- Searchable fields: `title`, `artist`
- Immediately playable

### YouTube Songs
- Source: YouTube Data API v3
- No database storage
- Marked for future download
- Requires API key in `.env.local`

## Configuration

### Required Environment Variables
```env
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### Optional Settings
- `SongSearchLibrary.maxSelections`: Change max songs (default 100)
- `SongSearchLibrary.mode`: Use 'single' for one song at a time

## Example Usage in Code

```tsx
import { SongSearchLibrary } from '@/app/components/SongSearchLibrary';

export default function MyPage() {
  const handleSongsSelected = (songs) => {
    console.log('Selected:', songs);
    // Add to cassette, save to DB, etc.
  };

  return (
    <SongSearchLibrary
      onSongsSelected={handleSongsSelected}
      maxSelections={50}
      mode="multiple"
    />
  );
}
```

## Keyboard Shortcuts
- `/search-library` - Access search page
- `Ctrl+F` - Focus search input
- `↑/↓` - Navigate song list
- `Space` - Toggle selection

## Tips & Tricks

✅ **Search for multiple keywords**: "Salman Khan Romantic"  
✅ **Use artist names**: "Shah Rukh Khan" or "A.R. Rahman"  
✅ **Filter by duration**: 180-240 seconds for standard songs  
✅ **Start with library**: Faster and always available  
✅ **Mix sources**: Add library songs + YouTube songs to same cassette  

## Troubleshooting

### No results found
- Check search query (min 2 characters)
- Verify YouTube API key is set
- Try searching just artist name

### YouTube results not showing
- Verify `YOUTUBE_API_KEY` in `.env.local`
- Check API quota hasn't been exceeded
- Try library-only search

### Song won't play
- Ensure status is "READY" (not "FAILED" or "PENDING")
- Check R2 storage key exists
- Verify file size > 0

### Can't create cassette
- Select at least 1 library song
- Use 2-100 songs
- Enter cassette name
- Check database connection

## Future Enhancements
- 🎵 Download YouTube songs on-demand
- 🎯 Create playlists by genre/mood
- 👥 Collaborate on cassettes
- 📊 Analytics (most searched, popular)
- 🔄 Sync to Spotify/Apple Music
