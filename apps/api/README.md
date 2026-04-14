# Production Manager API

API do **Production Manager**: serviço backend para planejamento de produção, com integração ao ERP **Omie**, cadastro/seleção de produtos, definição de setores e criação/exportação de planos de produção.

**Produção (Render):** https://production-manager-api.onrender.com/

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

O carregamento das variáveis ocorre em [env.ts](src/env.ts) via `dotenv` apontando para `apps/api/.env` (o caminho é resolvido como `../.env` a partir de `src`/`dist`).

Obrigatórias:

- `DATABASE_URL` (Postgres)
- `OMIE_APP_KEY`
- `OMIE_APP_SECRET`
- `OMIE_BASE_URL`

Opcional:

- `PORT` (default `3333`)
- `CORS_ORIGIN` (default `http://localhost:5173,http://localhost:5174`)

### Scripts

Definidos em [package.json](package.json):

- `pnpm run dev`: `tsx watch src/server.ts`
- `pnpm run build`: `tsc` (gera `dist/`)
- `pnpm run start`: `prisma migrate deploy` + `node dist/server.js`
- `pnpm run db:migrate`: `prisma migrate dev`
- `pnpm run db:migrate:prod`: `prisma migrate deploy`
- `pnpm run prisma:generate`: `prisma generate`
- `pnpm run test`: `vitest run`

---

## Arquitetura (Visão Geral)

### Entrypoints

- [server.ts](src/server.ts): apenas faz `buildApp()` e `listen()`.
- [app.ts](src/app.ts): cria o Fastify, configura CORS, `requestId`, error handler e registra rotas.

### Rotas

Rotas são registradas em [routes/index.ts](src/routes/index.ts) e delegadas para módulos:

- [omie.ts](src/routes/omie.ts)
- [products.ts](src/routes/products.ts)
- [sectors.ts](src/routes/sectors.ts)
- [product-sector.ts](src/routes/product-sector.ts)
- [plans.ts](src/routes/plans.ts)

### Banco de Dados

Prisma client é configurado em [db.ts](src/db.ts) usando `env.DATABASE_URL`.

Schema em [schema.prisma](prisma/schema.prisma):

- `SyncLock`: lock para evitar concorrência em sync do Omie
- `OmieProduct`: catálogo espelhado do Omie (com `rawPayload`)
- `Product`: produto “selecionado” para gestão interna (1:1 com `OmieProduct`)
- `Sector`: setores com ordenação e soft delete (`active`)
- `ProductSector`: setor padrão de um produto
- `ProductionPlan` e `ProductionPlanItem`: planos e seus itens

---

## Padrões de Resposta (DX)

### Envelope padrão (novo)

Helpers em [http.ts](src/lib/http.ts):

- `ok(data, meta?, links?)` → `{ data, meta?, links? }`
- `paginated(data, meta, links?)` → `{ data: [...], meta: { page, pageSize, total, ... } }`

As rotas informativas (`/`, `/health`, `/v1`) e algumas listagens já usam esse envelope.

### Compatibilidade (clientes antigos)

Somente em rotas de listagem, se o header abaixo estiver presente, o retorno volta ao formato antigo:

- `X-Response-Format: legacy`

Rotas com compatibilidade implementada:

- `GET /v1/omie/products`
- `GET /v1/products`
- `GET /v1/sectors`
- `GET /v1/plans`

Exemplo (novo):

```json
{
  "data": [{ "id": "..." }],
  "meta": { "page": 1, "pageSize": 50, "total": 123 }
}
```

Exemplo (legacy):

```json
{
  "items": [{ "id": "..." }]
}
```

### Erros (sempre JSON)

