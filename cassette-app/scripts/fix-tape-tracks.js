#!/usr/bin/env node

/**
 * Fix the test tape by replacing FAILED tracks with READY ones
 * Run this after starting `npm run dev`
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function main() {
  try {
    console.log('\n🎵 Fixing tape tracks with READY songs...\n');

    // Get READY songs
    const listRes = await fetch('http://localhost:3000/api/debug/media-assets');
    const data = await listRes.json();
    const readySongs = data.ready.samples;

    if (readySongs.length < 4) {
      console.log('❌ Need at least 4 READY songs');
      process.exit(1);
    }

    console.log(`Found ${data.ready.count} READY songs total`);
    console.log('\nUsing these songs for the tape:');
    readySongs.slice(0, 4).forEach((song, i) => {
      console.log(`  ${i + 1}. ${song.title.substring(0, 60)}...`);
    });

    console.log('\n✅ To update the tape in database, you need to:');
    console.log('\n1. Delete old tracks from tape cmt8gz2aa000cqt5r198vs4il');
    console.log('2. Create new tracks with these media asset IDs:');
    readySongs.slice(0, 4).forEach((song, i) => {
      const side = i < 2 ? 'A' : 'B';
      console.log(`   ${i + 1}. Side ${side}: ${song.id}`);
    });

    console.log('\n📝 SQL to fix the tape:\n');
    console.log('DELETE FROM "Track" WHERE "tapeId" = \'cmt8gz2aa000cqt5r198vs4il\';');
    console.log('');
    readySongs.slice(0, 4).forEach((song, i) => {
      const side = i < 2 ? 'A' : 'B';
      const id = `track_${i}`;
      const tapeId = 'cmt8gz2aa000cqt5r198vs4il';
      console.log(`INSERT INTO "Track" (id, "tapeId", title, "providerTrackId", side, position, "createdAt") VALUES ('${id}', '${tapeId}', '${song.title.replace(/'/g, "''")}', '${song.id}', '${side}', ${i % 2}, NOW());`);
    });

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
