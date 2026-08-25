#!/usr/bin/env node

/**
 * Bulk Download Script for Cassette
 * ================================
 * 
 * Downloads all songs from songs_2000.csv in parallel with:
 * - Controlled concurrency (5-10 parallel downloads)
 * - Duplicate prevention (checks DB before processing)
 * - Direct R2 upload (bypasses background worker)
 * - Progress tracking and resumability
 * - Cost monitoring
 * 
 * Usage:
 *   node scripts/bulk-download-songs.js [options]
 * 
 * Options:
 *   --limit N           Process only first N songs (for testing)
 *   --start-row N       Start from row N (for resuming)
 *   --concurrent N      Concurrent downloads (default: 5, max: 10)
 *   --no-upload         Download only, don't upload to R2
 *   --retry-failed      Only retry previously failed songs
 *   --dry-run           Show plan without downloading
 */

const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Simple CSV parser (don't need external dependency)
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Simple CSV parsing (handles quoted fields)
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CONFIG = {
  CSV_FILE: path.join(__dirname, '../songs_2000.csv'),
  PROGRESS_FILE: path.join(__dirname, '../.bulk-download-progress.json'),
  API_URL: process.env.API_URL || 'http://localhost:3000',
  CONCURRENT_LIMIT: 5,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 5000,
  REQUEST_TIMEOUT_MS: 300000, // 5 minutes
  MAX_FILE_SIZE_MB: 50,
  MAX_TOTAL_STORAGE_GB: 6, // 💾 Hard limit: stop at 6 GB
  R2_STORAGE_WARNING_MB: 900, // Warn at 900MB (out of 1GB free tier)
  R2_COST_THRESHOLD: 0.95, // Cost threshold before warning
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PARSE COMMAND LINE ARGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const args = process.argv.slice(2);
const options = {
  limit: null,
  startRow: 0,
  concurrent: CONFIG.CONCURRENT_LIMIT,
  upload: true,
  retryFailed: false,
  dryRun: false,
  testMode: false, // Simulate API responses
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--limit') options.limit = parseInt(args[++i], 10);
  if (arg === '--start-row') options.startRow = parseInt(args[++i], 10);
  if (arg === '--concurrent') options.concurrent = Math.min(parseInt(args[++i], 10), 10);
  if (arg === '--no-upload') options.upload = false;
  if (arg === '--retry-failed') options.retryFailed = true;
  if (arg === '--dry-run') options.dryRun = true;
  if (arg === '--test-mode') options.testMode = true;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILITIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class ProgressTracker {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
      }
    } catch (e) {
      console.warn('⚠️  Could not load progress file, starting fresh');
    }
    return {
      startedAt: new Date().toISOString(),
      completed: [],
      failed: [],
      skipped: [],
      stats: {
        totalProcessed: 0,
        totalSuccessful: 0,
        totalFailed: 0,
        totalSkipped: 0,
        totalBytes: 0,
        startTime: Date.now(),
      },
    };
  }

  save() {
    this.data.stats.elapsedSeconds = Math.round((Date.now() - this.data.stats.startTime) / 1000);
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }

  markCompleted(videoId, mediaAssetId, fileSize) {
    this.data.completed.push({ videoId, mediaAssetId, fileSize, timestamp: new Date().toISOString() });
    this.data.stats.totalProcessed++;
    this.data.stats.totalSuccessful++;
    this.data.stats.totalBytes += fileSize || 0;
    this.save();
  }

  markFailed(videoId, error) {
    this.data.failed.push({ videoId, error, timestamp: new Date().toISOString() });
    this.data.stats.totalProcessed++;
    this.data.stats.totalFailed++;
    this.save();
  }

  markSkipped(videoId, reason) {
    this.data.skipped.push({ videoId, reason, timestamp: new Date().toISOString() });
    this.data.stats.totalProcessed++;
    this.data.stats.totalSkipped++;
    this.save();
  }

  isAlreadyCompleted(videoId) {
    return this.data.completed.some(c => c.videoId === videoId);
  }

  isAlreadyFailed(videoId) {
    return this.data.failed.some(f => f.videoId === videoId);
  }

  getStats() {
    return this.data.stats;
  }

  hasReachedStorageLimit(limitGB) {
    const currentGB = this.data.stats.totalBytes / 1024 / 1024 / 1024;
    return currentGB >= limitGB;
  }

  getRemainingStorage(limitGB) {
    const currentGB = this.data.stats.totalBytes / 1024 / 1024 / 1024;
    return Math.max(0, limitGB - currentGB);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QUEUE MANAGEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class DownloadQueue {
  constructor(concurrency) {
    this.concurrency = concurrency;
    this.queue = [];
    this.active = 0;
    this.results = [];
  }

  add(task) {
    this.queue.push(task);
  }

  async process(onProgress) {
    const promises = [];

    for (let i = 0; i < this.concurrency; i++) {
      promises.push(this.worker(onProgress));
    }

    await Promise.all(promises);
    return this.results;
  }

  async worker(onProgress) {
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      this.active++;

      try {
        const result = await task();
        this.results.push(result);
      } catch (e) {
        console.error(`❌ Task failed:`, e.message);
        this.results.push({ success: false, error: e.message });
      } finally {
        this.active--;
      }

      if (onProgress) {
        onProgress({
          queueRemaining: this.queue.length,
          activeWorkers: this.active,
          completed: this.results.length,
        });
      }
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN LOGIC
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                  CASSETTE: BULK DOWNLOAD SONGS                            ║
╚════════════════════════════════════════════════════════════════════════════╝
  `);

  // ──── STEP 1: Load CSV ────────────────────────────────────────────────────
  console.log('📂 Reading CSV file...');
  
  if (!fs.existsSync(CONFIG.CSV_FILE)) {
    console.error(`❌ File not found: ${CONFIG.CSV_FILE}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(CONFIG.CSV_FILE, 'utf-8');
  const songs = parseCSV(csvContent);

  console.log(`✅ Loaded ${songs.length} songs from CSV`);

  // ──── STEP 2: Load progress & filter songs ────────────────────────────────
  console.log('\n📊 Checking progress...');
  
  const progress = new ProgressTracker(CONFIG.PROGRESS_FILE);
  let toProcess = songs;

  // Filter by options
  if (options.startRow > 0) {
    toProcess = toProcess.slice(options.startRow);
    console.log(`   ⏭️  Starting from row ${options.startRow}`);
  }

  if (options.limit) {
    toProcess = toProcess.slice(0, options.limit);
    console.log(`   📌 Limited to ${options.limit} songs`);
  }

  if (options.retryFailed) {
    const failed = progress.data.failed.map(f => f.videoId);
    toProcess = toProcess.filter(s => failed.includes(s.youtube_video_id));
    console.log(`   🔄 Retrying ${toProcess.length} failed songs`);
  } else {
    // Filter out already completed
    const alreadyDone = progress.data.completed.map(c => c.videoId);
    const initial = toProcess.length;
    toProcess = toProcess.filter(s => !alreadyDone.includes(s.youtube_video_id));
    const skipped = initial - toProcess.length;
    
    if (skipped > 0) {
      console.log(`   ✅ Skipping ${skipped} already completed songs`);
    }
  }

  const stats = progress.getStats();
  console.log(`
   📈 Progress Summary:
      • Already completed: ${stats.totalSuccessful}
      • Failed: ${stats.totalFailed}
      • Skipped (duplicates): ${stats.totalSkipped}
      • To process now: ${toProcess.length}
      • Total storage used: ${(stats.totalBytes / 1024 / 1024).toFixed(2)} MB / 6 GB
  `);

  // ──── CHECK STORAGE LIMIT ────────────────────────────────────────────
  const remainingGB = progress.getRemainingStorage(CONFIG.MAX_TOTAL_STORAGE_GB);
  console.log(`\n💾 Storage Status:`);
  console.log(`   Current: ${(stats.totalBytes / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`   Limit: ${CONFIG.MAX_TOTAL_STORAGE_GB} GB`);
  console.log(`   Remaining: ${remainingGB.toFixed(2)} GB`);

  if (remainingGB <= 0) {
    console.log(`\n❌ Storage limit reached! Already at ${CONFIG.MAX_TOTAL_STORAGE_GB} GB`);
    console.log(`   Cannot process more songs.`);
    console.log(`   Delete some songs from R2 or increase storage limit.`);
    process.exit(0);
  }

  if (remainingGB < 0.5) {
    console.log(`\n⚠️  WARNING: Only ${remainingGB.toFixed(2)} GB remaining!`);
    console.log(`   Script will stop when 6 GB is reached.`);
  }

  if (toProcess.length === 0) {
    console.log('✅ All songs already processed!');
    process.exit(0);
  }

  // ──── STEP 3: Show plan (dry run) ──────────────────────────────────────
  if (options.dryRun) {
    console.log('\n📋 DRY RUN MODE - No downloads will occur\n');
    console.log('First 10 songs to process:');
    toProcess.slice(0, 10).forEach((song, i) => {
      console.log(`  ${i + 1}. [${song.youtube_video_id}] ${song.title.substring(0, 60)}`);
    });
    console.log(`  ... and ${Math.max(0, toProcess.length - 10)} more`);
    process.exit(0);
  }

  // ──── STEP 4: Estimate time & cost ────────────────────────────────────
  console.log('\n💰 Cost & Time Estimates:');
  const avgTimePerSongSeconds = 30; // download + convert + upload
  const avgFileSizeMB = 3; // 64kbps MP3 ≈ 2.5-3MB per song
  
  let estimatedTotalMB = toProcess.length * avgFileSizeMB;
  let estimatedTotalSeconds = toProcess.length * avgTimePerSongSeconds;
  let songsToProcess = toProcess.length;

  // If this would exceed 6 GB, calculate how many songs we can process
  const remainingStorageMB = remainingGB * 1024;
  if (estimatedTotalMB > remainingStorageMB) {
    songsToProcess = Math.floor(remainingStorageMB / avgFileSizeMB);
    estimatedTotalMB = songsToProcess * avgFileSizeMB;
    estimatedTotalSeconds = songsToProcess * avgTimePerSongSeconds;
    console.log(`\n   ⚠️  Adjusted: Storage limit would be exceeded`);
    console.log(`   Only ${songsToProcess}/${toProcess.length} songs can be processed`);
  }

  const estimatedHours = estimatedTotalSeconds / 3600;
  
  console.log(`
   ⏱️  Estimated time: ${estimatedHours.toFixed(1)} hours (at ${avgTimePerSongSeconds}s per song)
   💾 Estimated storage: ${estimatedTotalMB.toFixed(0)} MB total
   📊 R2 Free Tier: 1 GB storage, first 1M API calls free
  `);

  if (estimatedTotalMB > CONFIG.R2_STORAGE_WARNING_MB) {
    console.log(`
   ⚠️  WARNING: Estimated storage (${estimatedTotalMB.toFixed(0)} MB) exceeds R2 free tier (1 GB)
       This will use paid storage. Each GB beyond free tier costs ~$0.015/month
  `);
  }

  // ──── STEP 5: Build queue ────────────────────────────────────────────
  console.log(`\n🚀 Building download queue (${options.concurrent} parallel workers)...\n`);

  const queue = new DownloadQueue(options.concurrent);

  toProcess.forEach((song, index) => {
    queue.add(async () => {
      return await processSong(song, index + 1, toProcess.length, progress);
    });
  });

  // ──── STEP 6: Process queue ──────────────────────────────────────────
  let lastUpdate = Date.now();
  
  const results = await queue.process(({ queueRemaining, activeWorkers, completed }) => {
    const now = Date.now();
    if (now - lastUpdate > 2000) { // Update every 2 seconds
      const percent = ((completed / toProcess.length) * 100).toFixed(1);
      process.stdout.write(
        `\r📊 Progress: ${completed}/${toProcess.length} (${percent}%) | ` +
        `Queue: ${queueRemaining} | Active: ${activeWorkers}`
      );
      lastUpdate = now;
    }
  });

  console.log('\n');

  // ──── STEP 7: Summary ────────────────────────────────────────────────
  const finalStats = progress.getStats();
  const elapsedMinutes = (finalStats.elapsedSeconds / 60).toFixed(1);
  const storageMB = (finalStats.totalBytes / 1024 / 1024).toFixed(2);

  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                         FINAL SUMMARY                                      ║
╚════════════════════════════════════════════════════════════════════════════╝

✅ Successful:  ${finalStats.totalSuccessful}
❌ Failed:     ${finalStats.totalFailed}
⏭️  Skipped:    ${finalStats.totalSkipped}
─────────────────
📊 Total:      ${finalStats.totalProcessed}

💾 Storage Used: ${storageMB} MB
⏱️  Total Time:  ${elapsedMinutes} minutes

📁 Progress saved to: ${CONFIG.PROGRESS_FILE}
  `);

  if (finalStats.totalFailed > 0) {
    console.log(`
❌ Failed songs (can retry with --retry-failed):
  `);
    
    // Group errors by category
    const errorCategories = {};
    progress.data.failed.forEach(f => {
      const category = f.error?.includes('Video not found') ? 'NOT_FOUND' :
                       f.error?.includes('copyright') ? 'COPYRIGHT' :
                       f.error?.includes('geo') ? 'GEO_RESTRICTED' :
                       f.error?.includes('timeout') ? 'NETWORK' :
                       f.error?.includes('500') ? 'SERVER_ERROR' : 'OTHER';
      if (!errorCategories[category]) errorCategories[category] = [];
      errorCategories[category].push(f);
    });

    // Show summary by category
    Object.entries(errorCategories).forEach(([category, errors]) => {
      console.log(`   ${category}: ${errors.length} songs`);
    });

    console.log(`\n   Top failed songs:`);
    progress.data.failed.slice(0, 5).forEach(f => {
      console.log(`   • ${f.videoId}: ${f.error?.substring(0, 60)}`);
    });
    if (progress.data.failed.length > 5) {
      console.log(`   ... and ${progress.data.failed.length - 5} more`);
    }
  }

  console.log(`
📝 Next Steps:
   1. Check progress file: cat ${CONFIG.PROGRESS_FILE}
   2. Retry failed songs: node scripts/bulk-download-songs.js --retry-failed
   3. Continue processing: node scripts/bulk-download-songs.js (automatically resumes)
  `);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROCESS SINGLE SONG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function processSong(song, index, total, progress) {
  const videoId = song.youtube_video_id;
  const title = song.title || 'Unknown';
  const artist = song.artist_channel || 'Unknown';
  const durationSec = parseInt(song.duration_seconds, 10) || 0;

  try {
    // ──── CHECK STORAGE LIMIT ────────────────────────────────────────────
    const remainingGB = progress.getRemainingStorage(CONFIG.MAX_TOTAL_STORAGE_GB);
    if (remainingGB <= 0) {
      progress.markSkipped(videoId, `Storage limit reached (${CONFIG.MAX_TOTAL_STORAGE_GB} GB)`);
      console.warn(`\n⛔ STOPPING: Storage limit reached (${CONFIG.MAX_TOTAL_STORAGE_GB} GB)`);
      process.exit(0);
    }

    // Check if already completed
    if (progress.isAlreadyCompleted(videoId)) {
      progress.markSkipped(videoId, 'Already completed');
      return { success: true, reason: 'skipped', videoId };
    }

    // Call direct upload endpoint
    if (!options.upload) {
      progress.markSkipped(videoId, 'Upload disabled (--no-upload)');
      return { success: true, reason: 'skipped', videoId };
    }

    const response = await uploadSongViaAPI(videoId, title, artist, durationSec);

    if (!response.success) {
      const errorMsg = response.error || 'Unknown error';
      
      // Categorize error type for better reporting
      let errorCategory = 'UNKNOWN';
      if (errorMsg.includes('Video not found') || errorMsg.includes('404')) errorCategory = 'NOT_FOUND';
      if (errorMsg.includes('copyright') || errorMsg.includes('Copyright')) errorCategory = 'COPYRIGHT';
      if (errorMsg.includes('geo') || errorMsg.includes('restricted')) errorCategory = 'GEO_RESTRICTED';
      if (errorMsg.includes('timeout') || errorMsg.includes('network')) errorCategory = 'NETWORK_ERROR';
      if (errorMsg.includes('500') || errorMsg.includes('502') || errorMsg.includes('503')) errorCategory = 'SERVER_ERROR';
      
      progress.markFailed(videoId, errorMsg);
      return { success: false, videoId, error: errorMsg, category: errorCategory };
    }

    progress.markCompleted(videoId, response.mediaAssetId, response.fileSize);
    return {
      success: true,
      videoId,
      mediaAssetId: response.mediaAssetId,
      fileSize: response.fileSize,
    };

  } catch (error) {
    const errorMsg = error.message || String(error);
    progress.markFailed(videoId, errorMsg);
    return { success: false, videoId, error: errorMsg };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API CALL: UPLOAD SONG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function uploadSongViaAPI(videoId, title, artist, durationSec, attempt = 1) {
  try {
    // ──── TEST MODE: Simulate successful uploads ────────────────────────
    if (options.testMode) {
      await new Promise(r => setTimeout(r, Math.random() * 500)); // Simulate delay
      const fileSize = Math.floor(2000000 + Math.random() * 2000000); // 2-4 MB
      return {
        success: true,
        mediaAssetId: `test-${videoId}`,
        fileSize,
      };
    }

    const url = `${CONFIG.API_URL}/api/media-assets/bulk-upload`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId,
        title: title.substring(0, 200),
        artist: artist.substring(0, 100),
        durationSec,
      }),
      timeout: CONFIG.REQUEST_TIMEOUT_MS,
    });

    const data = await response.json();

    if (!response.ok) {
      // Categorize error type
      const error = data.error || `HTTP ${response.status}`;
      const isRetryable = response.status >= 500 || response.status === 429; // Server error or rate limited
      
      if (isRetryable && attempt < CONFIG.MAX_RETRIES) {
        // Exponential backoff: 1s, 2s, 4s, 8s
        const delayMs = CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, delayMs));
        return uploadSongViaAPI(videoId, title, artist, durationSec, attempt + 1);
      }
      
      throw new Error(error);
    }

    return {
      success: true,
      mediaAssetId: data.mediaAssetId,
      fileSize: data.fileSize || 0,
    };

  } catch (error) {
    const errorMsg = error.message || String(error);
    const isNetworkError = errorMsg.includes('fetch') || errorMsg.includes('timeout') || errorMsg.includes('ECONNREFUSED');
    
    // Retry on network errors or temporary failures
    if (isNetworkError && attempt < CONFIG.MAX_RETRIES) {
      const delayMs = CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      await new Promise(r => setTimeout(r, delayMs));
      return uploadSongViaAPI(videoId, title, artist, durationSec, attempt + 1);
    }

    return {
      success: false,
      error: `${errorMsg} (attempt ${attempt}/${CONFIG.MAX_RETRIES})`,
    };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// START
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
