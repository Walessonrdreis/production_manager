// ---------------------------------------------------------------------------
// Job — Sync all production orders from Omie
// ---------------------------------------------------------------------------
// Segue o padrão de ReconcileProductStructuresJob.
// ---------------------------------------------------------------------------

import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import { env } from "@/config";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { PrismaSyncStateStore } from "@/shared/integration/strategies/sync-state.store";

import { ProductionOrderCommandStore } from "@/modules/integration/production-orders/infrastructure/db/production-order-command.store";
import { ProductionOrderSyncStore } from "@/modules/integration/production-orders/infrastructure/db/production-order-sync.store";
import { SyncAllProductionOrdersUseCase } from "@/modules/integration/production-orders/application/use-cases/sync-all-production-orders.usecase";
import { FakeProductionOrderSyncPageGateway } from "@/modules/integration/production-orders/infrastructure/gateways/sync-page/fake-production-order-sync-page.gateway";
import { RealProductionOrderSyncPageGateway } from "@/modules/integration/production-orders/infrastructure/gateways/sync-page/real-production-order-sync-page.gateway";

type ExecuteInput = {
    source: "JOB";
    omieClient: OmieHttpClientPort;
    fullSync?: boolean;
};

export class SyncAllProductionOrdersJob {
    static async execute({ source, omieClient }: ExecuteInput): Promise<void> {
        const logger = getLogger("production-orders:sync-job");

        const isFake = env.PRODUCTION_ORDER_GATEWAY === "fake";

        const fetchPageGateway = isFake
            ? new FakeProductionOrderSyncPageGateway()
            : new RealProductionOrderSyncPageGateway(omieClient);

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

        const externalRequestId = `production-orders-sync-${Date.now()}`;

        logger.info("Syncing production orders", {
            source,
            gatewayMode: isFake ? "fake" : "real",
        });

        await useCase.execute({
            externalRequestId,
            source: "JOB",
            fullSync: fullSync ?? false,
        });

        logger.info("Finished production orders sync job", { externalRequestId });
    }
}
