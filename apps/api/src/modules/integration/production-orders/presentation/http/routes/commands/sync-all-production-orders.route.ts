// ---------------------------------------------------------------------------
// Route — Sync All Production Orders (Command)
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { env } from "@/config";
import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { PrismaSyncStateStore } from "@/shared/integration/strategies/sync-state.store";
import { SyncHooksRunner } from "@/shared/integration/strategies/sync-hooks";

import type {
    SyncAllProductionOrdersRequestDTO,
    SyncAllProductionOrdersResponseDTO,
} from "../../../../application/dto/sync-all-production-orders.dto";

import { SyncAllProductionOrdersUseCase } from "../../../../application/use-cases/sync-all-production-orders.usecase";
import { ProductionOrderCommandStore } from "../../../../infrastructure/db/production-order-command.store";
import { ProductionOrderSyncStore } from "../../../../infrastructure/db/production-order-sync.store";

import { FakeProductionOrderSyncPageGateway } from "../../../../infrastructure/gateways/sync-page/fake-production-order-sync-page.gateway";
import { RealProductionOrderSyncPageGateway } from "../../../../infrastructure/gateways/sync-page/real-production-order-sync-page.gateway";

const logger = getLogger("sync-all-production-orders.route");

export async function registerSyncAllProductionOrdersRoute(app: FastifyInstance) {
    app.post("/v1/integration/production-orders/commands/sync-global", async (request, reply) => {
        const body = (request.body as SyncAllProductionOrdersRequestDTO | undefined) ?? {};

        const externalRequestId =
            body.externalRequestId ?? `production-orders-global-${Date.now()}`;

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
                    pageSize: body.pageSize,
                    maxPages: body.maxPages,
                    source: "API2",
                    fullSync: true,
                },
                hooks
            )
            .catch((error) => {
                logger.error("Sync global failed", error as any);
            });

        const response: SyncAllProductionOrdersResponseDTO = {
            status: "ACCEPTED",
            externalRequestId,
            resourceId: "__GLOBAL__",
        };

        return reply.code(202).send({
            success: true,
            data: response,
        });
    });
}
