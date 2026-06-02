// apps/api/src/modules/integration/product-structure/application/use-cases/sync-product-structure.usecase.ts

import { ProductStructureFetchGateway } from "../ports/product-structure-fetch.gateway";
import { ProductStructureIntegrationStore } from "../../infrastructure/db/product-structure-integration.store";

export class SyncProductStructureUseCase {
  constructor(
    private readonly gateway: ProductStructureFetchGateway,
    private readonly store: ProductStructureIntegrationStore
  ) {}

  async execute(productCode: string): Promise<void> {
    const result = await this.gateway.fetchByProductCode(productCode);
    await this.store.save(result);
  }
}