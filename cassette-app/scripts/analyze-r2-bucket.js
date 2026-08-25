#!/usr/bin/env node

/**
 * R2 Bucket Analysis Script (JavaScript)
 * Lists and verifies all audio files in the R2 bucket
 * Compares against database records for integrity verification
 */

const {
  S3Client,
  ListObjectsV2Command,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function createR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.error("❌ R2 credentials not configured");
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

async function listR2Files(client) {
  const bucketName = process.env.R2_BUCKET_NAME || "cassette-media-assets";
  const files = [];

  let continuationToken = undefined;
  let pageCount = 0;

  try {
    do {
      pageCount++;
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: "media-assets/",
        ContinuationToken: continuationToken,
      });

      const response = await client.send(command);

      if (response.Contents) {
        response.Contents.forEach((object) => {
          if (object.Key && object.Size !== undefined && object.LastModified) {
            const key = object.Key;
            const mediaAssetId = key
              .replace("media-assets/", "")
              .replace(".mp3", "");

            files.push({
              key,
              size: object.Size,
              lastModified: object.LastModified,
              mediaAssetId,
            });
          }
        });
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    console.log(`✓ Listed R2 bucket in ${pageCount} page(s)`);
    return files;
  } catch (error) {
    console.error("❌ Failed to list R2 bucket:", error.message);
    throw error;
  }
}

async function main() {
  console.log("=".repeat(80));
  console.log("CASSETTE R2 BUCKET ANALYSIS REPORT");
  console.log("=".repeat(80));
  console.log(`Generated: ${new Date().toISOString()}\n`);

  const r2Client = createR2Client();
  if (!r2Client) {
    console.error("❌ Cannot proceed without R2 client");
    process.exit(1);
  }

  try {
    // List all R2 files
    console.log("1️⃣  R2 BUCKET CONTENTS");
    console.log("-".repeat(80));

    const r2Files = await listR2Files(r2Client);
    console.log(`Found ${r2Files.length} audio files in R2\n`);

    const totalSize = r2Files.reduce((sum, file) => sum + file.size, 0);
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

    console.log(`Total Storage Used: ${totalSizeMB} MB\n`);

    // List files
    console.log("R2 Files:");
    console.log("-".repeat(80));

    r2Files.forEach((file, idx) => {
      const sizeKB = (file.size / 1024).toFixed(2);
      const uploadDate = file.lastModified.toISOString().split("T")[0];

      console.log(`${String(idx + 1).padStart(2)}. ${file.key}`);
      console.log(
        `    Size: ${sizeKB} KB | Uploaded: ${uploadDate} | Asset ID: ${file.mediaAssetId}`
      );
    });

    console.log("\n2️⃣  DATABASE CROSS-REFERENCE");
    console.log("-".repeat(80));

    // Check which R2 files have corresponding READY records in database
    let matchedCount = 0;
    let mismatchedCount = 0;
    const mismatches = [];

    for (const file of r2Files) {
      if (
        !file.mediaAssetId ||
        file.mediaAssetId === "test-upload/tere-bin-test"
      ) {
        console.log(`⚠️  Skipping non-standard file: ${file.key}`);
        continue;
      }

      const dbRecord = await prisma.mediaAsset.findUnique({
        where: { id: file.mediaAssetId },
        select: { id: true, status: true, storageKey: true, title: true, error: true },
      });

      if (dbRecord) {
        if (
          dbRecord.status === "READY" &&
          dbRecord.storageKey === `media-assets/${file.mediaAssetId}.mp3`
        ) {
          matchedCount++;
          console.log(`✓ ${file.mediaAssetId}: READY in DB`);
        } else {
          mismatchedCount++;
          mismatches.push({
            r2File: file.key,
            dbStatus: dbRecord.status,
            dbError: dbRecord.error || undefined,
          });
          console.log(
            `⚠️  ${file.mediaAssetId}: Status in DB is ${dbRecord.status} (expected READY)`
          );
        }
      } else {
        mismatchedCount++;
        mismatches.push({
          r2File: file.key,
          dbStatus: "NOT FOUND",
        });
        console.log(`❌ ${file.mediaAssetId}: NOT FOUND in database`);
      }
    }

    const validFilesCount = r2Files.filter(
      (f) =>
        f.mediaAssetId && f.mediaAssetId !== "test-upload/tere-bin-test"
    ).length;

    console.log(`\n✓ Matched: ${matchedCount}/${validFilesCount}`);
    console.log(`⚠️  Mismatched: ${mismatchedCount}`);

    if (mismatches.length > 0) {
      console.log("\nMismatches Detail:");
      mismatches.forEach((mismatch) => {
        console.log(`  ${mismatch.r2File}:`);
        console.log(`    DB Status: ${mismatch.dbStatus || "N/A"}`);
        if (mismatch.dbError) {
          console.log(`    Error: ${mismatch.dbError}`);
        }
      });
    }

    console.log("\n3️⃣  DATABASE RECORDS WITHOUT R2 FILES");
    console.log("-".repeat(80));

    // Find READY records that don't have files in R2
    const readyRecords = await prisma.mediaAsset.findMany({
      where: { status: "READY", storageKey: { not: null } },
      select: { id: true, title: true, storageKey: true, fileSize: true },
    });

    const r2FileIds = new Set(r2Files.map((f) => f.mediaAssetId));
    const orphanedRecords = readyRecords.filter(
      (record) =>
        record.storageKey &&
        !r2FileIds.has(
          record.storageKey
            .replace("media-assets/", "")
            .replace(".mp3", "")
        )
    );

    if (orphanedRecords.length === 0) {
      console.log("✓ All READY records have corresponding R2 files");
    } else {
      console.log(
        `❌ Found ${orphanedRecords.length} READY records without R2 files:\n`
      );
      orphanedRecords.forEach((record) => {
        console.log(`  ${record.id}: "${record.title}"`);
        console.log(`    Storage Key: ${record.storageKey}`);
        console.log(`    File Size: ${record.fileSize} bytes`);
      });
    }

    console.log("\n4️⃣  SUMMARY");
    console.log("-".repeat(80));

    console.log(`✓ Total R2 Files: ${r2Files.length}`);
    console.log(`✓ Valid Media Assets: ${validFilesCount}`);
    console.log(`✓ Total DB Ready Records: ${readyRecords.length}`);
    console.log(`✓ Matched Records: ${matchedCount}`);
    console.log(`✓ Orphaned R2 Files (no DB record): ${mismatchedCount}`);
    console.log(`✓ Orphaned DB Records (no R2 file): ${orphanedRecords.length}`);
    console.log(`✓ Total R2 Storage: ${totalSizeMB} MB`);

    const avgFileSize =
      validFilesCount > 0
        ? ((totalSize / validFilesCount) / 1024).toFixed(2)
        : 0;
    console.log(`✓ Average File Size: ${avgFileSize} KB`);

    console.log("\n" + "=".repeat(80));
    console.log("END OF REPORT");
    console.log("=".repeat(80));

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Error during R2 analysis:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
