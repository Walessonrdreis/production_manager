import { enqueueJob } from "@/shared/infra/job-queue";
import type { ProductStructureApplyGateway, ApplyProductStructureItem } from "../ports/product-structure-apply.gateway";
import type { ProductStructureFetchGateway } from "../ports/product-structure-fetch.gateway";
import type { ProductStructureIntegrationStore } from "../../infrastructure/db/product-structure-integration.store";
import type { ProductStructureCommandStore } from "../../infrastructure/db/product-structure-command.store";
import type { ProductStructureCommandSourceEnum } from "../../infrastructure/db/product-structure-command.store";

export type ApplyProductStructureCommand = {
  externalRequestId: string;
  productCode: string;
  items: ApplyProductStructureItem[];
  source?: ProductStructureCommandSourceEnum;
};

/**
 * Use case — Apply product structure (BOM) to Omie
 *
 * Queue pattern:
 * - noWrite (fake) → executa direto, sem tracking
 * - Real → enfileira (PENDING) e retorna 202; queue processor executa depois
 */
export class ApplyProductStructureUseCase {
  constructor(
    private readonly applyGateway: ProductStructureApplyGateway,
    private readonly fetchGateway: ProductStructureFetchGateway,
    private readonly store: ProductStructureIntegrationStore,
    private readonly commandStore: ProductStructureCommandStore,
    private readonly options: { noWrite?: boolean } = {}
  ) { }

  async execute(command: ApplyProductStructureCommand) {
    // ─── Modo no-write (fake): executa direto sem tracking ──────────
    if (this.options.noWrite) {
      await this.applyGateway.apply(command.productCode, command.items);
      return { status: "ACCEPTED" as const, externalRequestId: command.externalRequestId };
    }

    // ─── Modo real: enfileira para processamento assíncrono ─────────
    const { record, created } = await this.commandStore.enqueue({
      externalRequestId: command.externalRequestId,
      productCode: command.productCode,
      commandType: "APPLY",
      payload: {
        productCode: command.productCode,
        items: command.items,
      },
      source: command.source ?? "API2",
    });

    // Idempotência: se já existe, retorna status atual
    if (!created) {
      return { status: record.status as any, externalRequestId: record.externalRequestId };
    }

    // Enfileira no PgBoss para processamento assíncrono
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