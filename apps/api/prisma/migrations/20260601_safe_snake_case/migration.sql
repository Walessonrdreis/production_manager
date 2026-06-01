-- ============================================
-- SAFE MIGRATION: camelCase -> snake_case
-- Somente RENAMEs (tabelas/colunas). Sem DROP TABLE.
-- ============================================

BEGIN;

-- 1) SyncLock -> sync_lock
ALTER TABLE "SyncLock" RENAME TO "sync_lock";
ALTER TABLE "sync_lock" RENAME COLUMN "lockedUntil" TO "locked_until";

-- 2) job_lock columns
ALTER TABLE "job_lock" RENAME COLUMN "lockedUntil" TO "locked_until";
ALTER TABLE "job_lock" RENAME COLUMN "updatedAt" TO "updated_at";

-- 3) OmieProduct -> omie_product (tabela + colunas)
ALTER TABLE "OmieProduct" RENAME TO "omie_product";
ALTER TABLE "omie_product" RENAME COLUMN "omieCode" TO "omie_code";
ALTER TABLE "omie_product" RENAME COLUMN "omieId" TO "omie_id";
ALTER TABLE "omie_product" RENAME COLUMN "familyDescription" TO "family_description";
ALTER TABLE "omie_product" RENAME COLUMN "rawPayload" TO "raw_payload";
ALTER TABLE "omie_product" RENAME COLUMN "lastSyncAt" TO "last_sync_at";

-- 4) clientes columns
ALTER TABLE "clientes" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "clientes" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "clientes" RENAME COLUMN "createdAtOmie" TO "created_at_omie";
ALTER TABLE "clientes" RENAME COLUMN "updatedAtOmie" TO "updated_at_omie";
ALTER TABLE "clientes" RENAME COLUMN "isActive" TO "is_active";
ALTER TABLE "clientes" RENAME COLUMN "isBlocked" TO "is_blocked";
ALTER TABLE "clientes" RENAME COLUMN "isBillingBlocked" TO "is_billing_blocked";

-- 5) omie_order columns
ALTER TABLE "omie_order" RENAME COLUMN "omieCode" TO "omie_code";
ALTER TABLE "omie_order" RENAME COLUMN "numeroPedido" TO "numero_pedido";
ALTER TABLE "omie_order" RENAME COLUMN "codigoCliente" TO "codigo_cliente";
ALTER TABLE "omie_order" RENAME COLUMN "codigoEmpresa" TO "codigo_empresa";
ALTER TABLE "omie_order" RENAME COLUMN "dataPrevisao" TO "data_previsao";
ALTER TABLE "omie_order" RENAME COLUMN "clientLegalName" TO "client_legal_name";
ALTER TABLE "omie_order" RENAME COLUMN "clientTradeName" TO "client_trade_name";
ALTER TABLE "omie_order" RENAME COLUMN "rawPayload" TO "raw_payload";
ALTER TABLE "omie_order" RENAME COLUMN "lastSyncAt" TO "last_sync_at";

-- 6) omie_order_item columns
ALTER TABLE "omie_order_item" RENAME COLUMN "omieItemCode" TO "omie_item_code";
ALTER TABLE "omie_order_item" RENAME COLUMN "omieOrderId" TO "omie_order_id";
ALTER TABLE "omie_order_item" RENAME COLUMN "omieProductCode" TO "omie_product_code";
ALTER TABLE "omie_order_item" RENAME COLUMN "unitPrice" TO "unit_price";
ALTER TABLE "omie_order_item" RENAME COLUMN "totalPrice" TO "total_price";
ALTER TABLE "omie_order_item" RENAME COLUMN "rawPayload" TO "raw_payload";
ALTER TABLE "omie_order_item" RENAME COLUMN "lastSyncAt" TO "last_sync_at";

-- 7) omie_production_order columns
ALTER TABLE "omie_production_order" RENAME COLUMN "omieCode" TO "omie_code";
ALTER TABLE "omie_production_order" RENAME COLUMN "internalCode" TO "internal_code";
ALTER TABLE "omie_production_order" RENAME COLUMN "productCode" TO "product_code";
ALTER TABLE "omie_production_order" RENAME COLUMN "productIntegrationCode" TO "product_integration_code";
ALTER TABLE "omie_production_order" RENAME COLUMN "forecastDate" TO "forecast_date";
ALTER TABLE "omie_production_order" RENAME COLUMN "startDate" TO "start_date";
ALTER TABLE "omie_production_order" RENAME COLUMN "completionDate" TO "completion_date";
ALTER TABLE "omie_production_order" RENAME COLUMN "projectCode" TO "project_code";
ALTER TABLE "omie_production_order" RENAME COLUMN "rawPayload" TO "raw_payload";
ALTER TABLE "omie_production_order" RENAME COLUMN "lastSyncAt" TO "last_sync_at";

