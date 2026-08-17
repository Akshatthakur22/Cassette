const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo tapes...');

  // Demo 1 tape with Indie/Chill vibes
  const demo1 = await prisma.tape.create({
    data: {
      publicId: 'demo-1',
      draftToken: 'demo-token-1',
      senderName: 'Akshay',
      recipientName: 'Demo User',
      dedication: 'A collection of indie and chill tracks for you. Every song on here has a story.',
      relationship: 'best_friend',
      style: 'cream',
      visibility: 'public',
      status: 'published',
      tracks: {
        create: [
          // Side A
          {
            side: 'A',
            position: 1,
            title: 'Indie Song 1',
            artist: 'Various Artists',
            provider: 'youtube',
            providerTrackId: 'lSPNH_rYKIg',
            durationSec: 240,
          },
          {
            side: 'A',
            position: 2,
            title: 'Indie Song 2',
            artist: 'Various Artists',
            provider: 'youtube',
            providerTrackId: 'dQw4w9WgXcQ',
            durationSec: 230,
          },
          {
            side: 'A',
            position: 3,
            title: 'Indie Song 3',
            artist: 'Various Artists',
            provider: 'youtube',
            providerTrackId: 'jNQXAC9IVRw',
            durationSec: 250,
          },
          // Side B
          {
            side: 'B',
            position: 1,
            title: 'Chill Track 1',
            artist: 'Various Artists',
            provider: 'youtube',
            providerTrackId: 'kffacxfA7g4',
            durationSec: 260,
          },
          {
            side: 'B',
            position: 2,
            title: 'Chill Track 2',
            artist: 'Various Artists',
            provider: 'youtube',
            providerTrackId: '9bZkp7q19f0',
            durationSec: 240,
          },
        ],
      },
    },
  });

  console.log('✅ Demo 1 created:', demo1.publicId);

  // Demo 2 tape with Lo-Fi Hip Hop vibes
  const demo2 = await prisma.tape.create({
    data: {
      publicId: 'demo-2',
      draftToken: 'demo-token-2',
      senderName: 'Test User',
      recipientName: 'Friend',
      dedication: 'Lo-fi beats to study/chill to. Hope you enjoy these vibes!',
      relationship: 'best_friend',
      style: 'sky',
      visibility: 'public',
      status: 'published',
      tracks: {
        create: [
          // Side A
          {
            side: 'A',
            position: 1,
            title: 'Lo-Fi Beat 1',
            artist: 'Various Artists',
            provider: 'youtube',
            providerTrackId: 'RG-D4bcg54s',
            durationSec: 300,
          },
          {
            side: 'A',
            position: 2,
            title: 'Lo-Fi Beat 2',
            artist: 'Various Artists',
            provider: 'youtube',
            providerTrackId: 'kffacxfA7g4',
            durationSec: 280,
          },
          {
            side: 'A',
            position: 3,
            title: 'Lo-Fi Beat 3',
            artist: 'Various Artists',
            provider: 'youtube',
            providerTrackId: 'jNQXAC9IVRw',
            durationSec: 290,
          },
          // Side B
          {
            side: 'B',
            position: 1,
            title: 'Study Music 1',
            artist: 'Various Artists',
            provider: 'youtube',
            providerTrackId: 'dQw4w9WgXcQ',
            durationSec: 270,
          },
          {
            side: 'B',
            position: 2,
            title: 'Study Music 2',
            artist: 'Various Artists',
            provider: 'youtube',
            providerTrackId: '9bZkp7q19f0',
            durationSec: 310,
          },
        ],
      },
    },
  });

  console.log('✅ Demo 2 created:', demo2.publicId);

  console.log('🎉 Seeding complete!');
  console.log('Visit http://localhost:3000/t/demo-1 and /t/demo-2 to see the tapes');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
