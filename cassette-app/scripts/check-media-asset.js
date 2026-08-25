#!/usr/bin/env node

/**
 * Debug script to check MediaAsset status
 */

require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Get the specific asset mentioned in the logs
    const mediaAssetId = 'cmt8gz89m000dqt5r5navajjx';

    console.log(`\n📋 Checking MediaAsset: ${mediaAssetId}\n`);

    const asset = await prisma.mediaAsset.findUnique({
      where: { id: mediaAssetId },
    });

    if (!asset) {
      console.log('❌ Asset not found in database');
      process.exit(1);
    }

    console.log('Asset Details:');
    console.log(`  ID: ${asset.id}`);
    console.log(`  Title: ${asset.title}`);
    console.log(`  Status: ${asset.status}`);
    console.log(`  Storage Key: ${asset.storageKey}`);
    console.log(`  Storage Provider: ${asset.storageProvider}`);
    console.log(`  File Size: ${asset.fileSize ? (asset.fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}`);
    console.log(`  Created At: ${asset.createdAt}`);
    console.log(`  Processed At: ${asset.processedAt}`);
    console.log(`  Error: ${asset.error || 'None'}`);
    console.log(`  Attempt Count: ${asset.attemptCount}`);

    // Check status
    if (asset.status === 'READY' && asset.storageKey) {
      console.log('\n✅ Song is READY and should be playable');
      console.log(`\nStream URL: /api/media-assets/${asset.id}/stream`);
    } else if (asset.status === 'FAILED') {
      console.log('\n❌ Song FAILED to process');
      console.log(`Error: ${asset.error}`);
    } else if (asset.status === 'EXPIRED') {
      console.log('\n⚠️  Song has EXPIRED');
    } else {
      console.log(`\n⏳ Song status: ${asset.status} (processing)`);
    }

    // Get a few READY songs
    console.log('\n\n📊 Summary of all MediaAssets:\n');
    const stats = await prisma.mediaAsset.groupBy({
      by: ['status'],
      _count: true,
    });

    for (const stat of stats) {
      console.log(`  ${stat.status}: ${stat._count}`);
    }

    // List READY songs
    console.log('\n\n✅ READY songs (first 5):\n');
    const readySongs = await prisma.mediaAsset.findMany({
      where: { status: 'READY' },
      select: {
        id: true,
        title: true,
        storageKey: true,
      },
      take: 5,
    });

    if (readySongs.length === 0) {
      console.log('  ⚠️  No READY songs found');
    } else {
      readySongs.forEach((song, i) => {
        console.log(`  ${i + 1}. ${song.title || 'Untitled'}`);
        console.log(`     ID: ${song.id}`);
        console.log(`     Storage: ${song.storageKey}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
