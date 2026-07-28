-- CreateEnum
CREATE TYPE "integration"."ProductStockCommandType" AS ENUM ('REFRESH_STOCK');

-- CreateEnum
CREATE TYPE "integration"."ProductStockCommandStatus" AS ENUM ('ACCEPTED', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "integration"."ProductStockCommandSource" AS ENUM ('API2', 'JOB', 'ADMIN');

-- CreateTable
CREATE TABLE "integration"."product_stock_command" (
    "id" TEXT NOT NULL,
    "external_request_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "command_type" "integration"."ProductStockCommandType" NOT NULL,
    "status" "integration"."ProductStockCommandStatus" NOT NULL DEFAULT 'ACCEPTED',
    "source" "integration"."ProductStockCommandSource" NOT NULL DEFAULT 'API2',
    "last_error" JSONB,
    "executed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_stock_command_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_stock_command_external_request_id_key" ON "integration"."product_stock_command"("external_request_id");

-- CreateIndex
CREATE INDEX "product_stock_command_product_id_idx" ON "integration"."product_stock_command"("product_id");

-- CreateIndex
CREATE INDEX "product_stock_command_status_idx" ON "integration"."product_stock_command"("status");
