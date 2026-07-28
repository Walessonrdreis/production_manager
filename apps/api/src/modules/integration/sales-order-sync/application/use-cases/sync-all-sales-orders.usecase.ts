import { getLogger } from "@/shared/logger";
import { fetchPageWithRetry, sleep } from "@/shared/integration/strategies/retry.strategy";
import type { SyncStateStoreContract } from "@/shared/integration/strategies/types";
import type { SyncHooksRunner } from "@/shared/integration/strategies/sync-hooks";
import type {
  SalesOrderFetchPageGateway,
} from "../ports/sales-order-fetch-page.gateway";
import { SalesOrderSyncIntegrationStore } from "../../infrastructure/db/sales-order-sync-integration.store";
import { SalesOrderSyncCommandStore } from "../../infrastructure/db/sales-order-sync-command.store";
import { RefreshProductCatalogProductionReadyUseCase } from "@/modules/integration/product-catalog/application/use-cases/refresh-product-catalog-production-ready.usecase";
import { RefreshSalesOrderSummaryReadModelUseCase } from "./refresh-sales-order-summary-read-model.usecase";

export type SyncAllSalesOrdersCommand = {
  externalRequestId: string;
  pageSize?: number;
  maxPages?: number;
  source?: "API2" | "JOB" | "ADMIN";
};

export class SyncAllSalesOrdersUseCase {
  private readonly logger = getLogger("SyncAllSalesOrdersUseCase");

  constructor(
    private readonly fetchPageGateway: SalesOrderFetchPageGateway,
    private readonly integrationStore: SalesOrderSyncIntegrationStore,
    private readonly commandStore: SalesOrderSyncCommandStore,
    private readonly stateStore: SyncStateStoreContract,
    private readonly refreshProductCatalogUseCase: RefreshProductCatalogProductionReadyUseCase,
    private readonly refreshSalesOrderSummaryUseCase: RefreshSalesOrderSummaryReadModelUseCase,
    private readonly options: { noWrite?: boolean } = {}
  ) { }

