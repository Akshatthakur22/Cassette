const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEMO_TAPES = [
  { publicId: "demo-1", title: "Late Night Vibes", senderName: "Alex", recipientName: "Jordan", relationship: "best_friend", style: "y2k", dedication: "For those nights when we just vibe together", visibility: "public", tracks: [
    { side: "A", position: 0, title: "Blinding Lights", artist: "The Weeknd", providerTrackId: "0VjIjW4GlUZAMYd2vXMwbk" },
    { side: "A", position: 1, title: "As It Was", artist: "Harry Styles", providerTrackId: "4cOdK2wGLETKBW3PvgPWqLv" },
    { side: "A", position: 2, title: "Heat Waves", artist: "Glass Animals", providerTrackId: "4cOdK2wGLETKBW3PvgPWqLv" },
    { side: "A", position: 3, title: "Levitating", artist: "Dua Lipa", providerTrackId: "0dGsgranada5tFwyIbi77Xo" },
    { side: "B", position: 0, title: "Watermelon Sugar", artist: "Harry Styles", providerTrackId: "6RtPk9QWIOVVVld0HCl9jV" },
    { side: "B", position: 1, title: "Good as Hell", artist: "Lizzo", providerTrackId: "2takcwFFpFHSY8L7jdohc7" },
  ]},
  { publicId: "demo-2", title: "Road Trip Anthems", senderName: "Casey", recipientName: "Riley", relationship: "partner", style: "road_trip", dedication: "Every mile with you", visibility: "public", tracks: [
    { side: "A", position: 0, title: "Don't Stop Believin'", artist: "Journey", providerTrackId: "4bHsXqMQo5WGLEAJIUOA5W" },
    { side: "A", position: 1, title: "Born to Be Wild", artist: "Steppenwolf", providerTrackId: "0diylVWWywYo9Au3tLEbkX" },
    { side: "B", position: 0, title: "Highway to Hell", artist: "AC/DC", providerTrackId: "3qm84nBvXcNwORw03zNtKc" },
    { side: "B", position: 1, title: "Radar Love", artist: "Golden Earring", providerTrackId: "3AJwUDP919kvQ9QcozQIx7" },
  ]},
  { publicId: "demo-3", title: "Soft Indie Dreams", senderName: "Morgan", recipientName: null, relationship: "self", style: "love", dedication: "Feel something deep", visibility: "public", tracks: [
    { side: "A", position: 0, title: "RE: Stacks", artist: "Bon Iver", providerTrackId: "6I0W2LH0Z7RA1_1PCGJ1G1" },
    { side: "A", position: 1, title: "Naked As We Came", artist: "Iron & Wine", providerTrackId: "1dO0nDNe2z7RHHfz9oeRzX" },
    { side: "B", position: 0, title: "Such Great Heights", artist: "The Postal Service", providerTrackId: "7qiZfU4dY1lsylUevLLRPm" },
    { side: "B", position: 1, title: "First Day of My Life", artist: "Bright Eyes", providerTrackId: "2takcwFFpFHSY8L7jdohc7" },
  ]},
];

(async () => {
  try {
    for (const d of DEMO_TAPES) {
      const e = await prisma.tape.findUnique({ where: { publicId: d.publicId } });
      if (e) { console.log(`✓ ${d.publicId} exists`); continue; }
      const t = await prisma.tape.create({ data: { publicId: d.publicId, draftToken: `t-${d.publicId}-${Date.now()}`, title: d.title, senderName: d.senderName, recipientName: d.recipientName, relationship: d.relationship, style: d.style, dedication: d.dedication, visibility: d.visibility, status: "published" }});
      for (const tr of d.tracks) await prisma.tapeTrack.create({ data: { tapeId: t.id, side: tr.side, position: tr.position, title: tr.title, artist: tr.artist, providerTrackId: tr.providerTrackId, provider: "youtube" }});
      console.log(`✓ Created ${d.publicId}`);
    }
    console.log("✅ Done!");
  } catch (e) { console.error(e.message); } finally { await prisma.$disconnect(); }
})();
