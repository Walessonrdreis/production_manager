-- CreateEnum
CREATE TYPE "ProductionOrderIntegrationStatus" AS ENUM ('ACCEPTED', 'CONFIRMED', 'FAILED');

-- CreateTable
CREATE TABLE "production_order_integration" (
    "id" TEXT NOT NULL,
    "external_request_id" VARCHAR(64) NOT NULL,
    "omie_production_order_id" VARCHAR(64),
    "product_id" VARCHAR(64) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "ProductionOrderIntegrationStatus" NOT NULL,
    "last_error" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_order_integration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "production_order_integration_external_request_id_key" ON "production_order_integration"("external_request_id");

-- CreateIndex
CREATE INDEX "production_order_integration_external_request_id_idx" ON "production_order_integration"("external_request_id");

-- CreateIndex
CREATE INDEX "production_order_integration_omie_production_order_id_idx" ON "production_order_integration"("omie_production_order_id");

-- CreateIndex
CREATE INDEX "production_order_integration_status_idx" ON "production_order_integration"("status");

