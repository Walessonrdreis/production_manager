# RESUMO_PROJETO

---

**Versão:** 1.0.0
**Data:** 14/05/2026
**Hora:** 22:03:43

---

## 1. IDENTIFICAÇÃO

- **Nome:** @production-manager/api
- **Descrição:** API de gerenciamento de produção integrada com Omie
- **Versão:** 1.0.0
- **Stack:** Node.js + TypeScript + Fastify + Prisma + PostgreSQL
- **License:** N/A

---

## 2. ARQUITETURA

### 2.1 Clean Architecture

```
Presentation (routes/controllers/schemas)
       ↓
Application (use-cases/dto/ports)
       ↓
Infrastructure (repositories/gateways/jobs)
       ↓
Domain (entities/value-objects/errors)
```

### 2.2 Estrutura de Diretórios

```text
apps/api/
├─ docs/
│  ├─ ESTRUTURA_PROJETO/
│  │  ├─ COMPLETO/
│  │  └─ RESUMIDO/
│  ├─ history/
│  ├─ prompts/
│  ├─ reference/
│  │  └─ files/
│  ├─ templates/
│  │  └─ module/
│  │     ├─ application/
│  │     │  └─ use-cases/
│  │     ├─ infrastructure/
│  │     └─ presentation/
│  │        └─ http/
│  ├─ Terminal/
│  └─ typedoc/
│     ├─ app/
│     │  └─ functions/
│     ├─ contracts/
│     │  └─ publicProducts.contract/
│     ├─ core/
│     │  ├─ errors/
│     │  │  └─ AppError/
│     │  │     └─ classes/
│     │  └─ SyncOmieProductsService/
│     │     └─ classes/
│     ├─ db/
│     │  └─ variables/
│     ├─ env/
│     │  └─ variables/
│     ├─ integrations/
│     │  └─ omie/
│     │     ├─ OmieAdapter/
│     │     │  ├─ classes/
│     │     │  └─ type-aliases/
│     │     ├─ OmieClient/
│     │     │  ├─ classes/
│     │     │  └─ variables/
│     │     └─ OmieStockCache/
│     │        ├─ classes/
│     │        └─ variables/
│     ├─ jobs/
│     │  ├─ omieProductSync.job/
│     │  │  └─ functions/
│     │  └─ stockRefresh.job/
│     │     └─ functions/
│     ├─ lib/
│     │  ├─ errors/
│     │  ├─ http/
│     │  │  ├─ functions/
│     │  │  └─ type-aliases/
│     │  └─ logger/
│     ├─ repositories/
│     │  ├─ PlanRepository/
│     │  │  └─ classes/
│     │  ├─ ProductRepository/
│     │  │  └─ classes/
│     │  └─ SectorRepository/
│     │     └─ classes/
│     ├─ routes/
│     │  ├─ functions/
│     │  ├─ omie/
│     │  │  └─ functions/
│     │  ├─ plans/
│     │  │  └─ functions/
│     │  ├─ product-sector/
│     │  │  └─ functions/
│     │  ├─ products/
│     │  │  └─ functions/
│     │  └─ sectors/
│     │     └─ functions/
│     ├─ server/
│     ├─ services/
│     │  ├─ CreatePlanItemService/
│     │  │  └─ classes/
│     │  ├─ CreatePlanService/
│     │  │  └─ classes/
│     │  ├─ CreateSectorService/
│     │  │  └─ classes/
│     │  ├─ jobLock.service/
│     │  │  └─ functions/
│     │  ├─ omieProductRead.service/
│     │  │  └─ functions/
│     │  ├─ omieProductSync.service/
│     │  │  └─ functions/
│     │  ├─ omieStock.service/
│     │  │  └─ functions/
│     │  ├─ publicProductsRead.service/
│     │  │  ├─ functions/
│     │  │  └─ type-aliases/
│     │  ├─ SetProductDefaultSectorService/
│     │  │  └─ classes/
│     │  └─ stockRefresh.service/
│     │     └─ functions/
│     └─ utils/
│        ├─ backoff/
│        │  └─ functions/
│        ├─ domainErrors/
│        │  └─ classes/
│        └─ errors/
│           ├─ functions/
│           ├─ interfaces/
│           ├─ type-aliases/
│           └─ variables/
├─ prisma/
│  └─ migrations/
├─ scripts/
│  ├─ metrics/
│  ├─ scaffold/
│  └─ trello/
├─ src/
│  ├─ @types/
│  │  └─ fastify-schema.d.ts
│  ├─ bootstrap/
│  │  ├─ plugins/
│  │  │  ├─ error-handler.ts
│  │  │  ├─ job-lock.ts
│  │  │  ├─ logger.ts
│  │  │  └─ prisma.ts
│  │  ├─ app.ts
│  │  ├─ openapi-simple.ts
│  │  ├─ openapi.ts
│  │  ├─ routes.ts
│  │  └─ server.ts
│  ├─ config/
│  │  ├─ env.ts
│  │  └─ index.ts
│  ├─ contracts/
│  │  └─ publicProducts.contract.ts
│  ├─ controllers/
│  ├─ core/
│  │  └─ errors/
│  ├─ dontev/
│  │  └─ config.ts
│  ├─ infra/
│  │  └─ db.ts
│  ├─ integrations/
│  │  └─ omie/
│  ├─ legacy/ # Legado (não expandido)
│  ├─ lib/
│  │  └─ http.ts
│  ├─ middlewares/
│  ├─ modules/
│  │  ├─ alerts/
│  │  │  ├─ application/
│  │  │  │  ├─ dtos/
│  │  │  │  │  └─ stock-alerts.dto.ts
│  │  │  │  ├─ entities/
│  │  │  │  │  ├─ alert-config.entity.ts
│  │  │  │  │  └─ stock-alert.entity.ts
│  │  │  │  ├─ ports/
│  │  │  │  │  └─ alerts.repository.port.ts
│  │  │  │  └─ use-cases/
│  │  │  │     ├─ configure-alerts.usecase.ts
│  │  │  │     ├─ list-stock-alerts.usecase.ts
│  │  │  │     └─ update-alert-status.usecase.ts
│  │  │  ├─ infrastructure/
│  │  │  │  └─ db/
│  │  │  │     └─ alerts.repository.prisma.ts
│  │  │  ├─ presentation/
│  │  │  │  └─ http/
│  │  │  │     ├─ stock-alerts.controller.ts
│  │  │  │     ├─ stock-alerts.openapi.ts
│  │  │  │     └─ stock-alerts.routes.ts
│  │  │  ├─ README.md
│  │  │  └─ register.ts
│  │  ├─ client/
│  │  │  ├─ application/
│  │  │  │  ├─ dtos/
│  │  │  │  │  └─ client.dto.ts
│  │  │  │  ├─ ports/
│  │  │  │  │  ├─ client-repository.port.ts
│  │  │  │  │  └─ omie-client-gateway.port.ts
│  │  │  │  └─ use-cases/
│  │  │  │     ├─ get-client-by-omie-client-code.usecase.ts
│  │  │  │     ├─ list-clients.usecase.ts
│  │  │  │     └─ sync-omie-clients.usecase.ts
│  │  │  ├─ infrastructure/
│  │  │  │  ├─ db/
│  │  │  │  │  ├─ __tests__/
│  │  │  │  │  │  └─ client.repo.smoke.ts
│  │  │  │  │  └─ client.repo.prisma.ts
│  │  │  │  ├─ integrations/
│  │  │  │  │  └─ omie/
│  │  │  │  │     └─ omie-client.gateway.ts
│  │  │  │  └─ jobs/
│  │  │  │     └─ sync-omie-clients.job.ts
│  │  │  ├─ presentation/
│  │  │  │  ├─ http/
│  │  │  │  │  ├─ controllers/
│  │  │  │  │  │  └─ index.ts
│  │  │  │  │  ├─ client-admin.controller.ts
│  │  │  │  │  ├─ client-admin.routes.ts
│  │  │  │  │  ├─ client-admin.schemas.ts
│  │  │  │  │  ├─ client-list.controller.ts
│  │  │  │  │  ├─ client-list.routes.ts
│  │  │  │  │  ├─ client.routes.ts
│  │  │  │  │  ├─ client.schemas.ts
│  │  │  │  │  ├─ routes.ts
│  │  │  │  │  └─ schemas.ts
│  │  │  │  └─ client.controller.ts
│  │  │  ├─ types/
│  │  │  │  └─ fastify.d.ts
│  │  │  ├─ index.ts
│  │  │  ├─ README.md
│  │  │  └─ register.ts
│  │  ├─ internal-production-orders/
│  │  │  ├─ application/
│  │  │  │  ├─ dtos/
│  │  │  │  │  └─ internal-production-order.dto.ts
│  │  │  │  ├─ entities/
│  │  │  │  │  └─ internal-production-order.entity.ts
│  │  │  │  ├─ ports/
│  │  │  │  │  ├─ internal-production-order.repository.port.ts
│  │  │  │  │  └─ products-catalog.port.ts
│  │  │  │  ├─ services/
│  │  │  │  │  ├─ internal-production-order-audit.service.test.ts
│  │  │  │  │  └─ internal-production-order-audit.service.ts
│  │  │  │  ├─ use-cases/
│  │  │  │  │  ├─ complete-internal-production-order.usecase.ts
│  │  │  │  │  ├─ create-internal-production-order.usecase.ts
│  │  │  │  │  ├─ delete-internal-production-order.usecase.ts
│  │  │  │  │  ├─ get-internal-production-order-by-id.usecase.ts
│  │  │  │  │  ├─ get-internal-production-orders.usecase.ts
│  │  │  │  │  ├─ start-internal-production-order.usecase.ts
│  │  │  │  │  └─ update-internal-production-order.usecase.ts
│  │  │  │  └─ utils/
│  │  │  │     ├─ diff.test.ts
│  │  │  │     └─ diff.ts
│  │  │  ├─ infrastructure/
│  │  │  │  ├─ db/
│  │  │  │  │  └─ internal-production-order.repository.prisma.ts
│  │  │  │  ├─ integrations/
│  │  │  │  │  └─ http-products-catalog.adapter.ts
│  │  │  │  └─ jobs/
│  │  │  ├─ presentation/
│  │  │  │  └─ http/
│  │  │  │     ├─ controllers/
│  │  │  │     │  └─ index.ts
│  │  │  │     ├─ internal-production-order.controller.ts
│  │  │  │     ├─ routes.ts
│  │  │  │     └─ schemas.ts
│  │  │  ├─ types/
│  │  │  │  └─ fastify.d.ts
│  │  │  ├─ index.ts
│  │  │  ├─ README.md
│  │  │  └─ register.ts
│  │  ├─ omie-production-orders/
│  │  │  ├─ application/
│  │  │  │  └─ use-cases/
│  │  │  │     ├─ get-active-production-orders-count.usecase.ts
│  │  │  │     ├─ get-completed-production-orders-count.usecase.ts
│  │  │  │     ├─ get-production-order-by-code.usecase.ts
│  │  │  │     ├─ get-production-orders-by-product-code.usecase.ts
│  │  │  │     ├─ get-production-orders-by-product-integration-code.usecase.ts
│  │  │  │     ├─ get-production-orders-stats.usecase.ts
│  │  │  │     ├─ list-production-orders-page.usecase.ts
│  │  │  │     ├─ list-production-orders.usecase.ts
│  │  │  │     └─ sync-production-orders.usecase.ts
│  │  │  ├─ infrastructure/
│  │  │  │  ├─ db/
│  │  │  │  │  └─ omie-production-orders.repo.prisma.ts
│  │  │  │  └─ jobs/
│  │  │  │     ├─ omie-production-orders-sync.job.integration.test.ts
│  │  │  │     └─ omie-production-orders-sync.job.ts
│  │  │  ├─ presentation/
│  │  │  │  └─ http/
│  │  │  │     ├─ omie-production-orders.controller.ts
│  │  │  │     └─ omie-production-orders.routes.ts
│  │  │  ├─ index.ts
│  │  │  └─ register.ts
│  │  ├─ omie-sales-orders/
│  │  │  ├─ application/
│  │  │  │  └─ use-cases/
│  │  │  │     ├─ fetch-omie-products-page.usecase.ts
│  │  │  │     ├─ get-stage20-totals.usecase.ts
│  │  │  │     ├─ list-omie-orders-page.usecase.ts
│  │  │  │     ├─ list-orders.usecase.ts
│  │  │  │     ├─ list-stage20-orders.usecase.ts
│  │  │  │     ├─ sync-omie-products.usecase.ts
│  │  │  │     └─ sync-stage20-orders.usecase.ts
│  │  │  ├─ infrastructure/
│  │  │  │  ├─ db/
│  │  │  │  │  ├─ omie-orders.repo.prisma.ts
│  │  │  │  │  ├─ omie-product.repo.prisma.ts
│  │  │  │  │  └─ sync-lock.repo.prisma.ts
│  │  │  │  └─ jobs/
│  │  │  │     ├─ omie-orders-stage20.job.integration.test.ts
│  │  │  │     └─ omie-orders-stage20.job.ts
│  │  │  ├─ presentation/
│  │  │  │  └─ http/
│  │  │  │     ├─ omie-sales-orders.controller.ts
│  │  │  │     └─ omie-sales-orders.routes.ts
│  │  │  ├─ index.ts
│  │  │  └─ register.ts
│  │  ├─ orders-enriched/
│  │  │  ├─ application/
│  │  │  │  ├─ ports/
│  │  │  │  │  ├─ client-lookup.port.ts
│  │  │  │  │  └─ stage20-orders-fetcher.port.ts
│  │  │  │  └─ use-cases/
│  │  │  │     └─ list-stage20-orders-enriched.usecase.ts
│  │  │  ├─ infrastructure/
│  │  │  │  ├─ db/
│  │  │  │  │  └─ client-lookup.prisma.ts
│  │  │  │  └─ integrations/
│  │  │  │     └─ internal/
│  │  │  │        └─ stage20-orders.fetcher.fastify.ts
│  │  │  ├─ presentation/
│  │  │  │  └─ http/
│  │  │  │     ├─ controllers/
│  │  │  │     │  └─ index.ts
│  │  │  │     ├─ orders-enriched.controller.ts
│  │  │  │     ├─ orders-enriched.routes.ts
│  │  │  │     ├─ orders-enriched.schemas.ts
│  │  │  │     ├─ routes.ts
│  │  │  │     └─ schemas.ts
│  │  │  ├─ index.ts
│  │  │  ├─ README.md
│  │  │  └─ register.ts
│  │  ├─ orders-view/
│  │  │  ├─ application/
│  │  │  │  └─ list-orders-view.usecase.ts
│  │  │  ├─ infrastructure/
│  │  │  │  └─ orders-view.repository.prisma.ts
│  │  │  ├─ presentation/
│  │  │  │  ├─ orders-view.controller.ts
│  │  │  │  └─ orders-view.routes.ts
│  │  │  └─ register.ts
│  │  ├─ plans/
│  │  │  ├─ application/
│  │  │  │  ├─ dtos/
│  │  │  │  │  └─ product.dto.ts
│  │  │  │  └─ use-cases/
│  │  │  │     ├─ add-plan-item.usecase.ts
│  │  │  │     ├─ create-plan.usecase.ts
│  │  │  │     ├─ export-plan-csv.usecase.ts
│  │  │  │     ├─ get-plan-by-id.usecase.ts
│  │  │  │     ├─ get-product.usecase.ts
│  │  │  │     ├─ list-plan-items-by-sector.usecase.ts
│  │  │  │     ├─ list-plans.usecase.ts
│  │  │  │     ├─ list-products.usecase.ts
│  │  │  │     ├─ refresh-stock.usecase.ts
│  │  │  │     ├─ set-default-sector.usecase.ts
│  │  │  │     └─ sync-omie-products.usecase.ts
│  │  │  ├─ infrastructure/
│  │  │  │  ├─ db/
│  │  │  │  │  ├─ plan.repo.prisma.ts
│  │  │  │  │  └─ product.repo.prisma.ts
│  │  │  │  ├─ integrations/
│  │  │  │  │  └─ omie/
│  │  │  │  │     ├─ omie-product.gateway.ts
│  │  │  │  │     ├─ omie-stock-cache.ts
│  │  │  │  │     ├─ omie.adapter.ts
│  │  │  │  │     └─ omie.client.ts
│  │  │  │  └─ jobs/
│  │  │  │     ├─ refresh-stock.job.ts
│  │  │  │     └─ sync-omie-products.job.ts
│  │  │  ├─ presentation/
│  │  │  │  └─ http/
│  │  │  │     ├─ plans.controller.ts
│  │  │  │     ├─ plans.routes.ts
│  │  │  │     └─ plans.schemas.ts
│  │  │  └─ index.ts
│  │  ├─ product-sector/
│  │  │  ├─ application/
│  │  │  │  ├─ use-cases/
│  │  │  │  │  ├─ get-product-default-sector.usecase.ts
│  │  │  │  │  └─ set-product-default-sector.usecase.ts
│  │  │  │  └─ set-product-default-sector.usecase.ts
│  │  │  ├─ infrastructure/
│  │  │  │  └─ db/
│  │  │  │     └─ product-sector.repo.prisma.ts
│  │  │  ├─ presentation/
│  │  │  │  └─ http/
│  │  │  │     ├─ product-sector.controller.ts
│  │  │  │     ├─ product-sector.routes.ts
│  │  │  │     └─ product-sector.schemas.ts
│  │  │  └─ index.ts
│  │  ├─ product-sectors/
│  │  │  ├─ application/
│  │  │  │  └─ use-cases/
│  │  │  │     ├─ delete-sector.usecase.ts
│  │  │  │     ├─ list-sectors.usecase.ts
│  │  │  │     ├─ seed-default-sectors.usecase.ts
│  │  │  │     └─ update-sector.usecase.ts
│  │  │  ├─ infrastructure/
│  │  │  │  └─ db/
│  │  │  │     └─ product-sectors.repo.prisma.ts
│  │  │  ├─ presentation/
│  │  │  │  └─ http/
│  │  │  │     ├─ controllers/
│  │  │  │     ├─ product-sectors.controller.ts
│  │  │  │     ├─ product-sectors.routes.ts
│  │  │  │     └─ product-sectors.schemas.ts
│  │  │  ├─ index.ts
│  │  │  └─ README.md
│  │  ├─ product-structure/
│  │  │  ├─ application/
│  │  │  │  ├─ dtos/
│  │  │  │  │  ├─ product-structure.output.ts
│  │  │  │  │  └─ sync-product-structure.input.ts
│  │  │  │  ├─ ports/
│  │  │  │  │  ├─ omie-product-structure.gateway.ts
│  │  │  │  │  └─ product-structure.repository.ts
│  │  │  │  ├─ use-cases/
│  │  │  │  │  ├─ get-product-structure-by-codproduto.usecase.ts
│  │  │  │  │  ├─ list-product-structures.usecase.ts
│  │  │  │  │  └─ sync-omie-product-structure.usecase.ts
│  │  │  │  └─ utils/
│  │  │  │     ├─ compute-structure-hash.ts
│  │  │  │     ├─ omie-mappers.ts
│  │  │  │     └─ resolve-product-identifier.ts
│  │  │  ├─ infrastructure/
│  │  │  │  ├─ db/
│  │  │  │  │  └─ prisma/
│  │  │  │  │     └─ product-structure.prisma-repository.ts
│  │  │  │  ├─ integrations/
│  │  │  │  │  └─ omie/
│  │  │  │  │     ├─ omie-client.ts
│  │  │  │  │     ├─ omie-product-structure.contracts.ts
│  │  │  │  │     └─ omie-product-structure.gateway.ts
│  │  │  │  └─ jobs/
│  │  │  │     └─ omie-product-structure-sync.job.ts
│  │  │  ├─ presentation/
│  │  │  │  └─ http/
│  │  │  │     ├─ controllers/
│  │  │  │     │  ├─ get-product-structure.controller.ts
│  │  │  │     │  ├─ index.ts
│  │  │  │     │  ├─ list-product-structures.controller.ts
│  │  │  │     │  ├─ sync-product-structure-job-tick.controller.ts
│  │  │  │     │  └─ sync-product-structure.controller.ts
│  │  │  │     ├─ routes.ts
│  │  │  │     └─ schemas.ts
│  │  │  ├─ index.ts
│  │  │  ├─ README.md
│  │  │  └─ register.ts
│  │  ├─ production-queue/
│  │  │  ├─ application/
│  │  │  │  ├─ dtos/
│  │  │  │  │  └─ production-queue.dto.ts
│  │  │  │  ├─ entities/
│  │  │  │  │  └─ production-queue.entity.ts
│  │  │  │  ├─ ports/
│  │  │  │  │  └─ production-queue.repository.port.ts
│  │  │  │  └─ use-cases/
│  │  │  │     ├─ __tests__/
│  │  │  │     │  ├─ add-to-queue.usecase.test.ts
│  │  │  │     │  ├─ list-queue.usecase.test.ts
│  │  │  │     │  └─ update-queue-status.usecase.test.ts
│  │  │  │     ├─ add-to-queue.usecase.ts
│  │  │  │     ├─ list-queue.usecase.ts
│  │  │  │     ├─ queue-statistics.usecase.ts
│  │  │  │     ├─ reorder-queue.usecase.ts
│  │  │  │     └─ update-queue-status.usecase.ts
│  │  │  ├─ infrastructure/
│  │  │  │  └─ db/
│  │  │  │     └─ production-queue.repository.prisma.ts
│  │  │  ├─ presentation/
│  │  │  │  └─ http/
│  │  │  │     ├─ __tests__/
│  │  │  │     │  └─ production-queue.integration.test.ts
│  │  │  │     ├─ production-queue.controller.ts
│  │  │  │     └─ production-queue.routes.ts
│  │  │  ├─ index.ts
│  │  │  └─ register.ts
│  │  ├─ products/
│  │  │  ├─ application/
│  │  │  │  ├─ dtos/
│  │  │  │  │  ├─ product.dto.ts
│  │  │  │  │  └─ public-product.dto.ts
│  │  │  │  ├─ use-cases/
│  │  │  │  │  ├─ admin-omie/
│  │  │  │  │  │  ├─ get-omie-product-by-code.usecase.ts
│  │  │  │  │  │  ├─ get-omie-product-by-id.usecase.ts
│  │  │  │  │  │  ├─ get-omie-product-stock.usecase.ts
│  │  │  │  │  │  ├─ get-omie-stock-info.usecase.ts
│  │  │  │  │  │  ├─ list-omie-categories.usecase.ts
│  │  │  │  │  │  └─ search-omie-products.usecase.ts
│  │  │  │  │  ├─ create-managed-product.usecase.ts
│  │  │  │  │  ├─ create-managed-products-bulk.usecase.ts
│  │  │  │  │  ├─ delete-managed-product.usecase.ts
│  │  │  │  │  ├─ fetch-omie-products-page.usecase.ts
│  │  │  │  │  ├─ get-managed-product-stock-history.usecase.ts
│  │  │  │  │  ├─ get-managed-product-stock.usecase.ts
│  │  │  │  │  ├─ get-managed-product.usecase.ts
│  │  │  │  │  ├─ get-products.usecase.ts
│  │  │  │  │  ├─ get-public-product-by-omie-code.usecase.ts
│  │  │  │  │  ├─ get-stock-by-raw-payload.usecase.ts
│  │  │  │  │  ├─ list-managed-products.usecase.ts
│  │  │  │  │  ├─ list-omie-products-with-stock.usecase.ts
│  │  │  │  │  ├─ list-products.usecase.ts
│  │  │  │  │  ├─ list-public-products.usecase.ts
│  │  │  │  │  ├─ patch-managed-product.usecase.ts
│  │  │  │  │  ├─ refresh-stock.usecase.ts
│  │  │  │  │  ├─ resolve-omie-code-from-product.usecase.ts
│  │  │  │  │  ├─ set-default-sector.usecase.ts
│  │  │  │  │  └─ sync-omie-products.usecase.ts
│  │  │  │  └─ utils/
│  │  │  │     └─ to-number.ts
│  │  │  ├─ infrastructure/
│  │  │  │  ├─ db/
│  │  │  │  │  ├─ omie-product-read.repo.prisma.ts
│  │  │  │  │  ├─ omie-product.repo.prisma.ts
│  │  │  │  │  ├─ product-stock.repo.prisma.ts
│  │  │  │  │  ├─ product.repo.prisma.ts
│  │  │  │  │  ├─ public-products.repo.prisma.ts
│  │  │  │  │  ├─ sync-lock-lease.repo.prisma.ts
│  │  │  │  │  └─ sync-lock.repo.prisma.ts
│  │  │  │  ├─ integrations/
│  │  │  │  │  └─ omie/
│  │  │  │  │     ├─ index.ts
│  │  │  │  │     ├─ omie-product.gateway.ts
│  │  │  │  │     ├─ omie-stock-cache.ts
│  │  │  │  │     ├─ omie.adapter.ts
│  │  │  │  │     └─ omie.client.ts
│  │  │  │  └─ jobs/
│  │  │  │     ├─ omie-product-sync.job.ts
│  │  │  │     └─ stock-refresh.job.ts
│  │  │  ├─ presentation/
│  │  │  │  └─ http/
│  │  │  │     ├─ products.controller.ts
│  │  │  │     ├─ products.routes.ts
│  │  │  │     └─ products.schemas.ts
│  │  │  ├─ utils/
│  │  │  │  └─ to-number.ts
│  │  │  └─ index.ts
│  │  ├─ sales-production-integration/
│  │  │  ├─ application/
│  │  │  │  ├─ dtos/
│  │  │  │  │  └─ sales-production-integration.dto.ts
│  │  │  │  └─ use-cases/
│  │  │  │     ├─ integration-statistics.usecase.ts
│  │  │  │     └─ sales-to-production.usecase.ts
│  │  │  ├─ presentation/
│  │  │  │  └─ http/
│  │  │  │     ├─ sales-production-integration.controller.ts
│  │  │  │     └─ sales-production-integration.routes.ts
│  │  │  ├─ index.ts
│  │  │  ├─ README.md
│  │  │  └─ register.ts
│  │  ├─ sectors/
│  │  │  ├─ application/
│  │  │  │  ├─ dtos/
│  │  │  │  │  └─ product.dto.ts
│  │  │  │  └─ use-cases/
│  │  │  │     ├─ create-sector.usecase.ts
│  │  │  │     ├─ delete-sector.usecase.ts
│  │  │  │     ├─ get-product.usecase.ts
│  │  │  │     ├─ list-products.usecase.ts
│  │  │  │     ├─ list-sectors.usecase.ts
│  │  │  │     ├─ refresh-stock.usecase.ts
│  │  │  │     ├─ set-default-sector.usecase.ts
│  │  │  │     ├─ sync-omie-products.usecase.ts
│  │  │  │     └─ update-sector.usecase.ts
│  │  │  ├─ infrastructure/
│  │  │  │  ├─ db/
│  │  │  │  │  ├─ product.repo.prisma.ts
│  │  │  │  │  └─ sector.repo.prisma.ts
│  │  │  │  ├─ integrations/
│  │  │  │  │  └─ omie/
│  │  │  │  │     ├─ omie-product.gateway.ts
│  │  │  │  │     ├─ omie-stock-cache.ts
│  │  │  │  │     ├─ omie.adapter.ts
│  │  │  │  │     └─ omie.client.ts
│  │  │  │  └─ jobs/
│  │  │  │     ├─ refresh-stock.job.ts
│  │  │  │     └─ sync-omie-products.job.ts
│  │  │  ├─ presentation/
│  │  │  │  └─ http/
│  │  │  │     ├─ sectors.controller.ts
│  │  │  │     ├─ sectors.routes.ts
│  │  │  │     └─ sectors.schemas.ts
│  │  │  └─ index.ts
│  │  ├─ selected-products/
│  │  │  ├─ presentation/
│  │  │  │  └─ http/
│  │  │  │     ├─ controllers/
│  │  │  │     │  └─ index.ts
│  │  │  │     ├─ routes.ts
│  │  │  │     └─ schemas.ts
│  │  │  ├─ index.ts
│  │  │  └─ README.md
│  │  ├─ stock-monitor/
│  │  │  ├─ infrastructure/
│  │  │  │  └─ jobs/
│  │  │  │     ├─ stock-monitor.job.integration.test.ts
│  │  │  │     └─ stock-monitor.job.ts
│  │  │  ├─ index.ts
│  │  │  ├─ README.md
│  │  │  └─ register.ts
│  │  ├─ sync/
│  │  │  ├─ application/
│  │  │  │  ├─ dtos/
│  │  │  │  │  ├─ sync-orders.dto.ts
│  │  │  │  │  ├─ sync-status.dto.ts
│  │  │  │  │  └─ sync-stock.dto.ts
│  │  │  │  ├─ ports/
│  │  │  │  │  ├─ omie.gateway.port.ts
│  │  │  │  │  └─ sync.repository.port.ts
│  │  │  │  └─ use-cases/
│  │  │  │     ├─ get-sync-status.usecase.ts
│  │  │  │     ├─ sync-orders.usecase.ts
│  │  │  │     └─ sync-stock.usecase.ts
│  │  │  ├─ infrastructure/
│  │  │  │  ├─ db/
│  │  │  │  │  └─ sync.repository.prisma.ts
│  │  │  │  ├─ integrations/
│  │  │  │  │  └─ omie.gateway.ts
│  │  │  │  └─ jobs/
│  │  │  ├─ presentation/
│  │  │  │  └─ http/
│  │  │  │     ├─ sync-orders.controller.ts
│  │  │  │     ├─ sync-status.controller.ts
│  │  │  │     ├─ sync-stock.controller.ts
│  │  │  │     └─ sync.routes.ts
│  │  │  ├─ index.ts
│  │  │  ├─ README.md
│  │  │  └─ register.ts
│  │  └─ trello-integration/
│  │     ├─ application/
│  │     │  ├─ dtos/
│  │     │  │  └─ trello-webhook-event.dto.ts
│  │     │  ├─ ports/
│  │     │  ├─ use-cases/
│  │     │  │  ├─ process-trello-webhook.use-case.test.ts
│  │     │  │  └─ process-trello-webhook.use-case.ts
│  │     │  └─ utils/
│  │     │     ├─ parse-card-name.test.ts
│  │     │     ├─ parse-card-name.ts
│  │     │     └─ trello-event-guards.ts
│  │     ├─ infrastructure/
│  │     │  ├─ db/
│  │     │  ├─ integrations/
│  │     │  └─ jobs/
│  │     ├─ presentation/
│  │     │  └─ http/
│  │     │     ├─ controllers/
│  │     │     │  └─ trello-webhook.controller.ts
│  │     │     └─ routes.ts
│  │     ├─ index.ts
│  │     ├─ README.md
│  │     └─ register.ts
│  ├─ plugins/
│  ├─ repositories/
│  ├─ routes/
│  ├─ services/
│  ├─ shared/
│  │  ├─ errors/
│  │  │  ├─ AppError.ts
│  │  │  ├─ domain-errors.ts
│  │  │  ├─ http-errors.ts
│  │  │  └─ index.ts
│  │  ├─ http/
│  │  │  ├─ response.ts
│  │  │  └─ validate.ts
│  │  ├─ integrations/
│  │  │  └─ omie/
│  │  │     ├─ index.ts
│  │  │     ├─ omie-orders.adapter.ts
│  │  │     ├─ omie-stock-cache.ts
│  │  │     ├─ omie.adapter.ts
│  │  │     ├─ omie.client.ts
│  │  │     ├─ omie.constants.ts
│  │  │     ├─ omie.utils.ts
│  │  │     └─ OmieProductionOrdersAdapter.ts
│  │  ├─ logger/
│  │  │  ├─ index.ts
│  │  │  └─ logger.ts
│  │  ├─ services/
│  │  │  ├─ index.ts
│  │  │  ├─ IntelligentPollingService.test.ts
│  │  │  ├─ IntelligentPollingService.ts
│  │  │  ├─ polling.config.test.ts
│  │  │  ├─ polling.config.ts
│  │  │  ├─ retry.config.test.ts
│  │  │  ├─ retry.config.ts
│  │  │  ├─ RetrySystem.test.ts
│  │  │  └─ RetrySystem.ts
│  │  └─ utils/
│  │     ├─ backoff.ts
│  │     └─ job-lock.ts
│  ├─ utils/
│  └─ server.ts
└─ tests/
   ├─ integration/
   │  └─ modules/
   │     └─ sync/
   └─ unit/
      └─ modules/
         └─ sync/
```


