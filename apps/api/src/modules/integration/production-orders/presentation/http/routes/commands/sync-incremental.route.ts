// ---------------------------------------------------------------------------
// Route — Sync Incremental Production Orders (Command)
// ---------------------------------------------------------------------------
// POST /v1/integration/production-orders/commands/sync-incremental
// Sync incremental: busca apenas OPs alteradas desde a última sync.
// Usa o mesmo use case SyncAllProductionOrdersUseCase com fullSync: false.
//
// C1-P0: Comando para sincronização leve (apenas deltas).
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { env } from "@/config";
import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { PrismaSyncStateStore } from "@/shared/integration/strategies/sync-state.store";
import { SyncHooksRunner } from "@/shared/integration/strategies/sync-hooks";

import type {
    SyncIncrementalRequestDTO,
    SyncIncrementalResponseDTO,
} from "../../../../application/dto/sync-incremental.dto";

import { SyncAllProductionOrdersUseCase } from "../../../../application/use-cases/sync-all-production-orders.usecase";
import { ProductionOrderCommandStore } from "../../../../infrastructure/db/production-order-command.store";
import { ProductionOrderSyncStore } from "../../../../infrastructure/db/production-order-sync.store";

import { FakeProductionOrderSyncPageGateway } from "../../../../infrastructure/gateways/sync-page/fake-production-order-sync-page.gateway";
import { RealProductionOrderSyncPageGateway } from "../../../../infrastructure/gateways/sync-page/real-production-order-sync-page.gateway";

const logger = getLogger("sync-incremental.route");

export async function registerSyncIncrementalRoute(app: FastifyInstance) {
    app.post("/v1/integration/production-orders/commands/sync-incremental", async (request, reply) => {
        try {
            const body = (request.body as SyncIncrementalRequestDTO) ?? {};

            const externalRequestId =
                body.externalRequestId ?? `production-orders-incremental-${Date.now()}`;

            const isFake = env.PRODUCTION_ORDER_GATEWAY === "fake";

            const fetchPageGateway = isFake
                ? new FakeProductionOrderSyncPageGateway()
                : new RealProductionOrderSyncPageGateway(
                    (app as any).omieClient as OmieHttpClientPort
                );

            const syncStateStore = new PrismaSyncStateStore(
                prisma.productionOrderSyncState,
                "GLOBAL"
            );

            const useCase = new SyncAllProductionOrdersUseCase(
                fetchPageGateway,
                new ProductionOrderSyncStore(prisma),
                new ProductionOrderCommandStore(prisma),
                syncStateStore,
                { noWrite: isFake }
            );

            const hooks = new SyncHooksRunner();

            void useCase
                .execute(
                    {
                        externalRequestId,
                        pageSize: body.pageSize ?? 100,
                        maxPages: body.maxPages ?? 500,
                        source: "API2",
                        fullSync: false,
                    },
                    hooks
                )
                .catch((error) => {
                    logger.error("Sync incremental failed", error as any);
                });

            const response: SyncIncrementalResponseDTO = {
                status: "ACCEPTED",
                externalRequestId,
                resourceId: "__INCREMENTAL__",
            };

            return reply.code(202).send({
                success: true,
                data: response,
            });
        } catch (error) {
            logger.error("[SYNC-INCREMENTAL][ERROR]", error as any);
            return reply.code(500).send({
                success: false,
                error: "INTERNAL_ERROR",
                message: "An unexpected error occurred",
            });
        }
    });
}
