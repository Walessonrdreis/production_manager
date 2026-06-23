import { enqueueJob } from "@/shared/infra/job-queue";
import type { ProductStructureFetchGateway } from "../ports/product-structure-fetch.gateway";
import type { ProductStructureIntegrationStore } from "../../infrastructure/db/product-structure-integration.store";
import type { ProductStructureCommandStore } from "../../infrastructure/db/product-structure-command.store";
import type { ProductStructureCommandSourceEnum } from "../../infrastructure/db/product-structure-command.store";

export type SyncProductStructureCommand = {
  externalRequestId: string;
  productCode: string;
  source?: ProductStructureCommandSourceEnum;
};

/**
 * Use case — Sync individual product structure (BOM)
 *
 * Queue pattern:
 * - noWrite (fake) → executa direto, sem tracking
 * - Real → enfileira (PENDING) e retorna 202; queue processor executa depois
 */
export class SyncProductStructureUseCase {
  constructor(
    private readonly gateway: ProductStructureFetchGateway,
    private readonly store: ProductStructureIntegrationStore,
    private readonly commandStore: ProductStructureCommandStore,
    private readonly options: { noWrite?: boolean } = {}
  ) { }

  async execute(command: SyncProductStructureCommand) {
    // ─── Modo no-write (fake): executa direto sem tracking ──────────
    if (this.options.noWrite) {
      await this.gateway.fetchByProductCode(command.productCode);
      return { status: "ACCEPTED" as const, externalRequestId: command.externalRequestId };
    }

    // ─── Modo real: enfileira para processamento assíncrono ─────────
    const { record, created } = await this.commandStore.enqueue({
      externalRequestId: command.externalRequestId,
      productCode: command.productCode,
      commandType: "SYNC",
      payload: { productCode: command.productCode },
      source: command.source ?? "API2",
    });

    // Idempotência: se já existe, retorna status atual
    if (!created) {
      return { status: record.status as any, externalRequestId: record.externalRequestId };
    }

    // Enfileira no PgBoss para processamento assíncrono
    await enqueueJob("product-structure.sync", {
      externalRequestId: command.externalRequestId,
      productCode: command.productCode,
    }, {
      retryLimit: 5,
      retryBackoff: true,
      singletonKey: `product-structure-sync-${command.productCode}`,
    });

    return { status: "ACCEPTED" as const, externalRequestId: command.externalRequestId };
  }
}