#!/usr/bin/env node

/**
 * Test Worker Trigger Script
 * Adds a test song to database and verifies worker trigger works
 * Used to validate the worker trigger URL fix
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("=".repeat(80));
  console.log("WORKER TRIGGER TEST");
  console.log("=".repeat(80));
  console.log(`Started: ${new Date().toISOString()}\n`);

  try {
    // Test video: A short, commonly available song
    // Using "Tere Bin" by Atif Aslam (known to work, ~3:30)
    const testVideoId = "EaaeuLFk5rg";
    const testTitle = "TEST: Tere Bin - Atif Aslam (Worker Trigger Verification)";
    const testArtist = "Atif Aslam";
    const testDuration = 210; // 3:30

    console.log("📝 Step 1: Creating test MediaAsset...");
    console.log(`Video ID: ${testVideoId}`);
    console.log(`Title: ${testTitle}`);
    console.log(`Duration: ${testDuration}s`);

    // Check if this video already exists
    const existing = await prisma.mediaAsset.findFirst({
      where: {
        provider: "youtube",
        providerTrackId: testVideoId,
      },
    });

    let mediaAsset;

    if (existing) {
      console.log(`ℹ️  Video already in database. ID: ${existing.id}`);
      console.log(`   Status: ${existing.status}`);
      mediaAsset = existing;
    } else {
      // Create new media asset
      mediaAsset = await prisma.mediaAsset.create({
        data: {
          provider: "youtube",
          providerTrackId: testVideoId,
          title: testTitle,
          artist: testArtist,
          durationSec: testDuration,
          status: "PENDING",
          attemptCount: 0,
        },
      });

      console.log(`✓ Created: ${mediaAsset.id}`);
    }

    console.log("\n📝 Step 2: Triggering worker manually...");

    // Call worker endpoint directly to verify trigger works
    const baseUrl = "https://cassette-share.vercel.app";
    const workerUrl = `${baseUrl}/api/media-worker/process`;
    const secret = process.env.MEDIA_WORKER_SECRET || "";

    console.log(`Worker URL: ${workerUrl}`);
    console.log(`Secret configured: ${secret ? "yes" : "NO - WILL FAIL"}`);

    if (!secret) {
      console.error(
        "\n❌ ERROR: MEDIA_WORKER_SECRET not set in environment"
      );
      console.error("   Set it from .env.local or Vercel environment variables");
      process.exit(1);
    }

    try {
      const response = await fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-worker-secret": secret,
        },
        body: JSON.stringify({
          trigger: "test",
          mediaAssetId: mediaAsset.id,
        }),
      });

      const responseText = await response.text();
      console.log(`Response status: ${response.status}`);
      console.log(`Response body: ${responseText}`);

      if (response.ok) {
        console.log("✓ Worker trigger successful (200 OK)");
      } else {
        console.error(`❌ Worker trigger failed (${response.status})`);
        console.error(`   ${responseText}`);
      }
    } catch (fetchError) {
      console.error(`❌ Failed to reach worker: ${fetchError.message}`);
    }

    console.log("\n📝 Step 3: Checking MediaAsset status...");
    console.log("   (Processing may take 30 seconds to several minutes)");
    console.log("   Checking initial status...\n");

    // Poll status for up to 2 minutes
    const startTime = Date.now();
    const maxWaitMs = 2 * 60 * 1000; // 2 minutes
    const pollIntervalMs = 5000; // 5 seconds

    let lastStatus = mediaAsset.status;
    let attempts = 0;

    while (Date.now() - startTime < maxWaitMs) {
      attempts++;
      const current = await prisma.mediaAsset.findUnique({
        where: { id: mediaAsset.id },
        select: {
          id: true,
          status: true,
          error: true,
          attemptCount: true,
          fileSize: true,
          storageKey: true,
          lastAttemptAt: true,
        },
      });

      if (current.status !== lastStatus) {
        console.log(
          `[${new Date().toISOString()}] Status: ${current.status}`
        );
        lastStatus = current.status;
      }

      // Success conditions
      if (current.status === "READY") {
        console.log("\n✅ SUCCESS: Song uploaded to R2!");
        console.log(`   Storage Key: ${current.storageKey}`);
        console.log(`   File Size: ${current.fileSize} bytes`);
        console.log(`   Total time: ${(Date.now() - startTime) / 1000}s`);
        break;
      }

      // Failure conditions
      if (current.status === "FAILED") {
        console.log(`\n❌ FAILED: ${current.error}`);
        if (current.attemptCount > 0) {
          console.log(`   Attempts: ${current.attemptCount}`);
        }
        break;
      }

      // Still processing - wait and check again
      if (attempts % 12 === 0) {
        // Log every minute
        const elapsed = (Date.now() - startTime) / 1000;
        console.log(
          `[${elapsed}s] Still processing... (status: ${current.status})`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    const finalAsset = await prisma.mediaAsset.findUnique({
      where: { id: mediaAsset.id },
    });

    console.log("\n📊 FINAL STATUS");
    console.log("-".repeat(80));
    console.log(`ID: ${finalAsset.id}`);
    console.log(`Status: ${finalAsset.status}`);
    console.log(`Attempts: ${finalAsset.attemptCount}`);
    console.log(`Error: ${finalAsset.error || "None"}`);
    console.log(`Storage Key: ${finalAsset.storageKey || "Not yet uploaded"}`);
    console.log(`File Size: ${finalAsset.fileSize || "N/A"}`);
    console.log(`Processed At: ${finalAsset.processedAt || "N/A"}`);

    console.log("\n" + "=".repeat(80));

    if (finalAsset.status === "READY") {
      console.log("✅ TEST PASSED: Worker trigger is working!");
      console.log("   New songs can now be processed successfully.");
    } else if (finalAsset.status === "FAILED") {
      console.log("❌ TEST FAILED: Worker encountered an error");
      console.log(`   Error: ${finalAsset.error}`);
    } else {
      console.log("⏳ TEST INCONCLUSIVE: Processing still in progress");
      console.log(`   Status: ${finalAsset.status}`);
      console.log("   Run this script again to check final status");
    }

    console.log("=".repeat(80));

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Error:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
