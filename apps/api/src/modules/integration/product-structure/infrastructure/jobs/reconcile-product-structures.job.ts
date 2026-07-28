import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import { env } from "@/config";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { PrismaSyncStateStore } from "@/shared/integration/strategies/sync-state.store";

import { ProductStructureCommandStore } from "@/modules/integration/product-structure/infrastructure/db/product-structure-command.store";
import { ProductStructureIntegrationStore } from "@/modules/integration/product-structure/infrastructure/db/product-structure-integration.store";
import { SyncAllProductStructuresUseCase } from "@/modules/integration/product-structure/application/use-cases/sync-all-product-structures.usecase";
import { FakeProductStructureFetchPageGateway } from "@/modules/integration/product-structure/infrastructure/gateways/fetch-page/fake-product-structure-fetch-page.gateway";
import { RealProductStructureFetchPageGateway } from "@/modules/integration/product-structure/infrastructure/gateways/fetch-page/real-product-structure-fetch-page.gateway";

type ExecuteInput = {
  source: "JOB";
  omieClient: OmieHttpClientPort;
};

export class ReconcileProductStructuresJob {
  static async execute({ source, omieClient }: ExecuteInput): Promise<void> {
    const logger = getLogger("product-structure:reconcile-job");

    const isFake = env.PRODUCT_STRUCTURE_GATEWAY === "fake";

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

    const externalRequestId = `product-structure-reconcile-${Date.now()}`;

    logger.info("Reconciling product structures", { source, gatewayMode: isFake ? "fake" : "real" });

    await useCase.execute({
      externalRequestId,
      source: "JOB",
    });

    logger.info("Finished product structure reconciliation job", { externalRequestId });
  }
}