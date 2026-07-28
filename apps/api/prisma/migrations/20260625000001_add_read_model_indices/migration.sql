-- Fase 0: Índices para otimização do production_order_read_model
-- Aplicar via: npx prisma db execute --file=<caminho>
-- Índice GIN para lookup por material (refresh.by-stock)
-- Índices compostos para listagem (GET /open)

-- 1. Remover tabela duplicata que foi criada no schema public (caso exista)
DROP TABLE IF EXISTS "public"."production_order_read_model" CASCADE;

-- 2. Índice GIN para consulta JSONB por material (Fase 3 - refresh.by-stock)
CREATE INDEX IF NOT EXISTS idx_prorm_materials_gin
  ON "read_model"."production_order_read_model"
  USING GIN (materials_json);

-- 3. Índice composto principal para listagem de OPs abertas ordenadas
CREATE INDEX IF NOT EXISTS idx_prorm_open_priority_expected
  ON "read_model"."production_order_read_model"
  (is_open, priority DESC, expected_at);

-- 4. Índice alternativo por data para queries sem prioridade
CREATE INDEX IF NOT EXISTS idx_prorm_open_expected
  ON "read_model"."production_order_read_model"
  (is_open, expected_at);

-- 5. Índice por status operacional (filtros GET)
CREATE INDEX IF NOT EXISTS idx_prorm_operational_status
  ON "read_model"."production_order_read_model"
  (operational_status);