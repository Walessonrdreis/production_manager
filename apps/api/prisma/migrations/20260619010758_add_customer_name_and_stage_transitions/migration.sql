-- AlterTable
ALTER TABLE "sales_order_summary_read_model" ADD COLUMN     "customer_name" TEXT;

-- CreateTable
CREATE TABLE "sales_order_stage_transition" (
    "id" TEXT NOT NULL,
    "sales_order_omie_id" VARCHAR(64) NOT NULL,
    "from_stage" VARCHAR(10),
    "to_stage" VARCHAR(10) NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_order_stage_transition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sales_order_stage_transition_sales_order_omie_id_idx" ON "sales_order_stage_transition"("sales_order_omie_id");

-- CreateIndex
CREATE INDEX "sales_order_stage_transition_to_stage_idx" ON "sales_order_stage_transition"("to_stage");

-- CreateIndex
CREATE INDEX "sales_order_stage_transition_detected_at_idx" ON "sales_order_stage_transition"("detected_at");
