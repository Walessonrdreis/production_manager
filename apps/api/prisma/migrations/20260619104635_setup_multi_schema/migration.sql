-- ============================================================
-- Passo 1: Criar os schemas
-- ============================================================
CREATE SCHEMA IF NOT EXISTS integration;

CREATE SCHEMA IF NOT EXISTS read_model;

-- ============================================================
-- Passo 2: Mover tabelas de integração (idempotente)
-- ============================================================
-- Cada bloco DO $$ verifica se a tabela existe em public antes de mover.
-- Isso garante que funcione tanto em shadow DB (tabelas já criadas no
-- schema correto pelo Prisma) quanto em real DB (tabelas legado em public).
DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'sync_lock') THEN ALTER TABLE public.sync_lock SET SCHEMA integration;

END IF;

END $$;

DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'job_lock') THEN ALTER TABLE public.job_lock SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'omie_product') THEN ALTER TABLE public.omie_product SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'product_stock') THEN ALTER TABLE public.product_stock SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'omie_order') THEN ALTER TABLE public.omie_order SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'omie_order_item') THEN ALTER TABLE public.omie_order_item SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'sales_order') THEN ALTER TABLE public.sales_order SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'sales_order_item') THEN ALTER TABLE public.sales_order_item SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'sales_order_sync_command') THEN ALTER TABLE public.sales_order_sync_command SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'sales_order_sync_state') THEN ALTER TABLE public.sales_order_sync_state SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'omie_customer') THEN ALTER TABLE public.omie_customer SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'customer_command') THEN ALTER TABLE public.customer_command SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'customer_sync_state') THEN ALTER TABLE public.customer_sync_state SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'omie_production_order') THEN ALTER TABLE public.omie_production_order SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'omie_production_order_item') THEN ALTER TABLE public.omie_production_order_item SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'production_order_integration') THEN ALTER TABLE public.production_order_integration SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'product_structure') THEN ALTER TABLE public.product_structure SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'product_structure_item') THEN ALTER TABLE public.product_structure_item SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'product_structure_command') THEN ALTER TABLE public.product_structure_command SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'product_catalog_command') THEN ALTER TABLE public.product_catalog_command SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'clientes') THEN ALTER TABLE public.clientes SET SCHEMA integration; END IF; END $$;

-- ============================================================
-- Passo 3: Mover tabelas de read_model (idempotente)
-- ============================================================
DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'product_catalog_production_ready_read_model') THEN ALTER TABLE public.product_catalog_production_ready_read_model SET SCHEMA read_model; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'sales_order_summary_read_model') THEN ALTER TABLE public.sales_order_summary_read_model SET SCHEMA read_model; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'sales_order_stage_transition') THEN ALTER TABLE public.sales_order_stage_transition SET SCHEMA read_model; END IF; END $$;

-- ============================================================
-- Passo 4: Mover enum types para integration (idempotente)
-- ============================================================
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'TipoPessoa') THEN ALTER TYPE "TipoPessoa" SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'SalesOrderSyncCommandStatus') THEN ALTER TYPE "SalesOrderSyncCommandStatus" SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'SalesOrderSyncCommandSource') THEN ALTER TYPE "SalesOrderSyncCommandSource" SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'CustomerCommandType') THEN ALTER TYPE "CustomerCommandType" SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'CustomerCommandStatus') THEN ALTER TYPE "CustomerCommandStatus" SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'CustomerCommandSource') THEN ALTER TYPE "CustomerCommandSource" SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'ProductionOrderIntegrationStatus') THEN ALTER TYPE "ProductionOrderIntegrationStatus" SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'ProductStructureCommandType') THEN ALTER TYPE "ProductStructureCommandType" SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'ProductStructureCommandStatus') THEN ALTER TYPE "ProductStructureCommandStatus" SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'ProductStructureCommandSource') THEN ALTER TYPE "ProductStructureCommandSource" SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'ProductCatalogCommandType') THEN ALTER TYPE "ProductCatalogCommandType" SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'ProductCatalogCommandStatus') THEN ALTER TYPE "ProductCatalogCommandStatus" SET SCHEMA integration; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'ProductCatalogCommandSource') THEN ALTER TYPE "ProductCatalogCommandSource" SET SCHEMA integration; END IF; END $$;