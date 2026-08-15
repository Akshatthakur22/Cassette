-- CreateTable
CREATE TABLE "Tape" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "draftToken" TEXT NOT NULL,
    "title" TEXT,
    "dedication" TEXT,
    "senderName" TEXT NOT NULL,
    "recipientName" TEXT,
    "relationship" TEXT,
    "style" TEXT NOT NULL DEFAULT 'classic',
    "visibility" TEXT NOT NULL DEFAULT 'unlisted',
    "memoryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "playlistSourceId" TEXT,
    "playlistSourceUrl" TEXT,
    "playlistName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Tape_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TapeTrack" (
    "id" TEXT NOT NULL,
    "tapeId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "thumbnailUrl" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'youtube',
    "providerTrackId" TEXT NOT NULL,
    "personalNote" TEXT,
    "durationSec" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TapeTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareEvent" (
    "id" TEXT NOT NULL,
    "tapeId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TapeView" (
    "id" TEXT NOT NULL,
    "tapeId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TapeView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YoutubeSearchCache" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channelTitle" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "durationSec" INTEGER,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YoutubeSearchCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YoutubePlaylistCache" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "channelTitle" TEXT,
    "trackCount" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YoutubePlaylistCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tape_publicId_key" ON "Tape"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Tape_draftToken_key" ON "Tape"("draftToken");

-- CreateIndex
CREATE INDEX "TapeTrack_tapeId_idx" ON "TapeTrack"("tapeId");

-- CreateIndex
CREATE INDEX "ShareEvent_tapeId_idx" ON "ShareEvent"("tapeId");

-- CreateIndex
CREATE INDEX "TapeView_tapeId_idx" ON "TapeView"("tapeId");

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeSearchCache_query_key" ON "YoutubeSearchCache"("query");

-- CreateIndex
CREATE INDEX "YoutubeSearchCache_expiresAt_idx" ON "YoutubeSearchCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "YoutubePlaylistCache_playlistId_key" ON "YoutubePlaylistCache"("playlistId");

-- CreateIndex
CREATE INDEX "YoutubePlaylistCache_expiresAt_idx" ON "YoutubePlaylistCache"("expiresAt");

-- AddForeignKey
ALTER TABLE "TapeTrack" ADD CONSTRAINT "TapeTrack_tapeId_fkey" FOREIGN KEY ("tapeId") REFERENCES "Tape"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareEvent" ADD CONSTRAINT "ShareEvent_tapeId_fkey" FOREIGN KEY ("tapeId") REFERENCES "Tape"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TapeView" ADD CONSTRAINT "TapeView_tapeId_fkey" FOREIGN KEY ("tapeId") REFERENCES "Tape"("id") ON DELETE CASCADE ON UPDATE CASCADE;
