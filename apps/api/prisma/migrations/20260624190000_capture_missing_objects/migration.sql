-- Migration: capture_missing_objects
--
-- Captura objetos que existem no schema.prisma mas nunca foram criados
-- por nenhuma migration (criados manualmente ou alterados diretamente).
--
-- Também cria as tabelas PgBoss que são gerenciadas em runtime pela
-- biblioteca PgBoss (job, queue, schedule, etc.) para evitar falso drift
-- no prisma migrate dev / migrate diff.
--
-- Idempotente: todos os comandos usam DO $$ blocks / IF NOT EXISTS.
-- Seguro para shadow DB e real DB.

-- +------------------------------------------------------------------+
-- | ENUM: ProductManagerCommandType                                  |
-- +------------------------------------------------------------------+
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'ProductManagerCommandType' AND n.nspname = 'integration') THEN
    CREATE TYPE "integration"."ProductManagerCommandType" AS ENUM ('CREATE', 'UPDATE', 'INACTIVATE');
  END IF;
END
$$;

-- +------------------------------------------------------------------+
-- | ENUM: ProductManagerCommandStatus                                |
-- +------------------------------------------------------------------+
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'ProductManagerCommandStatus' AND n.nspname = 'integration') THEN
    CREATE TYPE "integration"."ProductManagerCommandStatus" AS ENUM ('PENDING', 'PROCESSING', 'ACCEPTED', 'CONFIRMED', 'FAILED');
  END IF;
END
$$;

-- +------------------------------------------------------------------+
-- | ENUM: ProductManagerCommandSource                                |
-- +------------------------------------------------------------------+
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'ProductManagerCommandSource' AND n.nspname = 'integration') THEN
    CREATE TYPE "integration"."ProductManagerCommandSource" AS ENUM ('API2', 'JOB', 'ADMIN');
  END IF;
END
$$;

-- +------------------------------------------------------------------+
-- | TABLE: product_manager_command                                   |
-- +------------------------------------------------------------------+


CREATE TABLE IF NOT EXISTS "integration"."product_manager_command" (
    "id"                  TEXT NOT NULL,
    "external_request_id" TEXT NOT NULL,
    "product_code"        TEXT NOT NULL,
    "command_type"        "integration"."ProductManagerCommandType" NOT NULL,
    "status"              "integration"."ProductManagerCommandStatus" NOT NULL DEFAULT 'PENDING',
    "source"              "integration"."ProductManagerCommandSource" NOT NULL DEFAULT 'API2',
    "last_error"          JSONB,
    "payload"             JSONB,
    "retry_count"         INTEGER NOT NULL DEFAULT 0,
    "executed_at"         TIMESTAMP(3),
    "completed_at"        TIMESTAMP(3),
    "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_manager_command_pkey" PRIMARY KEY ("id")
);

-- Unique index on external_request_id
CREATE UNIQUE INDEX IF NOT EXISTS "product_manager_command_external_request_id_key"
    ON "integration"."product_manager_command"("external_request_id");

-- Indexes
CREATE INDEX IF NOT EXISTS "product_manager_command_product_code_idx"
    ON "integration"."product_manager_command"("product_code");

CREATE INDEX IF NOT EXISTS "product_manager_command_status_idx"
    ON "integration"."product_manager_command"("status");

CREATE INDEX IF NOT EXISTS "product_manager_command_command_type_idx"
    ON "integration"."product_manager_command"("command_type");

