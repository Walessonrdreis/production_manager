-- CreateTable
CREATE TABLE "integration"."product_stock_fetch_sync_state" (
    "id" TEXT NOT NULL,
    "last_sync_at" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_stock_fetch_sync_state_pkey" PRIMARY KEY ("id")
);
