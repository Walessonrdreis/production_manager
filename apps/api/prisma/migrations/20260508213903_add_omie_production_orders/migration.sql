-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TipoPessoa" AS ENUM ('FISICA', 'JURIDICA');

-- CreateTable
CREATE TABLE "SyncLock" (
    "key" TEXT NOT NULL,
    "lockedUntil" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncLock_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "job_lock" (
    "key" VARCHAR(64) NOT NULL,
    "lockedUntil" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_lock_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "OmieProduct" (
    "id" TEXT NOT NULL,
    "omieCode" VARCHAR(64) NOT NULL,
    "omieId" VARCHAR(64),
    "sku" VARCHAR(128),
    "description" TEXT NOT NULL,
    "familyDescription" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "rawPayload" JSONB NOT NULL,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OmieProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "omieProductId" TEXT NOT NULL,
    "nickname" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSector" (
    "productId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ProductSector_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "ProductionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionPlanItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ProductionPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_stock" (
    "id" UUID NOT NULL,
    "omieCode" VARCHAR(64) NOT NULL,
    "stockQuantity" DECIMAL(18,4) NOT NULL,
    "minimumStock" DECIMAL(18,4) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omie_order" (
    "id" TEXT NOT NULL,
    "omieCode" VARCHAR(64) NOT NULL,
    "numeroPedido" VARCHAR(64),
    "codigoCliente" VARCHAR(64),
    "codigoEmpresa" VARCHAR(64),
    "etapa" VARCHAR(10) NOT NULL,
    "cancelado" CHAR(1) NOT NULL DEFAULT 'N',
    "encerrado" CHAR(1) NOT NULL DEFAULT 'N',
    "dataPrevisao" TIMESTAMP(3),
    "rawPayload" JSONB NOT NULL,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "omie_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omie_order_item" (
    "id" TEXT NOT NULL,
    "omieItemCode" VARCHAR(64) NOT NULL,
    "omieOrderId" TEXT NOT NULL,
    "omieProductCode" VARCHAR(64),
    "sku" VARCHAR(128),
    "description" TEXT NOT NULL,
    "unit" VARCHAR(16),
    "quantity" DECIMAL(18,4) NOT NULL,
    "unitPrice" DECIMAL(18,6),
    "totalPrice" DECIMAL(18,2),
    "rawPayload" JSONB NOT NULL,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "omie_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "codigo_cliente_omie" BIGINT NOT NULL,
    "razao_social" TEXT NOT NULL,
    "nome_fantasia" TEXT,
    "documento" TEXT NOT NULL,
    "tipo_pessoa" "TipoPessoa" NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "isBillingBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAtOmie" TIMESTAMP(3),
    "updatedAtOmie" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omie_production_order" (
    "id" TEXT NOT NULL,
    "omieCode" VARCHAR(64) NOT NULL,
    "internalCode" VARCHAR(64),
    "productCode" VARCHAR(64),
    "productIntegrationCode" VARCHAR(128),
    "quantity" VARCHAR(32) NOT NULL,
    "forecastDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "stage" VARCHAR(10),
    "projectCode" VARCHAR(64),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "rawPayload" JSONB NOT NULL,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "omie_production_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omie_production_order_item" (
    "id" TEXT NOT NULL,
    "omieItemCode" VARCHAR(128) NOT NULL,
    "omieProductionOrderId" TEXT NOT NULL,
    "productMeshId" BIGINT,
    "useFromStock" CHAR(1),
    "quantity" VARCHAR(32),
    "stockLocationCode" BIGINT,
    "observation" TEXT,
    "rawPayload" JSONB NOT NULL,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "omie_production_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OmieProduct_description_idx" ON "OmieProduct"("description");     

-- CreateIndex
CREATE UNIQUE INDEX "OmieProduct_omieCode_key" ON "OmieProduct"("omieCode");    

-- CreateIndex
CREATE UNIQUE INDEX "Product_omieProductId_key" ON "Product"("omieProductId");  

-- CreateIndex
CREATE UNIQUE INDEX "Sector_name_key" ON "Sector"("name");

-- CreateIndex
CREATE INDEX "ProductionPlan_startDate_endDate_idx" ON "ProductionPlan"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "ProductionPlanItem_planId_sectorId_idx" ON "ProductionPlanItem"("planId", "sectorId");

-- CreateIndex
CREATE INDEX "ProductionPlanItem_productId_idx" ON "ProductionPlanItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_stock_omieCode_key" ON "product_stock"("omieCode");

-- CreateIndex
CREATE INDEX "omie_order_etapa_idx" ON "omie_order"("etapa");

-- CreateIndex
CREATE INDEX "omie_order_cancelado_encerrado_idx" ON "omie_order"("cancelado", "encerrado");

-- CreateIndex
CREATE INDEX "omie_order_codigoCliente_idx" ON "omie_order"("codigoCliente");   

-- CreateIndex
CREATE UNIQUE INDEX "omie_order_omieCode_key" ON "omie_order"("omieCode");      

-- CreateIndex
CREATE INDEX "omie_order_item_omieOrderId_idx" ON "omie_order_item"("omieOrderId");

-- CreateIndex
CREATE INDEX "omie_order_item_omieProductCode_idx" ON "omie_order_item"("omieProductCode");

-- CreateIndex
CREATE INDEX "omie_order_item_description_idx" ON "omie_order_item"("description");

-- CreateIndex
CREATE UNIQUE INDEX "omie_order_item_omieItemCode_key" ON "omie_order_item"("omieItemCode");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_codigo_cliente_omie_key" ON "clientes"("codigo_cliente_omie");

-- CreateIndex
CREATE INDEX "omie_production_order_productCode_idx" ON "omie_production_order"("productCode");

-- CreateIndex
CREATE INDEX "omie_production_order_productIntegrationCode_idx" ON "omie_production_order"("productIntegrationCode");

-- CreateIndex
CREATE INDEX "omie_production_order_completed_idx" ON "omie_production_order"("completed");

-- CreateIndex
CREATE INDEX "omie_production_order_forecastDate_idx" ON "omie_production_order"("forecastDate");

-- CreateIndex
CREATE INDEX "omie_production_order_completionDate_idx" ON "omie_production_order"("completionDate");

-- CreateIndex
CREATE UNIQUE INDEX "omie_production_order_omieCode_key" ON "omie_production_order"("omieCode");

-- CreateIndex
CREATE INDEX "omie_production_order_item_omieProductionOrderId_idx" ON "omie_production_order_item"("omieProductionOrderId");

-- CreateIndex
CREATE INDEX "omie_production_order_item_productMeshId_idx" ON "omie_production_order_item"("productMeshId");

-- CreateIndex
CREATE UNIQUE INDEX "omie_production_order_item_omieItemCode_key" ON "omie_production_order_item"("omieItemCode");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_omieProductId_fkey" FOREIGN KEY ("omieProductId") REFERENCES "OmieProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSector" ADD CONSTRAINT "ProductSector_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSector" ADD CONSTRAINT "ProductSector_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionPlanItem" ADD CONSTRAINT "ProductionPlanItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ProductionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionPlanItem" ADD CONSTRAINT "ProductionPlanItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionPlanItem" ADD CONSTRAINT "ProductionPlanItem_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omie_order_item" ADD CONSTRAINT "omie_order_item_omieOrderId_fkey" FOREIGN KEY ("omieOrderId") REFERENCES "omie_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omie_production_order_item" ADD CONSTRAINT "omie_production_order_item_omieProductionOrderId_fkey" FOREIGN KEY ("omieProductionOrderId") REFERENCES "omie_production_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;