import { env } from "@/config";
import { getLogger } from "@/shared/logger";
import type { ProductCatalogFetchPageGateway } from "../ports/product-catalog-fetch-page.gateway";
import { ProductCatalogIntegrationStore } from "../../infrastructure/db/product-catalog-integration.store";
import { ProductCatalogCommandStore } from "../../infrastructure/db/product-catalog-command.store";
import { RefreshProductCatalogProductionReadyUseCase } from "./refresh-product-catalog-production-ready.usecase";
import { ProductCatalogProductionReadyReadModelStore } from "../../infrastructure/db/product-catalog-production-ready-read-model.store";

export type SyncAllProductCatalogCommand = {
  externalRequestId: string;
  pageSize?: number;
  maxPages?: number;
  source?: "API2" | "JOB" | "ADMIN";
};

export class SyncAllProductCatalogUseCase {
  private readonly logger = getLogger("SyncAllProductCatalogUseCase");

  constructor(
    private readonly fetchPageGateway: ProductCatalogFetchPageGateway,
    private readonly integrationStore: ProductCatalogIntegrationStore,
    private readonly commandStore: ProductCatalogCommandStore,
    private readonly options: { noWrite?: boolean } = {}
  ) {}

  private async refreshProductionReadyIfConfigured(triggerSource: string) {
    if (!env.FORCE_PRODUCTION_READY_REFRESH_ON_SYNC) {
      return;
    }

    try {
      const refreshUseCase = new RefreshProductCatalogProductionReadyUseCase(
        new ProductCatalogProductionReadyReadModelStore()
      );

      await refreshUseCase.execute();

      this.logger.info("Production-ready read-model refreshed after sync", {
        triggerSource,
      });
    } catch (error) {
      this.logger.error("Production-ready refresh failed after sync", {
        triggerSource,
        error,
      });
    }
  }

  async execute(command: SyncAllProductCatalogCommand) {
    const pageSize = Math.max(1, Math.min(Number(command.pageSize || 100), 500));
    const maxPages = Math.max(1, Math.min(Number(command.maxPages || 1000), 10000));

    this.logger.info("Starting product catalog global sync", {
      externalRequestId: command.externalRequestId,
      pageSize,
      maxPages,
      source: command.source ?? "API2",
      noWrite: this.options.noWrite === true,
    });

    if (this.options.noWrite) {
      let page = 1;
      let processedPages = 0;
      let processedItems = 0;

      while (processedPages < maxPages) {
        const pageResult = await this.fetchPageGateway.fetchPage(page, pageSize);

        processedPages += 1;
        processedItems += pageResult.items.length;

        this.logger.info("Fake no-write page processed", {
          externalRequestId: command.externalRequestId,
          page,
          items: pageResult.items.length,
          processedPages,
          processedItems,
        });

        if (!pageResult.hasNextPage || pageResult.items.length === 0) {
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

    const { record, created } = await this.commandStore.getOrCreateAccepted({
      externalRequestId: command.externalRequestId,
      productCode: "__GLOBAL__",
      commandType: "SYNC",
      source: command.source ?? "API2",
    });

    if (!created) {
      this.logger.info("Global sync already tracked", {
        externalRequestId: command.externalRequestId,
        status: record.status,
      });

      return {
        status: record.status,
        externalRequestId: command.externalRequestId,
        resourceId: "__GLOBAL__" as const,
      };
    }

    try {
      let page = 1;
      let processedPages = 0;
      let processedItems = 0;

      while (processedPages < maxPages) {
        let pageResult:
          | Awaited<ReturnType<ProductCatalogFetchPageGateway["fetchPage"]>>
          | null = null;

        let attempts = 0;

        while (attempts < 3) {
          try {
            pageResult = await this.fetchPageGateway.fetchPage(page, pageSize);
            break;
          } catch (error: any) {
            attempts += 1;

            const sample = error?.details?.sample ?? "";
            const message = error?.message ?? "";

            if (
              sample.includes("Não existem registros para a página") ||
              message.includes("Não existem registros para a página")
            ) {
              this.logger.info("Reached end of catalog pagination", {
                externalRequestId: command.externalRequestId,
                page,
                processedPages,
                processedItems,
              });

              pageResult = {
                items: [],
                hasNextPage: false,
              };

              break;
            }

            this.logger.warn("Fetch page failed", {
              externalRequestId: command.externalRequestId,
              page,
              attempt: attempts,
              message,
              sample,
            });

            if (attempts >= 3) {
              throw error;
            }
          }
        }

        if (!pageResult) {
          break;
        }

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

        processedPages += 1;
        processedItems += pageResult.items.length;

        this.logger.info("Global sync page processed", {
          externalRequestId: command.externalRequestId,
          page,
          items: pageResult.items.length,
          processedPages,
          processedItems,
          hasNextPage: pageResult.hasNextPage,
        });

        if (!pageResult.hasNextPage || pageResult.items.length === 0) {
          break;
        }

        page += 1;
      }

      await this.commandStore.markConfirmed(command.externalRequestId);

      await this.refreshProductionReadyIfConfigured(
        `product-catalog-sync-global:${command.externalRequestId}`
      );

      this.logger.info("Global sync completed", {
        externalRequestId: command.externalRequestId,
        processedPages,
        processedItems,
      });

      return {
        status: "ACCEPTED" as const,
        externalRequestId: command.externalRequestId,
        resourceId: "__GLOBAL__" as const,
      };
    } catch (error) {
      await this.commandStore.markFailed(command.externalRequestId, error);

      this.logger.error("Global sync failed", {
        externalRequestId: command.externalRequestId,
        error,
      });

      throw error;
    }
  }
}