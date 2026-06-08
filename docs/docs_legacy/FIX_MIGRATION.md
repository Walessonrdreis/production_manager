# Instruções para Resolver Migração Falhada no Render

## Problema
A migração `20260508213903_add_omie_production_orders` falhou no ambiente do Render e está marcada como "failed" no banco de dados. Isso impede que novas migrações sejam aplicadas.

## Solução

### Opção 1: Usando o Prisma Studio (Recomendado)
1. Acesse o Prisma Studio no ambiente do Render:
   ```bash
   npx prisma studio
   ```

2. Vá para a aba "Migrations"
3. Encontre a migração falhada `20260508213903_add_omie_production_orders`
4. Marque-a como "Applied" se as tabelas foram criadas com sucesso
5. Ou marque como "Rolled back" se a migração não foi aplicada

### Opção 2: Usando Comando SQL Direto
Conecte-se ao banco de dados PostgreSQL do Render e execute:

```sql
-- Verificar status das migrações
SELECT * FROM "_prisma_migrations";

-- Se a migração foi aplicada com sucesso, marcar como aplicada
UPDATE "_prisma_migrations" 
SET "finished_at" = NOW(), 
    "rolled_back_at" = NULL,
    "logs" = 'Migration manually marked as applied',
    "applied_steps_count" = 1
WHERE "migration_name" = '20260508213903_add_omie_production_orders';

-- Se a migração não foi aplicada, marcar como revertida
UPDATE "_prisma_migrations" 
SET "finished_at" = NOW(), 
    "rolled_back_at" = NOW(),
    "logs" = 'Migration manually marked as rolled back',
    "applied_steps_count" = 0
WHERE "migration_name" = '20260508213903_add_omie_production_orders';
```

### Opção 3: Usando Prisma Migrate Resolve (Via Terminal)
Execute no terminal do Render:

```bash
# Para marcar como aplicada (se as tabelas existem)
npx prisma migrate resolve --applied "20260508213903_add_omie_production_orders"

# Para marcar como revertida (se as tabelas não existem)
npx prisma migrate resolve --rolled-back "20260508213903_add_omie_production_orders"
```

## Verificação
Após resolver, verifique se as tabelas foram criadas:

```sql
-- Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('omie_production_order', 'omie_production_order_item');

-- Verificar estrutura das tabelas
\d omie_production_order;
\d omie_production_order_item;
```

## Passos para o Render

### Via Console do Render
1. Acesse o dashboard do Render
2. Vá para o serviço da API
3. Clique em "Shell" para abrir um terminal
4. Execute os comandos acima

### Via Deploy Script
Adicione ao script de build/deploy:

```bash
# No script de build
npm run build

# Resolver migração falhada antes de aplicar novas
npx prisma migrate resolve --applied "20260508213903_add_omie_production_orders" || true

# Aplicar migrações pendentes
npx prisma migrate deploy
```

## Prevenção Futura
1. Sempre teste migrações localmente antes do deploy
2. Use transações para migrações complexas
3. Mantenha backups do banco de dados
4. Considere usar migrações manuais para produção crítica