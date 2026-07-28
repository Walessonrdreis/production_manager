import { enqueueJob } from "@/shared/infra/job-queue";
import type { ProductStructureFetchGateway } from "../ports/product-structure-fetch.gateway";
import type { ProductStructureIntegrationStore } from "../../infrastructure/db/product-structure-integration.store";

export type SyncProductStructureCommand = {
  externalRequestId: string;
  productCode: string;
};

/**
 * Use case — Sync individual product structure (BOM)
 *
 * - noWrite (fake) → executa direto, sem tracking
 * - Real → enfileira no PgBoss e retorna 202
 */
export class SyncProductStructureUseCase {
  constructor(
    private readonly gateway: ProductStructureFetchGateway,
    private readonly store: ProductStructureIntegrationStore,
    private readonly options: { noWrite?: boolean } = {}
  ) { }

  async execute(command: SyncProductStructureCommand) {
    if (this.options.noWrite) {
      await this.gateway.fetchByProductCode(command.productCode);
      return { status: "ACCEPTED" as const, externalRequestId: command.externalRequestId };
    }

    await enqueueJob("product-structure.sync", {
      externalRequestId: command.externalRequestId,
      productCode: command.productCode,
    }, {
      retryLimit: 5,
      retryBackoff: true,
      singletonKey: `product-structure-sync-${command.productCode}`,
    });

    return { status: "ACCEPTED" as const, externalRequestId: command.externalRequestId };
  }
}