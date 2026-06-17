-- CreateTable
CREATE TABLE "product_catalog_production_ready_read_model" (
    "id" TEXT NOT NULL,
    "product_code" VARCHAR(64) NOT NULL,
    "description" TEXT NOT NULL,
    "sku" VARCHAR(128),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "family" TEXT,
    "unit" VARCHAR(16),
    "sale_price" DECIMAL(18,6),
    "cost" DECIMAL(18,6),
    "margin" DECIMAL(18,6),
    "stock" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "minimum_stock" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT false,
    "below_minimum_stock" BOOLEAN NOT NULL DEFAULT false,
    "has_structure" BOOLEAN NOT NULL DEFAULT false,
    "structure_items_count" INTEGER NOT NULL DEFAULT 0,
    "has_open_production_order" BOOLEAN NOT NULL DEFAULT false,
    "open_production_order_count" INTEGER NOT NULL DEFAULT 0,
    "has_open_sales_order_stage20" BOOLEAN NOT NULL DEFAULT false,
    "open_sales_order_stage20_count" INTEGER NOT NULL DEFAULT 0,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_catalog_production_ready_read_model_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_catalog_production_ready_read_model_product_code_key" ON "product_catalog_production_ready_read_model"("product_code");

-- CreateIndex
CREATE INDEX "product_catalog_production_ready_read_model_active_idx" ON "product_catalog_production_ready_read_model"("active");

-- CreateIndex
CREATE INDEX "product_catalog_production_ready_read_model_available_idx" ON "product_catalog_production_ready_read_model"("available");

-- CreateIndex
CREATE INDEX "product_catalog_production_ready_read_model_below_minimum_s_idx" ON "product_catalog_production_ready_read_model"("below_minimum_stock");

-- CreateIndex
CREATE INDEX "product_catalog_production_ready_read_model_has_structure_idx" ON "product_catalog_production_ready_read_model"("has_structure");

-- CreateIndex
CREATE INDEX "product_catalog_production_ready_read_model_has_open_produc_idx" ON "product_catalog_production_ready_read_model"("has_open_production_order");

-- CreateIndex
CREATE INDEX "product_catalog_production_ready_read_model_has_open_sales__idx" ON "product_catalog_production_ready_read_model"("has_open_sales_order_stage20");

-- CreateIndex
CREATE INDEX "product_catalog_production_ready_read_model_description_idx" ON "product_catalog_production_ready_read_model"("description");

-- CreateIndex
CREATE INDEX "product_catalog_production_ready_read_model_stock_idx" ON "product_catalog_production_ready_read_model"("stock");

-- CreateIndex
CREATE INDEX "product_catalog_production_ready_read_model_updated_at_idx" ON "product_catalog_production_ready_read_model"("updated_at");
