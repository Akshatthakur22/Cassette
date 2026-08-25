#!/usr/bin/env node

/**
 * Create a mega playlist cassette with ~2000 songs
 * Run this after starting `npm run dev`
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function main() {
  try {
    console.log('\n🎵 Creating 2000 Songs Playlist Cassette\n');
    console.log('=======================================\n');

    // Get ALL READY songs (batch requests)
    console.log('📥 Fetching all READY songs...');
    
    let allSongs = [];
    let batchSize = 100;
    let offset = 0;
    let hasMore = true;

    while (hasMore && allSongs.length < 2000) {
      const limit = Math.min(batchSize, 2000 - allSongs.length);
      const listRes = await fetch(
        `http://localhost:3000/api/debug/get-all-ready?limit=${limit}`
      );
      const data = await listRes.json();
      
      if (!data.songs || data.songs.length === 0) {
        hasMore = false;
        break;
      }

      allSongs = allSongs.concat(data.songs);
      console.log(`  ✓ Loaded ${allSongs.length} songs so far...`);

      if (data.songs.length < limit) {
        hasMore = false;
      }

      offset += limit;
    }

    console.log(`\n✅ Total songs found: ${allSongs.length}\n`);

    if (allSongs.length === 0) {
      console.log('❌ No READY songs in database');
      process.exit(1);
    }

    // Prepare tracks (cassettes have Side A and B, so split them)
    const tracks = allSongs.map((song, idx) => {
      const totalTracks = allSongs.length;
      const midpoint = Math.ceil(totalTracks / 2);
      const side = idx < midpoint ? "A" : "B";
      const position = idx < midpoint ? idx : idx - midpoint;

      return {
        title: song.title,
        providerTrackId: song.id,
        mediaAssetId: song.id,
        side: side,
        position: Math.min(position, 99), // Cassettes have limited tracks per side
        provider: "media_asset",
      };
    });

    console.log(`🎵 Organizing tracks:`);
    console.log(`   Side A: ${tracks.filter(t => t.side === 'A').length} songs`);
    console.log(`   Side B: ${tracks.filter(t => t.side === 'B').length} songs\n`);

    // Create the mega playlist tape
    console.log('🎬 Creating cassette in database...\n');

    const tapeData = {
      senderName: "🎵 Music Archive",
      recipientName: "Everyone",
      relationship: "best_friend",
      style: "classic",
      visibility: "public",
      title: "🎵 Complete Bollywood Hits - 2000+ Songs",
      dedication: `A comprehensive collection of ${allSongs.length} Bollywood songs. Press play and enjoy!`,
      tracks: tracks,
    };

    const createRes = await fetch("http://localhost:3000/api/debug/create-tape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tapeData),
    });

    const result = await createRes.json();

    if (!result.success) {
      console.log(`❌ Error: ${result.error}`);
      process.exit(1);
    }

    console.log('✅ Cassette Created!\n');
    console.log(`📀 Tape ID: ${result.tapeId}`);
    console.log(`🔗 Public ID: ${result.publicId}`);
    console.log(`📊 Total Tracks: ${result.tracksCount}`);
    console.log(`\n🎬 Title: "${result.tracks[0]?.title?.split('|')[0] || 'Bollywood Hits'}..."\n`);

    console.log('═════════════════════════════════════════');
    console.log(`\n🎵 PLAYLIST LINK:`);
    console.log(`\nhttp://localhost:3000/t/${result.publicId}\n`);
    console.log('═════════════════════════════════════════\n');

    console.log('✨ Share this link with anyone to play all songs!');
    console.log(`\n📱 Try it now: http://localhost:3000/t/${result.publicId}\n`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
