# YouTube API Quota Fix - Step by Step

## Problem
Your YouTube API key is hitting the **100 searches/day limit** (quota exceeded error 429).

## Solution: Request Higher Quota (FREE)

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Select your Cassette project
3. Go to **APIs & Services** → **Quotas**

### Step 2: Find YouTube Data API v3
1. Search for "YouTube Data API v3" in the quotas list
2. Click on it to select

### Step 3: Request Quota Increase
1. Click the **"Edit Quotas"** button at the top
2. Find **"Search List Requests Per Day"** (currently showing 100)
3. Click on it and enter your desired limit:
   - For MVP/testing: 1,000/day (still FREE)
   - For production: 10,000/day (still FREE)
4. Click **"Next"** and complete the form
5. Google usually approves within **hours to 1 day**

### Step 4: What You Get
- **Free tier**: Up to 1M queries/day from Google Cloud
- **No credit card needed** for the increase
- YouTube charges quota units (1 search = 100 units, 1 video detail = 1 unit)

## How Cassette is Optimized to Use Less Quota

### 1. **Search Deduplication**
- If 2 users search for "Blinding Lights" simultaneously, only 1 API call is made
- Saves quota by preventing duplicate searches

### 2. **Smart Caching**
- Results cached for 1 hour in memory
- Results also cached 24 hours in database
- Repeated searches don't hit YouTube API

### 3. **Batch Duration Fetching**
- Groups up to 50 video IDs per request
- More efficient than fetching one at a time

### Example Quota Usage
- User searches "Blinding Lights" → **100 units** (search)
- App fetches 10 video durations → **10 units** (batch)
- **Total: 110 units per search**
- 1,000 searches/day = 110,000 units/day (within free 1M limit)

## Current Implementation

**File**: `app/lib/youtube-enhanced.ts`

```typescript
// Search deduplication - prevents duplicate API calls
let searchInProgress = new Map<string, Promise<any>>();

// Smart caching - 1 hour in-memory + 24 hours database
let searchResultsCache = new Map<string, { results: any[]; timestamp: number }>();

// Batch duration fetching - groups up to 50 IDs per request
async function batchFetchDurations(videoIds: string[]) {
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    // Single API call for up to 50 videos
  }
}
```

## Testing the Fix

After quota increase is approved:

```bash
# Clear search cache and test with new quota
npm run dev

# Try searching multiple songs in the editor
# You should now see real YouTube results
```

## Monitoring Quota Usage

To check remaining quota:
1. Go to Google Cloud Console
2. Go to **APIs & Services** → **Quotas**
3. Look at "Search List Requests Per Day" - shows:
   - Quota limit (1,000, 10,000, etc.)
   - Used today (shows current usage)
   - Remaining

## FAQ

**Q: Is this free?**
A: Yes, the quota increase is free. You only pay if you exceed 1M quota units/day (unlikely for MVP).

**Q: How long until approval?**
A: Usually hours to 1 day. Sometimes instant.

**Q: What if quota increases still run out?**
A: Rotate between 2-3 API keys, each getting 100/day = 300/day total searches possible.

**Q: Can I use a different API?**
A: YouTube API is the only real-time music video search available for free. Spotify requires OAuth setup.

## Next Steps

1. **Immediate**: Request quota increase (5 min)
2. **While waiting**: Use current implementation with smart caching/deduplication
3. **After approval**: Full YouTube search works perfectly

That's it! Search will work once quota is increased.
