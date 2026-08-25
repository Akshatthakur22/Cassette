#!/usr/bin/env node

/**
 * Test New Song Addition Script
 * Tests the complete pipeline: add song → trigger worker → verify upload
 * Simulates what happens when a user adds a song to a tape
 */

const { PrismaClient } = require("@prisma/client");
const fetch = require("node-fetch");

const prisma = new PrismaClient();

async function triggerWorker(mediaAssetId) {
  const baseUrl = "https://cassette-share.vercel.app";
  const url = `${baseUrl}/api/media-worker/process`;
  const secret = process.env.MEDIA_WORKER_SECRET || "";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-worker-secret": secret,
      },
      body: JSON.stringify({
        trigger: "manual",
        mediaAssetId,
      }),
    });

    return {
      ok: response.ok,
      status: response.status,
      text: await response.text(),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
    };
  }
}

async function main() {
  console.log("=".repeat(80));
  console.log("NEW SONG ADDITION TEST");
  console.log("=".repeat(80));
  console.log(`Started: ${new Date().toISOString()}\n`);

  try {
    // Use a different test video each time
    // These are all short, commonly available songs
    const testSongs = [
      {
        videoId: "p1s2CG2ZDS4",
        title: "Ray J - One Wish (Lyrics)",
        artist: "Ray J",
        duration: 238,
      },
      {
        videoId: "iOpJywrdCuQ",
        title: "Bryson Tiller - Exchange (Official Audio)",
        artist: "Bryson Tiller",
        duration: 219,
      },
      {
        videoId: "mW1h0UeysDg",
        title: "Tink - Bonnie & Clyde Lyrics",
        artist: "Tink",
        duration: 215,
      },
    ];

    // Pick a random test song (or specific one)
    const testSong = testSongs[0];

    console.log("📝 STEP 1: Adding New Song to Database");
    console.log("-".repeat(80));
    console.log(`Video ID: ${testSong.videoId}`);
    console.log(`Title: ${testSong.title}`);
    console.log(`Artist: ${testSong.artist}`);
    console.log(`Duration: ${testSong.duration}s\n`);

    // Check if already exists
    let mediaAsset = await prisma.mediaAsset.findFirst({
      where: {
        provider: "youtube",
        providerTrackId: testSong.videoId,
      },
    });

    if (mediaAsset) {
      console.log(`⚠️  Song already exists in database`);
      console.log(`   ID: ${mediaAsset.id}`);
      console.log(`   Current status: ${mediaAsset.status}`);

      // Reset to PENDING for this test
      if (mediaAsset.status !== "PENDING") {
        console.log(`\n   Resetting to PENDING for test...\n`);
        mediaAsset = await prisma.mediaAsset.update({
          where: { id: mediaAsset.id },
          data: {
            status: "PENDING",
            error: null,
            errorDetails: null,
            storageKey: null,
            fileSize: null,
            checksum: null,
            processedAt: null,
            attemptCount: 0,
          },
        });
      }
    } else {
      mediaAsset = await prisma.mediaAsset.create({
        data: {
          provider: "youtube",
          providerTrackId: testSong.videoId,
          title: testSong.title,
          artist: testSong.artist,
          durationSec: testSong.duration,
          status: "PENDING",
          attemptCount: 0,
        },
      });
      console.log(`✓ Created new MediaAsset: ${mediaAsset.id}\n`);
    }

    console.log("📝 STEP 2: Triggering Worker");
    console.log("-".repeat(80));

    const triggerResult = await triggerWorker(mediaAsset.id);

    console.log(`Worker endpoint: https://cassette-share.vercel.app/api/media-worker/process`);
    console.log(`Status: ${triggerResult.status}`);
    console.log(`Response: ${triggerResult.text}\n`);

    if (!triggerResult.ok) {
      console.error(`❌ Worker trigger failed!`);
      console.error(`   This means the production URL is unreachable.`);
      process.exit(1);
    }

    console.log("✓ Worker trigger successful\n");

    console.log("📝 STEP 3: Polling for Completion (up to 3 minutes)");
    console.log("-".repeat(80));

    const startTime = Date.now();
    const maxWaitMs = 3 * 60 * 1000; // 3 minutes
    const pollIntervalMs = 10000; // 10 seconds

    let lastStatus = mediaAsset.status;
    let pollCount = 0;

    while (Date.now() - startTime < maxWaitMs) {
      pollCount++;
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

      const current = await prisma.mediaAsset.findUnique({
        where: { id: mediaAsset.id },
        select: {
          status: true,
          error: true,
          attemptCount: true,
          fileSize: true,
          storageKey: true,
        },
      });

      const elapsed = Math.round((Date.now() - startTime) / 1000);

      if (current.status !== lastStatus) {
        console.log(`[${elapsed}s] Status: ${current.status}`);
        lastStatus = current.status;
      }

      // Terminal states
      if (current.status === "READY") {
        console.log(`\n✅ SUCCESS! Song processed in ${elapsed}s`);
        console.log(`   Storage: ${current.storageKey}`);
        console.log(`   File Size: ${(current.fileSize / 1024 / 1024).toFixed(2)} MB`);
        break;
      }

      if (current.status === "FAILED") {
        console.log(`\n❌ FAILED: ${current.error}`);
        break;
      }

      // Log every 30 seconds
      if (pollCount % 3 === 0) {
        console.log(`[${elapsed}s] Still processing (${current.status})...`);
      }
    }

    console.log("\n📊 FINAL RESULT");
    console.log("-".repeat(80));

    const final = await prisma.mediaAsset.findUnique({
      where: { id: mediaAsset.id },
    });

    console.log(`ID: ${final.id}`);
    console.log(`Status: ${final.status}`);
    console.log(`Title: ${final.title}`);
    console.log(`File Size: ${final.fileSize ? `${(final.fileSize / 1024 / 1024).toFixed(2)} MB` : "N/A"}`);
    console.log(`Storage: ${final.storageKey || "Not uploaded"}`);
    console.log(`Error: ${final.error || "None"}`);
    console.log(`Attempts: ${final.attemptCount}`);

    console.log("\n" + "=".repeat(80));

    if (final.status === "READY") {
      console.log("✅ TEST PASSED");
      console.log("   Worker trigger fix is working correctly!");
      console.log("   New songs are being processed successfully.");
    } else if (final.status === "FAILED") {
      console.log("❌ TEST FAILED");
      console.log(`   Error: ${final.error}`);
      console.log("   Check logs for details");
    } else {
      console.log("⏳ TEST INCONCLUSIVE");
      console.log(`   Status: ${final.status}`);
      console.log("   Still processing - run script again to check");
    }

    console.log("=".repeat(80));

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Error:", error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
