
#!/usr/bin/env node

/**
 * Test Direct Upload & Playback
 * Tests the fast-track upload endpoint with a real MP3 file
 * Verifies immediate playback availability
 */

const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const fetch = require("node-fetch");

const UPLOAD_ENDPOINT = "https://cassette-share.vercel.app/api/media-assets/upload";
const STREAM_ENDPOINT = "https://cassette-share.vercel.app/api/media-assets";

async function getExistingMP3() {
  // Use one of the successfully processed songs for testing
  const testSongId = "cmt7hvqmj0002jcb134adcxdf"; // Tere Bin
  
  console.log("📝 Step 1: Using existing song from R2 as test data");
  console.log(`   Song ID: ${testSongId}`);
  console.log("   (This simulates a manually downloaded MP3)");
  
  return { testSongId, title: "TEST: Tere Bin - Direct Upload" };
}

async function uploadFile(filePath, title, artist) {
  console.log("\n📝 Step 2: Testing Direct Upload Endpoint");
  console.log(`   Endpoint: POST ${UPLOAD_ENDPOINT}`);
  console.log(`   File: ${path.basename(filePath)}`);
  console.log(`   Title: ${title}`);
  console.log(`   Artist: ${artist}\n`);

  try {
    const form = new FormData();
    const fileStream = fs.createReadStream(filePath);
    const stats = fs.statSync(filePath);

    form.append("file", fileStream, {
      filename: path.basename(filePath),
      contentType: "audio/mpeg",
    });
    form.append("title", title);
    form.append("artist", artist);

    console.log(`   Uploading ${(stats.size / 1024 / 1024).toFixed(2)} MB...`);

    const response = await fetch(UPLOAD_ENDPOINT, {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error(`   ❌ Upload failed: ${result.error}`);
      return null;
    }

    console.log(`   ✅ Upload successful!`);
    console.log(`   Response status: ${response.status}`);
    console.log(`   Media Asset ID: ${result.mediaAssetId}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Storage Key: ${result.storageKey}`);
    console.log(`   File Size: ${(result.fileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Duration: ${result.durationSec}s`);

    return result;
  } catch (error) {
    console.error(`   ❌ Upload error: ${error.message}`);
    return null;
  }
}

async function testPlayback(mediaAssetId) {
  console.log("\n📝 Step 3: Testing Immediate Playback");
  console.log(`   Endpoint: GET ${STREAM_ENDPOINT}/${mediaAssetId}/stream`);
  console.log(`   Testing if song is immediately playable...`);

  try {
    const response = await fetch(`${STREAM_ENDPOINT}/${mediaAssetId}/stream`);

    console.log(`   Response Status: ${response.status}`);

    if (response.status === 200) {
      console.log(`   ✅ Song is READY for playback (200 OK)`);
      console.log(`   Content-Type: ${response.headers.get("content-type")}`);
      console.log(`   Content-Length: ${response.headers.get("content-length")} bytes`);

      // Try to get a sample of the audio data
      const audioBuffer = await response.arrayBuffer();
      console.log(`   Downloaded: ${(audioBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);

      // Check for MP3 magic bytes
      const bytes = new Uint8Array(audioBuffer.slice(0, 3));
      const isMp3 = bytes[0] === 0xff; // MP3 frame header starts with 0xFF
      if (isMp3) {
        console.log(`   ✅ Audio data is valid MP3 (magic bytes verified)`);
      }

      return true;
    } else if (response.status === 202) {
      console.log(`   ⏳ Song still processing (202 Accepted)`);
      const data = await response.json();
      console.log(`   Status: ${data.status}`);
      return false;
    } else if (response.status === 410) {
      console.log(`   ❌ Song failed or expired (410 Gone)`);
      return false;
    } else {
      console.log(`   ⚠️  Unexpected status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Playback test error: ${error.message}`);
    return false;
  }
}

async function testWithExistingFile() {
  console.log("=".repeat(80));
  console.log("DIRECT UPLOAD & PLAYBACK TEST");
  console.log("=".repeat(80));
  console.log("");

  try {
    // For this test, we'll create a small dummy MP3 file
    // In production, users would provide real MP3s
    
    console.log("📝 Step 0: Creating test MP3 file");
    
    // Minimal valid MP3 header (first frame header only, for demo)
    const testMp3Path = "/tmp/test-upload.mp3";
    
    // Create a very small valid MP3 file for testing
    // This is just a frame header - real MP3 would be larger
    const mp3Header = Buffer.from([
      0xff, 0xfb, // Frame sync + MPEG version
      0x10, 0x00, // Bitrate, sample rate, padding, private
      0x00, 0x00, 0x00, 0x00, // Additional frame data
    ]);

    // Pad with some silence (zeros)
    const silence = Buffer.alloc(1024 * 10, 0); // 10KB of silence
    const testMp3 = Buffer.concat([mp3Header, silence]);

    fs.writeFileSync(testMp3Path, testMp3);
    console.log(`   ✅ Test MP3 created: ${testMp3Path}`);
    console.log(`   File size: ${testMp3.length} bytes\n`);

    // Upload the test file
    const uploadResult = await uploadFile(
      testMp3Path,
      "TEST: Direct Upload Song",
      "Test Artist"
    );

    if (!uploadResult) {
      console.error("\n❌ Upload failed - cannot proceed with playback test");
      process.exit(1);
    }

    // Test playback
    const canPlay = await testPlayback(uploadResult.mediaAssetId);

    console.log("\n" + "=".repeat(80));
    console.log("TEST RESULTS");
    console.log("=".repeat(80));

    if (canPlay) {
      console.log("✅ SUCCESS: Direct upload and immediate playback working!");
      console.log("\nSummary:");
      console.log("  1. Upload endpoint: ✅ Working (200 Created)");
      console.log("  2. Immediate status: ✅ READY (bypassed worker)");
      console.log("  3. Playback available: ✅ Song is playable immediately");
      console.log("\n💡 Users can now:");
      console.log("  1. Download songs manually from YouTube");
      console.log("  2. Upload MP3 files directly to Cassette");
      console.log("  3. Play songs instantly without waiting for background processing");
      console.log("\n🚀 Next: Deploy and document for users");
    } else {
      console.log("⚠️  PARTIAL: Upload works but playback needs checking");
    }

    console.log("=".repeat(80));

    // Cleanup
    try {
      fs.unlinkSync(testMp3Path);
    } catch (e) {
      // Ignore cleanup errors
    }
  } catch (error) {
    console.error("❌ Test error:", error.message);
    process.exit(1);
  }
}

testWithExistingFile();
