-- CreateTable
CREATE TABLE "sync_record" (
    "id" TEXT NOT NULL,
    "syncType" VARCHAR(32) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "itemsFailed" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "metadata" JSONB,

    CONSTRAINT "sync_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sync_record_syncType_idx" ON "sync_record"("syncType");

-- CreateIndex
CREATE INDEX "sync_record_status_idx" ON "sync_record"("status");

-- CreateIndex
CREATE INDEX "sync_record_startedAt_idx" ON "sync_record"("startedAt");