### 2.3 Tecnologias

| Tecnologia | Versão | Finalidade |
|---|---|---|
| Node.js | v20.20.2 | Runtime |
| TypeScript | 5.x | Tipagem estática |
| Fastify | 5.x | Framework HTTP |
| Prisma | 6.x | ORM / Database |
| PostgreSQL | - | Banco de dados relacional |
| Redis | - | Cache / Pub-Sub |
| Zod | - | Validação de schemas |
| Vitest | - | Testes unitários/integração |
| Omie API | REST | ERP externo (integração) |

- **Dependências de produção:** 7
- **Dependências de desenvolvimento:** 9

---

## 3. MÓDULOS DE NEGÓCIO

Total: **19 módulos**

| # | Módulo | Responsabilidade |
|---|---|---|
| 1 | `alerts` | Módulo de negócio |
| 2 | `client` | Sincronização de clientes Omie |
| 3 | `internal-production-orders` | Ordens de produção internas |
| 4 | `omie-production-orders` | Ordens de produção via Omie |
| 5 | `omie-sales-orders` | Pedidos de venda via Omie |
| 6 | `orders-enriched` | Pedidos enriquecidos (dados complementares) |
| 7 | `orders-view` | View consolidada de pedidos |
| 8 | `plans` | Planos de produção |
| 9 | `product-sector` | Módulo de negócio |
| 10 | `product-sectors` | Mapeamento produto-setor |
| 11 | `product-structure` | Estrutura/malha de produtos |
| 12 | `production-queue` | Módulo de negócio |
| 13 | `products` | Gestão de produtos |
| 14 | `sales-production-integration` | Módulo de negócio |
| 15 | `sectors` | Setores de produção |
| 16 | `selected-products` | Módulo de negócio |
| 17 | `stock-monitor` | Monitoramento de estoque |
| 18 | `sync` | Módulo de negócio |
| 19 | `trello-integration` | Integração com Trello |

