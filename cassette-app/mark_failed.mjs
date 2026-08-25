import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get all PENDING assets
  const pending = await prisma.mediaAsset.findMany({
    where: { status: 'PENDING' },
    select: { id: true, title: true, status: true }
  });

  console.log('Found PENDING assets:', pending.length);
  pending.forEach(p => console.log(`  - ${p.id}: ${p.title}`));

  // Mark them as FAILED so worker will retry
  const result = await prisma.mediaAsset.updateMany({
    where: { status: 'PENDING' },
    data: { 
      status: 'FAILED',
      error: 'Reset for retry with fixed yt-dlp',
      attemptCount: 0  // Reset attempt count
    }
  });

  console.log('\nMarked as FAILED:', result.count);
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
