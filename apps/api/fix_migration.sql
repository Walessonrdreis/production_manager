-- Primeiro, vamos verificar o estado atual das migrações
SELECT migration_name, started_at, finished_at, logs 
FROM _prisma_migrations 
WHERE migration_name = '20260508213903_add_omie_production_orders';

-- Se a migração está em estado falho, podemos tentar marcá-la como resolvida
-- Mas primeiro precisamos reverter o que foi aplicado parcialmente

-- Verificar se as tabelas já existem
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('omie_production_order', 'omie_production_order_item');

-- Se as tabelas não existem, podemos simplesmente marcar a migração como falha
-- e criar uma nova migração correta
UPDATE _prisma_migrations 
SET finished_at = NOW(), 
    logs = 'Migration failed due to duplicate enum type. Manually resolved by marking as failed and creating corrected migration.'
WHERE migration_name = '20260508213903_add_omie_production_orders' 
AND finished_at IS NULL;