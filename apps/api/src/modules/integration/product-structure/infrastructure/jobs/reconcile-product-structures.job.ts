import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { ProductStructureCommandStore } from "@/modules/integration/product-structure/infrastructure/db/product-structure-command.store";
import { ProductStructureIntegrationStore } from "@/modules/integration/product-structure/infrastructure/db/product-structure-integration.store";
import { RealProductStructureFetchGateway } from "@/modules/integration/product-structure/infrastructure/gateways/fetch/real-product-structure-fetch.gateway";

type ExecuteInput = {
  source: "JOB";
  omieClient: OmieHttpClientPort;
};

export class ReconcileProductStructuresJob {
  static async execute({ source, omieClient }: ExecuteInput): Promise<void> {
    const logger = getLogger("product-structure:reconcile-job");

    const fetchGateway = new RealProductStructureFetchGateway(omieClient);
    const commandStore = new ProductStructureCommandStore(prisma);
    const integrationStore = new ProductStructureIntegrationStore(prisma);

    logger.info("Reconciling product structures", { source });

    // Aqui você pode implementar a estratégia final (ListarEstruturas + sync etc.)
    // Por enquanto, exemplo simples: nada impede você de trocar depois.
    // ...

    logger.info("Finished product structure reconciliation job");
  }
}