import { prisma } from "@/app/lib/prisma";

const DEMO_TAPES = [
  {
    publicId: "demo-1",
    title: "Late Night Vibes",
    senderName: "Alex",
    recipientName: "Jordan",
    relationship: "best_friend",
    style: "y2k",
    dedication: "For those nights when we just vibe together",
    visibility: "public",
    tracks: [
      // Side A
      { side: "A", position: 0, title: "Blinding Lights", artist: "The Weeknd", providerTrackId: "0VjIjW4GlUZAMYd2vXMwbk" },
      { side: "A", position: 1, title: "As It Was", artist: "Harry Styles", providerTrackId: "4cOdK2wGLETKBW3PvgPWqLv" },
      { side: "A", position: 2, title: "Heat Waves", artist: "Glass Animals", providerTrackId: "4cOdK2wGLETKBW3PvgPWqLv" },
      { side: "A", position: 3, title: "Levitating", artist: "Dua Lipa", providerTrackId: "0dGsgranada5tFwyIbi77Xo" },
      // Side B
      { side: "B", position: 0, title: "Watermelon Sugar", artist: "Harry Styles", providerTrackId: "6RtPk9QWIOVVVld0HCl9jV" },
      { side: "B", position: 1, title: "Good as Hell", artist: "Lizzo", providerTrackId: "2takcwFFpFHSY8L7jdohc7" },
      { side: "B", position: 2, title: "Self Control", artist: "Frank Ocean", providerTrackId: "0pt3bAWANVcVzT53Youtube" },
      { side: "B", position: 3, title: "Pink + White", artist: "Frank Ocean", providerTrackId: "3AJwUDP919kvQ9QcozQIx7" },
    ],
  },
  {
    publicId: "demo-2",
    title: "Road Trip Anthems",
    senderName: "Casey",
    recipientName: "Riley",
    relationship: "partner",
    style: "road_trip",
    dedication: "Every mile with you feels like home",
    visibility: "public",
    tracks: [
      { side: "A", position: 0, title: "Don't Stop Believin'", artist: "Journey", providerTrackId: "4bHsXqMQo5WGLEAJIUOA5W" },
      { side: "A", position: 1, title: "Born to Be Wild", artist: "Steppenwolf", providerTrackId: "0diylVWWywYo9Au3tLEbkX" },
      { side: "A", position: 2, title: "Life in the Fast Lane", artist: "Eagles", providerTrackId: "3qm84nBvXcNwORw03zNtKc" },
      { side: "A", position: 3, title: "Take Me Home", artist: "Phil Collins", providerTrackId: "5hYwTfOW5OnRBvK9Wks8Nz" },
      { side: "B", position: 0, title: "Highway to Hell", artist: "AC/DC", providerTrackId: "3qm84nBvXcNwORw03zNtKc" },
      { side: "B", position: 1, title: "Going Down the Road Feeling Bad", artist: "Allman Brothers Band", providerTrackId: "3EhkuLT4zcC9IxZ1x1FPqf" },
      { side: "B", position: 2, title: "Radar Love", artist: "Golden Earring", providerTrackId: "3AJwUDP919kvQ9QcozQIx7" },
      { side: "B", position: 3, title: "Take It Easy", artist: "Eagles", providerTrackId: "3tket3T0yNA52eYFAgL5jL" },
    ],
  },
  {
    publicId: "demo-3",
    title: "Soft Indie Dreams",
    senderName: "Morgan",
    recipientName: null,
    relationship: "self",
    style: "love",
    dedication: "When you need to feel something deep",
    visibility: "public",
    tracks: [
      { side: "A", position: 0, title: "RE: Stacks", artist: "Bon Iver", providerTrackId: "6I0W2LH0Z7RA1_1PCGJ1G1" },
      { side: "A", position: 1, title: "Naked As We Came", artist: "Iron & Wine", providerTrackId: "1dO0nDNe2z7RHHfz9oeRzX" },
      { side: "A", position: 2, title: "Holocene", artist: "Bon Iver", providerTrackId: "6I0W2LH0Z7RA1_1PCGJ1G1" },
      { side: "A", position: 3, title: "Skinny Love", artist: "Bon Iver", providerTrackId: "1dO0nDNe2z7RHHfz9oeRzX" },
      { side: "B", position: 0, title: "Such Great Heights", artist: "The Postal Service", providerTrackId: "7qiZfU4dY1lsylUevLLRPm" },
      { side: "B", position: 1, title: "Float On", artist: "Modest Mouse", providerTrackId: "3KkXRkHBMCe25ippGrq1Em" },
      { side: "B", position: 2, title: "Youth", artist: "Daughter", providerTrackId: "79q4Jq6cRDw2gB41EqYV7i" },
      { side: "B", position: 3, title: "First Day of My Life", artist: "Bright Eyes", providerTrackId: "2takcwFFpFHSY8L7jdohc7" },
    ],
  },
  {
    publicId: "demo-4",
    title: "90s Nostalgia",
    senderName: "Sam",
    recipientName: "Taylor",
    relationship: "family",
    style: "classic",
    dedication: "Back to simpler times",
    visibility: "public",
    tracks: [
      { side: "A", position: 0, title: "Creep", artist: "Radiohead", providerTrackId: "6I0W2LH0Z7RA1_1PCGJ1G1" },
      { side: "A", position: 1, title: "No Scrubs", artist: "TLC", providerTrackId: "3EhkuLT4zcC9IxZ1x1FPqf" },
      { side: "A", position: 2, title: "Bitter Sweet Symphony", artist: "The Verve", providerTrackId: "3qm84nBvXcNwORw03zNtKc" },
      { side: "A", position: 3, title: "Wonderwall", artist: "Oasis", providerTrackId: "5hYwTfOW5OnRBvK9Wks8Nz" },
      { side: "B", position: 0, title: "Smells Like Teen Spirit", artist: "Nirvana", providerTrackId: "3AJwUDP919kvQ9QcozQIx7" },
      { side: "B", position: 1, title: "Under the Bridge", artist: "Red Hot Chili Peppers", providerTrackId: "3tket3T0yNA52eYFAgL5jL" },
      { side: "B", position: 2, title: "Zombie", artist: "The Cranberries", providerTrackId: "6RtPk9QWIOVVVld0HCl9jV" },
      { side: "B", position: 3, title: "Black Hole Sun", artist: "Soundgarden", providerTrackId: "2takcwFFpFHSY8L7jdohc7" },
    ],
  },
  {
    publicId: "demo-5",
    title: "Study Focus",
    senderName: "Jamie",
    recipientName: null,
    relationship: "other",
    style: "y2k",
    dedication: "For the late-night study sessions",
    visibility: "public",
    tracks: [
      { side: "A", position: 0, title: "lo-fi hip hop beat", artist: "Chilled Cow", providerTrackId: "4cOdK2wGLETKBW3PvgPWqLv" },
      { side: "A", position: 1, title: "Night Owl", artist: "Galimatias", providerTrackId: "0dGsgrad5tFwyIbi77Xo" },
      { side: "A", position: 2, title: "Joji - Glimpse of Us", artist: "Joji", providerTrackId: "6RtPk9QWIOVVVld0HCl9jV" },
      { side: "A", position: 3, title: "Daydreaming", artist: "Radiohead", providerTrackId: "2takcwFFpFHSY8L7jdohc7" },
      { side: "B", position: 0, title: "Cloud 9", artist: "Beach House", providerTrackId: "0pt3bAWANVcVzT53Youtube" },
      { side: "B", position: 1, title: "Electric Feel", artist: "MGMT", providerTrackId: "3AJwUDP919kvQ9QcozQIx7" },
      { side: "B", position: 2, title: "Dreams", artist: "Fleetwood Mac", providerTrackId: "4bHsXqMQo5WGLEAJIUOA5W" },
      { side: "B", position: 3, title: "Toto - Africa", artist: "Toto", providerTrackId: "0diylVWWywYo9Au3tLEbkX" },
    ],
  },
  {
    publicId: "demo-6",
    title: "Heartbreak Healing",
    senderName: "Alex",
    recipientName: null,
    relationship: "self",
    style: "love",
    dedication: "For getting through it",
    visibility: "public",
    tracks: [
      { side: "A", position: 0, title: "Someone Like You", artist: "Adele", providerTrackId: "3qm84nBvXcNwORw03zNtKc" },
      { side: "A", position: 1, title: "Skinny Love", artist: "Bon Iver", providerTrackId: "1dO0nDNe2z7RHHfz9oeRzX" },
      { side: "A", position: 2, title: "All Too Well", artist: "Taylor Swift", providerTrackId: "5hYwTfOW5OnRBvK9Wks8Nz" },
      { side: "A", position: 3, title: "Back to December", artist: "Taylor Swift", providerTrackId: "3AJwUDP919kvQ9QcozQIx7" },
      { side: "B", position: 0, title: "Tears in Heaven", artist: "Eric Clapton", providerTrackId: "3tket3T0yNA52eYFAgL5jL" },
      { side: "B", position: 1, title: "Sad Beautiful Tragic", artist: "Taylor Swift", providerTrackId: "6RtPk9QWIOVVVld0HCl9jV" },
      { side: "B", position: 2, title: "Fix You", artist: "Coldplay", providerTrackId: "2takcwFFpFHSY8L7jdohc7" },
      { side: "B", position: 3, title: "Yesterday", artist: "The Beatles", providerTrackId: "0pt3bAWANVcVzT53Youtube" },
    ],
  },
];

