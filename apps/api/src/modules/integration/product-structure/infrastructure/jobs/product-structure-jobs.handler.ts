// ---------------------------------------------------------------------------
// Product Structure — PgBoss Job Handlers
// ---------------------------------------------------------------------------
// BRIDGE: Apenas cria as dependências e delega para os use-cases.
// Nenhuma lógica de negócio aqui — toda regra está nos use-cases.
//
// Substitui o queue processor legado (process-product-structure-queue.job.ts)
// que usava SKIP LOCKED + polling 1s.
//
// O PgBoss gerencia:
//   - Concorrência (localConcurrency por tipo)
//   - Retry com backoff exponencial (retryLimit + retryBackoff)
//   - Singleton key (evita duplicatas)
//   - Entrega event-driven (LISTEN/NOTIFY)
// ---------------------------------------------------------------------------

import { env } from "@/config";
import { prisma } from "@/shared/db/prisma";
import { getLogger } from "@/shared/logger";
import { PrismaSyncStateStore } from "@/shared/integration/strategies/sync-state.store";
import { SyncHooksRunner } from "@/shared/integration/strategies/sync-hooks";
import { RefreshProductCatalogProductionReadyUseCase } from "@/modules/integration/product-catalog/application/use-cases/refresh-product-catalog-production-ready.usecase";
import { ProductCatalogProductionReadyReadModelStore } from "@/modules/integration/product-catalog/infrastructure/db/product-catalog-production-ready-read-model.store";
import { registerJobHandler } from "@/shared/infra/job-queue";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

// ─── Use Cases ────────────────────────────────────────────────────────

import { ProcessSyncProductStructureUseCase } from "../../application/use-cases/process-sync-product-structure.usecase";
import { ProcessApplyProductStructureUseCase } from "../../application/use-cases/process-apply-product-structure.usecase";
import { ProcessDeleteProductStructureUseCase } from "../../application/use-cases/process-delete-product-structure.usecase";
import { executeSyncAllProductStructures } from "../../application/use-cases/sync-all-product-structures.usecase";

// ─── Stores ───────────────────────────────────────────────────────────

import { ProductStructureCommandStore } from "../../infrastructure/db/product-structure-command.store";
import { ProductStructureIntegrationStore } from "../../infrastructure/db/product-structure-integration.store";

// ─── Gateways: Fetch ──────────────────────────────────────────────────

import { FakeProductStructureFetchGateway } from "../../infrastructure/gateways/fetch/fake-product-structure-fetch.gateway";
import { RealProductStructureFetchGateway } from "../../infrastructure/gateways/fetch/real-product-structure-fetch.gateway";
import type { ProductStructureFetchGateway } from "../../application/ports/product-structure-fetch.gateway";

// ─── Gateways: Fetch Page ─────────────────────────────────────────────

import { FakeProductStructureFetchPageGateway } from "../../infrastructure/gateways/fetch-page/fake-product-structure-fetch-page.gateway";
import { RealProductStructureFetchPageGateway } from "../../infrastructure/gateways/fetch-page/real-product-structure-fetch-page.gateway";
import type { ProductStructureFetchPageGateway } from "../../application/ports/product-structure-fetch-page.gateway";

// ─── Gateways: Apply ──────────────────────────────────────────────────

import { FakeProductStructureApplyGateway } from "../../infrastructure/gateways/apply/fake-product-structure-apply.gateway";
import { RealProductStructureApplyGateway } from "../../infrastructure/gateways/apply/real-product-structure-apply.gateway";
import type { ProductStructureApplyGateway } from "../../application/ports/product-structure-apply.gateway";

// ─── Gateways: Delete ─────────────────────────────────────────────────

import { FakeProductStructureDeleteGateway } from "../../infrastructure/gateways/delete/fake-product-structure-delete.gateway";
import { RealProductStructureDeleteGateway } from "../../infrastructure/gateways/delete/real-product-structure-delete.gateway";
import type { ProductStructureDeleteGateway } from "../../application/ports/product-structure-delete.gateway";

// ─── Types para dados dos jobs ────────────────────────────────────────

type SyncJobData = {
    externalRequestId: string;
    productCode: string;
};

type ApplyJobData = {
    externalRequestId: string;
    productCode: string;
    items: import("../../application/ports/product-structure-apply.gateway").ApplyProductStructureItem[];
};

type DeleteJobData = {
    externalRequestId: string;
    productCode: string;
};

type SyncGlobalJobData = {
    externalRequestId: string;
    pageSize?: number;
    maxPages?: number;
};

// ─── Logger ───────────────────────────────────────────────────────────

const logger = getLogger("product-structure:pgboss-handler");

// ─── Factory helpers ──────────────────────────────────────────────────

