# Fluxo de Trabalho para Desenvolvimento Local

## Situação Atual

✅ **Banco local resetado e sincronizado** com o Supabase:
- 30 migrações aplicadas
- 29 tabelas criadas
- Schema idêntico ao Supabase

## Configuração do Ambiente

### Arquivos `.env`

1. **`.env`** (produção) - **NUNCA modificar durante desenvolvimento**
   ```
   DATABASE_URL="postgresql://postgres.ywaucchinhyhvfhrrcqy:CHnQpyte4kWigl3y@aws-1-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

2. **`.env.local`** (desenvolvimento local) - usar este
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/production_manager?schema=public"
   ```

## Comandos para Desenvolvimento Local

### 1. Iniciar banco de dados local
```bash
# Na raiz do projeto
docker-compose up -d
```

### 2. Gerar migrações (após alterar schema.prisma)
```bash
cd apps/api
pnpm db:migrate:local
```

### 3. Abrir Prisma Studio para banco local
```bash
cd apps/api
pnpm db:studio:local
```

### 4. Rodar servidor local
```bash
cd apps/api
pnpm dev
```

### 5. Verificar status das migrações locais
```bash
cd apps/api
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/production_manager?schema=public" npx prisma migrate status
```

## Fluxo de Trabalho Seguro

### ✅ O QUE FAZER LOCALMENTE:
1. **Sempre** usar `.env.local` durante desenvolvimento
2. **Sempre** usar `pnpm db:migrate:local` para gerar migrações
3. **Sempre** testar no banco local primeiro
4. **Sempre** verificar se o Docker está rodando

### ❌ O QUE NÃO FAZER:
1. **NUNCA** modificar `.env` durante desenvolvimento
2. **NUNCA** usar `pnpm db:migrate:dev` (conecta ao Supabase)
3. **NUNCA** executar migrações diretamente no Supabase sem testar localmente
4. **NUNCA** esquecer de restaurar `.env` antes de deploy

## Deploy para Produção

### 1. Testar migrações localmente
```bash
cd apps/api
# Usar .env.local
pnpm db:migrate:local
```

### 2. Restaurar configuração de produção
```bash
cd apps/api
# Garantir que .env aponta para Supabase
mv .env.local .env.temp && mv .env .env.local && mv .env.temp .env
```

### 3. Aplicar migrações no Supabase
```bash
cd apps/api
pnpm db:migrate:prod
```

### 4. Fazer deploy (Render)
- O Render executa automaticamente `pnpm db:migrate:resilient`

## Resolução de Problemas

### Erro: "relation already exists"
Significa que a migração já foi aplicada. Use:
```bash
cd apps/api
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/production_manager?schema=public" npx prisma migrate status
```

### Erro: "Database does not exist"
Verifique se o Docker está rodando:
```bash
docker ps
docker-compose up -d
```

### Erro: "Connection refused"
Verifique se o PostgreSQL local está na porta 5432:
```bash
docker exec production_manager_db psql -U postgres -c "SELECT 1;"
```

## Scripts Úteis

### Resetar banco local (cuidado: apaga todos os dados)
```bash
cd apps/api
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/production_manager?schema=public" npx prisma migrate reset --force
```

### Verificar diferenças entre bancos
```bash
# Local
docker exec production_manager_db psql -U postgres -d production_manager -c "SELECT COUNT(*) FROM _prisma_migrations;"

# Supabase (usar .env de produção)
cd apps/api
npx prisma migrate status
```

## Backup Importante

O plano Free do Supabase **não tem backup automático**. Sempre:
1. Exportar dados importantes antes de migrações grandes
2. Testar migrações localmente primeiro
3. Ter um plano de rollback

---

**Lembrete**: O banco local agora está vazio (dados perdidos no reset). Você precisará:
1. Inserir dados de teste manualmente, OU
2. Exportar dados não-críticos do Supabase (se necessário), OU
3. Desenvolver com dados mock/fake