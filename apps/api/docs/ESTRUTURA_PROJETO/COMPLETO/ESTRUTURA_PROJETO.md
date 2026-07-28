```text
apps/api/
├─ dist/ # Build compilado (gerado)
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
│  ├─ legacy/ # Projeto legado (não expandido)
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

<!-- AUTO-DIR-SUMMARY-START -->

## Resumo por diretório (gerado automaticamente)
_Atualizado em: `2026-05-15T00:12:48.854Z`_

> A árvore acima lista **apenas diretórios**. Aqui está um resumo dos arquivos de cada diretório e do que eles contêm (heurísticas).

- `./`
  - `.env` — arquivo
  - `add_production_orders.sql` — arquivo
  - `ESTRUTURA_PROJETO.md` — documentação
  - `export type Stage20OrdersQuery = {` — arquivo
  - `fix_migration.sql` — arquivo
  - `fix-all-logger-errors.ps1` — arquivo
  - `fix-logger-errors.ps1` — arquivo
  - `IMPROVEMENT_PLAN.md` — títulos: Plano de Melhoria — Production Manager API (apps/api) | Estado Atual (resumo) | Modelos (Prisma) | Rotas principais | Padrões de resposta | Estoque hoje
  - `metrics-report.json` — json
  - `package.json` — keys: name, version, private, engines, scripts, dependencies, devDependencies
  - `README.md` — títulos: Production Manager API | 📌 Contrato público | Tecnologias | Como Rodar | Pré-requisitos | Variáveis de Ambiente
  - `render-build.sh` — arquivo
  - `tsconfig.build.json` — keys: extends, exclude
  - `tsconfig.json` — keys: compilerOptions, include, exclude
  - `tsup.config.ts` — exports: default
  - `typedoc.json` — keys: entryPoints, entryPointStrategy, out, plugin, readme, excludePrivate, excludeProtected, excludeExternals, categorizeByGroup, defaultCategory
  - `UPDATE_SUMMARY_2026-04-14.md` — títulos: Resumo de Atualizações — 2026-04-14 | Contexto | Principais mudanças entregues | Endpoints informativos | Envelope de resposta padronizado (compatível com legado) | Erros padronizados globalmente
- `docs/`
  - `API_CONTRACT.md` — títulos: 📦 API Contract — Production Manager | 🎯 Objetivo | ✅ Endpoint público | `GET /v1/products` | 🧾 Campos retornados | 📐 Regras do contrato
  - `ARCHITECTURE.md` — documentação
  - `LEGADO_VS_ATUAL.md` — títulos: Legado (`src/legacy`) vs API atual (`apps/api`) — resumo comparativo | Objetivo | O que é o `src/legacy` | Foto de alto nível (lado a lado) | Estrutura: onde fica o quê | Legado (preservado)
  - `REPO_STATUS.md` — títulos: Production Manager API — Status do Repositório | 📌 Visão rápida | 📁 Estrutura (apps/api/src) | 📏 Linhas de código (LOC) | Top arquivos (por linhas) | 💾 Tamanho por pasta/arquivo
  - `TDD_WORKFLOW.md` — documentação
- `docs/prompts/`
  - `00-visao-geral.md` — documentação
  - `01-refatoracao-geral.md` — documentação
  - `02-arquitetura-e-modulos.md` — documentação
  - `03-modulo-template.md` — documentação
  - `04-testes-tdd.md` — documentação
  - `05-integracao-omie.md` — documentação
  - `06-comandos-terminal.md` — títulos: Comandos de terminal (API) — testar rotas e tarefas comuns | 1) Preparação (Windows / PowerShell) | 2) Rodar a API localmente | 3) Testar rotas “meta” (definidas em src/bootstrap/routes.ts) | 4) Rotas públicas (expostas no índice /v1) | 5) Rotas admin — pedidos (omie-orders)
  - `07-comandos-scripts-api.md` — títulos: Comandos de terminal — scripts em apps/api/scripts (e atalhos no package.json) | Rodar a partir da raiz do monorepo | Rodar scripts do workspace @production-manager/api a partir da raiz | Alternativa equivalente | Scripts principais (já existentes em apps/api/package.json) | dev server
- `docs/templates/`
  - `README.template.md` — títulos: Production Manager API | 📌 Contrato público | Tecnologias | Como Rodar | Pré-requisitos | Variáveis de Ambiente
- `docs/templates/module/`
  - `index.ts` — código TS/JS
- `docs/templates/module/application/use-cases/`
  - `example.usecase.ts` — código TS/JS
- `docs/templates/module/infrastructure/`
  - `db` — arquivo
- `docs/templates/module/presentation/http/`
  - `nome-do-modulo.controller.ts` — código TS/JS
  - `nome-do-modulo.routes.ts` — código TS/JS
- `docs/Terminal/`
  - `comandos-importantes.md` — títulos: Comandos Importantes do Projeto | Sumário | 1) Preparação do Ambiente | PowerShell (Windows Terminal) | Git Bash | Git Terminal (IDE)
- `docs/typedoc/`
  - `README.md` — títulos: @production-manager/api | Modules
- `docs/typedoc/app/`
  - `README.md` — títulos: app | Functions
- `docs/typedoc/app/functions/`
  - `buildApp.md` — títulos: Function: buildApp() | Returns
- `docs/typedoc/contracts/publicProducts.contract/`
  - `README.md` — títulos: contracts/publicProducts.contract
- `docs/typedoc/core/errors/AppError/`
  - `README.md` — títulos: core/errors/AppError | Classes
- `docs/typedoc/core/errors/AppError/classes/`
  - `AppError.md` — títulos: Class: AppError | Extends | Constructors | Constructor | Parameters | code
- `docs/typedoc/core/SyncOmieProductsService/`
  - `README.md` — títulos: core/SyncOmieProductsService | Classes
- `docs/typedoc/core/SyncOmieProductsService/classes/`
  - `SyncOmieProductsService.md` — títulos: Class: SyncOmieProductsService | Constructors | Constructor | Returns | Methods | execute()
- `docs/typedoc/db/`
  - `README.md` — títulos: db | Variables
- `docs/typedoc/db/variables/`
  - `prisma.md` — títulos: Variable: prisma
- `docs/typedoc/env/`
  - `README.md` — títulos: env | Variables
- `docs/typedoc/env/variables/`
  - `env.md` — títulos: Variable: env | Type Declaration | PORT | DATABASE\_URL | OMIE\_APP\_KEY | OMIE\_APP\_SECRET
- `docs/typedoc/integrations/omie/OmieAdapter/`
  - `README.md` — títulos: integrations/omie/OmieAdapter | Classes | Type Aliases
- `docs/typedoc/integrations/omie/OmieAdapter/classes/`
  - `OmieAdapter.md` — títulos: Class: OmieAdapter | Constructors | Constructor | Returns | Methods | extractProductCode()
- `docs/typedoc/integrations/omie/OmieAdapter/type-aliases/`
  - `OmieProductDTO.md` — títulos: Type Alias: OmieProductDTO | Properties | omieId | sku? | description | active
- `docs/typedoc/integrations/omie/OmieClient/`
  - `README.md` — títulos: integrations/omie/OmieClient | Classes | Variables
- `docs/typedoc/integrations/omie/OmieClient/classes/`
  - `OmieClient.md` — títulos: Class: OmieClient | Constructors | Constructor | Returns | Methods | post()
- `docs/typedoc/integrations/omie/OmieClient/variables/`
  - `omieClient.md` — títulos: Variable: omieClient
- `docs/typedoc/integrations/omie/OmieStockCache/`
  - `README.md` — títulos: integrations/omie/OmieStockCache | Classes | Variables
- `docs/typedoc/integrations/omie/OmieStockCache/classes/`
  - `OmieStockCache.md` — títulos: Class: OmieStockCache | Constructors | Constructor | Returns | Methods | getSnapshot()
- `docs/typedoc/integrations/omie/OmieStockCache/variables/`
  - `omieStockCache.md` — títulos: Variable: omieStockCache
- `docs/typedoc/jobs/omieProductSync.job/`
  - `README.md` — títulos: jobs/omieProductSync.job | Functions
- `docs/typedoc/jobs/omieProductSync.job/functions/`
  - `startOmieProductSyncJob.md` — títulos: Function: startOmieProductSyncJob() | Parameters | appOrLogger | Returns
- `docs/typedoc/jobs/stockRefresh.job/`
  - `README.md` — títulos: jobs/stockRefresh.job | Functions
- `docs/typedoc/jobs/stockRefresh.job/functions/`
  - `startStockRefreshJob.md` — títulos: Function: startStockRefreshJob() | Parameters | appOrLogger | Returns
- `docs/typedoc/lib/errors/`
  - `README.md` — títulos: lib/errors
- `docs/typedoc/lib/http/`
  - `README.md` — títulos: lib/http | Type Aliases | Functions
- `docs/typedoc/lib/http/functions/`
  - `markDeprecated.md` — títulos: Function: markDeprecated() | Parameters | request | reply | legacyPath | replacementPath
  - `ok.md` — títulos: Function: ok() | Type Parameters | T | Parameters | data | meta?
  - `paginated.md` — títulos: Function: paginated() | Type Parameters | T | Parameters | data | meta
  - `sendOk.md` — títulos: Function: sendOk() | Type Parameters | T | Parameters | request | reply
  - `sendPaginated.md` — títulos: Function: sendPaginated() | Type Parameters | T | Parameters | request | reply
  - `wantsLegacyResponse.md` — títulos: Function: wantsLegacyResponse() | Parameters | request | Returns
  - `wantsPrettyResponse.md` — títulos: Function: wantsPrettyResponse() | Parameters | request | Returns
- `docs/typedoc/lib/http/type-aliases/`
  - `HttpLinks.md` — títulos: Type Alias: HttpLinks
  - `PaginationMeta.md` — títulos: Type Alias: PaginationMeta | Type Declaration | page | pageSize | total
- `docs/typedoc/lib/logger/`
  - `README.md` — títulos: lib/logger
- `docs/typedoc/repositories/PlanRepository/`
  - `README.md` — títulos: repositories/PlanRepository | Classes
- `docs/typedoc/repositories/PlanRepository/classes/`
  - `PlanRepository.md` — títulos: Class: PlanRepository | Constructors | Constructor | Returns | Methods | findById()
- `docs/typedoc/repositories/ProductRepository/`
  - `README.md` — títulos: repositories/ProductRepository | Classes
- `docs/typedoc/repositories/ProductRepository/classes/`
  - `ProductRepository.md` — títulos: Class: ProductRepository | Constructors | Constructor | Returns | Methods | findById()
- `docs/typedoc/repositories/SectorRepository/`
  - `README.md` — títulos: repositories/SectorRepository | Classes
- `docs/typedoc/repositories/SectorRepository/classes/`
  - `SectorRepository.md` — títulos: Class: SectorRepository | Constructors | Constructor | Returns | Methods | findById()
- `docs/typedoc/routes/`
  - `README.md` — títulos: routes | Functions
- `docs/typedoc/routes/functions/`
  - `appRoutes.md` — títulos: Function: appRoutes() | Parameters | app | Returns
- `docs/typedoc/routes/omie/`
  - `README.md` — títulos: routes/omie | Functions
- `docs/typedoc/routes/omie/functions/`
  - `omieRoutes.md` — títulos: Function: omieRoutes() | Parameters | app | Returns
- `docs/typedoc/routes/plans/`
  - `README.md` — títulos: routes/plans | Functions
- `docs/typedoc/routes/plans/functions/`
  - `plansRoutes.md` — títulos: Function: plansRoutes() | Parameters | app | Returns
- `docs/typedoc/routes/product-sector/`
  - `README.md` — títulos: routes/product-sector | Functions
- `docs/typedoc/routes/product-sector/functions/`
  - `productSectorRoutes.md` — títulos: Function: productSectorRoutes() | Parameters | app | Returns
- `docs/typedoc/routes/products/`
  - `README.md` — títulos: routes/products | Functions
- `docs/typedoc/routes/products/functions/`
  - `productsRoutes.md` — títulos: Function: productsRoutes() | Parameters | app | Returns
- `docs/typedoc/routes/sectors/`
  - `README.md` — títulos: routes/sectors | Functions
- `docs/typedoc/routes/sectors/functions/`
  - `sectorRoutes.md` — títulos: Function: sectorRoutes() | Parameters | app | Returns
- `docs/typedoc/server/`
  - `README.md` — títulos: server
- `docs/typedoc/services/CreatePlanItemService/`
  - `README.md` — títulos: services/CreatePlanItemService | Classes
- `docs/typedoc/services/CreatePlanItemService/classes/`
  - `CreatePlanItemService.md` — títulos: Class: CreatePlanItemService | Constructors | Constructor | Parameters | planRepo? | productRepo?
- `docs/typedoc/services/CreatePlanService/`
  - `README.md` — títulos: services/CreatePlanService | Classes
- `docs/typedoc/services/CreatePlanService/classes/`
  - `CreatePlanService.md` — títulos: Class: CreatePlanService | Constructors | Constructor | Parameters | planRepo? | Returns
- `docs/typedoc/services/CreateSectorService/`
  - `README.md` — títulos: services/CreateSectorService | Classes
- `docs/typedoc/services/CreateSectorService/classes/`
  - `CreateSectorService.md` — títulos: Class: CreateSectorService | Constructors | Constructor | Parameters | sectorRepo? | Returns
- `docs/typedoc/services/jobLock.service/`
  - `README.md` — títulos: services/jobLock.service | Functions
- `docs/typedoc/services/jobLock.service/functions/`
  - `acquireJobLock.md` — títulos: Function: acquireJobLock() | Parameters | key | ttlMs | Returns
  - `releaseJobLock.md` — títulos: Function: releaseJobLock() | Parameters | key | Returns
- `docs/typedoc/services/omieProductRead.service/`
  - `README.md` — títulos: services/omieProductRead.service | Functions
- `docs/typedoc/services/omieProductRead.service/functions/`
  - `listOmieProductsWithCurrentStock.md` — títulos: Function: listOmieProductsWithCurrentStock() | Returns
- `docs/typedoc/services/omieProductSync.service/`
  - `README.md` — títulos: services/omieProductSync.service | Functions
- `docs/typedoc/services/omieProductSync.service/functions/`
  - `runOmieProductSync.md` — títulos: Function: runOmieProductSync() | Returns
- `docs/typedoc/services/omieStock.service/`
  - `README.md` — títulos: services/omieStock.service | Functions
- `docs/typedoc/services/omieStock.service/functions/`
  - `getStockByRawPayload.md` — títulos: Function: getStockByRawPayload() | Parameters | rawPayload | Returns
- `docs/typedoc/services/publicProductsRead.service/`
  - `README.md` — títulos: services/publicProductsRead.service | Type Aliases | Functions
- `docs/typedoc/services/publicProductsRead.service/functions/`
  - `getPublicProductByCode.md` — títulos: Function: getPublicProductByCode() | Parameters | omieCode | Returns
  - `listPublicProducts.md` — títulos: Function: listPublicProducts() | Parameters | params | Returns
- `docs/typedoc/services/publicProductsRead.service/type-aliases/`
  - `ListPublicProductsParams.md` — títulos: Type Alias: ListPublicProductsParams | Properties | q? | page? | pageSize? | activeOnly?
  - `PublicProduct.md` — títulos: Type Alias: PublicProduct | Properties | omieCode | description | sku? | family?
- `docs/typedoc/services/SetProductDefaultSectorService/`
  - `README.md` — títulos: services/SetProductDefaultSectorService | Classes
- `docs/typedoc/services/SetProductDefaultSectorService/classes/`
  - `SetProductDefaultSectorService.md` — títulos: Class: SetProductDefaultSectorService | Constructors | Constructor | Parameters | productRepo? | sectorRepo?
- `docs/typedoc/services/stockRefresh.service/`
  - `README.md` — títulos: services/stockRefresh.service | Functions
- `docs/typedoc/services/stockRefresh.service/functions/`
  - `runStockRefresh.md` — títulos: Function: runStockRefresh() | Parameters | options? | Returns
- `docs/typedoc/utils/backoff/`
  - `README.md` — títulos: utils/backoff | Functions
- `docs/typedoc/utils/backoff/functions/`
  - `calculateBackoffWithJitter.md` — títulos: Function: calculateBackoffWithJitter() | Parameters | attempt | baseDelay? | maxJitter? | Returns
  - `sleep.md` — títulos: Function: sleep() | Parameters | ms | Returns
- `docs/typedoc/utils/domainErrors/`
  - `README.md` — títulos: utils/domainErrors | Classes
- `docs/typedoc/utils/domainErrors/classes/`
  - `AppError.md` — títulos: Class: AppError | Extends | Extended by | Constructors | Constructor | Parameters
  - `ConflictError.md` — títulos: Class: ConflictError | Extends | Constructors | Constructor | Parameters | message
  - `MissingDefaultSectorError.md` — títulos: Class: MissingDefaultSectorError | Extends | Constructors | Constructor | Returns | Overrides
  - `NotFoundError.md` — títulos: Class: NotFoundError | Extends | Constructors | Constructor | Parameters | resource
  - `ValidationError.md` — títulos: Class: ValidationError | Extends | Constructors | Constructor | Parameters | message
- `docs/typedoc/utils/errors/`
  - `README.md` — títulos: utils/errors | Interfaces | Type Aliases | Variables | Functions
- `docs/typedoc/utils/errors/functions/`
  - `sendError.md` — títulos: Function: sendError() | Parameters | reply | status | code | message
- `docs/typedoc/utils/errors/interfaces/`
  - `ApiErrorPayload.md` — títulos: Interface: ApiErrorPayload | Properties | code | message | details?
- `docs/typedoc/utils/errors/type-aliases/`
  - `ErrorCode.md` — títulos: Type Alias: ErrorCode
- `docs/typedoc/utils/errors/variables/`
  - `ErrorCodes.md` — títulos: Variable: ErrorCodes | Type Declaration | MISSING\_DEFAULT\_SECTOR | NOT\_FOUND | VALIDATION\_ERROR | OMIE\_ERROR
- `prisma/`
  - `schema.prisma` — models: SyncLock, JobLock, OmieProduct, Product, Sector, ProductSector, ProductionPlan, ProductionPlanItem, ProductStock, OmieOrder, OmieOrderItem, Client | enums: PlanStatus, InternalProductionOrderSource, InternalProductionOrderStatus, InternalProductionOrderQuantityUnit, InternalProductionOrderActorType, InternalProductionOrderEventSource, PersonType
- `prisma/migrations/`
  - `migration_lock.toml` — arquivo
- `prisma/migrations/20260410002353_first_migrate/`
  - `migration.sql` — arquivo
- `prisma/migrations/20260410005913_add_sync_lock/`
  - `migration.sql` — arquivo
- `prisma/migrations/20260414125500_add_omie_code_and_family_description/`
  - `migration.sql` — arquivo
- `prisma/migrations/20260414131000_add_product_stock/`
  - `migration.sql` — arquivo
- `prisma/migrations/20260415100605_expand_product_stock_omie_code_64/`
  - `migration.sql` — arquivo
- `prisma/migrations/20260415124006_add_job_lock_table/`
  - `migration.sql` — arquivo
- `prisma/migrations/20260415170012_widen_omie_product_fields/`
  - `migration.sql` — arquivo
- `prisma/migrations/20260415183012_omie_code_identity/`
  - `migration.sql` — arquivo
- `prisma/migrations/20260415190742_unique_product_stock_by_code/`
  - `migration.sql` — arquivo
- `prisma/migrations/20260415190836_/`
  - `migration.sql` — arquivo
- `prisma/migrations/20260417014146_/`
  - `migration.sql` — arquivo
- `prisma/migrations/20260505162545_create_clientes/`
  - `migration.sql` — arquivo
- `prisma/migrations/20260505164924_create_clients/`
  - `migration.sql` — arquivo
- `prisma/migrations/20260506114308_create_client/`
  - `migration.sql` — arquivo
- `prisma/migrations/20260506115215_create_client/`
  - `migration.sql` — arquivo
- `prisma/migrations/20260506120255_create_client/`
  - `migration.sql` — arquivo
- `prisma/migrations/20260506185532_relacionamento_orders_client/`
  - `migration.sql` — arquivo
- `prisma/migrations/20260508213903_add_omie_production_orders/`
  - `migration.sql` — arquivo
- `prisma/migrations/20260510201008_add_sync_record_table/`
  - `migration.sql` — arquivo
- `prisma/migrations/20260510202226_add_alerts_tables/`
  - `migration.sql` — arquivo
- `prisma/migrations/20260512014737_product_structure_migrate/`
  - `migration.sql` — arquivo
- `prisma/migrations/20260512033604_product_structure_bigint_ids/`
  - `migration.sql` — arquivo
- `prisma/migrations/20260513120000_add_internal_production_orders_with_audit/`
  - `migration.sql` — arquivo
- `scripts/`
  - `backfill-omie-code.ts` — código TS/JS
  - `check-env.mjs` — código TS/JS
  - `Comandos-scripts-api.md` — títulos: Comandos de terminal — scripts em apps/api/scripts (e atalhos no package.json) | Rodar a partir da raiz do monorepo | Rodar scripts do workspace @production-manager/api a partir da raiz | Alternativa equivalente | Scripts principais (já existentes em apps/api/package.json) | dev server
  - `create-file-interactive.ts` — código TS/JS
  - `fix-failed-migration.js` — código TS/JS
  - `generate-module.ts` — código TS/JS
  - `repo-metrics.mjs` — código TS/JS
  - `resilient-migrate.js` — código TS/JS
  - `update-estrutura-projeto-dirs-summary.js` — código TS/JS
  - `update-estrutura-projeto.mjs` — código TS/JS
- `scripts/metrics/`
  - `all.mjs` — código TS/JS
  - `endpoints-drift.mjs` — código TS/JS
  - `endpoints.mjs` — código TS/JS
  - `env-check.mjs` — código TS/JS
  - `exports.mjs` — código TS/JS
  - `loc.mjs` — código TS/JS
  - `migrations.mjs` — código TS/JS
  - `prisma-schema.mjs` — código TS/JS
  - `render-api-contract.mjs` — código TS/JS
  - `render-md.mjs` — código TS/JS
  - `render-readme.mjs` — código TS/JS
  - `render-reference.mjs` — código TS/JS
  - `sizes.mjs` — código TS/JS
  - `tree.mjs` — código TS/JS
- `scripts/scaffold/`
  - `audit.ts` — exports: auditModule
  - `config.ts` — exports: buildDefaultTemplate, $ — routes: GET /
  - `fs-utils.ts` — exports: normalizeRel, exists, ensureProjectRoot, ensureDir, readUtf8, safeWriteFile, listTree
  - `index.ts` — código TS/JS
  - `readme-writer.ts` — exports: renderReadme, writeReadme
  - `types.ts` — exports: Options, Template, StatusItem, AuditResult, WriteAction, WriteResult
- `scripts/trello/`
  - `register-webhook.ts` — código TS/JS
- `src/`
  - `server.ts` — código TS/JS
- `src/@types/`
  - `fastify-schema.d.ts` — código TS/JS
- `src/bootstrap/`
  - `app.ts` — código TS/JS
  - `openapi-simple.ts` — exports: registerOpenAPIDocumentation — routes: GET /docs | GET /api/endpoints
  - `openapi.ts` — exports: registerOpenAPIDocumentation — routes: GET /openapi.json | GET /openapi.yaml
  - `routes.ts` — routes: GET / | GET /health | GET /v1
  - `server.ts` — código TS/JS
- `src/bootstrap/plugins/`
  - `error-handler.ts` — código TS/JS
  - `job-lock.ts` — código TS/JS
  - `logger.ts` — código TS/JS
  - `prisma.ts` — código TS/JS
- `src/config/`
  - `env.ts` — exports: env
  - `index.ts` — código TS/JS
- `src/contracts/`
  - `publicProducts.contract.ts` — código TS/JS
- `src/dontev/`
  - `config.ts` — código TS/JS
- `src/infra/`
  - `db.ts` — exports: prisma
- `src/lib/`
  - `http.ts` — código TS/JS
- `src/modules/alerts/`
  - `README.md` — títulos: Módulo de Alertas de Estoque | 📋 Endpoints Disponíveis | 1. Listar Alertas de Estoque | 2. Listar Alertas Críticos de Estoque | 3. Configurar Regras de Alertas | 4. Atualizar Status do Alerta
  - `register.ts` — exports: registerAlertsModule
- `src/modules/alerts/application/dtos/`
  - `stock-alerts.dto.ts` — exports: StockAlertsRequestSchema, StockAlertsRequest, StockAlertsResponseSchema, StockAlertsResponse, AlertConfigRequestSchema, AlertConfigRequest, AlertConfigResponseSchema, AlertConfigResponse, AlertStatusRequestSchema, AlertStatusRequest, AlertStatusResponseSchema, AlertStatusResponse
- `src/modules/alerts/application/entities/`
  - `alert-config.entity.ts` — exports: AlertConfig, createAlertConfig, updateAlertConfig
  - `stock-alert.entity.ts` — exports: StockAlert, createStockAlert
- `src/modules/alerts/application/ports/`
  - `alerts.repository.port.ts` — exports: AlertsRepositoryPort
- `src/modules/alerts/application/use-cases/`
  - `configure-alerts.usecase.ts` — exports: ConfigureAlertsUseCaseDependencies, ConfigureAlertsUseCase, createConfigureAlertsUseCase
  - `list-stock-alerts.usecase.ts` — exports: ListStockAlertsUseCaseDependencies, ListStockAlertsUseCase, createListStockAlertsUseCase
  - `update-alert-status.usecase.ts` — exports: UpdateAlertStatusUseCaseDependencies, UpdateAlertStatusUseCase, createUpdateAlertStatusUseCase
- `src/modules/alerts/infrastructure/db/`
  - `alerts.repository.prisma.ts` — exports: AlertsRepositoryPrisma, createAlertsRepository
- `src/modules/alerts/presentation/http/`
  - `stock-alerts.controller.ts` — exports: StockAlertsController
  - `stock-alerts.openapi.ts` — exports: stockAlertsOpenAPIDocs
  - `stock-alerts.routes.ts` — exports: registerStockAlertsRoutes — routes: GET /api/alerts/stock | GET /api/alerts/stock/critical | POST /api/alerts/stock/configure | PATCH /api/alerts/stock/:id/status | GET /api/alerts/stock/statistics
- `src/modules/client/`
  - `index.ts` — código TS/JS
  - `README.md` — títulos: Módulo `client` | 🎯 Objetivo do módulo | 🧱 Padrão arquitetural (por módulo) | ✅ Status da estrutura (template) | Pastas | Arquivos
  - `register.ts` — código TS/JS
- `src/modules/client/application/dtos/`
  - `client.dto.ts` — exports: PersonType, Client
- `src/modules/client/application/ports/`
  - `client-repository.port.ts` — exports: ListClientsParams, ListClientsResult, ClientRepository
  - `omie-client-gateway.port.ts` — exports: OmieClientRaw, OmieClientGateway
- `src/modules/client/application/use-cases/`
  - `get-client-by-omie-client-code.usecase.ts` — exports: GetClientByOmieClientCodeUseCase
  - `list-clients.usecase.ts` — exports: ListClientsUseCase
  - `sync-omie-clients.usecase.ts` — exports: SyncOmieClientsUseCase
- `src/modules/client/infrastructure/db/`
  - `client.repo.prisma.ts` — exports: ClientPrismaRepository
- `src/modules/client/infrastructure/db/__tests__/`
  - `client.repo.smoke.ts` — código TS/JS
- `src/modules/client/infrastructure/integrations/omie/`
  - `omie-client.gateway.ts` — exports: OmieClientGatewayImpl
- `src/modules/client/infrastructure/jobs/`
  - `sync-omie-clients.job.ts` — exports: startOmieClientSyncJob
- `src/modules/client/presentation/`
  - `client.controller.ts` — exports: ClientController
- `src/modules/client/presentation/http/`
  - `client-admin.controller.ts` — exports: ClientAdminController
  - `client-admin.routes.ts` — routes: POST /admin/omie/clients/sync
  - `client-admin.schemas.ts` — exports: syncClientsFromOmieSchema
  - `client-list.controller.ts` — exports: ClientListController
  - `client-list.routes.ts` — routes: GET /clients
  - `client.routes.ts` — routes: GET /clients/:omieClientCode
  - `client.schemas.ts` — exports: getClientByOmieClientCodeSchema
  - `routes.ts` — código TS/JS
  - `schemas.ts` — código TS/JS
- `src/modules/client/presentation/http/controllers/`
  - `index.ts` — código TS/JS
- `src/modules/client/types/`
  - `fastify.d.ts` — código TS/JS
- `src/modules/internal-production-orders/`
  - `index.ts` — código TS/JS
  - `README.md` — títulos: Módulo `internal-production-orders` | 🎯 Objetivo do módulo | 🧱 Padrão arquitetural (por módulo) | ✅ Status da estrutura (template) | Pastas | Arquivos
  - `register.ts` — código TS/JS
- `src/modules/internal-production-orders/application/dtos/`
  - `internal-production-order.dto.ts` — exports: CreateInternalProductionOrderSchema, CreateInternalProductionOrderInput, UpdateInternalProductionOrderSchema, UpdateInternalProductionOrderInput, ListInternalProductionOrdersSchema, ListInternalProductionOrdersInput, InternalProductionOrderOutput, toOutput
- `src/modules/internal-production-orders/application/entities/`
  - `internal-production-order.entity.ts` — exports: InternalProductionOrderSource, InternalProductionOrderStatus, InternalProductionOrderQuantityUnit, InternalProductionOrderActorType, InternalProductionOrderEventSource, InternalProductionOrder, InternalProductionOrderEvent, InternalProductionOrderChange
- `src/modules/internal-production-orders/application/ports/`
  - `internal-production-order.repository.port.ts` — exports: CreateEventInput, CreateChangeInput, InternalProductionOrderRepositoryPort
  - `products-catalog.port.ts` — exports: ProductCatalogInfo, ProductsCatalogPort
- `src/modules/internal-production-orders/application/services/`
  - `internal-production-order-audit.service.test.ts` — código TS/JS
  - `internal-production-order-audit.service.ts` — exports: AuditLogger, InternalProductionOrderAuditService
- `src/modules/internal-production-orders/application/use-cases/`
  - `complete-internal-production-order.usecase.ts` — exports: CompleteInternalProductionOrderDependencies, CompleteInternalProductionOrderUseCase
  - `create-internal-production-order.usecase.ts` — exports: CreateInternalProductionOrderDependencies, CreateInternalProductionOrderUseCase
  - `delete-internal-production-order.usecase.ts` — exports: DeleteInternalProductionOrderDependencies, DeleteInternalProductionOrderUseCase
  - `get-internal-production-order-by-id.usecase.ts` — exports: GetInternalProductionOrderByIdDependencies, GetInternalProductionOrderByIdUseCase
  - `get-internal-production-orders.usecase.ts` — exports: GetInternalProductionOrdersDependencies, GetInternalProductionOrdersUseCase
  - `start-internal-production-order.usecase.ts` — exports: StartInternalProductionOrderDependencies, StartInternalProductionOrderUseCase
  - `update-internal-production-order.usecase.ts` — exports: UpdateInternalProductionOrderDependencies, UpdateInternalProductionOrderUseCase
- `src/modules/internal-production-orders/application/utils/`
  - `diff.test.ts` — código TS/JS
  - `diff.ts` — exports: FieldChange, computeDiff
- `src/modules/internal-production-orders/infrastructure/db/`
  - `internal-production-order.repository.prisma.ts` — exports: InternalProductionOrderRepositoryPrisma
- `src/modules/internal-production-orders/infrastructure/integrations/`
  - `http-products-catalog.adapter.ts` — exports: HttpProductsCatalogAdapter
- `src/modules/internal-production-orders/presentation/http/`
  - `internal-production-order.controller.ts` — exports: InternalProductionOrderController
  - `routes.ts` — exports: registerInternalProductionOrderRoutes — routes: POST /v1/internal-production-orders | GET /v1/internal-production-orders | GET /v1/internal-production-orders/:id | PATCH /v1/internal-production-orders/:id | POST /v1/internal-production-orders/:id/start | POST /v1/internal-production-orders/:id/complete | PATCH /v1/internal-production-orders/:id/start | PATCH /v1/internal-production-orders/:id/complete | DELETE /v1/internal-production-orders/:id
  - `schemas.ts` — exports: InternalProductionOrderBodySchema, InternalProductionOrderUpdateBodySchema, InternalProductionOrderQuerySchema, InternalProductionOrderResponseSchema, InternalProductionOrderListResponseSchema, InternalProductionOrderErrorSchema
- `src/modules/internal-production-orders/presentation/http/controllers/`
  - `index.ts` — código TS/JS
- `src/modules/internal-production-orders/types/`
  - `fastify.d.ts` — código TS/JS
- `src/modules/omie-production-orders/`
  - `index.ts` — exports: createOmieProductionOrdersModule
  - `register.ts` — código TS/JS
- `src/modules/omie-production-orders/application/use-cases/`
  - `get-active-production-orders-count.usecase.ts` — exports: createGetActiveProductionOrdersCountUseCase
  - `get-completed-production-orders-count.usecase.ts` — exports: createGetCompletedProductionOrdersCountUseCase
  - `get-production-order-by-code.usecase.ts` — exports: createGetProductionOrderByCodeUseCase
  - `get-production-orders-by-product-code.usecase.ts` — exports: createGetProductionOrdersByProductCodeUseCase
  - `get-production-orders-by-product-integration-code.usecase.ts` — exports: createGetProductionOrdersByProductIntegrationCodeUseCase
  - `get-production-orders-stats.usecase.ts` — exports: createGetProductionOrdersStatsUseCase
  - `list-production-orders-page.usecase.ts` — exports: OmieListProductionOrdersResponse, createListProductionOrdersPageUseCase
  - `list-production-orders.usecase.ts` — exports: createListProductionOrdersUseCase
  - `sync-production-orders.usecase.ts` — exports: createSyncProductionOrdersUseCase
- `src/modules/omie-production-orders/infrastructure/db/`
  - `omie-production-orders.repo.prisma.ts` — exports: createOmieProductionOrdersRepoPrisma
- `src/modules/omie-production-orders/infrastructure/jobs/`
  - `omie-production-orders-sync.job.integration.test.ts` — código TS/JS
  - `omie-production-orders-sync.job.ts` — exports: startOmieProductionOrdersSyncJob
- `src/modules/omie-production-orders/presentation/http/`
  - `omie-production-orders.controller.ts` — exports: createOmieProductionOrdersController
  - `omie-production-orders.routes.ts` — routes: GET /v1/admin/omie/production-orders | GET /v1/admin/omie/production-orders/:omieCode | GET /v1/admin/omie/production-orders/product/:productCode | GET /v1/admin/omie/production-orders/product-integration/:integrationCode | GET /v1/admin/omie/production-orders/stats | GET /v1/admin/omie/production-orders/stats/active | GET /v1/admin/omie/production-orders/stats/completed | POST /v1/admin/omie/production-orders/sync | GET /v1/admin/omie/production-orders/sync | GET /v1/admin/omie/production-orders/ping
- `src/modules/omie-sales-orders/`
  - `index.ts` — exports: createOmieSalesOrdersModule
  - `register.ts` — código TS/JS
- `src/modules/omie-sales-orders/application/use-cases/`
  - `fetch-omie-products-page.usecase.ts` — exports: createFetchOmieProductsPageUseCase
  - `get-stage20-totals.usecase.ts` — exports: createGetStage20TotalsUseCase
  - `list-omie-orders-page.usecase.ts` — exports: OmieListOrdersResponse, createListOmieOrdersPageUseCase
  - `list-orders.usecase.ts` — exports: createListOrdersUseCase
  - `list-stage20-orders.usecase.ts` — exports: createListStage20OrdersUseCase
  - `sync-omie-products.usecase.ts` — exports: createSyncOmieProductsUseCase
  - `sync-stage20-orders.usecase.ts` — exports: createSyncStage20OrdersUseCase
- `src/modules/omie-sales-orders/infrastructure/db/`
  - `omie-orders.repo.prisma.ts` — exports: createOmieOrdersRepoPrisma
  - `omie-product.repo.prisma.ts` — exports: createOmieProductRepoPrisma
  - `sync-lock.repo.prisma.ts` — exports: createSyncLockRepoPrisma
- `src/modules/omie-sales-orders/infrastructure/jobs/`
  - `omie-orders-stage20.job.integration.test.ts` — código TS/JS
  - `omie-orders-stage20.job.ts` — exports: startOmieOrdersStage20SyncJob
- `src/modules/omie-sales-orders/presentation/http/`
  - `omie-sales-orders.controller.ts` — exports: createOmieSalesOrdersController
  - `omie-sales-orders.routes.ts` — routes: GET /v1/admin/orders | GET /v1/admin/orders/stage20 | GET /v1/admin/orders/stage20/totals | POST /v1/admin/omie/orders/stage20/sync | GET /v1/admin/omie/orders/stage20/sync | GET /v1/admin/omie/orders/stage20/ping
- `src/modules/orders-enriched/`
  - `index.ts` — exports: OrdersEnriched
  - `README.md` — títulos: Módulo `orders-enriched` | 🎯 Objetivo do módulo | 🧱 Padrão arquitetural (por módulo) | ✅ Status da estrutura (template) | Pastas | Arquivos
  - `register.ts` — código TS/JS
- `src/modules/orders-enriched/application/ports/`
  - `client-lookup.port.ts` — exports: ClientSnapshot, ClientLookup
  - `stage20-orders-fetcher.port.ts` — exports: Stage20OrdersQuery, Stage20OrdersFetcher
- `src/modules/orders-enriched/application/use-cases/`
  - `list-stage20-orders-enriched.usecase.ts` — exports: ListStage20OrdersEnrichedUseCase
- `src/modules/orders-enriched/infrastructure/db/`
  - `client-lookup.prisma.ts` — exports: ClientLookupPrisma
- `src/modules/orders-enriched/infrastructure/integrations/internal/`
  - `stage20-orders.fetcher.fastify.ts` — exports: Stage20OrdersFetcherFastify
- `src/modules/orders-enriched/presentation/http/`
  - `orders-enriched.controller.ts` — exports: OrdersEnrichedController
  - `orders-enriched.routes.ts` — routes: GET /admin/orders/stage20/enriched
  - `orders-enriched.schemas.ts` — exports: listStage20OrdersEnrichedSchema
  - `routes.ts` — routes: GET /
  - `schemas.ts` — código TS/JS
- `src/modules/orders-enriched/presentation/http/controllers/`
  - `index.ts` — código TS/JS
- `src/modules/orders-view/`
  - `register.ts` — código TS/JS
- `src/modules/orders-view/application/`
  - `list-orders-view.usecase.ts` — exports: ListOrdersViewUseCase
- `src/modules/orders-view/infrastructure/`
  - `orders-view.repository.prisma.ts` — exports: OrdersViewRepository
- `src/modules/orders-view/presentation/`
  - `orders-view.controller.ts` — exports: OrdersViewController
  - `orders-view.routes.ts` — routes: GET /orders
- `src/modules/plans/`
  - `index.ts` — código TS/JS
- `src/modules/plans/application/dtos/`
  - `product.dto.ts` — código TS/JS
- `src/modules/plans/application/use-cases/`
  - `add-plan-item.usecase.ts` — exports: createAddPlanItemUseCase
  - `create-plan.usecase.ts` — exports: createCreatePlanUseCase
  - `export-plan-csv.usecase.ts` — exports: createExportPlanCsvUseCase
  - `get-plan-by-id.usecase.ts` — exports: createGetPlanByIdUseCase
  - `get-product.usecase.ts` — código TS/JS
  - `list-plan-items-by-sector.usecase.ts` — exports: createListPlanItemsBySectorUseCase
  - `list-plans.usecase.ts` — exports: createListPlansUseCase
  - `list-products.usecase.ts` — código TS/JS
  - `refresh-stock.usecase.ts` — código TS/JS
  - `set-default-sector.usecase.ts` — código TS/JS
  - `sync-omie-products.usecase.ts` — código TS/JS
- `src/modules/plans/infrastructure/db/`
  - `plan.repo.prisma.ts` — exports: createPlanRepoPrisma
  - `product.repo.prisma.ts` — código TS/JS
- `src/modules/plans/infrastructure/integrations/omie/`
  - `omie-product.gateway.ts` — código TS/JS
  - `omie-stock-cache.ts` — código TS/JS
  - `omie.adapter.ts` — código TS/JS
  - `omie.client.ts` — código TS/JS
- `src/modules/plans/infrastructure/jobs/`
  - `refresh-stock.job.ts` — código TS/JS
  - `sync-omie-products.job.ts` — código TS/JS
- `src/modules/plans/presentation/http/`
  - `plans.controller.ts` — exports: createPlansController
  - `plans.routes.ts` — routes: POST /v1/admin/plans | GET /v1/admin/plans | GET /v1/admin/plans/:id | POST /v1/admin/plans/:id/items | GET /v1/admin/plans/:id/by-sector | GET /v1/admin/plans/:id/export.csv | POST /v1/plans | GET /v1/plans | GET /v1/plans/:id | POST /v1/plans/:id/items | GET /v1/plans/:id/by-sector | GET /v1/plans/:id/export.csv
  - `plans.schemas.ts` — exports: planIdParamsSchema, createPlanBodySchema, addPlanItemBodySchema
- `src/modules/product-sector/`
  - `index.ts` — código TS/JS
- `src/modules/product-sector/application/`
  - `set-product-default-sector.usecase.ts` — exports: createSetProductDefaultSectorUseCase
- `src/modules/product-sector/application/use-cases/`
  - `get-product-default-sector.usecase.ts` — exports: createGetProductDefaultSectorUseCase
  - `set-product-default-sector.usecase.ts` — exports: createSetProductDefaultSectorUseCase
- `src/modules/product-sector/infrastructure/db/`
  - `product-sector.repo.prisma.ts` — exports: createProductSectorRepoPrisma
- `src/modules/product-sector/presentation/http/`
  - `product-sector.controller.ts` — exports: createProductSectorController
  - `product-sector.routes.ts` — routes: PUT /v1/admin/managed-products/:productId/sector | GET /v1/admin/managed-products/:productId/sector | PUT /v1/admin/products/:productId/sector | GET /v1/admin/products/:productId/sector | PUT /v1/products/:productId/sector | GET /v1/products/:productId/sector
  - `product-sector.schemas.ts` — exports: productIdParamsSchema, updateProductSectorBodySchema
- `src/modules/product-sectors/`
  - `index.ts` — código TS/JS
  - `README.md` — títulos: Módulo `product-sectors` | 🎯 Objetivo do módulo | 🧱 Padrão arquitetural (por módulo) | ✅ Status da estrutura (template) | Pastas | Arquivos
- `src/modules/product-sectors/application/use-cases/`
  - `delete-sector.usecase.ts` — exports: createDeleteSectorUseCase
  - `list-sectors.usecase.ts` — exports: createListSectorsUseCase
  - `seed-default-sectors.usecase.ts` — exports: createSeedDefaultSectorsUseCase
  - `update-sector.usecase.ts` — exports: createUpdateSectorUseCase
- `src/modules/product-sectors/infrastructure/db/`
  - `product-sectors.repo.prisma.ts` — exports: DEFAULT_SECTORS, createProductSectorsRepoPrisma
- `src/modules/product-sectors/presentation/http/`
  - `product-sectors.controller.ts` — exports: createProductSectorsController
  - `product-sectors.routes.ts` — exports: registerProductSectorsRoutes — routes: GET ${prefix} | PUT ${prefix}/:id | DELETE ${prefix}/:id
  - `product-sectors.schemas.ts` — exports: listSectorsQuerySchema, sectorIdParamsSchema, updateSectorBodySchema
- `src/modules/product-structure/`
  - `index.ts` — exports: default
  - `README.md` — títulos: Módulo `product-structure` | 🎯 Objetivo do módulo | 🧱 Padrão arquitetural (por módulo) | ✅ Status da estrutura (template) | Pastas | Arquivos
  - `register.ts` — código TS/JS
- `src/modules/product-structure/application/dtos/`
  - `product-structure.output.ts` — exports: ProductStructureItemOutput, ProductStructureOutput
  - `sync-product-structure.input.ts` — exports: SyncProductStructureInput, SyncProductStructureResult
- `src/modules/product-structure/application/ports/`
  - `omie-product-structure.gateway.ts` — exports: ProductIdentifierInput, OmieProductStructureResult, OmieProductStructureGateway
  - `product-structure.repository.ts` — exports: UpsertStructureInput, ProductStructurePersistenceModel, FindAllStructuresParams, FindAllStructuresResult, ProductStructureRepository
- `src/modules/product-structure/application/use-cases/`
  - `get-product-structure-by-codproduto.usecase.ts` — exports: GetProductStructureByCodProdutoUseCase
  - `list-product-structures.usecase.ts` — exports: ListProductStructuresUseCase
  - `sync-omie-product-structure.usecase.ts` — exports: SyncOmieProductStructureUseCase
- `src/modules/product-structure/application/utils/`
  - `compute-structure-hash.ts` — exports: computeStructureHash
  - `omie-mappers.ts` — exports: mapOmieToUpsertInput
  - `resolve-product-identifier.ts` — exports: resolveProductIdentifier
- `src/modules/product-structure/infrastructure/db/prisma/`
  - `product-structure.prisma-repository.ts` — exports: ProductStructurePrismaRepository
- `src/modules/product-structure/infrastructure/integrations/omie/`
  - `omie-client.ts` — exports: OmieClientConfig, OmieClient
  - `omie-product-structure.contracts.ts` — exports: OmieMalhaIdent, OmieMalhaItem, OmieEstrutura, OmieListarEstruturasResponse
  - `omie-product-structure.gateway.ts` — exports: OmieProductStructureGatewayImpl
- `src/modules/product-structure/infrastructure/jobs/`
  - `omie-product-structure-sync.job.ts` — exports: startOmieProductStructureSyncJob
- `src/modules/product-structure/presentation/http/`
  - `routes.ts` — código TS/JS
  - `schemas.ts` — exports: SyncProductStructureBodySchema, SyncProductStructureResponseSchema, GetProductStructureParamsSchema, ProductStructureOutputSchema, ListProductStructuresQuerySchema, ListProductStructuresResponseSchema
- `src/modules/product-structure/presentation/http/controllers/`
  - `get-product-structure.controller.ts` — código TS/JS
  - `index.ts` — código TS/JS
  - `list-product-structures.controller.ts` — código TS/JS
  - `sync-product-structure-job-tick.controller.ts` — código TS/JS
  - `sync-product-structure.controller.ts` — código TS/JS
- `src/modules/production-queue/`
  - `index.ts` — código TS/JS
  - `register.ts` — exports: registerProductionQueueModule
- `src/modules/production-queue/application/dtos/`
  - `production-queue.dto.ts` — exports: AddToQueueRequestSchema, AddToQueueRequest, AddToQueueResponseSchema, AddToQueueResponse, ListQueueRequestSchema, ListQueueRequest, ListQueueResponseSchema, ListQueueResponse, UpdateQueueStatusRequestSchema, UpdateQueueStatusRequest, UpdateQueueStatusResponseSchema, UpdateQueueStatusResponse
- `src/modules/production-queue/application/entities/`
  - `production-queue.entity.ts` — exports: ProductionQueueItem, ProductionQueueStatistics, QueueReorderItem, createProductionQueueItem, calculateEstimatedStartDate, validateQueuePriority, validateQueueStatus, getPriorityWeight, compareQueueItems, calculateQueueStatistics
- `src/modules/production-queue/application/ports/`
  - `production-queue.repository.port.ts` — exports: ProductionQueueRepositoryPort
- `src/modules/production-queue/application/use-cases/`
  - `add-to-queue.usecase.ts` — exports: AddToQueueDependencies, AddToQueueUseCase, createAddToQueueUseCase
  - `list-queue.usecase.ts` — exports: ListQueueDependencies, ListQueueUseCase, createListQueueUseCase
  - `queue-statistics.usecase.ts` — exports: QueueStatisticsDependencies, QueueStatisticsUseCase, createQueueStatisticsUseCase
  - `reorder-queue.usecase.ts` — exports: ReorderQueueDependencies, ReorderQueueUseCase, createReorderQueueUseCase
  - `update-queue-status.usecase.ts` — exports: UpdateQueueStatusDependencies, UpdateQueueStatusUseCase, createUpdateQueueStatusUseCase
- `src/modules/production-queue/application/use-cases/__tests__/`
  - `add-to-queue.usecase.test.ts` — código TS/JS
  - `list-queue.usecase.test.ts` — código TS/JS
  - `update-queue-status.usecase.test.ts` — código TS/JS
- `src/modules/production-queue/infrastructure/db/`
  - `production-queue.repository.prisma.ts` — exports: ProductionQueueRepositoryPrisma, createProductionQueueRepository
- `src/modules/production-queue/presentation/http/`
  - `production-queue.controller.ts` — exports: ProductionQueueController
  - `production-queue.routes.ts` — exports: registerProductionQueueRoutes — routes: POST /api/production/queue/add | GET /api/production/queue | GET /api/production/queue/:id | PATCH /api/production/queue/:id/status | GET /api/production/queue/statistics | POST /api/production/queue/reorder | GET /api/production/queue/health
- `src/modules/production-queue/presentation/http/__tests__/`
  - `production-queue.integration.test.ts` — código TS/JS
- `src/modules/products/`
  - `index.ts` — código TS/JS
- `src/modules/products/application/dtos/`
  - `product.dto.ts` — código TS/JS
  - `public-product.dto.ts` — exports: PublicProduct, ListPublicProductsParams, PublicProductsMeta, ListPublicProductsResult
- `src/modules/products/application/use-cases/`
  - `create-managed-product.usecase.ts` — exports: createCreateManagedProductUseCase
  - `create-managed-products-bulk.usecase.ts` — exports: createCreateManagedProductsBulkUseCase
  - `delete-managed-product.usecase.ts` — exports: createDeleteManagedProductUseCase
  - `fetch-omie-products-page.usecase.ts` — exports: createFetchOmieProductsPageUseCase
  - `get-managed-product-stock-history.usecase.ts` — exports: createGetManagedProductStockHistoryUseCase
  - `get-managed-product-stock.usecase.ts` — exports: createGetManagedProductStockUseCase
  - `get-managed-product.usecase.ts` — exports: createGetManagedProductUseCase
  - `get-products.usecase.ts` — exports: createGetOmieProductsUseCase
  - `get-public-product-by-omie-code.usecase.ts` — exports: createGetPublicProductByOmieCodeUseCase
  - `get-stock-by-raw-payload.usecase.ts` — exports: createGetStockByRawPayloadUseCase
  - `list-managed-products.usecase.ts` — exports: createListManagedProductsUseCase
  - `list-omie-products-with-stock.usecase.ts` — exports: createListOmieProductsWithStockUseCase
  - `list-products.usecase.ts` — código TS/JS
  - `list-public-products.usecase.ts` — exports: createListPublicProductsUseCase
  - `patch-managed-product.usecase.ts` — exports: createPatchManagedProductUseCase
  - `refresh-stock.usecase.ts` — exports: createRefreshStockUseCase
  - `resolve-omie-code-from-product.usecase.ts` — exports: createResolveOmieCodeFromProductUseCase
  - `set-default-sector.usecase.ts` — código TS/JS
  - `sync-omie-products.usecase.ts` — exports: createSyncOmieProductsUseCase
- `src/modules/products/application/use-cases/admin-omie/`
  - `get-omie-product-by-code.usecase.ts` — exports: createGetOmieProductByCodeUseCase
  - `get-omie-product-by-id.usecase.ts` — exports: createGetOmieProductByIdUseCase
  - `get-omie-product-stock.usecase.ts` — exports: createGetOmieProductStockUseCase
  - `get-omie-stock-info.usecase.ts` — exports: createGetOmieStockInfoUseCase
  - `list-omie-categories.usecase.ts` — exports: createListOmieCategoriesUseCase
  - `search-omie-products.usecase.ts` — exports: createSearchOmieProductsUseCase
- `src/modules/products/application/utils/`
  - `to-number.ts` — exports: toNumber
- `src/modules/products/infrastructure/db/`
  - `omie-product-read.repo.prisma.ts` — exports: createOmieProductReadRepoPrisma
  - `omie-product.repo.prisma.ts` — exports: createOmieProductRepoPrisma
  - `product-stock.repo.prisma.ts` — exports: ProductStockUpsertRow, createProductStockRepoPrisma
  - `product.repo.prisma.ts` — exports: createProductRepoPrisma
  - `public-products.repo.prisma.ts` — exports: createPublicProductsRepoPrisma
  - `sync-lock-lease.repo.prisma.ts` — exports: createSyncLockLeaseRepoPrisma
  - `sync-lock.repo.prisma.ts` — exports: createSyncLockRepoPrisma
- `src/modules/products/infrastructure/integrations/omie/`
  - `index.ts` — código TS/JS
  - `omie-product.gateway.ts` — código TS/JS
  - `omie-stock-cache.ts` — código TS/JS
  - `omie.adapter.ts` — exports: OmieProductDTO, OmieAdapter
  - `omie.client.ts` — código TS/JS
- `src/modules/products/infrastructure/jobs/`
  - `omie-product-sync.job.ts` — exports: startOmieProductSyncJob
  - `stock-refresh.job.ts` — exports: startStockRefreshJob
- `src/modules/products/presentation/http/`
  - `products.controller.ts` — exports: createProductsController
  - `products.routes.ts` — routes: GET /v1/products | GET /v1/products/:omieCode([A-Za-z0-9]{1,64}) | GET /v1/products/stock | POST /v1/admin/managed-products | POST /v1/admin/products | POST /v1/products | POST /v1/admin/managed-products/bulk | POST /v1/admin/products/bulk | POST /v1/products/bulk | GET /v1/admin/managed-products | GET /v1/admin/products | GET /v1/products/managed
  - `products.schemas.ts` — exports: publicListQuerySchema, publicGetByOmieCodeParamsSchema, managedProductIdParamsSchema, managedProductIdUuidParamsSchema, createManagedProductBodySchema, createManagedProductsBulkBodySchema, patchManagedProductBodySchema, stockHistoryQuerySchema
- `src/modules/products/utils/`
  - `to-number.ts` — exports: toNumber
- `src/modules/sales-production-integration/`
  - `index.ts` — código TS/JS
  - `README.md` — títulos: Sales → Production Integration Module | Funcionalidades | Endpoints | POST /api/integration/sales-to-production | Regras de Prioridade | Dependências
  - `register.ts` — exports: registerSalesProductionIntegrationModule
- `src/modules/sales-production-integration/application/dtos/`
  - `sales-production-integration.dto.ts` — exports: SalesToProductionRequestSchema, SalesToProductionResponseSchema, IntegrationStatisticsSchema, IntegrationStatisticsResponseSchema, SalesToProductionRequest, SalesToProductionResponse, IntegrationStatistics, IntegrationStatisticsResponse
- `src/modules/sales-production-integration/application/use-cases/`
  - `integration-statistics.usecase.ts` — exports: IntegrationStatisticsDependencies, IntegrationStatisticsUseCase
  - `sales-to-production.usecase.ts` — exports: SalesToProductionDependencies, SalesToProductionUseCase
- `src/modules/sales-production-integration/presentation/http/`
  - `sales-production-integration.controller.ts` — exports: SalesProductionIntegrationController
  - `sales-production-integration.routes.ts` — exports: registerSalesProductionIntegrationRoutes — routes: POST /api/integration/sales-to-production | GET /api/integration/sales-to-production/statistics
- `src/modules/sectors/`
  - `index.ts` — código TS/JS
- `src/modules/sectors/application/dtos/`
  - `product.dto.ts` — código TS/JS
- `src/modules/sectors/application/use-cases/`
  - `create-sector.usecase.ts` — exports: createCreateSectorUseCase
  - `delete-sector.usecase.ts` — exports: createDeleteSectorUseCase
  - `get-product.usecase.ts` — código TS/JS
  - `list-products.usecase.ts` — código TS/JS
  - `list-sectors.usecase.ts` — exports: createListSectorsUseCase
  - `refresh-stock.usecase.ts` — código TS/JS
  - `set-default-sector.usecase.ts` — código TS/JS
  - `sync-omie-products.usecase.ts` — código TS/JS
  - `update-sector.usecase.ts` — exports: createUpdateSectorUseCase
- `src/modules/sectors/infrastructure/db/`
  - `product.repo.prisma.ts` — código TS/JS
  - `sector.repo.prisma.ts` — exports: createSectorRepoPrisma
- `src/modules/sectors/infrastructure/integrations/omie/`
  - `omie-product.gateway.ts` — código TS/JS
  - `omie-stock-cache.ts` — código TS/JS
  - `omie.adapter.ts` — código TS/JS
  - `omie.client.ts` — código TS/JS
- `src/modules/sectors/infrastructure/jobs/`
  - `refresh-stock.job.ts` — código TS/JS
  - `sync-omie-products.job.ts` — código TS/JS
- `src/modules/sectors/presentation/http/`
  - `sectors.controller.ts` — exports: createSectorsController
  - `sectors.routes.ts` — routes: POST /v1/admin/sectors | GET /v1/admin/sectors | PATCH /v1/admin/sectors/:id | DELETE /v1/admin/sectors/:id | POST /v1/sectors | GET /v1/sectors | PATCH /v1/sectors/:id | DELETE /v1/sectors/:id
  - `sectors.schemas.ts` — exports: listSectorsQuerySchema, sectorIdParamsSchema, createSectorBodySchema, updateSectorBodySchema
- `src/modules/selected-products/`
  - `index.ts` — exports: SelectedProducts
  - `README.md` — títulos: Módulo `selected-products` | 🎯 Objetivo do módulo | 🧱 Padrão arquitetural (por módulo) | ✅ Status da estrutura (template) | Pastas | Arquivos
- `src/modules/selected-products/presentation/http/`
  - `routes.ts` — routes: GET /
  - `schemas.ts` — código TS/JS
- `src/modules/selected-products/presentation/http/controllers/`
  - `index.ts` — código TS/JS
- `src/modules/stock-monitor/`
  - `index.ts` — código TS/JS
  - `README.md` — títulos: Módulo de Monitoramento de Estoque | Funcionalidades | Configuração | Variáveis de Ambiente | Habilitar monitoramento de estoque | Intervalo base de polling (em milissegundos)
  - `register.ts` — exports: registerStockMonitorModule
- `src/modules/stock-monitor/infrastructure/jobs/`
  - `stock-monitor.job.integration.test.ts` — código TS/JS
  - `stock-monitor.job.ts` — exports: startStockMonitorJob
- `src/modules/sync/`
  - `index.ts` — código TS/JS
  - `README.md` — títulos: Módulo Sync | Funcionalidades | Endpoints de Sincronização | Características Técnicas | Estrutura do Módulo | Configuração
  - `register.ts` — exports: registerSyncModule
- `src/modules/sync/application/dtos/`
  - `sync-orders.dto.ts` — exports: SyncOrdersRequestSchema, SyncOrdersResponseSchema, OrderSyncResultSchema, BatchSyncResultSchema, SyncOrdersRequest, SyncOrdersResponse, OrderSyncResult, BatchSyncResult
  - `sync-status.dto.ts` — exports: SyncStatusRequestSchema, SyncStatusResponseSchema, SyncStatusSummarySchema, SyncStatusRequest, SyncStatusResponse, SyncStatusSummary
  - `sync-stock.dto.ts` — exports: SyncStockRequestSchema, SyncStockRequest, SyncStockResponseSchema, SyncStockResponse, ProductStockData, SyncStockResult
- `src/modules/sync/application/ports/`
  - `omie.gateway.port.ts` — exports: OmieProduct, OmieProductionOrder, OmieSalesOrder, OmieGatewayPort
  - `sync.repository.port.ts` — exports: SyncRecord, SyncRepositoryPort
- `src/modules/sync/application/use-cases/`
  - `get-sync-status.usecase.ts` — exports: GetSyncStatusUseCaseDependencies, GetSyncStatusUseCase, createGetSyncStatusUseCase
  - `sync-orders.usecase.ts` — exports: SyncOrdersUseCaseDependencies, SyncOrdersUseCase, createSyncOrdersUseCase
  - `sync-stock.usecase.ts` — exports: SyncStockUseCaseDependencies, SyncStockUseCase, createSyncStockUseCase
- `src/modules/sync/infrastructure/db/`
  - `sync.repository.prisma.ts` — exports: SyncRepositoryPrisma, createSyncRepository
- `src/modules/sync/infrastructure/integrations/`
  - `omie.gateway.ts` — exports: OmieGateway, createOmieGateway
- `src/modules/sync/presentation/http/`
  - `sync-orders.controller.ts` — exports: SyncOrdersControllerDependencies, SyncOrdersController, createSyncOrdersController, registerSyncOrdersRoutes — routes: POST /api/sync/orders | GET /api/sync/orders/schema
  - `sync-status.controller.ts` — exports: SyncStatusControllerDependencies, SyncStatusController, createSyncStatusController, registerSyncStatusRoutes — routes: GET /api/sync/status | GET /api/sync/status/schema
  - `sync-stock.controller.ts` — exports: SyncStockControllerDependencies, SyncStockController, createSyncStockController, registerSyncStockRoutes — routes: POST /api/sync/stock | GET /api/sync/stock/schema
  - `sync.routes.ts` — exports: SyncDependencies, registerSyncRoutes — routes: POST /api/sync/stock | POST /api/sync/orders | GET /api/sync/status | GET /api/sync/health
- `src/modules/trello-integration/`
  - `index.ts` — código TS/JS
  - `README.md` — títulos: Módulo `trello-integration` | 🎯 Objetivo do módulo | 🧱 Padrão arquitetural (por módulo) | ✅ Status da estrutura (template) | Pastas | Arquivos
  - `register.ts` — código TS/JS
- `src/modules/trello-integration/application/dtos/`
  - `trello-webhook-event.dto.ts` — exports: TrelloWebhookEvent, ParsedCardName, ProcessWebhookResult
- `src/modules/trello-integration/application/use-cases/`
  - `process-trello-webhook.use-case.test.ts` — código TS/JS
  - `process-trello-webhook.use-case.ts` — exports: ProcessTrelloWebhookDependencies, ProcessTrelloWebhookUseCase
- `src/modules/trello-integration/application/utils/`
  - `parse-card-name.test.ts` — código TS/JS
  - `parse-card-name.ts` — exports: parseCardName
  - `trello-event-guards.ts` — exports: isCardEnteredTargetList
- `src/modules/trello-integration/presentation/http/`
  - `routes.ts` — exports: registerTrelloIntegrationRoutes — routes: GET /v1/trello/webhook | POST /v1/trello/webhook
- `src/modules/trello-integration/presentation/http/controllers/`
  - `trello-webhook.controller.ts` — exports: TrelloWebhookController
- `src/shared/errors/`
  - `AppError.ts` — exports: AppError
  - `domain-errors.ts` — exports: AppError, NotFoundError, ConflictError, ValidationError, MissingDefaultSectorError
  - `http-errors.ts` — exports: ErrorCodes, ErrorCode, ApiErrorPayload, sendError
  - `index.ts` — código TS/JS
- `src/shared/http/`
  - `response.ts` — exports: HttpLinks, PaginationMeta, ok, paginated, wantsLegacyResponse, wantsPrettyResponse, sendOk, sendPaginated, markDeprecated
  - `validate.ts` — código TS/JS
- `src/shared/integrations/omie/`
  - `index.ts` — código TS/JS
  - `omie-orders.adapter.ts` — exports: OmieOrderMapped, isEligibleStage20, mapOrder
  - `omie-stock-cache.ts` — exports: OmieStockEntry, OmieStockCacheOptions, createOmieStockCache
  - `omie.adapter.ts` — exports: OmieProductDTO, OmieAdapter
  - `omie.client.ts` — exports: OmieClientConfig, OmieLogger, OmieClient, createOmieClient
  - `omie.constants.ts` — exports: OMIE_ENDPOINTS
  - `omie.utils.ts` — exports: brDateToISO, isSim
  - `OmieProductionOrdersAdapter.ts` — exports: OmieProductionOrder, OmieProductionOrderItem, filterByCompletionStatus, filterByCompletionDate, mapProductionOrder, extractProductionOrderSummary
- `src/shared/logger/`
  - `index.ts` — código TS/JS
  - `logger.ts` — exports: Logger, setBaseLogger, getLogger
- `src/shared/services/`
  - `index.ts` — código TS/JS
  - `IntelligentPollingService.test.ts` — código TS/JS
  - `IntelligentPollingService.ts` — exports: PollingJobConfig, PollingJobStatus, PollingJobResult, PollingJobHandler, IntelligentPollingService
  - `polling.config.test.ts` — código TS/JS
  - `polling.config.ts` — exports: DEFAULT_POLLING_CONFIGS, getPollingConfigFromEnv, validatePollingConfig
  - `retry.config.test.ts` — código TS/JS
  - `retry.config.ts` — exports: RetryConfigMap, DEFAULT_RETRY_CONFIGS, getRetryConfig, getAllRetryConfigs
  - `RetrySystem.test.ts` — código TS/JS
  - `RetrySystem.ts` — exports: RetryConfig, RetryResult, RetryMetrics, RetrySystem
- `src/shared/utils/`
  - `backoff.ts` — código TS/JS
  - `job-lock.ts` — exports: JobLockAcquireResult, createJobLock
- `tests/`
  - `CreatePlanItemService.spec.ts` — código TS/JS
  - `frontend-stock-consumption.spec.ts` — código TS/JS
  - `informative-endpoints.spec.ts` — código TS/JS
  - `omie-categories.spec.ts` — código TS/JS
  - `omie-product-sync-idempotent.spec.ts` — routes: GET XTE
  - `omie-product-sync-long-fields.spec.ts` — código TS/JS
  - `omie-products-detail.spec.ts` — código TS/JS
  - `omie-products-search.spec.ts` — código TS/JS
  - `omie-products-sync.spec.ts` — código TS/JS
  - `omie-stock-refresh-persist.spec.ts` — código TS/JS
  - `omie-stock-summary.spec.ts` — código TS/JS
  - `OmieAdapter.spec.ts` — código TS/JS
  - `omieProductRead.service.spec.ts` — routes: GET XTE | GET ABC
  - `product-stock.spec.ts` — código TS/JS
  - `products-item-and-update.spec.ts` — código TS/JS
  - `products-stock-external.spec.ts` — código TS/JS
  - `public-products.contract.spec.ts` — código TS/JS
  - `stock-refresh-idempotent.spec.ts` — routes: GET XTE
- `tests/integration/modules/sync/`
  - `sync-module.test.ts` — código TS/JS
  - `sync-repository.test.ts` — código TS/JS
- `tests/unit/modules/sync/`
  - `get-sync-status.usecase.test.ts` — código TS/JS
  - `sync-orders.usecase.test.ts` — código TS/JS
  - `sync-stock.usecase.test.ts` — código TS/JS

<!-- AUTO-DIR-SUMMARY-END -->
