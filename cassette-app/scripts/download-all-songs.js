#!/usr/bin/env node

/**
 * Download All Songs from CSV
 * Reads songs_2000.csv, downloads from YouTube URLs, converts to MP3, uploads to R2
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CSV_FILE = path.join(__dirname, '../songs_2000.csv');
const PROGRESS_FILE = path.join(__dirname, '../.download-progress.json');
const TEMP_DIR = path.join(__dirname, '../.download-temp');
const MAX_PARALLEL = 5;
const MAX_RETRIES = 3;
const API_URL = process.env.API_URL || 'http://localhost:3000';

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Parse CSV
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }
  
  return rows;
}

// Load/save progress
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    } catch (e) {
      console.warn('⚠️  Could not load progress');
    }
  }
  return {
    completed: [],
    failed: [],
    total: 0,
    success: 0,
    failed_count: 0,
    storage_mb: 0,
    start_time: Date.now(),
  };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// Download and convert song
async function downloadSong(videoUrl, title, artist, index, total) {
  const videoId = videoUrl.split('v=')[1]?.split('&')[0] || '';
  
  try {
    console.log(`\n[${index}/${total}] 📥 ${title.substring(0, 60)}...`);
    
    const audioFile = path.join(TEMP_DIR, `${videoId}.m4a`);
    const mp3File = path.join(TEMP_DIR, `${videoId}.mp3`);
    
    // Step 1: Download audio
    execSync(
      `yt-dlp -f bestaudio --extract-audio --audio-format m4a --audio-quality 0 -o "${audioFile}" "${videoUrl}" 2>/dev/null`,
      { stdio: 'pipe' }
    );
    
    if (!fs.existsSync(audioFile)) {
      throw new Error('Download failed');
    }
    
    // Step 2: Convert to MP3
    execSync(
      `ffmpeg -i "${audioFile}" -q:a 5 -b:a 64k -ar 22050 -ac 1 "${mp3File}" -y 2>/dev/null`,
      { stdio: 'pipe' }
    );
    
    if (!fs.existsSync(mp3File)) {
      throw new Error('Conversion failed');
    }
    
    const fileSize = fs.statSync(mp3File).size;
    
    // Step 3: Upload to R2 using curl
    const sanitizedTitle = title.replace(/"/g, '\\"').substring(0, 100);
    const sanitizedArtist = (artist || 'Unknown').replace(/"/g, '\\"').substring(0, 100);
    
    const curlCmd = `curl -s -X POST "${API_URL}/api/media-assets/upload" \
      -F "file=@${mp3File}" \
      -F "title=${sanitizedTitle}" \
      -F "artist=${sanitizedArtist}"`;
    
    const response = execSync(curlCmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    const result = JSON.parse(response || '{}');
    
    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }
    
    // Cleanup
    try { fs.unlinkSync(audioFile); } catch (e) {}
    try { fs.unlinkSync(mp3File); } catch (e) {}
    
    console.log(`   ✅ ${(fileSize / 1024 / 1024).toFixed(1)}MB`);
    
    return { success: true, fileSize, mediaAssetId: result.mediaAssetId };
    
  } catch (error) {
    console.log(`   ❌ ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Queue management
class Queue {
  constructor(concurrency) {
    this.concurrency = concurrency;
    this.queue = [];
    this.active = 0;
  }

  add(task) {
    this.queue.push(task);
  }

  async process() {
    const workers = [];
    for (let i = 0; i < this.concurrency; i++) {
      workers.push(this.worker());
    }
    await Promise.all(workers);
  }

  async worker() {
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      this.active++;
      try {
        await task();
      } catch (e) {
        console.error('Task error:', e.message);
      }
      this.active--;
    }
  }
}

// Main
async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                 DOWNLOAD ALL SONGS FROM CSV                               ║
╚════════════════════════════════════════════════════════════════════════════╝
  `);

  // Load CSV
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`❌ CSV file not found: ${CSV_FILE}`);
    process.exit(1);
  }

  console.log('📂 Reading CSV...');
  const content = fs.readFileSync(CSV_FILE, 'utf-8');
  const songs = parseCSV(content);
  console.log(`✅ Loaded ${songs.length} songs\n`);

  // Load progress
  const progress = loadProgress();
  const completed = new Set(progress.completed);
  
  let toProcess = songs.filter(s => !completed.has(s.youtube_video_id));
  console.log(`📊 To process: ${toProcess.length}/${songs.length}`);
  console.log(`✅ Already done: ${completed.size}`);
  console.log(`❌ Failed: ${progress.failed_count}`);
  console.log(`💾 Storage used: ${progress.storage_mb.toFixed(0)} MB\n`);

  if (toProcess.length === 0) {
    console.log('✅ All songs already downloaded!');
    process.exit(0);
  }

  // Build queue
  const queue = new Queue(MAX_PARALLEL);
  let index = completed.size;

  toProcess.forEach(song => {
    index++;
    queue.add(async () => {
      const result = await downloadSong(
        song.youtube_url,
        song.title,
        song.artist_channel,
        index,
        songs.length
      );

      if (result.success) {
        progress.completed.push(song.youtube_video_id);
        progress.success++;
        progress.storage_mb += result.fileSize / 1024 / 1024;
      } else {
        progress.failed.push({ videoId: song.youtube_video_id, error: result.error });
        progress.failed_count++;
      }

      progress.total++;
      saveProgress(progress);

      const pct = ((progress.total / toProcess.length) * 100).toFixed(1);
      process.stdout.write(`\r📊 Progress: ${progress.total}/${toProcess.length} (${pct}%) | ✅ ${progress.success} | ❌ ${progress.failed_count}`);
    });
  });

  console.log(`🚀 Starting download with ${MAX_PARALLEL} parallel workers...\n`);

  await queue.process();

  console.log(`\n
╔════════════════════════════════════════════════════════════════════════════╗
║                           SUMMARY                                          ║
╚════════════════════════════════════════════════════════════════════════════╝

✅ Successful:  ${progress.success}
❌ Failed:     ${progress.failed_count}
📊 Total:      ${progress.total}
💾 Storage:    ${progress.storage_mb.toFixed(0)} MB
⏱️  Time:      ${((Date.now() - progress.start_time) / 1000 / 60).toFixed(1)} minutes

📁 Progress saved to: ${PROGRESS_FILE}
  `);

  if (progress.failed_count > 0) {
    console.log(`\n❌ Failed songs:`);
    progress.failed.slice(0, 10).forEach(f => {
      console.log(`   • ${f.videoId}: ${f.error}`);
    });
    if (progress.failed.length > 10) {
      console.log(`   ... and ${progress.failed.length - 10} more`);
    }
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
