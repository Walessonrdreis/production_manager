-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.

ALTER TYPE "integration"."ProductionOrderCommandType" ADD VALUE 'SYNC_INCREMENTAL';

ALTER TYPE "integration"."ProductionOrderCommandType" ADD VALUE 'RETRY_FAILED';

ALTER TYPE "integration"."ProductionOrderCommandType" ADD VALUE 'RECONCILE';

ALTER TYPE "integration"."ProductionOrderCommandType" ADD VALUE 'INVALIDATE';

-- DropIndex (substituir por índice composto)
DROP INDEX IF EXISTS "integration"."production_order_command_command_type_idx";

DROP INDEX IF EXISTS "integration"."production_order_command_status_idx";

-- CreateIndex (composto)
CREATE INDEX IF NOT EXISTS "production_order_command_status_command_type_idx"
  ON "integration"."production_order_command"("status", "command_type");

-- AlterTable
ALTER TABLE "read_model"."production_order_read_model" ADD COLUMN IF NOT EXISTS "has_structure" BOOLEAN NOT NULL DEFAULT false;

-- RenameIndex
ALTER INDEX "integration"."uq_product_stock_omie_id" RENAME TO "product_stock_product_omie_id_key";