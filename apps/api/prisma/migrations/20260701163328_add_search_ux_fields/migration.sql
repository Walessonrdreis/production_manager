-- AlterTable
ALTER TABLE "read_model"."production_order_read_model" ADD COLUMN     "normalize_version" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "order_number_normalized" VARCHAR(32),
ADD COLUMN     "product_code_normalized" VARCHAR(64),
ADD COLUMN     "product_name_normalized" TEXT,
ADD COLUMN     "stage_group" VARCHAR(16) NOT NULL DEFAULT 'unknown',
ADD COLUMN     "stage_name" VARCHAR(32),
ADD COLUMN     "stage_order" INTEGER NOT NULL DEFAULT 999;

-- CreateIndex
CREATE INDEX "idx_prorm_product_name" ON "read_model"."production_order_read_model"("product_name");

-- CreateIndex
CREATE INDEX "idx_prorm_product_code" ON "read_model"."production_order_read_model"("product_code");

-- CreateIndex
CREATE INDEX "idx_prorm_order_number" ON "read_model"."production_order_read_model"("order_number");
