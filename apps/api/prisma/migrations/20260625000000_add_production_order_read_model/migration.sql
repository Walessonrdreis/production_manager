-- CreateTable
CREATE TABLE "read_model"."production_order_read_model" (
    "id" TEXT NOT NULL,
    "omie_code" VARCHAR(64) NOT NULL,
    "order_number" VARCHAR(32),
    "product_code" VARCHAR(64),
    "product_name" TEXT,
    "product_unit" VARCHAR(16),
    "quantity" DECIMAL(18, 4) NOT NULL,
    "stage" VARCHAR(10),
    "operational_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "is_late" BOOLEAN NOT NULL DEFAULT false,
    "is_ready" BOOLEAN NOT NULL DEFAULT false,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "has_stock_issue" BOOLEAN NOT NULL DEFAULT false,
    "has_missing_materials" BOOLEAN NOT NULL DEFAULT false,
    "has_critical_material" BOOLEAN NOT NULL DEFAULT false,
    "has_partial_stock" BOOLEAN NOT NULL DEFAULT false,
    "priority" VARCHAR(10) NOT NULL DEFAULT 'low',
    "expected_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "days_overdue" INTEGER NOT NULL DEFAULT 0,
    "materials_json" JSONB,
    "materials_summary_json" JSONB,
    "readiness_json" JSONB,
    "alerts_json" JSONB,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "production_order_read_model_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "production_order_read_model_omie_code_key" ON "read_model"."production_order_read_model" ("omie_code");

-- CreateIndex
CREATE INDEX "production_order_read_model_is_open_idx" ON "read_model"."production_order_read_model" ("is_open");

-- CreateIndex
CREATE INDEX "production_order_read_model_is_ready_idx" ON "read_model"."production_order_read_model" ("is_ready");

-- CreateIndex
CREATE INDEX "production_order_read_model_is_blocked_idx" ON "read_model"."production_order_read_model" ("is_blocked");

-- CreateIndex
CREATE INDEX "production_order_read_model_operational_status_idx" ON "read_model"."production_order_read_model" ("operational_status");

-- CreateIndex
CREATE INDEX "production_order_read_model_priority_idx" ON "read_model"."production_order_read_model" ("priority");

-- CreateIndex
CREATE INDEX "production_order_read_model_expected_at_idx" ON "read_model"."production_order_read_model" ("expected_at");

-- CreateIndex
CREATE INDEX "production_order_read_model_is_late_idx" ON "read_model"."production_order_read_model" ("is_late");