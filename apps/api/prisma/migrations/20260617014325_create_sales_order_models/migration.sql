-- CreateTable
CREATE TABLE "sales_order" (
    "id" TEXT NOT NULL,
    "omie_order_id" VARCHAR(64) NOT NULL,
    "order_number" VARCHAR(64),
    "stage" VARCHAR(10) NOT NULL,
    "is_canceled" BOOLEAN NOT NULL DEFAULT false,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "customer_omie_id" VARCHAR(64),
    "company_omie_id" VARCHAR(64),
    "forecast_date" TIMESTAMP(3),
    "total_amount" DECIMAL(18,2),
    "raw_payload" JSONB NOT NULL,
    "last_sync_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order_item" (
    "id" TEXT NOT NULL,
    "omie_item_id" VARCHAR(64) NOT NULL,
    "productCode" VARCHAR(64) NOT NULL,
    "product_omie_id" VARCHAR(64) NOT NULL,
    "description" TEXT NOT NULL,
    "unit" VARCHAR(16),
    "quantity" DECIMAL(18,4) NOT NULL,
    "unit_price" DECIMAL(18,6),
    "total_price" DECIMAL(18,2),
    "raw_payload" JSONB NOT NULL,
    "last_sync_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salesOrderId" TEXT NOT NULL,

    CONSTRAINT "sales_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sales_order_stage_idx" ON "sales_order"("stage");

-- CreateIndex
CREATE INDEX "sales_order_is_canceled_idx" ON "sales_order"("is_canceled");

-- CreateIndex
CREATE INDEX "sales_order_is_closed_idx" ON "sales_order"("is_closed");

-- CreateIndex
CREATE INDEX "sales_order_customer_omie_id_idx" ON "sales_order"("customer_omie_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_order_omie_order_id_key" ON "sales_order"("omie_order_id");

-- CreateIndex
CREATE INDEX "sales_order_item_productCode_idx" ON "sales_order_item"("productCode");

-- CreateIndex
CREATE INDEX "sales_order_item_product_omie_id_idx" ON "sales_order_item"("product_omie_id");

-- CreateIndex
CREATE INDEX "sales_order_item_salesOrderId_idx" ON "sales_order_item"("salesOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_order_item_omie_item_id_key" ON "sales_order_item"("omie_item_id");

-- AddForeignKey
ALTER TABLE "sales_order_item" ADD CONSTRAINT "sales_order_item_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
