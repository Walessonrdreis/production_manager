# Product Manager Module — Patterns & Facts

## Purpose
Criar, atualizar e inativar produtos no Omie via comandos assíncronos (PgBoss). Espelho local (OmieProduct) é atualizado após sucesso.

## File Structure (23 files)
```
product-manager/
├── index.ts
├── product-manager-integration-register.ts
├── application/
│   ├── dto/
│   │   ├── create-product.dto.ts          — Zod: externalRequestId, description (req), sku?, familyDescription?, brand?, unit?, ncm?
│   │   ├── update-product.dto.ts          — Zod: externalRequestId, productCode (req), + above optional
│   │   └── inactivate-product.dto.ts      — Zod: externalRequestId, productCode (req)
│   ├── mappers/
│   │   └── map-product-to-omie-payload.ts — buildCreatePayload (IncluirProduto), buildUpdatePayload (AlterarProduto), buildInactivatePayload (AlterarProduto ativo="N")
│   ├── ports/
│   │   ├── product-creation.gateway.ts    — interface: create() → {externalRequestId, productCode, status}
│   │   ├── product-update.gateway.ts      — interface: update() → same
│   │   └── product-inactivate.gateway.ts  — interface: inactivate() → same
│   └── use-cases/
│       ├── enqueue-create-product.usecase.ts     — enqueueJob("product-manager.create", ...)
│       ├── enqueue-update-product.usecase.ts     — enqueueJob("product-manager.update", ...)
│       ├── enqueue-inactivate-product.usecase.ts — enqueueJob("product-manager.inactivate", ...)
│       ├── process-create-product.usecase.ts     — markProcessing → creationGateway → markConfirmed/markFailed
│       ├── process-update-product.usecase.ts     — same pattern with updateGateway
│       └── process-inactivate-product.usecase.ts — same pattern with inactivateGateway
├── infrastructure/
│   ├── db/
│   │   └── product-manager-command.store.ts — PENDING→PROCESSING→CONFIRMED/FAILED lifecycle
│   ├── gateways/
│   │   ├── creation/
│   │   │   ├── real-product-creation.gateway.ts  — POST /api/v1/geral/produtos/ + OmieProduct upsert
│   │   │   └── fake-product-creation.gateway.ts  — returns FAKE-{requestId}
│   │   ├── update/
│   │   │   ├── real-product-update.gateway.ts    — POST /api/v1/geral/produtos/ + updateMany mirror
│   │   │   └── fake-product-update.gateway.ts    — returns CONFIRMED
│   │   └── inactivate/
│   │       ├── real-product-inactivate.gateway.ts — POST /api/v1/geral/produtos/ + active=false
│   │       └── fake-product-inactivate.gateway.ts — returns CONFIRMED
│   └── jobs/
│       ├── product-manager-jobs.register.ts  — creates gateways + calls registerProductManagerJobHandlers(omieClient)
│       └── product-manager-jobs.handler.ts   — checks env.PRODUCT_MANAGER_GATEWAY, registers 3 handlers concurrency:1
└── presentation/http/
    ├── schemas.ts                                — re-exports Zod schemas
    ├── routes.ts                                 — aggregates 3 command routes
    ├── routes/
    │   ├── create-product.route.ts      — POST .../commands/create → 202
    │   ├── update-product.route.ts      — POST .../commands/update → 202
    │   └── inactivate-product.route.ts  — POST .../commands/inactivate → 202
    └── openapi.ts                                — OpenAPI 3.0 documentation
```

## Key Facts
- **Gateways**: 3 separate gateways (creation, update, inactivate) — NOT a single generic one
- **Status flow**: PENDING→PROCESSING→CONFIRMED/FAILED (matches production-orders pattern)
- **Env var**: `PRODUCT_MANAGER_GATEWAY=fake|real` (default: fake)
- **Mirror update**: After successful Omie call, OmieProduct is upserted/updated immediately
- **No DELETE**: Omie doesn't support ExcluirProduto, so we use INACTIVATE (ativo="N")
- **Separate from product-catalog**: product-catalog handles sync; product-manager handles only commands
- **Template**: Follows production-orders (~95% match)
- **Prisma model**: ProductManagerCommand (table: `integration.product_manager_command`)
- **Omie endpoint**: POST /api/v1/geral/produtos/ (same for create, update, inactivate)
- **Idempotency**: externalRequestId with unique constraint + singletonKey on PgBoss

## Commands
```bash
# Build
pnpm --filter @production-manager/api build

# Test endpoints
curl -s -X POST http://localhost:3333/v1/integration/product-manager/commands/create \
  -H "Content-Type: application/json" \
  -d '{"externalRequestId":"test-001","description":"Produto Teste"}'

curl -s -X POST http://localhost:3333/v1/integration/product-manager/commands/update \
  -H "Content-Type: application/json" \
  -d '{"externalRequestId":"test-002","productCode":"FAKE-001","description":"Atualizado"}'

curl -s -X POST http://localhost:3333/v1/integration/product-manager/commands/inactivate \
  -H "Content-Type: application/json" \
  -d '{"externalRequestId":"test-003","productCode":"FAKE-001"}'
```