function createGateways(omieClient: OmieHttpClientPort) {
    const isFake = env.PRODUCT_STRUCTURE_GATEWAY === "fake";

    const fetchGateway: ProductStructureFetchGateway = isFake
        ? new FakeProductStructureFetchGateway()
        : new RealProductStructureFetchGateway(omieClient);

    const applyGateway: ProductStructureApplyGateway = isFake
        ? new FakeProductStructureApplyGateway()
        : new RealProductStructureApplyGateway(omieClient);

    const deleteGateway: ProductStructureDeleteGateway = isFake
        ? new FakeProductStructureDeleteGateway()
        : new RealProductStructureDeleteGateway(omieClient);

    const fetchPageGateway: ProductStructureFetchPageGateway = isFake
        ? new FakeProductStructureFetchPageGateway()
        : new RealProductStructureFetchPageGateway(omieClient);

    return { isFake, fetchGateway, applyGateway, deleteGateway, fetchPageGateway };
}

// ─── Registro dos Handlers ────────────────────────────────────────────

/**
 * Registra todos os handlers PgBoss para o módulo product-structure.
 * Bridge pura: cria use-cases com gateways injetados e registra handlers
 * que delegam para os use-cases.
 *
 * Deve ser chamado durante o bootstrap, ANTES de `startWorker()`.
 */
export function registerProductStructureJobHandlers(omieClient: OmieHttpClientPort): void {
    const commandStore = new ProductStructureCommandStore(prisma);
    const integrationStore = new ProductStructureIntegrationStore(prisma);
    const { isFake, fetchGateway, applyGateway, deleteGateway, fetchPageGateway } = createGateways(omieClient);

    // ── Instancia use-cases de processamento ──────────────────────────
    // Toda a lógica de negócio (gateway, store, markConfirmed) está dentro
    // dos use-cases. O handler é apenas uma ponte.

    const syncUseCase = new ProcessSyncProductStructureUseCase(
        fetchGateway, integrationStore, commandStore, { isFake }
    );

    const applyUseCase = new ProcessApplyProductStructureUseCase(
        applyGateway, fetchGateway, integrationStore, commandStore, { isFake }
    );

    const deleteUseCase = new ProcessDeleteProductStructureUseCase(
        deleteGateway, fetchGateway, integrationStore, commandStore, { isFake }
    );

    // ── 1. SYNC: Sincronizar estrutura individual ─────────────────────

    registerJobHandler<SyncJobData>(
        "product-structure.sync",
        (job) => syncUseCase.execute(job.data),
        { concurrency: 3, batchSize: 1 }
    );

    // ── 2. APPLY: Aplicar estrutura no Omie ───────────────────────────

    registerJobHandler<ApplyJobData>(
        "product-structure.apply",
        (job) => applyUseCase.execute(job.data),
        { concurrency: 1, batchSize: 1 }
    );

    // ── 3. DELETE: Excluir estrutura no Omie ──────────────────────────

    registerJobHandler<DeleteJobData>(
        "product-structure.delete",
        (job) => deleteUseCase.execute(job.data),
        { concurrency: 1, batchSize: 1 }
    );

    // ── 4. SYNC_GLOBAL: Sincronizar estruturas completas (paginação) ──

    registerJobHandler<SyncGlobalJobData>(
        "product-structure.sync-global",
        async (job) => {
            const { externalRequestId, pageSize, maxPages } = job.data;
            logger.info("Processing sync-global", { externalRequestId, pageSize, maxPages });

            if (!isFake) {
                const syncStateStore = new PrismaSyncStateStore(
                    prisma.productStructureSyncState,
                    "GLOBAL"
                );

                // ── Hooks pós-sync ──────────────────────────────────
                const hooks = new SyncHooksRunner();

                if (env.FORCE_PRODUCTION_READY_REFRESH_ON_SYNC) {
                    hooks.add({
                        name: "refresh-production-ready",
                        execute: async () => {
                            const useCase = new RefreshProductCatalogProductionReadyUseCase(
                                new ProductCatalogProductionReadyReadModelStore()
                            );
                            await useCase.execute();
                        },
                    });
                }

                await executeSyncAllProductStructures(
                    fetchPageGateway,
                    integrationStore,
                    commandStore,
                    syncStateStore,
                    {
                        externalRequestId,
                        pageSize: pageSize ?? 100,
                        maxPages: maxPages ?? 1000,
                        source: "JOB",
                    },
                    hooks
                );
            } else {
                // Modo fake: apenas marca como confirmado
                await commandStore.markConfirmed(externalRequestId);
            }

            logger.info("Sync-global completed", { externalRequestId });
        },
        { concurrency: 1, batchSize: 1 }
    );

    logger.info("Product-structure PgBoss handlers registered", {
        types: ["product-structure.sync", "product-structure.apply", "product-structure.delete", "product-structure.sync-global"],
    });
}
