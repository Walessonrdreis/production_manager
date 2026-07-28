// ---------------------------------------------------------------------------
// Sales Order Sync — PgBoss Job Handlers
// ---------------------------------------------------------------------------
// BRIDGE: Apenas cria as dependências e delega para o use-case.
// Nenhuma lógica de negócio aqui — toda regra está no use-case.
//
// O PgBoss gerencia:
//   - Concorrência (localConcurrency = 1 para sync-global)
//   - Retry com backoff exponencial (retryLimit + retryBackoff)
//   - Singleton key (evita duplicatas concorrentes)
//   - Entrega event-driven (LISTEN/NOTIFY)
// ---------------------------------------------------------------------------

import { env } from "@/config";
import { prisma } from "@/shared/db/prisma";
import { getLogger } from "@/shared/logger";
import { registerJobHandler } from "@/shared/infra/job-queue";
import { PrismaSyncStateStore } from "@/shared/integration/strategies/sync-state.store";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

// ─── Use Cases ────────────────────────────────────────────────────────

import { SyncAllSalesOrdersUseCase } from "../../application/use-cases/sync-all-sales-orders.usecase";
import { RefreshProductCatalogProductionReadyUseCase } from "@/modules/integration/product-catalog/application/use-cases/refresh-product-catalog-production-ready.usecase";
import { RefreshSalesOrderSummaryReadModelUseCase } from "../../application/use-cases/refresh-sales-order-summary-read-model.usecase";

// ─── Stores ───────────────────────────────────────────────────────────

import { SalesOrderSyncIntegrationStore } from "../../infrastructure/db/sales-order-sync-integration.store";
import { SalesOrderSyncCommandStore } from "../../infrastructure/db/sales-order-sync-command.store";
import { SalesOrderSummaryReadModelStore } from "../../infrastructure/db/sales-order-summary-read-model.store";
import { SalesOrderStageTransitionStore } from "../../infrastructure/db/sales-order-stage-transition.store";
import { ProductCatalogProductionReadyReadModelStore } from "@/modules/integration/product-catalog/infrastructure/db/product-catalog-production-ready-read-model.store";

// ─── Gateways ─────────────────────────────────────────────────────────

import { FakeSalesOrderFetchPageGateway } from "../../infrastructure/gateways/fetch-page/fake-sales-order-fetch-page.gateway";
import { RealSalesOrderFetchPageGateway } from "../../infrastructure/gateways/fetch-page/real-sales-order-fetch-page.gateway";
import type { SalesOrderFetchPageGateway } from "../../application/ports/sales-order-fetch-page.gateway";

// ─── Types ────────────────────────────────────────────────────────────

type SyncGlobalJobData = {
    externalRequestId: string;
    pageSize?: number;
    maxPages?: number;
    source?: "API2" | "JOB" | "ADMIN";
};

// ─── Logger ───────────────────────────────────────────────────────────

const logger = getLogger("sales-order-sync:pgboss-handler");

// ─── Factory ──────────────────────────────────────────────────────────

function createGateways(omieClient: OmieHttpClientPort): {
    isFake: boolean;
    fetchPageGateway: SalesOrderFetchPageGateway;
} {
    const isFake = env.SALES_ORDER_SYNC_GATEWAY === "fake";

    const fetchPageGateway: SalesOrderFetchPageGateway = isFake
        ? new FakeSalesOrderFetchPageGateway()
        : new RealSalesOrderFetchPageGateway(omieClient);

    return { isFake, fetchPageGateway };
}

// ─── Registro dos Handlers ────────────────────────────────────────────

/**
 * Registra todos os handlers PgBoss para o módulo sales-order-sync.
 * Bridge pura: cria o use-case com gateways injetados e registra handler
 * que delega para o use-case.
 *
 * Deve ser chamado durante o bootstrap, ANTES de `startWorker()`.
 */
export function registerSalesOrderSyncJobHandlers(
    omieClient: OmieHttpClientPort
): void {
    const { isFake, fetchPageGateway } = createGateways(omieClient);
    const integrationStore = new SalesOrderSyncIntegrationStore(prisma);
    const commandStore = new SalesOrderSyncCommandStore(prisma);
    const refreshProductCatalogUseCase =
        new RefreshProductCatalogProductionReadyUseCase(
            new ProductCatalogProductionReadyReadModelStore()
        );
    const refreshSalesOrderSummaryUseCase =
        new RefreshSalesOrderSummaryReadModelUseCase(
            new SalesOrderSummaryReadModelStore(),
            new SalesOrderStageTransitionStore()
        );

    // ── SYNC_GLOBAL: Sincronizar todos os pedidos (paginado) ──────────

    registerJobHandler<SyncGlobalJobData>(
        "sales-order.sync-global",
        async (job) => {
            const { externalRequestId, pageSize, maxPages, source } = job.data;

            logger.info("Processing sales-order sync-global", {
                externalRequestId,
                pageSize,
                maxPages,
                source,
            });

            const syncStateStore = new PrismaSyncStateStore(
                prisma.salesOrderSyncState,
                "GLOBAL"
            );

            const useCase = new SyncAllSalesOrdersUseCase(
                fetchPageGateway,
                integrationStore,
                commandStore,
                syncStateStore,
                refreshProductCatalogUseCase,
                refreshSalesOrderSummaryUseCase,
                { noWrite: isFake }
            );

            const result = await useCase.execute({
                externalRequestId,
                pageSize: pageSize ?? 100,
                maxPages: maxPages ?? 1000,
                source: source ?? "JOB",
            });

            logger.info("Sales-order sync-global completed", {
                externalRequestId,
                result,
            });
        },
        { concurrency: 1, batchSize: 1 }
    );
}
