// ---------------------------------------------------------------------------
// Use Case: SyncAllProductStockUseCase
// Sincroniza todos os produtos do estoque no Omie com o banco local.
// Segue o padrão incremental com SyncStateStore.
// ---------------------------------------------------------------------------

import { getLogger } from "@/shared/logger";
import type {
  ProductStockFetchPageGateway,
} from "../ports/product-stock-fetch-page.gateway";
import { RefreshProductCatalogProductionReadyUseCase } from "@/modules/integration/product-catalog/application/use-cases/refresh-product-catalog-production-ready.usecase";
import { fetchPageWithRetry, sleep } from "@/shared/integration/strategies/retry.strategy";
import type { SyncStateStoreContract } from "@/shared/integration/strategies/types";

export type IntegrationStoreContract = {
  upsert(productId: string, data: { stockQuantity: number; minimumStock?: number }): Promise<any>;
  saveMany(items: Array<{ productId: string; stockQuantity: number; minimumStock?: number }>): Promise<any>;
};

export type CommandStoreContract = {
  getOrCreateAccepted(input: {
    externalRequestId: string;
    productOmieId: string;
    commandType: string;
    source?: string;
  }): Promise<{ record: any; created: boolean }>;
  markConfirmed(externalRequestId: string): Promise<any>;
  markFailed(externalRequestId: string, error: unknown): Promise<any>;
};

export type SyncAllProductStockCommand = {
  externalRequestId: string;
  pageSize?: number;
  maxPages?: number;
  source?: "API2" | "JOB" | "ADMIN";
};

export class SyncAllProductStockUseCase {
  private readonly logger = getLogger("SyncAllProductStockUseCase");

  constructor(
    private readonly fetchPageGateway: ProductStockFetchPageGateway,
    private readonly integrationStore: IntegrationStoreContract,
    private readonly commandStore: CommandStoreContract,
    private readonly syncStateStore: SyncStateStoreContract,
    private readonly refreshProductCatalogUseCase?: RefreshProductCatalogProductionReadyUseCase,
    private readonly options: { noWrite?: boolean } = {}
  ) { }

  async execute(command: SyncAllProductStockCommand) {
    const pageSize = Math.max(1, Math.min(Number(command.pageSize || 100), 500));
    const maxPages = Math.max(1, Math.min(Number(command.maxPages || 1000), 10000));

    this.logger.info("Starting product stock global sync", {
      externalRequestId: command.externalRequestId,
      pageSize,
      maxPages,
      source: command.source ?? "API2",
      noWrite: this.options.noWrite === true,
    });

    // Modo noWrite (fake): apenas simula a leitura das páginas
    if (this.options.noWrite) {
      let page = 1;
      let processedPages = 0;
      let processedItems = 0;

      while (processedPages < maxPages) {
        const pageResult = await this.fetchPageGateway.fetchPage({ page, pageSize });

        processedPages += 1;
        processedItems += pageResult.items.length;

        this.logger.info("Fake no-write page processed", {
          externalRequestId: command.externalRequestId,
          page,
          items: pageResult.items.length,
          processedPages,
          processedItems,
        });

        if (!pageResult.hasNext || pageResult.items.length === 0) {
          break;
        }

        page += 1;
      }

      return {
        status: "ACCEPTED" as const,
        externalRequestId: command.externalRequestId,
        resourceId: "__GLOBAL__" as const,
      };
    }

    // Modo real: busca incremental e persiste
    const { record, created } = await this.commandStore.getOrCreateAccepted({
      externalRequestId: command.externalRequestId,
      productOmieId: "__GLOBAL__",
      commandType: "REFRESH_STOCK",
      source: command.source ?? "API2",
    });

    if (!created) {
      this.logger.info("Stock sync already tracked", {
        externalRequestId: command.externalRequestId,
        status: record.status,
      });

      return {
        status: record.status,
        externalRequestId: command.externalRequestId,
        resourceId: "__GLOBAL__" as const,
      };
    }

    let page = 1;
    let totalItems = 0;
    let processedPages = 0;

    try {
      const state = await this.syncStateStore.getState();
      const lastSyncAt = state.lastSyncAt;

      this.logger.info("Product stock sync window", {
        externalRequestId: command.externalRequestId,
        lastSyncAt,
        isIncremental: lastSyncAt > new Date("2000-01-01"),
      });

      while (processedPages < maxPages) {
        const pageResult = await fetchPageWithRetry(
          () => this.fetchPageGateway.fetchPage({ page, pageSize, updatedSince: lastSyncAt }),
          {
            label: "product-stock",
            externalRequestId: command.externalRequestId,
            page,
            pageSize,
          }
        );

        processedPages += 1;

        if (pageResult.items.length > 0) {
          totalItems += pageResult.items.length;

          await this.integrationStore.saveMany(
            pageResult.items.map((item) => ({
              productId: item.productId,
              stockQuantity: item.stockQuantity,
              minimumStock: item.minimumStock,
            })),
          );
        }

        this.logger.info("Product stock page processed", {
          externalRequestId: command.externalRequestId,
          page,
          items: pageResult.items.length,
          processedPages,
          totalItems,
        });

        if (processedPages % 10 === 0) {
          this.logger.info("Product stock sync checkpoint", {
            externalRequestId: command.externalRequestId,
            processedPages,
            totalItems,
          });
        }

        if (!pageResult.hasNext || pageResult.items.length === 0) {
          this.logger.info("Product stock sync finished: last page reached", {
            externalRequestId: command.externalRequestId,
            currentPage: page,
            processedPages,
            totalItems,
          });
          break;
        }

        page += 1;
        await sleep(700);
      }

      await this.commandStore.markConfirmed(command.externalRequestId);
      await this.syncStateStore.updateLastSync(new Date());

      this.logger.info("Product stock sync completed", {
        externalRequestId: command.externalRequestId,
        processedPages,
        totalItems,
      });

      // ✅ Cascade: após atualizar estoque, refresh do production-ready read model
      if (this.refreshProductCatalogUseCase) {
        this.logger.info("Triggering production-ready read-model refresh after stock sync", {
          externalRequestId: command.externalRequestId,
        });
        await this.refreshProductCatalogUseCase.execute();
      }

      return {
        status: "ACCEPTED" as const,
        externalRequestId: command.externalRequestId,
        resourceId: "__GLOBAL__" as const,
      };
    } catch (error) {
      await this.commandStore.markFailed(command.externalRequestId, error);

      this.logger.error("Product stock sync failed", {
        externalRequestId: command.externalRequestId,
        error,
      });

      throw error;
    }
  }
}

