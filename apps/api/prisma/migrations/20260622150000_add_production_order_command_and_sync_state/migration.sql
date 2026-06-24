-- Migration: add_production_order_command_and_sync_state
--
-- ⚠️  REWRITTEN (2026-06-24): Agora cria enums e tabelas do zero.
--     Antes era apenas ALTER TYPE/ALTER TABLE (aplicado manualmente).
--     A reescrita garante que o shadow DB replay funcione corretamente.
--
-- Safe: usa DO $$ blocks com verificação de existência para ser idempotente.
--       Funciona tanto em shadow DB (criar do zero) quanto em real DB (já existe).

-- +------------------------------------------------------------------+
-- | ENUM: ProductionOrderCommandType                                 |
-- +------------------------------------------------------------------+
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'ProductionOrderCommandType' AND n.nspname = 'integration') THEN
    CREATE TYPE "integration"."ProductionOrderCommandType" AS ENUM ('SYNC_GLOBAL', 'CREATE_OP', 'UPDATE_OP', 'SYNC_OP', 'CANCEL_OP', 'CHANGE_STAGE');
  END IF;
END
$$;

-- +------------------------------------------------------------------+
-- | ENUM: ProductionOrderCommandStatus                               |
-- +------------------------------------------------------------------+
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'ProductionOrderCommandStatus' AND n.nspname = 'integration') THEN
    CREATE TYPE "integration"."ProductionOrderCommandStatus" AS ENUM ('PENDING', 'PROCESSING', 'ACCEPTED', 'CONFIRMED', 'FAILED');
  END IF;
END
$$;

-- +------------------------------------------------------------------+
-- | ENUM: ProductionOrderCommandSource                               |
-- +------------------------------------------------------------------+
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'ProductionOrderCommandSource' AND n.nspname = 'integration') THEN
    CREATE TYPE "integration"."ProductionOrderCommandSource" AS ENUM ('API2', 'JOB', 'ADMIN');
  END IF;
END
$$;

-- +------------------------------------------------------------------+
-- | TABLE: production_order_command                                  |
-- +------------------------------------------------------------------+

CREATE TABLE IF NOT EXISTS "integration"."production_order_command" (
    "id"              TEXT NOT NULL,
    "external_request_id" VARCHAR(64) NOT NULL,
    "command_type"    "integration"."ProductionOrderCommandType" NOT NULL,
    "status"          "integration"."ProductionOrderCommandStatus" NOT NULL DEFAULT 'PENDING',
    "source"          "integration"."ProductionOrderCommandSource" NOT NULL DEFAULT 'API2',
    "last_error"      JSONB,
    "payload"         JSONB,
    "retry_count"     INTEGER NOT NULL DEFAULT 0,
    "executed_at"     TIMESTAMP(3),
    "completed_at"    TIMESTAMP(3),
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_order_command_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "production_order_command_external_request_id_key"
    ON "integration"."production_order_command"("external_request_id");

CREATE INDEX IF NOT EXISTS "production_order_command_status_idx"
    ON "integration"."production_order_command"("status");

CREATE INDEX IF NOT EXISTS "production_order_command_command_type_idx"
    ON "integration"."production_order_command"("command_type");

-- +------------------------------------------------------------------+
-- | TABLE: production_order_sync_state                               |
-- +------------------------------------------------------------------+

CREATE TABLE IF NOT EXISTS "integration"."production_order_sync_state" (
    "id"             TEXT NOT NULL,
    "last_sync_at"   TIMESTAMP(3) NOT NULL,
    "updated_at"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_order_sync_state_pkey" PRIMARY KEY ("id")
);

-- +------------------------------------------------------------------+
-- | COLUMNS ADICIONAIS (omie_production_order, production_order_cmd) |
-- +------------------------------------------------------------------+

-- order_number on omie_production_order
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'integration' AND table_name = 'omie_production_order' AND column_name = 'order_number') THEN
    ALTER TABLE "integration"."omie_production_order" ADD COLUMN "order_number" VARCHAR(32);
  END IF;
END
$$;

-- payload on production_order_command (já criada acima, mas safe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'integration' AND table_name = 'production_order_command' AND column_name = 'payload') THEN
    ALTER TABLE "integration"."production_order_command" ADD COLUMN "payload" JSONB;
  END IF;
END
$$;

-- retry_count on production_order_command (já criada acima, mas safe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'integration' AND table_name = 'production_order_command' AND column_name = 'retry_count') THEN
    ALTER TABLE "integration"."production_order_command" ADD COLUMN "retry_count" INTEGER NOT NULL DEFAULT 0;
  END IF;
END
$$;