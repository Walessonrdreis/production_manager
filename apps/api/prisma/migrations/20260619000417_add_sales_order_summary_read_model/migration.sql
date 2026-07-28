-- CreateTable
CREATE TABLE "sales_order_summary_read_model" (
    "id" TEXT NOT NULL,
    "omie_id" VARCHAR(64) NOT NULL,
    "order_number" VARCHAR(64),
    "stage" VARCHAR(10) NOT NULL,
    "is_canceled" BOOLEAN NOT NULL DEFAULT false,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "customer_omie_id" VARCHAR(64),
    "company_omie_id" VARCHAR(64),
    "forecast_date" TIMESTAMP(3),
    "total_amount" DECIMAL(18,2),
    "total_items" INTEGER NOT NULL DEFAULT 0,
    "total_quantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_order_summary_read_model_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sales_order_summary_read_model_omie_id_key" ON "sales_order_summary_read_model"("omie_id");

-- CreateIndex
CREATE INDEX "sales_order_summary_read_model_stage_idx" ON "sales_order_summary_read_model"("stage");

-- CreateIndex
CREATE INDEX "sales_order_summary_read_model_is_canceled_idx" ON "sales_order_summary_read_model"("is_canceled");

-- CreateIndex
CREATE INDEX "sales_order_summary_read_model_is_closed_idx" ON "sales_order_summary_read_model"("is_closed");

-- CreateIndex
CREATE INDEX "sales_order_summary_read_model_customer_omie_id_idx" ON "sales_order_summary_read_model"("customer_omie_id");
