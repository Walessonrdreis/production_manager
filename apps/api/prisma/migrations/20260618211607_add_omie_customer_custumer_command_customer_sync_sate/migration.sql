-- CreateEnum
CREATE TYPE "CustomerCommandType" AS ENUM ('SYNC');

-- CreateEnum
CREATE TYPE "CustomerCommandStatus" AS ENUM ('ACCEPTED', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "CustomerCommandSource" AS ENUM ('API2', 'JOB', 'ADMIN');

-- CreateTable
CREATE TABLE "omie_customer" (
    "id" TEXT NOT NULL,
    "omie_code" VARCHAR(64) NOT NULL,
    "legal_name" TEXT NOT NULL,
    "trade_name" TEXT,
    "document" VARCHAR(20) NOT NULL,
    "person_type" VARCHAR(16) NOT NULL,
    "email" VARCHAR(256),
    "phone" VARCHAR(64),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "is_billing_blocked" BOOLEAN NOT NULL DEFAULT false,
    "created_at_omie" TIMESTAMP(3),
    "updated_at_omie" TIMESTAMP(3),
    "raw_payload" JSONB NOT NULL,
    "last_sync_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "omie_customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_command" (
    "id" TEXT NOT NULL,
    "external_request_id" TEXT NOT NULL,
    "customer_code" VARCHAR(64) NOT NULL,
    "command_type" "CustomerCommandType" NOT NULL,
    "status" "CustomerCommandStatus" NOT NULL DEFAULT 'ACCEPTED',
    "source" "CustomerCommandSource" NOT NULL DEFAULT 'API2',
    "last_error" JSONB,
    "executed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_command_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_sync_state" (
    "id" TEXT NOT NULL,
    "last_sync_at" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_sync_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "omie_customer_omie_code_key" ON "omie_customer"("omie_code");

-- CreateIndex
CREATE INDEX "omie_customer_document_idx" ON "omie_customer"("document");

-- CreateIndex
CREATE INDEX "omie_customer_legal_name_idx" ON "omie_customer"("legal_name");

-- CreateIndex
CREATE INDEX "omie_customer_trade_name_idx" ON "omie_customer"("trade_name");

-- CreateIndex
CREATE INDEX "omie_customer_is_active_idx" ON "omie_customer"("is_active");

-- CreateIndex
CREATE INDEX "omie_customer_is_blocked_idx" ON "omie_customer"("is_blocked");

-- CreateIndex
CREATE INDEX "omie_customer_last_sync_at_idx" ON "omie_customer"("last_sync_at");

-- CreateIndex
CREATE UNIQUE INDEX "customer_command_external_request_id_key" ON "customer_command"("external_request_id");

-- CreateIndex
CREATE INDEX "customer_command_customer_code_idx" ON "customer_command"("customer_code");

-- CreateIndex
CREATE INDEX "customer_command_status_idx" ON "customer_command"("status");

-- CreateIndex
CREATE INDEX "customer_command_command_type_idx" ON "customer_command"("command_type");
