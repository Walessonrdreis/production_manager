import type { FastifyInstance } from "fastify";
import { env } from "@/config";
import { getLogger } from "@/shared/logger";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { PrismaSyncStateStore } from "@/shared/integration/strategies/sync-state.store";

import type {
    SyncAllProductStructureRequestDTO,
    SyncAllProductStructureResponseDTO,
} from "../../../../application/dto/sync-all-product-structure.dto";

import { SyncAllProductStructuresUseCase } from "../../../../application/use-cases/sync-all-product-structures.usecase";
import { ProductStructureIntegrationStore } from "../../../../infrastructure/db/product-structure-integration.store";
import { ProductStructureCommandStore } from "../../../../infrastructure/db/product-structure-command.store";

import { FakeProductStructureFetchPageGateway } from "../../../../infrastructure/gateways/fetch-page/fake-product-structure-fetch-page.gateway";
import { RealProductStructureFetchPageGateway } from "../../../../infrastructure/gateways/fetch-page/real-product-structure-fetch-page.gateway";

const logger = getLogger("sync-all-product-structures.route");

export function registerSyncAllProductStructuresRoute(app: FastifyInstance) {
    app.post(
        "/v1/integration/product-structure/commands/sync-global",
        async (request, reply) => {
            const body = (request.body as SyncAllProductStructureRequestDTO | undefined) ?? {};

            const externalRequestId =
                body.externalRequestId ?? `product-structure-global-${Date.now()}`;

            const omieClient = (app as any).omieClient as OmieHttpClientPort;
            const isFake = env.PRODUCT_STRUCTURE_GATEWAY === "fake";
            const prisma = (app as any).prisma;

            const fetchPageGateway = isFake
                ? new FakeProductStructureFetchPageGateway()
                : new RealProductStructureFetchPageGateway(omieClient);

            const syncStateStore = new PrismaSyncStateStore(
                prisma.productStructureSyncState,
                "GLOBAL"
            );

            const useCase = new SyncAllProductStructuresUseCase(
                fetchPageGateway,
                new ProductStructureIntegrationStore(prisma),
                new ProductStructureCommandStore(prisma),
                syncStateStore,
                { noWrite: isFake }
            );

            void useCase
                .execute({
                    externalRequestId,
                    pageSize: body.pageSize,
                    maxPages: body.maxPages,
                    source: "API2",
                })
                .catch((error) => {
                    logger.error("Sync global failed", error as any);
                });

            const response: SyncAllProductStructureResponseDTO = {
                status: "ACCEPTED",
                externalRequestId,
                resourceId: "__GLOBAL__",
            };

            return reply.code(202).send({
                success: true,
                data: response,
            });
        }
    );
}
