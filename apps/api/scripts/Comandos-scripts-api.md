# Comandos de terminal — scripts em apps/api/scripts (e atalhos no package.json)

## Rodar a partir da raiz do monorepo

```powershell
cd c:\Users\Dell\Documents\trae_projects\production_manager
```

Atalhos úteis:

```powershell
# Rodar scripts do workspace @production-manager/api a partir da raiz
pnpm --filter @production-manager/api <script>

# Alternativa equivalente
pnpm -C apps/api <comando>
```

## Scripts principais (já existentes em apps/api/package.json)

```powershell
# dev server
pnpm --filter @production-manager/api dev

# build
pnpm --filter @production-manager/api build
pnpm --filter @production-manager/api start

# generate module
pnpm --filter @production-manager/api gen:module -- name-module

# Gerar arquivo com a estrutura da aplicação completa
pnpm --filter @production-manager/api gen:structure

# Gerar arquivo com a estrutura da aplicação resumida
pnpm --filter @production-manager/api run docs:estrutura

# Gerar ou atualizar arquivo com o resumo da aplicação
pnpm --filter @production-manager/api gen:resumo

# Cria e popula o arquivo de código com o conteúdo interativo em duas etapas o caminho e nome do arquivo e o conteúdo do arquivo
 pnpm --filter @production-manager/api run create:file

# prisma
pnpm --filter @production-manager/api prisma:generate
pnpm --filter @production-manager/api db:migrate
pnpm --filter @production-manager/api db:migrate:prod
pnpm --filter @production-manager/api db:studio

# testes
pnpm --filter @production-manager/api test

# backfill
pnpm --filter @production-manager/api backfill:omie-code

# métricas e docs
pnpm --filter @production-manager/api metrics:all
pnpm --filter @production-manager/api metrics:tree
pnpm --filter @production-manager/api metrics:loc
pnpm --filter @production-manager/api metrics:sizes
pnpm --filter @production-manager/api metrics:endpoints
pnpm --filter @production-manager/api metrics:drift
pnpm --filter @production-manager/api metrics:prisma
pnpm --filter @production-manager/api metrics:migrations
pnpm --filter @production-manager/api metrics:env
pnpm --filter @production-manager/api metrics:exports
pnpm --filter @production-manager/api docs:contract
pnpm --filter @production-manager/api docs:status
pnpm --filter @production-manager/api docs:reference
pnpm --filter @production-manager/api docs:typedoc
pnpm --filter @production-manager/api metrics:update-docs
```

## Rodar os arquivos diretamente (quando não existir script no package.json)

```powershell


cd c:\Users\Dell\Documents\trae_projects\production_manager\apps\api

# TSX (para scripts .ts)
pnpm exec tsx scripts/backfill-omie-code.ts
pnpm exec tsx scripts/generate-module.ts

# Node (para scripts .mjs)
node scripts/check-env.mjs
node scripts/repo-metrics.mjs

node scripts/metrics/all.mjs
node scripts/metrics/tree.mjs src 4
node scripts/metrics/loc.mjs
node scripts/metrics/sizes.mjs
node scripts/metrics/endpoints.mjs
node scripts/metrics/endpoints-drift.mjs
node scripts/metrics/prisma-schema.mjs
node scripts/metrics/migrations.mjs
node scripts/metrics/env-check.mjs
node scripts/metrics/exports.mjs
node scripts/metrics/render-api-contract.mjs
node scripts/metrics/render-md.mjs
node scripts/metrics/render-reference.mjs
node scripts/metrics/render-readme.mjs

# Atualizar a estrutura do projeto
node scripts/update-estrutura-projeto.mjs
```

## Sugestão de organização (copiar/colar no package.json da raiz)

Se você quiser ter atalhos na raiz (sem precisar lembrar `--filter`), este bloco é um exemplo para colar em `scripts` do [package.json](file:///c:/Users/Dell/Documents/trae_projects/production_manager/package.json):

```json
{
  "scripts": {
    "api:dev": "pnpm --filter @production-manager/api dev",
    "api:build": "pnpm --filter @production-manager/api build",
    "api:start": "pnpm --filter @production-manager/api start",
    "api:prisma:generate": "pnpm --filter @production-manager/api prisma:generate",
    "api:db:migrate": "pnpm --filter @production-manager/api db:migrate",
    "api:db:studio": "pnpm --filter @production-manager/api db:studio",
    "api:test": "pnpm --filter @production-manager/api test",
    "api:backfill:omie-code": "pnpm --filter @production-manager/api backfill:omie-code",
    "api:metrics:all": "pnpm --filter @production-manager/api metrics:all",
    "api:docs:contract": "pnpm --filter @production-manager/api docs:contract",
    "api:docs:status": "pnpm --filter @production-manager/api docs:status",
    "api:docs:reference": "pnpm --filter @production-manager/api docs:reference"
  }
}
```
