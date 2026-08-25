#!/usr/bin/env node

/**
 * Create a Salman Khan songs cassette with READY tracks
 * Run this after starting `npm run dev`
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Popular Salman Khan songs to search for
const SALMAN_KHAN_SONGS = [
  "Maine Pyaar Kyun Kiya",
  "Sajan Tumse Pyar",
  "Haan Main Chand Sitara",
  "Teri Yaad Satati Hai",
  "Salaam Namaste",
  "Chaleya Jab Tak Rahunga",
  "Tere Naina",
  "Dil Diya Dard Liya",
];

async function main() {
  try {
    console.log('\n🎬 Creating Salman Khan Songs Cassette\n');

    // Get READY songs from database
    const listRes = await fetch('http://localhost:3000/api/debug/media-assets');
    const data = await listRes.json();
    const allReady = data.ready.samples;

    if (!allReady || allReady.length === 0) {
      console.log('❌ No READY songs in database');
      process.exit(1);
    }

    // Filter for Salman Khan songs
    const salmanSongs = allReady.filter(song => {
      const title = song.title.toLowerCase();
      return SALMAN_KHAN_SONGS.some(salmanSong => 
        title.includes(salmanSong.toLowerCase()) || 
        title.includes('salman') ||
        title.includes('maine pyaar kyun kiya') ||
        title.includes('sajan')
      );
    });

    console.log(`📊 Found ${salmanSongs.length} Salman Khan songs in database\n`);

    if (salmanSongs.length === 0) {
      console.log('⚠️  No Salman Khan songs found.');
      console.log('Available READY songs:');
      allReady.slice(0, 10).forEach((song, i) => {
        console.log(`  ${i + 1}. ${song.title.substring(0, 70)}`);
      });
      process.exit(1);
    }

    salmanSongs.slice(0, 4).forEach((song, i) => {
      console.log(`  ${i + 1}. ${song.title}`);
      console.log(`     ID: ${song.id}\n`);
    });

    // Use up to 4 songs for the cassette
    const songsForTape = salmanSongs.slice(0, 4);
    if (songsForTape.length < 2) {
      console.log('⚠️  Need at least 2 songs for a cassette');
      process.exit(1);
    }

    // Create the tape via API
    console.log('🎵 Creating cassette in database...\n');
    
    const tapeData = {
      senderName: "Salman Khan Fan",
      recipientName: "Music Lover",
      relationship: "best_friend",
      style: "classic",
      visibility: "public",
      title: "🎬 Salman Khan Classics",
      dedication: "A collection of iconic Salman Khan songs from Bollywood",
      tracks: songsForTape.map((song, idx) => ({
        title: song.title,
        providerTrackId: song.id,
        mediaAssetId: song.id,
        side: idx < Math.ceil(songsForTape.length / 2) ? "A" : "B",
        position: idx % 2,
        provider: "media_asset",
      })),
    };

    // Create via direct fetch to create endpoint
    const createRes = await fetch('http://localhost:3000/api/debug/create-tape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tapeData),
    });

    if (!createRes.ok) {
      // If endpoint doesn't exist, provide manual instructions
      console.log('ℹ️  Manual creation needed. Here are the track details:\n');
      console.log('Tracks for Salman Khan Cassette:');
      songsForTape.forEach((song, idx) => {
        const side = idx < Math.ceil(songsForTape.length / 2) ? "A" : "B";
        console.log(`\nTrack ${idx + 1} (Side ${side}):`);
        console.log(`  Title: ${song.title}`);
        console.log(`  Media Asset ID: ${song.id}`);
      });
      process.exit(0);
    }

    const result = await createRes.json();
    
    console.log('✅ Cassette Created!\n');
    console.log(`📀 Tape ID: ${result.tapeId}`);
    console.log(`🔗 Public URL: http://localhost:3000/t/${result.publicId}`);
    console.log(`📋 Tracks: ${result.tracksCount}`);
    console.log(`\n🎵 Track List:`);
    result.tracks.forEach((track, i) => {
      console.log(`  ${i + 1}. ${track.title} (Side ${track.side})`);
    });

    console.log(`\n✨ Share this link: http://localhost:3000/t/${result.publicId}`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
