import type { ProductStructureApplyGateway, ApplyProductStructureItem } from "../ports/product-structure-apply.gateway";
import type { ProductStructureFetchGateway } from "../ports/product-structure-fetch.gateway";
import type { ProductStructureIntegrationStore } from "../../infrastructure/db/product-structure-integration.store";

export type ApplyProductStructureCommand = {
  externalRequestId: string;
  productCode: string;
  items: ApplyProductStructureItem[];
};

export class ApplyProductStructureUseCase {
  constructor(
    private readonly applyGateway: ProductStructureApplyGateway,
    private readonly fetchGateway: ProductStructureFetchGateway,
    private readonly store: ProductStructureIntegrationStore,
    private readonly options: { noWrite?: boolean } = {}
  ) {}

  async execute(command: ApplyProductStructureCommand): Promise<void> {
    // noWrite é usado para Fake (não poluir DB)
    if (this.options.noWrite) {
      await this.applyGateway.apply(command.productCode, command.items);
      return;
    }

    await this.applyGateway.apply(command.productCode, command.items);

    // Após aplicar no Omie, sincroniza estado real e persiste no espelho
    const result = await this.fetchGateway.fetchByProductCode(command.productCode);
    await this.store.save(result);
  }
}