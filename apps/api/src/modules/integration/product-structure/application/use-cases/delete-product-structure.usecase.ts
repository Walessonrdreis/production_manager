import type { ProductStructureDeleteGateway } from "../ports/product-structure-delete.gateway";
import type { ProductStructureFetchGateway } from "../ports/product-structure-fetch.gateway";
import type { ProductStructureIntegrationStore } from "../../infrastructure/db/product-structure-integration.store";
import type { ProductStructureCommandStore } from "../../infrastructure/db/product-structure-command.store";
import type { ProductStructureCommandSource, ProductStructureCommandType } from "@prisma/client";

export type DeleteProductStructureCommand = {
  externalRequestId: string;
  productCode: string;
  source?: ProductStructureCommandSource;
};

export class DeleteProductStructureUseCase {
  constructor(
    private readonly deleteGateway: ProductStructureDeleteGateway,
    private readonly fetchGateway: ProductStructureFetchGateway,
    private readonly store: ProductStructureIntegrationStore,
    private readonly commandStore: ProductStructureCommandStore,
    private readonly options: { noWrite?: boolean } = {}
  ) {}

  async execute(command: DeleteProductStructureCommand) {
    if (this.options.noWrite) {
      await this.deleteGateway.delete(command.productCode);
      return { status: "ACCEPTED" as const, externalRequestId: command.externalRequestId };
    }

    const { record, created } = await this.commandStore.getOrCreateAccepted({
      externalRequestId: command.externalRequestId,
      productCode: command.productCode,
      commandType: "DELETE" as ProductStructureCommandType,
      source: command.source ?? "API2",
    });

    if (!created) {
      return { status: record.status, externalRequestId: record.externalRequestId };
    }

    try {
      await this.deleteGateway.delete(command.productCode);

      const result = await this.fetchGateway.fetchByProductCode(command.productCode);
      await this.store.save(result);

      await this.commandStore.markConfirmed(command.externalRequestId);
      return { status: "CONFIRMED" as const, externalRequestId: command.externalRequestId };
    } catch (err) {
      await this.commandStore.markFailed(command.externalRequestId, err);
      return { status: "FAILED" as const, externalRequestId: command.externalRequestId };
    }
  }
}