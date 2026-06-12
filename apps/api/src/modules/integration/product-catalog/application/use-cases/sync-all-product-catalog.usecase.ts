import type { ProductCatalogFetchPageGateway } from "../ports/product-catalog-fetch-page.gateway";
import { ProductCatalogIntegrationStore } from "../../infrastructure/db/product-catalog-integration.store";
import { ProductCatalogCommandStore } from "../../infrastructure/db/product-catalog-command.store";

export type SyncAllProductCatalogCommand = {
  externalRequestId: string;
  pageSize?: number;
  maxPages?: number;
  source?: "API2" | "JOB" | "ADMIN";
};

export class SyncAllProductCatalogUseCase {
  constructor(
    private readonly fetchPageGateway: ProductCatalogFetchPageGateway,
    private readonly integrationStore: ProductCatalogIntegrationStore,
    private readonly commandStore: ProductCatalogCommandStore,
    private readonly options: { noWrite?: boolean } = {}
  ) {}

  async execute(command: SyncAllProductCatalogCommand) {
    const pageSize = Math.max(1, Math.min(Number(command.pageSize || 100), 500));
    const maxPages = Math.max(1, Math.min(Number(command.maxPages || 1000), 10000));

    // ✅ fake = no-write (somente simulação)
    if (this.options.noWrite) {
      let page = 1;
      let processedPages = 0;

      while (processedPages < maxPages) {
        const pageResult = await this.fetchPageGateway.fetchPage(page, pageSize);

        processedPages++;

        if (!pageResult.hasNextPage || pageResult.items.length === 0) {
          break;
        }

        page++;
      }

      return {
        status: "ACCEPTED" as const,
        externalRequestId: command.externalRequestId,
        resourceId: "__GLOBAL__" as const,
      };
    }

    const { record, created } = await this.commandStore.getOrCreateAccepted({
      externalRequestId: command.externalRequestId,
      productCode: "__GLOBAL__",
      commandType: "SYNC",
      source: command.source ?? "API2",
    });

    if (!created) {
      return {
        status: record.status,
        externalRequestId: command.externalRequestId,
        resourceId: "__GLOBAL__" as const,
      };
    }

    try {
      let page = 1;
      let processedPages = 0;

      while (processedPages < maxPages) {
        try {
          const pageResult = await this.fetchPageGateway.fetchPage(page, pageSize);

          for (const item of pageResult.items) {
            await this.integrationStore.upsertFromExternal({
              productCode: item.productCode,
              omieId: item.omieId,
              sku: item.sku,
              description: item.description,
              familyDescription: item.familyDescription,
              active: item.active,
              rawPayload: item.rawPayload,
            });
          }

          processedPages++;

          if (!pageResult.hasNextPage || pageResult.items.length === 0) {
            break;
          }

          page++;
        } catch (error: any) {
          const sample = error?.details?.sample ?? "";
          const message = error?.message ?? "";

          // ✅ CORREÇÃO CRÍTICA: tratar erro da Omie como fim da paginação
          if (
            sample.includes("Não existem registros para a página") ||
            message.includes("Não existem registros para a página")
          ) {
            console.log(`[SYNC] Page ${page} - END OF DATA`);

            break;
          }

          // erro real → continua fatal
          throw error;
        }
      }

      await this.commandStore.markConfirmed(command.externalRequestId);

      return {
        status: "ACCEPTED" as const,
        externalRequestId: command.externalRequestId,
        resourceId: "__GLOBAL__" as const,
      };
    } catch (error) {
      await this.commandStore.markFailed(command.externalRequestId, error);
      throw error;
    }
  }
}