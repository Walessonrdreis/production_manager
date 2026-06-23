import type { ProductStructureDeleteGateway } from "../ports/product-structure-delete.gateway";
import type { ProductStructureFetchGateway } from "../ports/product-structure-fetch.gateway";
import type { ProductStructureIntegrationStore } from "../../infrastructure/db/product-structure-integration.store";
import type { ProductStructureCommandStore } from "../../infrastructure/db/product-structure-command.store";
import type { ProductStructureCommandSourceEnum } from "../../infrastructure/db/product-structure-command.store";

export type DeleteProductStructureCommand = {
  externalRequestId: string;
  productCode: string;
  source?: ProductStructureCommandSourceEnum;
};

/**
 * Use case — Delete product structure (BOM) from Omie
 *
 * Queue pattern:
 * - noWrite (fake) → executa direto, sem tracking
 * - Real → enfileira (PENDING) e retorna 202; queue processor executa depois
 */
export class DeleteProductStructureUseCase {
  constructor(
    private readonly deleteGateway: ProductStructureDeleteGateway,
    private readonly fetchGateway: ProductStructureFetchGateway,
    private readonly store: ProductStructureIntegrationStore,
    private readonly commandStore: ProductStructureCommandStore,
    private readonly options: { noWrite?: boolean } = {}
  ) { }

  async execute(command: DeleteProductStructureCommand) {
    // ─── Modo no-write (fake): executa direto sem tracking ──────────
    if (this.options.noWrite) {
      await this.deleteGateway.delete(command.productCode);
      return { status: "ACCEPTED" as const, externalRequestId: command.externalRequestId };
    }

    // ─── Modo real: enfileira para processamento assíncrono ─────────
    const { record, created } = await this.commandStore.enqueue({
      externalRequestId: command.externalRequestId,
      productCode: command.productCode,
      commandType: "DELETE",
      payload: { productCode: command.productCode },
      source: command.source ?? "API2",
    });

    // Idempotência: se já existe, retorna status atual
    if (!created) {
      return { status: record.status as any, externalRequestId: record.externalRequestId };
    }

    return { status: "ACCEPTED" as const, externalRequestId: command.externalRequestId };
  }
}