-- +------------------------------------------------------------------+
-- | FIX: product_structure_command.status default                    |
-- +------------------------------------------------------------------+
-- A migration 20260622180000 ADD VALUE para 'PENDING' e 'PROCESSING'
-- mas o SET DEFAULT foi removido por conflito de transação.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'integration' AND table_name = 'product_structure_command' AND column_name = 'status' AND column_default IS DISTINCT FROM '''PENDING''::"integration"."ProductStructureCommandStatus"') THEN
    ALTER TABLE "integration"."product_structure_command" ALTER COLUMN "status" SET DEFAULT 'PENDING';

END IF;

END $$;

-- +------------------------------------------------------------------+
-- | FIX: production_order_command.external_request_id type          |
-- +------------------------------------------------------------------+
-- A migration 20260622150000 criou como VARCHAR(64), mas schema.prisma
-- define String → TEXT. Ajustar para TEXT.
ALTER TABLE "integration"."production_order_command"
    ALTER COLUMN "external_request_id" TYPE TEXT;

-- +------------------------------------------------------------------+
-- | FIX: omie_production_order_item unique index                    |
-- +------------------------------------------------------------------+
-- A migration original criou UNIQUE INDEX em (omie_item_code) apenas.
-- O schema.prisma agora define @@unique([omieItemCode, omieProductionOrderId]).
-- Remover o índice antigo e criar o composto.
DROP INDEX IF EXISTS "integration"."omie_production_order_item_omie_item_code_key";

CREATE UNIQUE INDEX IF NOT EXISTS "omie_production_order_item_omie_item_code_omie_production_order_id_key"
    ON "integration"."omie_production_order_item"("omie_item_code", "omie_production_order_id");

-- ═══════════════════════════════════════════════════════════════════════════
-- PgBoss Tables (runtime — criadas pela biblioteca PgBoss)
-- ═══════════════════════════════════════════════════════════════════════════
-- Incluídas aqui para que o histórico de migrations reflita a realidade
-- do banco. PgBoss usa CREATE TABLE IF NOT EXISTS, então é seguro.

-- job_state enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'job_state' AND n.nspname = 'integration') THEN
    CREATE TYPE "integration"."job_state" AS ENUM ('created', 'retry', 'active', 'completed', 'cancelled', 'failed');

END IF;

END $$;

-- version
CREATE TABLE IF NOT EXISTS "integration"."version" (
    "version" INTEGER NOT NULL,
    "cron_on" TIMESTAMPTZ,
    "bam_on" TIMESTAMPTZ,
    PRIMARY KEY ("version")
);

-- queue
CREATE TABLE IF NOT EXISTS "integration"."queue" (
    "name" TEXT NOT NULL,
    "policy" TEXT,
    "retry_limit" INTEGER,
    "retry_delay" INTEGER,
    "retry_backoff" BOOLEAN,
    "retry_delay_max" INTEGER,
    "expire_seconds" INTEGER,
    "retention_seconds" INTEGER,
    "deletion_seconds" INTEGER,
    "dead_letter" TEXT,
    "partition" BOOLEAN,
    "table_name" TEXT,
    "deferred_count" INTEGER NOT NULL DEFAULT 0,
    "queued_count" INTEGER NOT NULL DEFAULT 0,
    "warning_queued" INTEGER NOT NULL DEFAULT 0,
    "active_count" INTEGER NOT NULL DEFAULT 0,
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "heartbeat_seconds" INTEGER,
    "singletons_active" TEXT[],
    "monitor_on" TIMESTAMPTZ,
    "maintain_on" TIMESTAMPTZ,
    "created_on" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_on" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("name")
);

-- subscription
CREATE TABLE IF NOT EXISTS "integration"."subscription" (
    "event" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_on" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_on" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("event", "name")
);

-- schedule
CREATE TABLE IF NOT EXISTS "integration"."schedule" (
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT '',
    "cron" TEXT NOT NULL,
    "timezone" TEXT,
    "data" JSONB,
    "options" JSONB,
    "created_on" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_on" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("name", "key")
);

-- bam
CREATE TABLE IF NOT EXISTS "integration"."bam" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "queue" TEXT,
    "table_name" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "error" TEXT,
    "created_on" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "started_on" TIMESTAMPTZ,
    "completed_on" TIMESTAMPTZ,
    PRIMARY KEY ("id")
);

-- job_common (partitioned parent table)
CREATE TABLE IF NOT EXISTS "integration"."job_common" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB,
    "state" "integration"."job_state" NOT NULL DEFAULT 'created',
    "retry_limit" INTEGER NOT NULL DEFAULT 2,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "retry_delay" INTEGER NOT NULL DEFAULT 0,
    "retry_backoff" BOOLEAN NOT NULL DEFAULT FALSE,
    "retry_delay_max" INTEGER,
    "expire_seconds" INTEGER NOT NULL DEFAULT 900,
    "deletion_seconds" INTEGER NOT NULL DEFAULT 604800,
    "singleton_key" TEXT,
    "singleton_on" TIMESTAMP(3),
    "group_id" TEXT,
    "group_tier" TEXT,
    "start_after" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "created_on" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "started_on" TIMESTAMPTZ,
    "completed_on" TIMESTAMPTZ,
    "keep_until" TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '14 days',
    "output" JSONB,
    "dead_letter" TEXT,
    "policy" TEXT,
    "heartbeat_on" TIMESTAMPTZ,
    "heartbeat_seconds" INTEGER,
    "blocked" BOOLEAN NOT NULL DEFAULT FALSE,
    "blocking" BOOLEAN NOT NULL DEFAULT FALSE,
    "pending_dependencies" INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY ("id")
);

-- job (partition)
CREATE TABLE IF NOT EXISTS "integration"."job" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB,
    "state" "integration"."job_state" NOT NULL DEFAULT 'created',
    "retry_limit" INTEGER NOT NULL DEFAULT 2,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "retry_delay" INTEGER NOT NULL DEFAULT 0,
    "retry_backoff" BOOLEAN NOT NULL DEFAULT FALSE,
    "retry_delay_max" INTEGER,
    "expire_seconds" INTEGER NOT NULL DEFAULT 900,
    "deletion_seconds" INTEGER NOT NULL DEFAULT 604800,
    "singleton_key" TEXT,
    "singleton_on" TIMESTAMP(3),
    "group_id" TEXT,
    "group_tier" TEXT,
    "start_after" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "created_on" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "started_on" TIMESTAMPTZ,
    "completed_on" TIMESTAMPTZ,
    "keep_until" TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '14 days',
    "output" JSONB,
    "dead_letter" TEXT,
    "policy" TEXT,
    "heartbeat_on" TIMESTAMPTZ,
    "heartbeat_seconds" INTEGER,
    "blocked" BOOLEAN NOT NULL DEFAULT FALSE,
    "blocking" BOOLEAN NOT NULL DEFAULT FALSE,
    "pending_dependencies" INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY ("id")
);

-- job_dependency
CREATE TABLE IF NOT EXISTS "integration"."job_dependency" (
    "child_name" TEXT NOT NULL,
    "child_id" UUID NOT NULL,
    "parent_name" TEXT NOT NULL,
    "parent_id" UUID NOT NULL,
    PRIMARY KEY ("child_name", "child_id", "parent_name", "parent_id")
);

-- warning
CREATE TABLE IF NOT EXISTS "integration"."warning" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "created_on" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id")
);

-- Indexes for PgBoss tables
CREATE INDEX IF NOT EXISTS "warning_created_on_idx" ON "integration"."warning"("created_on");

-- Foreign keys
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'queue_dead_letter_fkey' AND table_schema = 'integration') THEN
    ALTER TABLE "integration"."queue" ADD CONSTRAINT "queue_dead_letter_fkey" FOREIGN KEY ("dead_letter") REFERENCES "integration"."queue"("name");

END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'schedule_name_fkey' AND table_schema = 'integration') THEN
    ALTER TABLE "integration"."schedule" ADD CONSTRAINT "schedule_name_fkey" FOREIGN KEY ("name") REFERENCES "integration"."queue"("name") ON DELETE CASCADE;

END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'subscription_name_fkey' AND table_schema = 'integration') THEN
    ALTER TABLE "integration"."subscription" ADD CONSTRAINT "subscription_name_fkey" FOREIGN KEY ("name") REFERENCES "integration"."queue"("name") ON DELETE CASCADE;

END IF;

END $$;