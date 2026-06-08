import type { ProductStructureApplyGateway, ApplyProductStructureItem } from "../ports/product-structure-apply.gateway";
import type { ProductStructureFetchGateway } from "../ports/product-structure-fetch.gateway";
import type { ProductStructureIntegrationStore } from "../../infrastructure/db/product-structure-integration.store";
import type { ProductStructureCommandStore } from "../../infrastructure/db/product-structure-command.store";
import type { ProductStructureCommandSource, ProductStructureCommandType } from "@prisma/client";

export type ApplyProductStructureCommand = {
  externalRequestId: string;
  productCode: string;
  items: ApplyProductStructureItem[];
  source?: ProductStructureCommandSource;
};

export class ApplyProductStructureUseCase {
  constructor(
    private readonly applyGateway: ProductStructureApplyGateway,
    private readonly fetchGateway: ProductStructureFetchGateway,
    private readonly store: ProductStructureIntegrationStore,
    private readonly commandStore: ProductStructureCommandStore,
    private readonly options: { noWrite?: boolean } = {}
  ) {}

  async execute(command: ApplyProductStructureCommand) {
    // Fake no-write: simula apply sem tracking e sem escrita local
    if (this.options.noWrite) {
      await this.applyGateway.apply(command.productCode, command.items);
      return { status: "ACCEPTED" as const, externalRequestId: command.externalRequestId };
    }

    const { record, created } = await this.commandStore.getOrCreateAccepted({
      externalRequestId: command.externalRequestId,
      productCode: command.productCode,
      commandType: "APPLY" as ProductStructureCommandType,
      source: command.source ?? "API2",
    });

    if (!created) {
      return { status: record.status, externalRequestId: record.externalRequestId };
    }

    try {
      await this.applyGateway.apply(command.productCode, command.items);

      // Após aplicar no Omie, sincroniza estado real e persiste no espelho
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