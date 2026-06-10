/*
  Warnings:

  - The `status` column on the `product_structure_command` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `source` column on the `product_structure_command` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductSector` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductionPlan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductionPlanItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Sector` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `alert_config` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `internal_production_order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `internal_production_order_change` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `internal_production_order_event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `production_control_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `production_control_order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `production_control_product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `production_control_snapshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stock_alert` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sync_record` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `command_type` on the `product_structure_command` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ProductStructureCommandType" AS ENUM ('SYNC', 'APPLY', 'DELETE');

-- CreateEnum
CREATE TYPE "ProductStructureCommandStatus" AS ENUM ('ACCEPTED', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "ProductStructureCommandSource" AS ENUM ('API2', 'JOB', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProductCatalogCommandType" AS ENUM ('SYNC');

-- CreateEnum
CREATE TYPE "ProductCatalogCommandStatus" AS ENUM ('ACCEPTED', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "ProductCatalogCommandSource" AS ENUM ('API2', 'JOB', 'ADMIN');

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_omieProductId_fkey";

-- DropForeignKey
ALTER TABLE "ProductSector" DROP CONSTRAINT "ProductSector_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductSector" DROP CONSTRAINT "ProductSector_sectorId_fkey";

-- DropForeignKey
ALTER TABLE "ProductionPlanItem" DROP CONSTRAINT "ProductionPlanItem_planId_fkey";

-- DropForeignKey
ALTER TABLE "ProductionPlanItem" DROP CONSTRAINT "ProductionPlanItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductionPlanItem" DROP CONSTRAINT "ProductionPlanItem_sectorId_fkey";

-- DropForeignKey
ALTER TABLE "internal_production_order_change" DROP CONSTRAINT "internal_production_order_change_eventId_fkey";

-- DropForeignKey
ALTER TABLE "internal_production_order_event" DROP CONSTRAINT "internal_production_order_event_orderId_fkey";

-- DropForeignKey
ALTER TABLE "production_control_history" DROP CONSTRAINT "production_control_history_orderId_fkey";

-- DropForeignKey
ALTER TABLE "production_control_history" DROP CONSTRAINT "production_control_history_productId_fkey";

-- DropForeignKey
ALTER TABLE "production_control_order" DROP CONSTRAINT "production_control_order_productId_fkey";

-- DropForeignKey
ALTER TABLE "production_control_product" DROP CONSTRAINT "production_control_product_snapshotId_fkey";

-- AlterTable
ALTER TABLE "omie_product" RENAME CONSTRAINT "OmieProduct_pkey" TO "omie_product_pkey";

-- AlterTable
ALTER TABLE "product_structure" RENAME CONSTRAINT "ProductStructure_pkey" TO "product_structure_pkey";

-- AlterTable
ALTER TABLE "product_structure_command" ALTER COLUMN "external_request_id" SET DATA TYPE TEXT,
DROP COLUMN "command_type",
ADD COLUMN     "command_type" "ProductStructureCommandType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ProductStructureCommandStatus" NOT NULL DEFAULT 'ACCEPTED',
DROP COLUMN "source",
ADD COLUMN     "source" "ProductStructureCommandSource" NOT NULL DEFAULT 'API2',
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "product_structure_item" RENAME CONSTRAINT "ProductStructureItem_pkey" TO "product_structure_item_pkey";

-- AlterTable
ALTER TABLE "sync_lock" RENAME CONSTRAINT "SyncLock_pkey" TO "sync_lock_pkey";

-- DropTable
DROP TABLE "Product";

-- DropTable
DROP TABLE "ProductSector";

-- DropTable
DROP TABLE "ProductionPlan";

-- DropTable
DROP TABLE "ProductionPlanItem";

-- DropTable
DROP TABLE "Sector";

-- DropTable
DROP TABLE "alert_config";

-- DropTable
DROP TABLE "internal_production_order";

-- DropTable
DROP TABLE "internal_production_order_change";

-- DropTable
DROP TABLE "internal_production_order_event";

-- DropTable
DROP TABLE "production_control_history";

-- DropTable
DROP TABLE "production_control_order";

-- DropTable
DROP TABLE "production_control_product";

-- DropTable
DROP TABLE "production_control_snapshot";

-- DropTable
DROP TABLE "stock_alert";

-- DropTable
DROP TABLE "sync_record";

-- DropEnum
DROP TYPE "PlanStatus";

-- DropEnum
DROP TYPE "internal_production_order_actor_type";

-- DropEnum
DROP TYPE "internal_production_order_event_source";

-- DropEnum
DROP TYPE "internal_production_order_quantity_unit";

-- DropEnum
DROP TYPE "internal_production_order_source";

-- DropEnum
DROP TYPE "internal_production_order_status";

-- DropEnum
DROP TYPE "product_structure_command_source";

-- DropEnum
DROP TYPE "product_structure_command_status";

-- DropEnum
DROP TYPE "product_structure_command_type";

-- DropEnum
DROP TYPE "production_control_history_action";

-- DropEnum
DROP TYPE "production_control_status";

-- CreateTable
CREATE TABLE "product_catalog_command" (
    "id" TEXT NOT NULL,
    "external_request_id" TEXT NOT NULL,
    "product_code" TEXT NOT NULL,
    "command_type" "ProductCatalogCommandType" NOT NULL,
    "status" "ProductCatalogCommandStatus" NOT NULL DEFAULT 'ACCEPTED',
    "source" "ProductCatalogCommandSource" NOT NULL DEFAULT 'API2',
    "last_error" JSONB,
    "executed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_catalog_command_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_catalog_command_external_request_id_key" ON "product_catalog_command"("external_request_id");

-- CreateIndex
CREATE INDEX "product_catalog_command_product_code_idx" ON "product_catalog_command"("product_code");

-- CreateIndex
CREATE INDEX "product_catalog_command_status_idx" ON "product_catalog_command"("status");

-- CreateIndex
CREATE INDEX "product_structure_command_status_idx" ON "product_structure_command"("status");

-- CreateIndex
CREATE INDEX "product_structure_command_command_type_idx" ON "product_structure_command"("command_type");

-- RenameForeignKey
ALTER TABLE "omie_order_item" RENAME CONSTRAINT "omie_order_item_omieOrderId_fkey" TO "omie_order_item_omie_order_id_fkey";

-- RenameForeignKey
ALTER TABLE "omie_production_order_item" RENAME CONSTRAINT "omie_production_order_item_omieProductionOrderId_fkey" TO "omie_production_order_item_omie_production_order_id_fkey";

-- RenameForeignKey
ALTER TABLE "product_structure_item" RENAME CONSTRAINT "ProductStructureItem_codProdutoPai_fkey" TO "product_structure_item_cod_produto_pai_fkey";

-- RenameIndex
ALTER INDEX "omie_order_codigoCliente_idx" RENAME TO "omie_order_codigo_cliente_idx";

-- RenameIndex
ALTER INDEX "omie_order_omieCode_key" RENAME TO "omie_order_omie_code_key";

-- RenameIndex
ALTER INDEX "omie_order_item_omieItemCode_key" RENAME TO "omie_order_item_omie_item_code_key";

-- RenameIndex
ALTER INDEX "omie_order_item_omieOrderId_idx" RENAME TO "omie_order_item_omie_order_id_idx";

-- RenameIndex
ALTER INDEX "omie_order_item_omieProductCode_idx" RENAME TO "omie_order_item_omie_product_code_idx";

-- RenameIndex
ALTER INDEX "OmieProduct_description_idx" RENAME TO "omie_product_description_idx";

-- RenameIndex
ALTER INDEX "OmieProduct_omieCode_key" RENAME TO "omie_product_omie_code_key";

-- RenameIndex
ALTER INDEX "omie_production_order_completionDate_idx" RENAME TO "omie_production_order_completion_date_idx";

-- RenameIndex
ALTER INDEX "omie_production_order_forecastDate_idx" RENAME TO "omie_production_order_forecast_date_idx";

-- RenameIndex
ALTER INDEX "omie_production_order_omieCode_key" RENAME TO "omie_production_order_omie_code_key";

-- RenameIndex
ALTER INDEX "omie_production_order_productCode_idx" RENAME TO "omie_production_order_product_code_idx";

-- RenameIndex
ALTER INDEX "omie_production_order_productIntegrationCode_idx" RENAME TO "omie_production_order_product_integration_code_idx";

-- RenameIndex
ALTER INDEX "omie_production_order_item_omieItemCode_key" RENAME TO "omie_production_order_item_omie_item_code_key";

-- RenameIndex
ALTER INDEX "omie_production_order_item_omieProductionOrderId_idx" RENAME TO "omie_production_order_item_omie_production_order_id_idx";

-- RenameIndex
ALTER INDEX "omie_production_order_item_productMeshId_idx" RENAME TO "omie_production_order_item_product_mesh_id_idx";

-- RenameIndex
ALTER INDEX "product_stock_omieCode_key" RENAME TO "product_stock_omie_code_key";

-- RenameIndex
ALTER INDEX "ProductStructure_codProduto_idx" RENAME TO "product_structure_cod_produto_idx";

-- RenameIndex
ALTER INDEX "ProductStructure_codProduto_key" RENAME TO "product_structure_cod_produto_key";

-- RenameIndex
ALTER INDEX "ProductStructureItem_codProdutoPai_codProdutoComponente_idM_key" RENAME TO "product_structure_item_cod_produto_pai_cod_produto_componen_key";

-- RenameIndex
ALTER INDEX "ProductStructureItem_codProdutoPai_idx" RENAME TO "product_structure_item_cod_produto_pai_idx";
