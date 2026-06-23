-- Migration: add_production_order_command_and_sync_state
-- Applied manually via prisma db execute (safe: only ADD COLUMN and ALTER TYPE ADD VALUE)
-- No DROP or destructive operations

-- Step 1: Add enum values
ALTER TYPE "integration"."ProductionOrderCommandStatus" ADD VALUE 'PENDING';

ALTER TYPE "integration"."ProductionOrderCommandStatus" ADD VALUE 'PROCESSING';

ALTER TYPE "integration"."ProductionOrderCommandType" ADD VALUE 'CREATE_OP';

ALTER TYPE "integration"."ProductionOrderCommandType" ADD VALUE 'UPDATE_OP';

ALTER TYPE "integration"."ProductionOrderCommandType" ADD VALUE 'SYNC_OP';

-- Step 2: Add columns
ALTER TABLE "integration"."omie_production_order" ADD COLUMN "order_number" VARCHAR(32);

ALTER TABLE "integration"."production_order_command" ADD COLUMN "payload" JSONB;

ALTER TABLE "integration"."production_order_command" ADD COLUMN "retry_count" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "integration"."production_order_command" ALTER COLUMN "status" SET DEFAULT 'PENDING';