---

## 4. JOBS E POLLING

Total: **14 jobs**

### 4.1 Configurações de Polling

| Job | Intervalo Base | Criticalidade | Descrição |
|---|---|---|---|
| `omie-production-orders-sync` | 30s | high | Ordens de produção Omie |
| `omie-orders-stage20-sync` | 1min | high | Pedidos etapa 20 Omie |
| `stock-monitor` | 2min | medium | Monitoramento de estoque |
| `omie-product-sync` | 5min | medium | Sincronização de produtos |
| `stock-refresh` | 10min | low | Atualização de estoque |

### 4.2 Jobs Disponíveis

- `omie-production-orders-sync` — Sincroniza OPs do Omie
- `omie-orders-stage20-sync` — Sincroniza pedidos etapa 20
- `omie-product-sync` — Sincroniza produtos do Omie
- `omie-product-structure-sync` — Sincroniza estrutura de produtos
- `omie-client-sync` — Sincroniza clientes do Omie
- `stock-monitor` — Monitora estoque crítico
- `stock-refresh` — Atualiza saldo de estoque
- `sync-omie-clients` — Sincronização de clientes

### 4.3 Sistema de Retry

- **Circuit Breaker:** Ativo para jobs críticos (threshold: 3 falhas)
- **Backoff Exponencial:** Fator 2x por tentativa
- **Jitter:** Variação aleatória para evitar thundering herd
- **Configurável via env:** Prefixo `RETRY_<JOBNAME>_*`

