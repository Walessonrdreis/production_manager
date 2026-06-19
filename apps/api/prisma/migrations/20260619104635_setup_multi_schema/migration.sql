-- ============================================================
-- Passo 1: Criar os schemas
-- ============================================================
CREATE SCHEMA IF NOT EXISTS integration;
CREATE SCHEMA IF NOT EXISTS read_model;

-- ============================================================
-- Passo 2: Mover tabelas de integração
-- ============================================================
ALTER TABLE public.sync_lock SET SCHEMA integration;
ALTER TABLE public.job_lock SET SCHEMA integration;
ALTER TABLE public.omie_product SET SCHEMA integration;
ALTER TABLE public.product_stock SET SCHEMA integration;
ALTER TABLE public.omie_order SET SCHEMA integration;
ALTER TABLE public.omie_order_item SET SCHEMA integration;
ALTER TABLE public.sales_order SET SCHEMA integration;
ALTER TABLE public.sales_order_item SET SCHEMA integration;
ALTER TABLE public.sales_order_sync_command SET SCHEMA integration;
ALTER TABLE public.sales_order_sync_state SET SCHEMA integration;
ALTER TABLE public.omie_customer SET SCHEMA integration;
ALTER TABLE public.customer_command SET SCHEMA integration;
ALTER TABLE public.customer_sync_state SET SCHEMA integration;
ALTER TABLE public.omie_production_order SET SCHEMA integration;
ALTER TABLE public.omie_production_order_item SET SCHEMA integration;
ALTER TABLE public.production_order_integration SET SCHEMA integration;
ALTER TABLE public.product_structure SET SCHEMA integration;
ALTER TABLE public.product_structure_item SET SCHEMA integration;
ALTER TABLE public.product_structure_command SET SCHEMA integration;
ALTER TABLE public.product_catalog_command SET SCHEMA integration;
ALTER TABLE public.clientes SET SCHEMA integration;

-- ============================================================
-- Passo 3: Mover tabelas de read_model
-- ============================================================
ALTER TABLE public.product_catalog_production_ready_read_model SET SCHEMA read_model;
ALTER TABLE public.sales_order_summary_read_model SET SCHEMA read_model;
ALTER TABLE public.sales_order_stage_transition SET SCHEMA read_model;

-- ============================================================
-- Passo 4: Mover enum types para integration (usados pelos modelos)
-- ============================================================
ALTER TYPE "TipoPessoa" SET SCHEMA integration;
ALTER TYPE "SalesOrderSyncCommandStatus" SET SCHEMA integration;
ALTER TYPE "SalesOrderSyncCommandSource" SET SCHEMA integration;
ALTER TYPE "CustomerCommandType" SET SCHEMA integration;
ALTER TYPE "CustomerCommandStatus" SET SCHEMA integration;
ALTER TYPE "CustomerCommandSource" SET SCHEMA integration;
ALTER TYPE "ProductionOrderIntegrationStatus" SET SCHEMA integration;
ALTER TYPE "ProductStructureCommandType" SET SCHEMA integration;
ALTER TYPE "ProductStructureCommandStatus" SET SCHEMA integration;
ALTER TYPE "ProductStructureCommandSource" SET SCHEMA integration;
ALTER TYPE "ProductCatalogCommandType" SET SCHEMA integration;
ALTER TYPE "ProductCatalogCommandStatus" SET SCHEMA integration;
ALTER TYPE "ProductCatalogCommandSource" SET SCHEMA integration;