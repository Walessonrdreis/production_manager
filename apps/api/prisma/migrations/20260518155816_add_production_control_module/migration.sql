-- CreateEnum
CREATE TYPE "production_control_status" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "production_control_history_action" AS ENUM ('SNAPSHOT_CREATED', 'ORDER_CHECKED', 'ORDER_UNCHECKED', 'PRODUCT_CHECKED', 'PRODUCT_UNCHECKED', 'DATE_UPDATED', 'AUTO_COMPLETED');

-- CreateTable
CREATE TABLE "production_control_snapshot" (
    "id" TEXT NOT NULL,
    "snapshotId" VARCHAR(64) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_control_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_control_product" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "totalQuantity" DECIMAL(18,4) NOT NULL,
    "pendingQuantity" DECIMAL(18,4) NOT NULL,
    "status" "production_control_status" NOT NULL DEFAULT 'PENDING',
    "scheduledDate" TIMESTAMP(3),
    "actualDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_control_product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_control_order" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderNumber" VARCHAR(64),
    "clientName" TEXT,
    "quantity" DECIMAL(18,4) NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_control_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_control_history" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "productId" TEXT,
    "action" "production_control_history_action" NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_control_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "production_control_snapshot_snapshotId_key" ON "production_control_snapshot"("snapshotId");

-- CreateIndex
CREATE INDEX "production_control_snapshot_snapshotId_idx" ON "production_control_snapshot"("snapshotId");

-- CreateIndex
CREATE INDEX "production_control_snapshot_createdAt_idx" ON "production_control_snapshot"("createdAt");

-- CreateIndex
CREATE INDEX "production_control_product_snapshotId_idx" ON "production_control_product"("snapshotId");

-- CreateIndex
CREATE INDEX "production_control_product_description_idx" ON "production_control_product"("description");

-- CreateIndex
CREATE INDEX "production_control_product_status_idx" ON "production_control_product"("status");

-- CreateIndex
CREATE INDEX "production_control_order_productId_idx" ON "production_control_order"("productId");

-- CreateIndex
CREATE INDEX "production_control_order_orderNumber_idx" ON "production_control_order"("orderNumber");

-- CreateIndex
CREATE INDEX "production_control_history_orderId_idx" ON "production_control_history"("orderId");

-- CreateIndex
CREATE INDEX "production_control_history_productId_idx" ON "production_control_history"("productId");

-- CreateIndex
CREATE INDEX "production_control_history_action_idx" ON "production_control_history"("action");

-- CreateIndex
CREATE INDEX "production_control_history_createdAt_idx" ON "production_control_history"("createdAt");

-- AddForeignKey
ALTER TABLE "production_control_product" ADD CONSTRAINT "production_control_product_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "production_control_snapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_control_order" ADD CONSTRAINT "production_control_order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "production_control_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_control_history" ADD CONSTRAINT "production_control_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "production_control_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_control_history" ADD CONSTRAINT "production_control_history_productId_fkey" FOREIGN KEY ("productId") REFERENCES "production_control_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
