-- CreateEnum
CREATE TYPE "internal_production_order_source" AS ENUM ('MANUAL', 'TRELLO');

-- CreateEnum
CREATE TYPE "internal_production_order_status" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "internal_production_order_quantity_unit" AS ENUM ('UN', 'B', 'G', 'KG');

-- CreateEnum
CREATE TYPE "internal_production_order_actor_type" AS ENUM ('SYSTEM', 'INTEGRATION', 'USER');

-- CreateEnum
CREATE TYPE "internal_production_order_event_source" AS ENUM ('TRELLO', 'MANUAL', 'SYSTEM');

-- CreateTable
CREATE TABLE "internal_production_order" (
    "id" TEXT NOT NULL,
    "trelloCardId" VARCHAR(128),
    "trelloCardUrl" VARCHAR(1024),
    "source" "internal_production_order_source" NOT NULL DEFAULT 'MANUAL',
    "status" "internal_production_order_status" NOT NULL DEFAULT 'PENDING',
    "lote" VARCHAR(64) NOT NULL,
    "quantityValue" DECIMAL(18,4) NOT NULL,
    "quantityUnit" "internal_production_order_quantity_unit" NOT NULL DEFAULT 'UN',
    "omieCode" VARCHAR(64),
    "parsedProductName" VARCHAR(512),
    "productDescription" TEXT,
    "stockQuantity" DECIMAL(18,4),
    "minimumStock" DECIMAL(18,4),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internal_production_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_production_order_event" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" VARCHAR(64) NOT NULL,
    "actorType" "internal_production_order_actor_type" NOT NULL,
    "actorId" VARCHAR(128),
    "source" "internal_production_order_event_source" NOT NULL,
    "message" VARCHAR(512) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_production_order_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_production_order_change" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "field" VARCHAR(128) NOT NULL,
    "before" TEXT,
    "after" TEXT,

    CONSTRAINT "internal_production_order_change_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "internal_production_order_trelloCardId_key" ON "internal_production_order"("trelloCardId");

-- CreateIndex
CREATE INDEX "internal_production_order_status_idx" ON "internal_production_order"("status");

-- CreateIndex
CREATE INDEX "internal_production_order_source_idx" ON "internal_production_order"("source");

-- CreateIndex
CREATE INDEX "internal_production_order_createdAt_idx" ON "internal_production_order"("createdAt");

-- CreateIndex
CREATE INDEX "internal_production_order_omieCode_idx" ON "internal_production_order"("omieCode");

-- CreateIndex
CREATE INDEX "internal_production_order_event_orderId_idx" ON "internal_production_order_event"("orderId");

-- CreateIndex
CREATE INDEX "internal_production_order_event_type_idx" ON "internal_production_order_event"("type");

-- CreateIndex
CREATE INDEX "internal_production_order_event_createdAt_idx" ON "internal_production_order_event"("createdAt");

-- CreateIndex
CREATE INDEX "internal_production_order_change_eventId_idx" ON "internal_production_order_change"("eventId");

-- AddForeignKey
ALTER TABLE "internal_production_order_event" ADD CONSTRAINT "internal_production_order_event_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "internal_production_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_production_order_change" ADD CONSTRAINT "internal_production_order_change_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "internal_production_order_event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