-- 8) omie_production_order_item columns
ALTER TABLE "omie_production_order_item" RENAME COLUMN "omieItemCode" TO "omie_item_code";
ALTER TABLE "omie_production_order_item" RENAME COLUMN "omieProductionOrderId" TO "omie_production_order_id";
ALTER TABLE "omie_production_order_item" RENAME COLUMN "productMeshId" TO "product_mesh_id";
ALTER TABLE "omie_production_order_item" RENAME COLUMN "useFromStock" TO "use_from_stock";
ALTER TABLE "omie_production_order_item" RENAME COLUMN "stockLocationCode" TO "stock_location_code";
ALTER TABLE "omie_production_order_item" RENAME COLUMN "rawPayload" TO "raw_payload";
ALTER TABLE "omie_production_order_item" RENAME COLUMN "lastSyncAt" TO "last_sync_at";

-- 9) product_stock columns
ALTER TABLE "product_stock" RENAME COLUMN "omieCode" TO "omie_code";
ALTER TABLE "product_stock" RENAME COLUMN "stockQuantity" TO "stock_quantity";
ALTER TABLE "product_stock" RENAME COLUMN "minimumStock" TO "minimum_stock";
ALTER TABLE "product_stock" RENAME COLUMN "capturedAt" TO "captured_at";
ALTER TABLE "product_stock" RENAME COLUMN "updatedAt" TO "updated_at";

-- 10) ProductStructure -> product_structure (tabela + colunas)
ALTER TABLE "ProductStructure" RENAME TO "product_structure";
ALTER TABLE "product_structure" RENAME COLUMN "codProduto" TO "cod_produto";
ALTER TABLE "product_structure" RENAME COLUMN "descrProduto" TO "descr_produto";
ALTER TABLE "product_structure" RENAME COLUMN "codFamilia" TO "cod_familia";
ALTER TABLE "product_structure" RENAME COLUMN "descrFamilia" TO "descr_familia";
ALTER TABLE "product_structure" RENAME COLUMN "tipoProduto" TO "tipo_produto";
ALTER TABLE "product_structure" RENAME COLUMN "unidProduto" TO "unid_produto";
ALTER TABLE "product_structure" RENAME COLUMN "pesoBruto" TO "peso_bruto";
ALTER TABLE "product_structure" RENAME COLUMN "pesoLiquido" TO "peso_liquido";
ALTER TABLE "product_structure" RENAME COLUMN "hasStructure" TO "has_structure";
ALTER TABLE "product_structure" RENAME COLUMN "idProdutoOmie" TO "id_produto_omie";
ALTER TABLE "product_structure" RENAME COLUMN "intProdutoOmie" TO "int_produto_omie";
ALTER TABLE "product_structure" RENAME COLUMN "structureHash" TO "structure_hash";
ALTER TABLE "product_structure" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "product_structure" RENAME COLUMN "updatedAt" TO "updated_at";

-- 11) ProductStructureItem -> product_structure_item (tabela + colunas)
ALTER TABLE "ProductStructureItem" RENAME TO "product_structure_item";
ALTER TABLE "product_structure_item" RENAME COLUMN "codProdutoPai" TO "cod_produto_pai";
ALTER TABLE "product_structure_item" RENAME COLUMN "codProdutoComponente" TO "cod_produto_componente";
ALTER TABLE "product_structure_item" RENAME COLUMN "descrProdutoComponente" TO "descr_produto_componente";
ALTER TABLE "product_structure_item" RENAME COLUMN "codFamiliaComponente" TO "cod_familia_componente";
ALTER TABLE "product_structure_item" RENAME COLUMN "descrFamiliaComponente" TO "descr_familia_componente";
ALTER TABLE "product_structure_item" RENAME COLUMN "tipoProdutoComponente" TO "tipo_produto_componente";
ALTER TABLE "product_structure_item" RENAME COLUMN "percentualPerda" TO "percentual_perda";
ALTER TABLE "product_structure_item" RENAME COLUMN "idMalhaOmie" TO "id_malha_omie";
ALTER TABLE "product_structure_item" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "product_structure_item" RENAME COLUMN "updatedAt" TO "updated_at";

-- 12) (Opcional) recriar índices com nomes novos sem dropar os antigos
-- (Você pode deixar para depois; isso não afeta dados nem integridade.)

COMMIT;