  async execute(command: SyncAllSalesOrdersCommand, hooks?: SyncHooksRunner) {
    const pageSize = Math.max(1, Math.min(Number(command.pageSize || 100), 500));
    const maxPages = Math.max(1, Math.min(Number(command.maxPages || 1000), 10000));

    this.logger.info("Sales-order sync started", {
      externalRequestId: command.externalRequestId,
      pageSize,
      maxPages,
      source: command.source ?? "API2",
      noWrite: this.options.noWrite === true,
    });

    const { record, created } = await this.commandStore.getOrCreateAccepted({
      externalRequestId: command.externalRequestId,
      resourceId: "__GLOBAL__",
      commandType: "SYNC",
      source: command.source ?? "API2",
    });

    if (!created) {
      this.logger.info("Sales-order sync already tracked", {
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
      const state = await this.stateStore.getState();
      const lastSyncAt = state.lastSyncAt;

      this.logger.info("Sales-order incremental sync window", {
        externalRequestId: command.externalRequestId,
        lastSyncAt,
      });

      let page = 1;
      let processedPages = 0;
      let processedOrders = 0;
      let processedItems = 0;

      while (processedPages < maxPages) {
        const pageResult = await fetchPageWithRetry(
          () => this.fetchPageGateway.fetchPage({ page, pageSize, updatedSince: lastSyncAt }),
          { label: "sales-order-sync", externalRequestId: command.externalRequestId, page, pageSize }
        );

        const totalPages =
          pageResult.totalPages != null && Number.isFinite(pageResult.totalPages)
            ? pageResult.totalPages
            : null;

        const currentPage =
          pageResult.currentPage != null && Number.isFinite(pageResult.currentPage)
            ? pageResult.currentPage
            : page;

        const itemsFetched = Array.isArray(pageResult.items)
          ? pageResult.items.length
          : 0;

        if (itemsFetched === 0) {
          this.logger.info("Sales-order sync finished: no more orders returned", {
            externalRequestId: command.externalRequestId,
            currentPage,
            totalPages,
            processedPages,
            processedOrders,
            processedItems,
          });
          break;
        }

        if (!this.options.noWrite) {
          const batchInputs = pageResult.items.map((order) => ({
            order: {
              omieId: order.omieId,
              orderNumber: order.orderNumber,
              stage: order.stage,
              isCanceled: order.isCanceled,
              isClosed: order.isClosed,
              customerOmieId: order.customerOmieId,
              companyOmieId: order.companyOmieId,
              forecastDate: order.forecastDate,
              totalAmount: order.totalAmount,
              rawPayload: order.rawPayload,
            },
            items: order.items.map((item) => ({
              omieItemId: item.omieItemId,
              productCode: item.productCode,
              productOmieId: item.productOmieId,
              description: item.description,
              unit: item.unit,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              rawPayload: item.rawPayload,
            })),
          }));

          await this.integrationStore.saveMany(batchInputs);

          processedOrders += pageResult.items.length;
          processedItems += pageResult.items.reduce(
            (sum, o) => sum + o.items.length, 0
          );
        } else {
          for (const order of pageResult.items) {
            processedOrders += 1;
            processedItems += order.items.length;
          }
        }

        processedPages += 1;

        this.logger.info("Sales-order page processed", {
          externalRequestId: command.externalRequestId,
          progress:
            totalPages != null ? `${currentPage}/${totalPages}` : `${currentPage}/?`,
          currentPage,
          totalPages,
          itemsFetched,
          processedPages,
          processedOrders,
          processedItems,
          hasNextPage: pageResult.hasNextPage,
        });

        if (processedPages % 10 === 0) {
          this.logger.info("Sales-order sync checkpoint", {
            externalRequestId: command.externalRequestId,
            progress:
              totalPages != null ? `${currentPage}/${totalPages}` : `${currentPage}/?`,
            processedPages,
            processedOrders,
            processedItems,
          });
        }

        if (!pageResult.hasNextPage) {
          this.logger.info("Sales-order sync finished: last page reached", {
            externalRequestId: command.externalRequestId,
            currentPage,
            totalPages,
            processedPages,
            processedOrders,
            processedItems,
          });
          break;
        }

        page += 1;

        await sleep(700);
      }

      await this.commandStore.markConfirmed(command.externalRequestId);
      await this.stateStore.updateLastSync(new Date());

      if (!this.options.noWrite) {
        this.logger.info("Triggering product-catalog refresh after sales-order sync", {
          externalRequestId: command.externalRequestId,
        });

        await this.refreshProductCatalogUseCase.execute();

        this.logger.info("Triggering sales-order summary refresh after sync", {
          externalRequestId: command.externalRequestId,
        });

        await this.refreshSalesOrderSummaryUseCase.execute();

        // ✅ Executar hooks pós-sync (SyncHooksRunner)
        if (hooks && !hooks.empty) {
          this.logger.info("Running post-sync hooks", {
            externalRequestId: command.externalRequestId,
          });
          await hooks.runAll({ externalRequestId: command.externalRequestId });
        }
      }

      this.logger.info("Sales-order sync completed", {
        externalRequestId: command.externalRequestId,
        processedPages,
        processedOrders,
        processedItems,
      });

      return {
        status: "ACCEPTED" as const,
        externalRequestId: command.externalRequestId,
        resourceId: "__GLOBAL__" as const,
      };
    } catch (error) {
      await this.commandStore.markFailed(command.externalRequestId, error);

      this.logger.error("Sales-order sync failed", {
        externalRequestId: command.externalRequestId,
        error,
      });

      throw error;
    }
  }
}

// ─── Função auxiliar para execução direta pelo PgBoss handler ────────────

export async function executeSyncAllSalesOrders(
  fetchPageGateway: SalesOrderFetchPageGateway,
  integrationStore: SalesOrderSyncIntegrationStore,
  commandStore: SalesOrderSyncCommandStore,
  stateStore: SyncStateStoreContract,
  refreshProductCatalogUseCase: RefreshProductCatalogProductionReadyUseCase,
  refreshSalesOrderSummaryUseCase: RefreshSalesOrderSummaryReadModelUseCase,
  command: SyncAllSalesOrdersCommand,
  hooks?: SyncHooksRunner
): Promise<void> {
  const logger = getLogger("SyncAllSalesOrdersExecutor");
  const { externalRequestId } = command;

  logger.info("Executing sales-order global sync via helper", {
    externalRequestId,
    pageSize: command.pageSize ?? 100,
    maxPages: command.maxPages ?? 1000,
  });

  const useCase = new SyncAllSalesOrdersUseCase(
    fetchPageGateway,
    integrationStore,
    commandStore,
    stateStore,
    refreshProductCatalogUseCase,
    refreshSalesOrderSummaryUseCase,
    { noWrite: false }
  );

  await useCase.execute(command, hooks);

  logger.info("Sales-order global sync helper completed", {
    externalRequestId,
  });
}