---

## 5. API ENDPOINTS

Total: **34 endpoints**

| Método | Caminho | Descrição |
|---|---|---|
| GET | `/` | Raiz da API (info) |
| GET | `/health` | Health check |
| GET | `/v1` | Índice de rotas v1 |
| GET | `/v1/products` | Catálogo público + estoque |
| GET | `/v1/products/:omieCode` | Detalhe produto por OmieCode |
| GET | `/v1/orders` | Lista pedidos etapa 20 |
| GET | `/v1/clients` | Lista clientes |
| GET | `/v1/clients/:omieClientCode` | Detalhe cliente |
| POST | `/v1/admin/omie/clients/sync` | Força sincronização clientes |
| GET | `/v1/admin/managed-products` | Lista produtos gerenciados |
| POST | `/v1/admin/managed-products` | Seleciona produto gerenciado |
| POST | `/v1/admin/managed-products/bulk` | Seleciona produtos em lote |
| GET | `/v1/admin/orders` | Lista pedidos admin |
| GET | `/v1/admin/sectors` | Lista setores |
| GET | `/v1/admin/plans` | Lista planos |
| GET | `/v1/internal-production-orders` | Lista OPs internas |
| POST | `/v1/internal-production-orders` | Cria OP interna |
| PATCH | `/v1/internal-production-orders/:id/start` | Inicia OP interna |
| PATCH | `/v1/internal-production-orders/:id/complete` | Completa OP interna |
| DELETE | `/v1/internal-production-orders/:id` | Exclui OP interna |
| GET | `/api/alerts/stock` | Alertas de estoque |
| GET | `/api/alerts/stock/critical` | Alertas críticos de estoque |
| POST | `/api/alerts/stock/configure` | Configura regras de alerta |
| POST | `/api/production/queue/add` | Adiciona à fila de produção |
| GET | `/api/production/queue` | Lista fila de produção |
| POST | `/api/production/queue/reorder` | Reordena fila de produção |
| POST | `/api/integration/sales-to-production` | Integra venda→produção |
| POST | `/api/sync/stock` | Sincroniza estoque (Omie) |
| POST | `/api/sync/orders` | Sincroniza pedidos (Omie) |
| POST | `/api/sync/production` | Sincroniza produção (Omie) |
| POST | `/api/forecast/demand` | Previsão de demanda |
| GET | `/api/metrics/production/efficiency` | KPIs de produção |
| GET | `/v1/trello/webhook` | Webhook Trello (GET) |
| POST | `/v1/trello/webhook` | Webhook Trello (POST) |

