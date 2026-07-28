-- CreateTable
CREATE TABLE "sales_order_sync_state" (
    "id" TEXT NOT NULL,
    "lastSyncAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_order_sync_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sales_order_sync_state_id_key" ON "sales_order_sync_state"("id");
