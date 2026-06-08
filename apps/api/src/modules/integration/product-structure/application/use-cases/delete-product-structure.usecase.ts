import type { ProductStructureDeleteGateway } from "../ports/product-structure-delete.gateway";
import type { ProductStructureFetchGateway } from "../ports/product-structure-fetch.gateway";
import type { ProductStructureIntegrationStore } from "../../infrastructure/db/product-structure-integration.store";

export type DeleteProductStructureCommand = {
  externalRequestId: string;
  productCode: string;
};

export class DeleteProductStructureUseCase {
  constructor(
    private readonly deleteGateway: ProductStructureDeleteGateway,
    private readonly fetchGateway: ProductStructureFetchGateway,
    private readonly store: ProductStructureIntegrationStore,
    private readonly options: { noWrite?: boolean } = {}
  ) {}

  async execute(command: DeleteProductStructureCommand): Promise<void> {
    if (this.options.noWrite) {
      await this.deleteGateway.delete(command.productCode);
      return;
    }

    await this.deleteGateway.delete(command.productCode);

    // Depois de excluir no Omie, sincroniza para refletir estado final
    const result = await this.fetchGateway.fetchByProductCode(command.productCode);
    await this.store.save(result);
  }
}