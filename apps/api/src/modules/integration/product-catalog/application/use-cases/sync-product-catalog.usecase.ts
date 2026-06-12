import type { ProductCatalogFetchGateway } from "../ports/product-catalog-fetch.gateway";
import { ProductCatalogIntegrationStore } from "../../infrastructure/db/product-catalog-integration.store";
import { ProductCatalogCommandStore } from "../../infrastructure/db/product-catalog-command.store";

export type SyncProductCatalogCommand = {
  externalRequestId: string;
  productCode: string;
  source?: "API2" | "JOB" | "ADMIN";
};

export class SyncProductCatalogUseCase {
  constructor(
    private readonly fetchGateway: ProductCatalogFetchGateway,
    private readonly integrationStore: ProductCatalogIntegrationStore,
    private readonly commandStore: ProductCatalogCommandStore,
    private readonly options: { noWrite?: boolean } = {}
  ) {}

  async execute(command: SyncProductCatalogCommand) {
    if (this.options.noWrite) {
      await this.fetchGateway.fetchByProductCode(command.productCode);

      return {
        status: "ACCEPTED" as const,
        externalRequestId: command.externalRequestId,
        productCode: command.productCode,
      };
    }

    const { record, created } = await this.commandStore.getOrCreateAccepted({
      externalRequestId: command.externalRequestId,
      productCode: command.productCode,
      commandType: "SYNC",
      source: command.source ?? "API2",
    });

    if (!created) {
      return {
        status: record.status,
        externalRequestId: command.externalRequestId,
        productCode: command.productCode,
      };
    }

    try {
      const externalProduct = await this.fetchGateway.fetchByProductCode(
        command.productCode
      );

      if (!externalProduct) {
        throw new Error(`Produto não encontrado no Omie: ${command.productCode}`);
      }

      await this.integrationStore.upsertFromExternal({
        productCode: externalProduct.productCode,
        omieId: externalProduct.omieId,
        sku: externalProduct.sku,
        description: externalProduct.description,
        familyDescription: externalProduct.familyDescription,
        active: externalProduct.active,
        rawPayload: externalProduct.rawPayload,
      });

      await this.commandStore.markConfirmed(command.externalRequestId);

      return {
        status: "ACCEPTED" as const,
        externalRequestId: command.externalRequestId,
        productCode: externalProduct.productCode,
      };
    } catch (error) {
      await this.commandStore.markFailed(command.externalRequestId, error);
      throw error;
    }
  }
}