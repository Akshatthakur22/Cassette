-- AlterTable
ALTER TABLE "Tape" ADD COLUMN     "createdFromTapeId" TEXT,
ADD COLUMN     "flaggedForReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "voiceMessageDuration" INTEGER,
ADD COLUMN     "voiceMessageMimeType" TEXT,
ADD COLUMN     "voiceMessageSize" INTEGER,
ADD COLUMN     "voiceMessageUrl" TEXT;

-- CreateTable
CREATE TABLE "ContentReport" (
    "id" TEXT NOT NULL,
    "tapeId" TEXT NOT NULL,
    "reporterSessionId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentReport_tapeId_idx" ON "ContentReport"("tapeId");

-- CreateIndex
CREATE INDEX "ContentReport_status_idx" ON "ContentReport"("status");

-- CreateIndex
CREATE INDEX "Tape_publicId_idx" ON "Tape"("publicId");

-- CreateIndex
CREATE INDEX "Tape_draftToken_idx" ON "Tape"("draftToken");

-- CreateIndex
CREATE INDEX "Tape_status_idx" ON "Tape"("status");

-- CreateIndex
CREATE INDEX "Tape_visibility_idx" ON "Tape"("visibility");

-- CreateIndex
CREATE INDEX "Tape_deletedAt_idx" ON "Tape"("deletedAt");

-- CreateIndex
CREATE INDEX "TapeView_sessionId_idx" ON "TapeView"("sessionId");

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_tapeId_fkey" FOREIGN KEY ("tapeId") REFERENCES "Tape"("id") ON DELETE CASCADE ON UPDATE CASCADE;
