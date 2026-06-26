-- ============================================================
-- Fase 2: Adicionar colunas productOmieId / omieId
--
-- ⚠️ 100% ADITIVO — NENHUMA TABELA OU COLuna É REMOVIDA
--
-- Nova colunas são todas NULLABLE (String?), portanto:
-- ✅ Sem risco de NOT NULL violation
-- ✅ Sem bloqueio de tabela prolongado
-- ✅ Sem necessidade de backfill imediato
-- ✅ Compativel com dados existentes
-- ============================================================

-- 1. ProductStock: omieCode guarda nCodProd (numerico)
--    → adicionar productOmieId como alias semantico
ALTER TABLE "integration"."product_stock"
  ADD COLUMN "product_omie_id" VARCHAR(64);

-- 2. OmieProductionOrder: omieCode guarda nCodOP (numerico)
--    → adicionar omieId como alias semantico
ALTER TABLE "integration"."omie_production_order"
  ADD COLUMN "omie_id" VARCHAR(64);

-- 3. OmieProductionOrder: productCode guarda nCodProduto (numerico)
--    → adicionar productOmieId como alias semantico
ALTER TABLE "integration"."omie_production_order"
  ADD COLUMN "product_omie_id" VARCHAR(64);

-- 4. OmieOrderItem: omieProductCode guarda nCodProduto (numerico)
--    → adicionar productOmieId como alias semantico
ALTER TABLE "integration"."omie_order_item"
  ADD COLUMN "product_omie_id" VARCHAR(64);

-- 5. ProductionOrderReadModel (read_model):
--    → adicionar productOmieId (numerico)
ALTER TABLE "read_model"."production_order_read_model"
  ADD COLUMN "product_omie_id" VARCHAR(64);

-- 6. ProductCatalogProductionReadyReadModel (read_model):
--    → adicionar productOmieId (numerico)
ALTER TABLE "read_model"."product_catalog_production_ready_read_model"
  ADD COLUMN "product_omie_id" VARCHAR(64);

-- 7. ProductStockCommand:
--    → adicionar productOmieId
ALTER TABLE "integration"."product_stock_command"
  ADD COLUMN "product_omie_id" VARCHAR(64);

-- 8. ProductionOrderIntegration:
--    → adicionar productOmieId
ALTER TABLE "integration"."production_order_integration"
  ADD COLUMN "product_omie_id" VARCHAR(64);