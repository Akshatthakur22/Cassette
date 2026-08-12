export type Track = {
  id: string;
  side: "A" | "B";
  position: number;
  title: string;
  artist: string;
  thumbnailUrl: string;
  providerTrackId: string; // YouTube videoId placeholder
  personalNote?: string;
  durationSec: number;
};

export type FakeTape = {
  title: string;
  senderName: string;
  recipientName: string;
  dedication: string;
  style: "classic" | "y2k" | "love" | "road_trip";
  tracks: Track[];
};

export const FAKE_TAPE: FakeTape = {
  title: "Late Night Drive Vol. 1",
  senderName: "Arjun",
  recipientName: "Riya",
  dedication:
    "Every song on here has a story. Some are places we've been. Some are places I want to take you. This one's yours.",
  style: "road_trip",
  tracks: [
    {
      id: "t1",
      side: "A",
      position: 0,
      title: "Tum Se Hi",
      artist: "Mohit Chauhan",
      thumbnailUrl: "https://i.ytimg.com/vi/placeholder1/hqdefault.jpg",
      providerTrackId: "placeholder1",
      personalNote: "This one played when we drove through Manali at 2am.",
      durationSec: 298,
    },
    {
      id: "t2",
      side: "A",
      position: 1,
      title: "Phir Le Aya Dil",
      artist: "Arijit Singh",
      thumbnailUrl: "https://i.ytimg.com/vi/placeholder2/hqdefault.jpg",
      providerTrackId: "placeholder2",
      personalNote: "No explanation needed.",
      durationSec: 264,
    },
    {
      id: "t3",
      side: "A",
      position: 2,
      title: "Agar Tum Saath Ho",
      artist: "Alka Yagnik, Arijit Singh",
      thumbnailUrl: "https://i.ytimg.com/vi/placeholder3/hqdefault.jpg",
      providerTrackId: "placeholder3",
      personalNote: undefined,
      durationSec: 312,
    },
    {
      id: "t4",
      side: "A",
      position: 3,
      title: "Raabta",
      artist: "Arijit Singh",
      thumbnailUrl: "https://i.ytimg.com/vi/placeholder4/hqdefault.jpg",
      providerTrackId: "placeholder4",
      personalNote: "The bridge in this song. You know.",
      durationSec: 287,
    },
    {
      id: "t5",
      side: "B",
      position: 0,
      title: "Kesariya",
      artist: "Arijit Singh",
      thumbnailUrl: "https://i.ytimg.com/vi/placeholder5/hqdefault.jpg",
      providerTrackId: "placeholder5",
      personalNote: "I heard this the morning after and it wrecked me.",
      durationSec: 254,
    },
    {
      id: "t6",
      side: "B",
      position: 1,
      title: "Hawayein",
      artist: "Arijit Singh",
      thumbnailUrl: "https://i.ytimg.com/vi/placeholder6/hqdefault.jpg",
      providerTrackId: "placeholder6",
      personalNote: undefined,
      durationSec: 318,
    },
    {
      id: "t7",
      side: "B",
      position: 2,
      title: "Channa Mereya",
      artist: "Arijit Singh",
      thumbnailUrl: "https://i.ytimg.com/vi/placeholder7/hqdefault.jpg",
      providerTrackId: "placeholder7",
      personalNote: "This is the one I couldn't skip.",
      durationSec: 275,
    },
  ],
};

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
