#!/usr/bin/env node

/**
 * Create demo cassettes with READY songs
 * Run this after starting `npm run dev`
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function createTape(name, limit = 4) {
  try {
    // Get READY songs
    const listRes = await fetch(
      `http://localhost:3000/api/debug/get-all-ready?limit=${limit}`
    );
    const data = await listRes.json();
    const songs = data.songs;

    if (songs.length < 2) {
      console.log(`❌ Not enough songs for "${name}"`);
      return null;
    }

    console.log(`\n📀 Creating "${name}"...`);
    console.log(`   ${songs.length} songs selected\n`);

    // Create the tape
    const tapeData = {
      senderName: "🎬 Cassette Creator",
      recipientName: "Music Lover",
      relationship: "best_friend",
      style: "classic",
      visibility: "public",
      title: name,
      dedication: `A collection of ${songs.length} amazing Bollywood songs`,
      tracks: songs.map((song, idx) => ({
        title: song.title,
        providerTrackId: song.id,
        mediaAssetId: song.id,
        side: idx < Math.ceil(songs.length / 2) ? "A" : "B",
        position: idx % 2,
        provider: "media_asset",
      })),
    };

    const createRes = await fetch("http://localhost:3000/api/debug/create-tape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tapeData),
    });

    const result = await createRes.json();

    if (!result.success) {
      console.log(`❌ Error: ${result.error}`);
      return null;
    }

    console.log(`✅ Created!`);
    console.log(`   Public ID: ${result.publicId}`);
    console.log(`   URL: http://localhost:3000/t/${result.publicId}`);
    console.log(`   Tracks: ${result.tracksCount}`);

    return {
      name,
      publicId: result.publicId,
      url: `http://localhost:3000/t/${result.publicId}`,
      tracksCount: result.tracksCount,
    };
  } catch (error) {
    console.error(`Error creating "${name}":`, error.message);
    return null;
  }
}

async function main() {
  console.log("\n🎵 Creating Demo Cassette Tapes\n");
  console.log("================================\n");

  const tapes = [];

  // Create multiple tapes
  const tape1 = await createTape("🎬 Salman Khan Classics", 4);
  if (tape1) tapes.push(tape1);

  const tape2 = await createTape("💕 Bollywood Love Songs", 4);
  if (tape2) tapes.push(tape2);

  const tape3 = await createTape("🎶 Top Hindi Hits", 4);
  if (tape3) tapes.push(tape3);

  console.log("\n\n📋 Created Cassettes:\n");
  tapes.forEach((tape, i) => {
    console.log(`${i + 1}. ${tape.name}`);
    console.log(`   URL: ${tape.url}`);
    console.log(`   Tracks: ${tape.tracksCount}\n`);
  });

  if (tapes.length === 0) {
    console.log("❌ No tapes created. Check database for READY songs.");
  }
}

main();
