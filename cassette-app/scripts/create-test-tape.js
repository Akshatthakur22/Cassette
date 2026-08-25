#!/usr/bin/env node

/**
 * Create a test tape with READY songs only
 * Run this after starting `npm run dev`
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function main() {
  try {
    console.log('\n🎵 Creating test tape with READY songs...\n');

    // First, get the list of READY songs via API
    const listRes = await fetch('http://localhost:3000/api/debug/media-assets');
    const data = await listRes.json();
    const readySongs = data.ready.samples;

    if (readySongs.length === 0) {
      console.log('❌ No READY songs available');
      process.exit(1);
    }

    console.log(`Found ${readySongs.length} READY songs:`)
    readySongs.forEach((song, i) => {
      console.log(`  ${i + 1}. ${song.title}`);
    });

    // The tracks array
    const tracks = readySongs.map((song, idx) => ({
      title: song.title,
      providerTrackId: song.id,
      side: idx < Math.ceil(readySongs.length / 2) ? 'A' : 'B',
    }));

    // Now we need to create a tape via Prisma or API
    // For now, let's just output the IDs so they can be tested
    console.log('\n✅ To test playback, use these track IDs:\n');
    readySongs.forEach((song, i) => {
      console.log(`  Song ${i + 1}: /api/media-assets/${song.id}/stream`);
    });

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
