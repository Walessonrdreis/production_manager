# Production Manager API

API do **Production Manager**: serviço backend para planejamento de produção, com integração ao ERP **Omie**, cadastro/seleção de produtos, definição de e criação/exportação de planos de produção.

**Produção (Render):**  
👉 https://production-manager-api.onrender.com/

---

## 📌 Contrato público (leia primeiro)

> Para consumo externo (ex.: BizChat, frontend, integrações), **existe um único contrato público**.

- ✅ **Endpoint base:** `GET /v1/products`
- ✅ Retorna: **produto + estoque atual**
- ✅ Chave externa: `omieCode`
- ❌ Não é necessário chamar Omie
- ❌ Não existem endpoints por campo (`/stockQuantity`, `/sku`, etc.)

📄 Documentação gerada automaticamente:
- **Contrato da API:** [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md)
- **Status do repositório:** [`docs/REPO_STATUS.md`](docs/REPO_STATUS.md)

Esses arquivos são **sempre atualizados por script** (não editados manualmente).

---

## Tecnologias

- Node.js 20 + TypeScript
- Fastify (HTTP)
- Prisma ORM + PostgreSQL
- Zod (validação)
- Vitest (testes)

---

## Como Rodar

### Pré-requisitos

- Node.js 20
- pnpm
- PostgreSQL (ou `DATABASE_URL` apontando para um Postgres gerenciado)

### Variáveis de Ambiente

O carregamento das variáveis ocorre em [`env.ts`](src/env.ts) via `dotenv`, apontando para `apps/api/.env`
(o caminho é resolvido como `../.env` a partir de `src`/`dist`).

**Obrigatórias:**
- `DATABASE_URL` (Postgres)
- `OMIE_APP_KEY`
- `OMIE_APP_SECRET`
- `OMIE_BASE_URL`

**Jobs (produção):**
- `ENABLE_STOCK_REFRESH_JOB=true`
- `STOCK_REFRESH_CRON=*/5 * * * *`
- `OMIE_PRODUCT_SYNC_CRON=*/30 * * * *`

**Opcionais:**
- `PORT` (default `3333`)
- `CORS_ORIGIN` (default `http://localhost:5173,http://localhost:5174`)

---

## Scripts

Definidos em [`package.json`](package.json):

- `pnpm run dev` → `tsx watch src/server.ts`
- `pnpm run build` → `tsc` (gera `dist/`)
- `pnpm run start` → `prisma migrate deploy` + `node dist/server.js`
- `pnpm run db:migrate` → `prisma migrate dev`
- `pnpm run db:migrate:prod` → `prisma migrate deploy`
- `pnpm run prisma:generate` → `prisma generate`
- `pnpm run test` → `vitest run`

### Scripts de métricas e documentação (DX)

Esses scripts **economizam trabalho manual e crédito de LLM**:

- `pnpm metrics:all` → gera `metrics-report.json`
- `pnpm docs:status` → atualiza `docs/REPO_STATUS.md`
- `pnpm docs:contract` → atualiza `docs/API_CONTRACT.md`
- `pnpm metrics:update-docs` → métricas + status (fluxo recomendado)

---

## Arquitetura (Visão Geral)

### Entrypoints

- [`server.ts`](src/server.ts): apenas faz `buildApp()` e `listen()`
- [`app.ts`](src/app.ts): cria o Fastify, configura CORS, `requestId`, error handler e registra rotas

### Rotas

Rotas são registradas em [`routes/index.ts`](src/routes/index.ts) e delegadas para módulos:

- [`omie.ts`](src/routes/omie.ts) → **admin**
- [`products.ts`](src/routes/products.ts)
- [`sectors.ts`](src/routes/sectors.ts)
- [`product-sector.ts`](src/routes/product-sector.ts)
- [`plans.ts`](src/routes/plans.ts)

### Banco de Dados

Prisma client configurado em [`db.ts`](src/db.ts) usando `env.DATABASE_URL`.

Schema em [`schema.prisma`](prisma/schema.prisma):

- `SyncLock`: lock para evitar concorrência em sync do Omie
- `OmieProduct`: catálogo espelhado do Omie (com `rawPayload`)
- `Product`: produto “selecionado” para gestão interna
- `Sector`: setores com ordenação e soft delete (`active`)
- `ProductSector`: setor padrão de um produto
- `ProductStock`: estoque atual (estado)
- `ProductionPlan` e `ProductionPlanItem`: planos e itens

---

## Padrões de Resposta (DX)

### Envelope padrão

Helpers em [`http.ts`](src/lib/http.ts):

- `ok(data, meta?, links?)` → `{ data, meta?, links? }`
- `paginated(data, meta, links?)` → `{ data: [...], meta: { page, pageSize, total } }`

Rotas informativas (`/`, `/health`, `/v1`) e endpoints públicos usam esse envelope.

### Compatibilidade (clientes antigos)

Algumas listagens aceitam:

---

## Integração Omie (detalhes)

> Esta seção é **interna** e não faz parte do contrato público.

Arquivos principais:

- `src/integrations/omie/OmieClient.ts`  
  Client HTTP para Omie (fetch), com:
  - timeout
  - retry básico
  - normalização de erros para `AppError`

- `src/integrations/omie/OmieAdapter.ts`  
  Responsável por:
  - normalizar payloads inconsistentes do Omie
  - mapear códigos, descrições e famílias
  - isolar variações da API externa

- `src/integrations/omie/OmieStockCache.ts`  
  Cache de estoque:
  - refresh automático (job)
  - refresh manual via endpoint admin
  - fallback seguro quando Omie falha

- `src/core/SyncOmieProductsService.ts`  
  Serviço de sincronização do catálogo:
  - lock via banco (`SyncLock`)
  - retry controlado
  - proteção contra concorrência

---

## Jobs / Cron

### Sincronização de catálogo (Omie → OmieProduct)

- Controlada por:
  ```env
  OMIE_PRODUCT_SYNC_CRON=*/30 * * * *
 