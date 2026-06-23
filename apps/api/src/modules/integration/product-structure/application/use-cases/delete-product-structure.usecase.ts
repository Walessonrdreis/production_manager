import { enqueueJob } from "@/shared/infra/job-queue";
import type { ProductStructureDeleteGateway } from "../ports/product-structure-delete.gateway";
import type { ProductStructureFetchGateway } from "../ports/product-structure-fetch.gateway";
import type { ProductStructureIntegrationStore } from "../../infrastructure/db/product-structure-integration.store";

export type DeleteProductStructureCommand = {
  externalRequestId: string;
  productCode: string;
};

/**
 * Use case — Delete product structure (BOM) from Omie
 *
 * - noWrite (fake) → executa direto, sem tracking
 * - Real → enfileira no PgBoss e retorna 202
 */
export class DeleteProductStructureUseCase {
  constructor(
    private readonly deleteGateway: ProductStructureDeleteGateway,
    private readonly fetchGateway: ProductStructureFetchGateway,
    private readonly store: ProductStructureIntegrationStore,
    private readonly options: { noWrite?: boolean } = {}
  ) { }

  async execute(command: DeleteProductStructureCommand) {
    if (this.options.noWrite) {
      await this.deleteGateway.delete(command.productCode);
      return { status: "ACCEPTED" as const, externalRequestId: command.externalRequestId };
    }

    await enqueueJob("product-structure.delete", {
      externalRequestId: command.externalRequestId,
      productCode: command.productCode,
    }, {
      retryLimit: 5,
      retryBackoff: true,
      singletonKey: `product-structure-delete-${command.productCode}`,
    });

    return { status: "ACCEPTED" as const, externalRequestId: command.externalRequestId };
  }
}