O error handler global garante o formato:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos.",
    "details": {},
    "requestId": "..."
  }
}
```

Implementação em [app.ts](src/app.ts):

- Zod (`ZodError`) → `400` com `code="VALIDATION_ERROR"` e `details` (inclui `stack` em dev)
- Erro conhecido (duck typing `code/statusCode/message`) → `statusCode` e `error.code/message/details`
- Erro desconhecido → `500` com `code="INTERNAL_ERROR"`

### requestId

Em todas as requisições:

- Lê `X-Request-Id` (header) se existir; caso contrário gera `uuid`.
- Injeta `requestId` na resposta de erro e no log (`reqId`) fora de ambiente de teste.

---

## Rotas

### Informativas

- `GET /` → `{ data: { name, status, timestamp, versions, endpoints, resources, tips } }`
- `GET /health` → `{ data: { ok: true } }`
- `GET /v1` → índice manual de rotas v1 (útil para browser)

Observação: `GET /` inclui `endpoints.docs = <baseUrl>/docs`, mas não existe rota `/docs` implementada neste projeto (placeholder para futura documentação).

### Integração Omie

- `POST /v1/omie/sync/products?force=true|false` → sincroniza catálogo Omie para `OmieProduct`
  - Usa lock em banco (`SyncLock`) e fallback em memória se a tabela não existir
  - Possui throttle por janela de tempo (retorna `skipped=true` quando bloqueado)
- `POST /v1/omie/products/stock/refresh` → força refresh do cache de estoque
- `GET /v1/omie/products` → lista catálogo enriquecido com estoque/categoria
  - Query: `search`, `family`, `page`, `pageSize`

### Produtos (internos/gerenciados)

- `POST /v1/products` → seleciona 1 produto Omie para gestão interna
- `POST /v1/products/bulk` → seleciona vários em lote
- `GET /v1/products` → lista produtos gerenciados (com compatibilidade legacy)
- `DELETE /v1/products/:id`

### Setores

- `POST /v1/sectors`
- `GET /v1/sectors?includeInactive=true|false` (com compatibilidade legacy)
- `PATCH /v1/sectors/:id`
- `DELETE /v1/sectors/:id` (soft delete)

### Produto ↔ Setor padrão

- `PUT /v1/products/:productId/sector`
- `GET /v1/products/:productId/sector`

### Planos de Produção

- `POST /v1/plans`
- `GET /v1/plans` (com compatibilidade legacy)
- `GET /v1/plans/:id`
- `POST /v1/plans/:id/items`
- `GET /v1/plans/:id/by-sector`
- `GET /v1/plans/:id/export.csv`

---

## Integração Omie (detalhes internos)

Arquivos principais:

- [OmieClient.ts](src/integrations/omie/OmieClient.ts): client HTTP (fetch) com timeout e normalização de erros em `AppError`
- [OmieAdapter.ts](src/integrations/omie/OmieAdapter.ts): normaliza payloads variáveis do Omie (código, estoque, família)
- [OmieStockCache.ts](src/integrations/omie/OmieStockCache.ts): cache em memória, refresh automático a cada 15 minutos e refresh manual
- [SyncOmieProductsService.ts](src/core/SyncOmieProductsService.ts): sincronização com retry e lock (`SyncLock`)

---

## Testes

- Testes unitários rodam com `pnpm run test`.
- Teste “em memória” de endpoints informativos (Fastify `inject`) em [informative-endpoints.spec.ts](tests/informative-endpoints.spec.ts).

O setup de testes usa `buildApp()` exportado em [app.ts](src/app.ts), evitando subir porta HTTP e sem exigir conexão com banco para esses testes.

---

## Observações para Manutenção (para outro agente)

- Existem duas classes chamadas `AppError`:
  - [core/errors/AppError.ts](src/core/errors/AppError.ts)
  - [domainErrors.ts](src/utils/domainErrors.ts)
  O handler usa duck typing, então ambas funcionam, mas é recomendado consolidar em um único tipo para reduzir ambiguidade.

- [errors.ts](src/utils/errors.ts) contém `sendError()` que retorna `{ code, message, details }` (formato antigo). Preferir lançar `AppError`/`ValidationError` para cair no error handler padronizado.

- Rotas “listagem” têm compatibilidade via `X-Response-Format: legacy`. Se adicionar novas listagens, decidir se devem suportar legacy e aplicar o mesmo padrão.

---

## Testes rápidos (curl)

Produção:

```bash
curl -i https://production-manager-api.onrender.com/
curl -i https://production-manager-api.onrender.com/health
curl -i https://production-manager-api.onrender.com/v1
```

Omie:

```bash
curl -i -X POST "https://production-manager-api.onrender.com/v1/omie/sync/products?force=true"
curl -i "https://production-manager-api.onrender.com/v1/omie/products?page=1&pageSize=50"
curl -i -H "X-Response-Format: legacy" "https://production-manager-api.onrender.com/v1/omie/products?page=1&pageSize=50"
```
