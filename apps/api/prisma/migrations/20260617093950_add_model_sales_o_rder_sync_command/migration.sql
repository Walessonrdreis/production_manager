-- CreateTable
CREATE TABLE "sales_order_sync_command" (
    "id" TEXT NOT NULL,
    "external_request_id" VARCHAR(64) NOT NULL,
    "command_type" VARCHAR(32) NOT NULL,
    "resource_id" VARCHAR(64) NOT NULL,
    "status" "SalesOrderSyncCommandStatus" NOT NULL DEFAULT 'ACCEPTED',
    "source" "SalesOrderSyncCommandSource" NOT NULL DEFAULT 'API2',
    "last_error" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "sales_order_sync_command_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sales_order_sync_command_external_request_id_key" ON "sales_order_sync_command"("external_request_id");

-- CreateIndex
CREATE INDEX "sales_order_sync_command_status_idx" ON "sales_order_sync_command"("status");

-- CreateIndex
CREATE INDEX "sales_order_sync_command_resource_id_idx" ON "sales_order_sync_command"("resource_id");
