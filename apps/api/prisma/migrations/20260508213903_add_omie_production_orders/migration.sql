-- CreateTable
CREATE TABLE "omie_production_order" (
    "id" TEXT NOT NULL,
    "omieCode" VARCHAR(64) NOT NULL,
    "internalCode" VARCHAR(64),
    "productCode" VARCHAR(64),
    "productIntegrationCode" VARCHAR(128),
    "quantity" VARCHAR(32) NOT NULL,
    "forecastDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "stage" VARCHAR(10),
    "projectCode" VARCHAR(64),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "rawPayload" JSONB NOT NULL,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "omie_production_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omie_production_order_item" (
    "id" TEXT NOT NULL,
    "omieItemCode" VARCHAR(128) NOT NULL,
    "omieProductionOrderId" TEXT NOT NULL,
    "productMeshId" BIGINT,
    "useFromStock" CHAR(1),
    "quantity" VARCHAR(32),
    "stockLocationCode" BIGINT,
    "observation" TEXT,
    "rawPayload" JSONB NOT NULL,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "omie_production_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "omie_production_order_productCode_idx" ON "omie_production_order"("productCode");

-- CreateIndex
CREATE INDEX "omie_production_order_productIntegrationCode_idx" ON "omie_production_order"("productIntegrationCode");

-- CreateIndex
CREATE INDEX "omie_production_order_completed_idx" ON "omie_production_order"("completed");

-- CreateIndex
CREATE INDEX "omie_production_order_forecastDate_idx" ON "omie_production_order"("forecastDate");

-- CreateIndex
CREATE INDEX "omie_production_order_completionDate_idx" ON "omie_production_order"("completionDate");

-- CreateIndex
CREATE UNIQUE INDEX "omie_production_order_omieCode_key" ON "omie_production_order"("omieCode");

-- CreateIndex
CREATE INDEX "omie_production_order_item_omieProductionOrderId_idx" ON "omie_production_order_item"("omieProductionOrderId");

-- CreateIndex
CREATE INDEX "omie_production_order_item_productMeshId_idx" ON "omie_production_order_item"("productMeshId");

-- CreateIndex
CREATE UNIQUE INDEX "omie_production_order_item_omieItemCode_key" ON "omie_production_order_item"("omieItemCode");

-- AddForeignKey
ALTER TABLE "omie_production_order_item" ADD CONSTRAINT "omie_production_order_item_omieProductionOrderId_fkey" FOREIGN KEY ("omieProductionOrderId") REFERENCES "omie_production_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;