import type { ProductStructureFetchGateway } from "../ports/product-structure-fetch.gateway";
import type { ProductStructureIntegrationStore } from "../../infrastructure/db/product-structure-integration.store";
import type { ProductStructureCommandStore } from "../../infrastructure/db/product-structure-command.store";
import type { ProductStructureCommandSource, ProductStructureCommandType } from "@prisma/client";

export type SyncProductStructureCommand = {
  externalRequestId: string;
  productCode: string;
  source?: ProductStructureCommandSource; // API2 | JOB | ADMIN
};

export class SyncProductStructureUseCase {
  constructor(
    private readonly gateway: ProductStructureFetchGateway,
    private readonly store: ProductStructureIntegrationStore,
    private readonly commandStore: ProductStructureCommandStore,
    private readonly options: { noWrite?: boolean } = {}
  ) {}

  async execute(command: SyncProductStructureCommand) {
    // Fake no-write: não cria tracking e não escreve espelho
    if (this.options.noWrite) {
      await this.gateway.fetchByProductCode(command.productCode);
      return { status: "ACCEPTED" as const, externalRequestId: command.externalRequestId };
    }

    const { record, created } = await this.commandStore.getOrCreateAccepted({
      externalRequestId: command.externalRequestId,
      productCode: command.productCode,
      commandType: "SYNC" as ProductStructureCommandType,
      source: command.source ?? "API2",
    });

    // Idempotência: se já existia, não reexecuta
    if (!created) {
      return { status: record.status, externalRequestId: record.externalRequestId };
    }

    try {
      const result = await this.gateway.fetchByProductCode(command.productCode);
      await this.store.save(result);

      await this.commandStore.markConfirmed(command.externalRequestId);
      return { status: "CONFIRMED" as const, externalRequestId: command.externalRequestId };
    } catch (err) {
      await this.commandStore.markFailed(command.externalRequestId, err);
      return { status: "FAILED" as const, externalRequestId: command.externalRequestId };
    }
  }
}