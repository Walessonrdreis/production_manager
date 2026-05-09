-- Adicionar tabela omie_production_order se não existir
CREATE TABLE IF NOT EXISTS "omie_production_order" (
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

-- Adicionar tabela omie_production_order_item se não existir
CREATE TABLE IF NOT EXISTS "omie_production_order_item" (
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

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS "omie_production_order_productCode_idx" ON "omie_production_order"("productCode");
CREATE INDEX IF NOT EXISTS "omie_production_order_productIntegrationCode_idx" ON "omie_production_order"("productIntegrationCode");
CREATE INDEX IF NOT EXISTS "omie_production_order_completed_idx" ON "omie_production_order"("completed");
CREATE INDEX IF NOT EXISTS "omie_production_order_forecastDate_idx" ON "omie_production_order"("forecastDate");
CREATE INDEX IF NOT EXISTS "omie_production_order_completionDate_idx" ON "omie_production_order"("completionDate");

-- Criar índice único se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'omie_production_order_omieCode_key') THEN
        ALTER TABLE "omie_production_order" ADD CONSTRAINT "omie_production_order_omieCode_key" UNIQUE ("omieCode");
    END IF;
END $$;

-- Criar índices para a tabela de itens
CREATE INDEX IF NOT EXISTS "omie_production_order_item_omieProductionOrderId_idx" ON "omie_production_order_item"("omieProductionOrderId");
CREATE INDEX IF NOT EXISTS "omie_production_order_item_productMeshId_idx" ON "omie_production_order_item"("productMeshId");

-- Criar índice único para itens se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'omie_production_order_item_omieItemCode_key') THEN
        ALTER TABLE "omie_production_order_item" ADD CONSTRAINT "omie_production_order_item_omieItemCode_key" UNIQUE ("omieItemCode");
    END IF;
END $$;

-- Adicionar chave estrangeira se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'omie_production_order_item_omieProductionOrderId_fkey') THEN
        ALTER TABLE "omie_production_order_item" ADD CONSTRAINT "omie_production_order_item_omieProductionOrderId_fkey" FOREIGN KEY ("omieProductionOrderId") REFERENCES "omie_production_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;