---

## 6. BANCO DE DADOS

### 6.1 Tecnologia
- **ORM:** Prisma 6.x
- **Banco:** PostgreSQL
- **Migration:** Prisma Migrations

### 6.2 Models (Prisma Schema)
- Produtos, Setores, Planos de Produção
- Ordens de Produção (Omie + Internas)
- Pedidos de Venda (Etapa 20)
- Clientes
- Estrutura de Produtos (malha)
- Alertas de Estoque
- Fila de Produção
- Mapeamento Produto-Setor

---

## 7. ESTATÍSTICAS DO PROJETO

| Métrica | Valor |
|---|---|
| Módulos de negócio | 19 |
| Jobs agendados | 14 |
| Use Cases | 96 |
| Controllers | 24 |
| Arquivos de rotas | 16 |
| Repositories | 19 |
| Testes unitários | 15 |
| Dependências produção | 7 |
| Dependências dev | 9 |

---

## 8. INICIALIZAÇÃO

```bash
# Desenvolvimento
pnpm dev

# Build
pnpm build

# Testes
pnpm test
pnpm test:watch

# Lint
pnpm lint

# Gerar resumo do projeto
pnpm gen:resumo
```

---

## 9. AMBIENTES

| Variável | Descrição |
|---|---|
| `NODE_ENV` | development / production / test |
| `PORT` | Porta do servidor HTTP |
| `HOST` | Host do servidor |
| `DATABASE_URL` | URL de conexão PostgreSQL |
| `REDIS_URL` | URL de conexão Redis |
| `OMIE_BASE_URL` | URL base API Omie |
| `OMIE_APP_KEY` | App Key Omie |
| `OMIE_APP_SECRET` | App Secret Omie |
| `CORS_ORIGIN` | Origens permitidas CORS |