async function createDemoTapes() {
  try {
    console.log("🎵 Creating demo tapes...");

    for (const demoTape of DEMO_TAPES) {
      // Check if tape already exists
      const existing = await prisma.tape.findUnique({
        where: { publicId: demoTape.publicId },
      });

      if (existing) {
        console.log(`✓ Tape ${demoTape.publicId} already exists, skipping...`);
        continue;
      }

      // Create tape
      const tape = await prisma.tape.create({
        data: {
          publicId: demoTape.publicId,
          draftToken: `demo-token-${demoTape.publicId}`,
          title: demoTape.title,
          senderName: demoTape.senderName,
          recipientName: demoTape.recipientName,
          relationship: demoTape.relationship,
          style: demoTape.style,
          dedication: demoTape.dedication,
          visibility: demoTape.visibility,
          status: "published",
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        },
      });

      // Create tracks
      for (const track of demoTape.tracks) {
        await prisma.tapeTrack.create({
          data: {
            tapeId: tape.id,
            side: track.side,
            position: track.position,
            title: track.title,
            artist: track.artist,
            providerTrackId: track.providerTrackId,
            provider: "youtube",
          },
        });
      }

      console.log(`✓ Created tape: ${demoTape.title} (${demoTape.publicId})`);
    }

    console.log("✅ Demo tapes created successfully!");
  } catch (error) {
    console.error("❌ Error creating demo tapes:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoTapes();
