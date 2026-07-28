import { enqueueJob } from "@/shared/infra/job-queue";
import type { ProductStructureApplyGateway, ApplyProductStructureItem } from "../ports/product-structure-apply.gateway";
import type { ProductStructureFetchGateway } from "../ports/product-structure-fetch.gateway";
import type { ProductStructureIntegrationStore } from "../../infrastructure/db/product-structure-integration.store";

export type ApplyProductStructureCommand = {
  externalRequestId: string;
  productCode: string;
  items: ApplyProductStructureItem[];
};

/**
 * Use case — Apply product structure (BOM) to Omie
 *
 * - noWrite (fake) → executa direto, sem tracking
 * - Real → enfileira no PgBoss e retorna 202
 */
export class ApplyProductStructureUseCase {
  constructor(
    private readonly applyGateway: ProductStructureApplyGateway,
    private readonly fetchGateway: ProductStructureFetchGateway,
    private readonly store: ProductStructureIntegrationStore,
    private readonly options: { noWrite?: boolean } = {}
  ) { }

  async execute(command: ApplyProductStructureCommand) {
    if (this.options.noWrite) {
      await this.applyGateway.apply(command.productCode, command.items);
      return { status: "ACCEPTED" as const, externalRequestId: command.externalRequestId };
    }

    await enqueueJob("product-structure.apply", {
      externalRequestId: command.externalRequestId,
      productCode: command.productCode,
      items: command.items,
    }, {
      retryLimit: 5,
      retryBackoff: true,
      singletonKey: `product-structure-apply-${command.productCode}`,
    });

    return { status: "ACCEPTED" as const, externalRequestId: command.externalRequestId };
  }
}