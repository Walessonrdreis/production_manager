-- CreateTable
CREATE TABLE "product_stock" (
  "id" UUID NOT NULL,
  "omieCode" VARCHAR(32) NOT NULL,
  "stockQuantity" DECIMAL(18,4) NOT NULL,
  "minimumStock" DECIMAL(18,4) NOT NULL,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "product_stock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_stock_omieCode_idx" ON "product_stock"("omieCode");

-- CreateIndex
CREATE INDEX "product_stock_omieCode_capturedAt_idx" ON "product_stock"("omieCode", "capturedAt");

