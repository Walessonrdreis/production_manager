-- CreateTable
CREATE TABLE "stock_alert" (
    "id" TEXT NOT NULL,
    "productCode" VARCHAR(64) NOT NULL,
    "productDescription" TEXT NOT NULL,
    "currentStock" DECIMAL(18,4) NOT NULL,
    "minimumStock" DECIMAL(18,4) NOT NULL,
    "severity" VARCHAR(16) NOT NULL,
    "status" VARCHAR(16) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "stock_alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_config" (
    "id" TEXT NOT NULL,
    "productCode" VARCHAR(64),
    "criticalThreshold" DECIMAL(18,4) NOT NULL,
    "warningThreshold" DECIMAL(18,4) NOT NULL,
    "notificationChannels" TEXT[],
    "autoResolveDays" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_alert_productCode_idx" ON "stock_alert"("productCode");

-- CreateIndex
CREATE INDEX "stock_alert_severity_idx" ON "stock_alert"("severity");

-- CreateIndex
CREATE INDEX "stock_alert_status_idx" ON "stock_alert"("status");

-- CreateIndex
CREATE INDEX "stock_alert_createdAt_idx" ON "stock_alert"("createdAt");

-- CreateIndex
CREATE INDEX "alert_config_productCode_idx" ON "alert_config"("productCode");

-- CreateIndex
CREATE UNIQUE INDEX "alert_config_productCode_key" ON "alert_config"("productCode");
