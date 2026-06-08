DO $$ BEGIN
  CREATE TYPE "product_structure_command_type" AS ENUM ('SYNC','APPLY','DELETE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "product_structure_command_status" AS ENUM ('ACCEPTED','CONFIRMED','FAILED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "product_structure_command_source" AS ENUM ('API2','JOB','ADMIN');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "product_structure_command" (
  "id" TEXT PRIMARY KEY,
  "external_request_id" VARCHAR(64) NOT NULL UNIQUE,
  "product_code" VARCHAR(64) NOT NULL,
  "command_type" "product_structure_command_type" NOT NULL,
  "status" "product_structure_command_status" NOT NULL DEFAULT 'ACCEPTED',
  "source" "product_structure_command_source" NOT NULL DEFAULT 'API2',
  "last_error" JSONB,
  "executed_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "product_structure_command_product_code_idx"
  ON "product_structure_command" ("product_code");

CREATE INDEX IF NOT EXISTS "product_structure_command_status_idx"
  ON "product_structure_command" ("status");

CREATE INDEX IF NOT EXISTS "product_structure_command_command_type_idx"
  ON "product_structure_command" ("command_type");