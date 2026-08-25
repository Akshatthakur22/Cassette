# Media Worker Service

The media worker processes YouTube tracks into MP3 files stored on Cloudflare R2. It runs as part of the main cassette-app, not as a separate deployment.

## How It Works

1. **Job Discovery**: Polls database for PENDING or FAILED media assets
2. **YouTube Validation**: Checks if video exists and is accessible
3. **Audio Download**: Downloads best audio from YouTube using yt-dlp
4. **MP3 Conversion**: Converts WebM to MP3 using FFmpeg
5. **Upload**: Uploads MP3 to Cloudflare R2
6. **Complete**: Marks job as READY for playback

## Running the Worker

### Option 1: Vercel Cron (Recommended for Production)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/media-worker/process",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This runs the worker every 5 minutes.

Set `MEDIA_WORKER_SECRET` in your Vercel environment variables and include it in requests.

### Option 2: External Cron Service

Use Upstash, AWS EventBridge, or any cron service to call:

```bash
curl -X POST https://your-app.com/api/media-worker/process \
  -H "x-worker-secret: your-secret"
```

### Option 3: Local Development

Start the app normally:

```bash
npm run dev
```

Then manually trigger processing:

```bash
curl -X POST http://localhost:3000/api/media-worker/process
```

## Environment Variables

Add to `.env.local`:

```env
# R2 Configuration (Required for uploads)
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=cassette-media-assets
R2_PUBLIC_BASE_URL=https://your-domain.com/media

# Worker Configuration
MEDIA_WORKER_SECRET=your-secret-key  # For API security
MAX_CONCURRENT_DOWNLOADS=3            # Parallel jobs
MAX_RETRIES=5                         # Retry attempts
RETRY_BACKOFF_BASE_MINUTES=1          # Exponential backoff base
TARGET_BITRATE_KBPS=128               # MP3 quality
TEMP_DIR=/tmp/cassette-media-processing # Temp storage
POLL_INTERVAL_SEC=5                   # Poll frequency
LOG_LEVEL=info                        # debug|info|warn|error
```

## Dependencies

The worker requires system packages:

- **yt-dlp**: YouTube audio extraction
- **FFmpeg**: Audio conversion
- **ffprobe**: Duration detection

### macOS

```bash
brew install yt-dlp ffmpeg
```

### Linux (Ubuntu/Debian)

```bash
sudo apt-get install yt-dlp ffmpeg
```

### Docker

Include in Dockerfile:

```dockerfile
RUN apt-get update && apt-get install -y yt-dlp ffmpeg
```

## Job Status Flow

```
PENDING
  ↓
VALIDATING (YouTube check)
  ↓
DOWNLOADING (audio extraction)
  ↓
CONVERTING (MP3 creation)
  ↓
UPLOADING (R2 storage)
  ↓
READY (playable)
```

On error at any step:
- Mark as FAILED
- Schedule retry with exponential backoff (2^n minutes)
- Max 5 attempts (configurable)

## API Endpoints

### POST /api/media-worker/process

Trigger job processing immediately.

**Headers:**
```
x-worker-secret: your-secret-key (optional if not configured)
```

**Response:**
```json
{
  "success": true,
  "message": "Media worker processing completed"
}
```

### GET /api/media-worker/process

Check worker status.

**Response:**
```json
{
  "status": "ok",
  "message": "Media worker is running",
  "endpoint": "/api/media-worker/process",
  "method": "POST"
}
```

## Monitoring

### Database Queries

View pending jobs:

```sql
SELECT id, status, title, attemptCount FROM "MediaAsset"
WHERE status IN ('PENDING', 'VALIDATING', 'DOWNLOADING', 'CONVERTING', 'UPLOADING')
ORDER BY createdAt ASC;
```

View failed jobs:

```sql
SELECT id, error, errorDetails, attemptCount, nextAttemptAt FROM "MediaAsset"
WHERE status = 'FAILED'
ORDER BY nextAttemptAt DESC;
```

### Logs

Monitor worker progress in:
- **Local**: Terminal output
- **Vercel**: Function logs dashboard
- **Custom**: Application logging service

Look for patterns:
- `[processJob] Starting` - Job started
- `[processJob] Validating YouTube video` - Validation step
- `[processJob] Downloading audio` - Download step
- `[processJob] Converting to MP3` - Conversion step
- `[processJob] Uploading to R2` - Upload step
- `[processJob] Job completed successfully` - Success
- `[processJob] Validation failed` - Error at step

## Troubleshooting

### "yt-dlp: command not found"

Install yt-dlp:

```bash
# macOS
brew install yt-dlp

# Linux
sudo apt-get install yt-dlp

# Or via pip
pip install yt-dlp
```

### "ffmpeg: command not found"

Install FFmpeg:

```bash
# macOS
brew install ffmpeg

# Linux
sudo apt-get install ffmpeg
```

### Jobs stuck in VALIDATING

Database lock may not be releasing. Check:
- Worker logs for crashes
- Database connections
- Restart worker service

### R2 upload fails

Check:
- R2 credentials configured in `.env.local`
- Bucket name is correct
- Credentials have PutObject permission

### Timeout errors

Increase timeouts in `app/services/media-worker/youtube.ts` and `ffmpeg.ts`:
- YouTube download: 5 minutes (configurable)
- FFmpeg conversion: 10 minutes (configurable)

## Performance

Default settings:
- **3 concurrent jobs** (MAX_CONCURRENT_DOWNLOADS)
- **5-minute poll interval** (POLL_INTERVAL_SEC)
- **128 kbps MP3** (TARGET_BITRATE_KBPS)

Adjust based on:
- Server CPU/memory
- Network bandwidth
- Storage capacity

### Scaling

For higher throughput:
1. Increase MAX_CONCURRENT_DOWNLOADS (CPU/memory permitting)
2. Decrease POLL_INTERVAL_SEC for faster job discovery
3. Deploy multiple Vercel functions (load balance via database lock)

## Cost Optimization

- **R2 storage**: ~$0.50/month per 1GB @ $0.015/GB
- **YouTube bandwidth**: Free (yt-dlp uses YouTube's CDN)
- **Vercel compute**: Included in standard plan
- **CloudFlare R2**: Included with bundle

Typical cost for 100 tapes @ 3 songs each (~150MB):
- R2: ~$2.25/month
- Total: ~$2.25/month

## Security

- **Worker secret**: Required for production deployments
- **R2 credentials**: Stored in environment variables
- **Database**: Prisma client sanitizes queries
- **File cleanup**: Temp files deleted after processing
- **No external APIs**: All processing local to app

## Future Improvements

- [ ] Retry queue with priority
- [ ] Progress webhooks for real-time UI updates
- [ ] Batch processing optimization
- [ ] Custom bitrate selection per tape
- [ ] Audio format support (FLAC, WAV, etc)
- [ ] Duration limit enforcement
- [ ] DRM/licensing compliance
