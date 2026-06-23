// ---------------------------------------------------------------------------
// Product Structure — PgBoss Job Handlers
// ---------------------------------------------------------------------------
// Registra handlers para processar comandos de estrutura de produto via PgBoss.
//
// Substitui o queue processor legado (process-product-structure-queue.job.ts)
// que usava SKIP LOCKED + polling 1s.
//
// Cada handler corresponde a um commandType:
//   product-structure.sync        → SYNC
//   product-structure.apply       → APPLY
//   product-structure.delete      → DELETE
//   product-structure.sync-global → SYNC_GLOBAL
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
import { registerJobHandler } from "@/shared/infra/job-queue";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import type { ApplyProductStructureItem } from "../../application/ports/product-structure-apply.gateway";

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

// ─── Use Cases (função auxiliar exportada) ────────────────────────────

import { executeSyncAllProductStructures } from "../../application/use-cases/sync-all-product-structures.usecase";

// ─── Types para dados dos jobs ────────────────────────────────────────

type SyncJobData = {
    externalRequestId: string;
    productCode: string;
};

type ApplyJobData = {
    externalRequestId: string;
    productCode: string;
    items: ApplyProductStructureItem[];
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
 * Deve ser chamado durante o bootstrap, ANTES de `startWorker()`.
 */
export function registerProductStructureJobHandlers(omieClient: OmieHttpClientPort): void {
    const commandStore = new ProductStructureCommandStore(prisma);
    const integrationStore = new ProductStructureIntegrationStore(prisma);
    const { isFake, fetchGateway, applyGateway, deleteGateway, fetchPageGateway } = createGateways(omieClient);

    // ── 1. SYNC: Sincronizar estrutura individual ─────────────────────

    registerJobHandler<SyncJobData>(
        "product-structure.sync",
        async (job) => {
            const { externalRequestId, productCode } = job.data;
            logger.info("Processing sync", { externalRequestId, productCode });

            if (!isFake) {
                const result = await fetchGateway.fetchByProductCode(productCode);
                await integrationStore.save(result);
            }

            await commandStore.markConfirmed(externalRequestId);
            logger.info("Sync completed", { externalRequestId, productCode });
        },
        { concurrency: 3, batchSize: 1 }
    );

    // ── 2. APPLY: Aplicar estrutura no Omie ───────────────────────────

    registerJobHandler<ApplyJobData>(
        "product-structure.apply",
        async (job) => {
            const { externalRequestId, productCode, items } = job.data;
            logger.info("Processing apply", { externalRequestId, productCode, itemsCount: items.length });

            if (!isFake) {
                await applyGateway.apply(productCode, items);

                // Pós-apply: sincroniza espelho local
                const result = await fetchGateway.fetchByProductCode(productCode);
                await integrationStore.save(result);
            }

            await commandStore.markConfirmed(externalRequestId);
            logger.info("Apply completed", { externalRequestId, productCode });
        },
        { concurrency: 1, batchSize: 1 }
    );

    // ── 3. DELETE: Excluir estrutura no Omie ──────────────────────────

    registerJobHandler<DeleteJobData>(
        "product-structure.delete",
        async (job) => {
            const { externalRequestId, productCode } = job.data;
            logger.info("Processing delete", { externalRequestId, productCode });

            if (!isFake) {
                await deleteGateway.delete(productCode);

                // Pós-delete: atualiza espelho
                const result = await fetchGateway.fetchByProductCode(productCode);
                await integrationStore.save(result);
            }

            await commandStore.markConfirmed(externalRequestId);
            logger.info("Delete completed", { externalRequestId, productCode });
        },
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
                    }
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
