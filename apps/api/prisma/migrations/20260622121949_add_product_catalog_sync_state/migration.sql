-- CreateTable
CREATE TABLE "integration"."product_catalog_sync_state" (
    "id" TEXT NOT NULL,
    "last_sync_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_catalog_sync_state_pkey" PRIMARY KEY ("id")
);
