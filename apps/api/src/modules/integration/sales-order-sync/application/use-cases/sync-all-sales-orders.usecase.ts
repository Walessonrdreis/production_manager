import { getLogger } from "@/shared/logger";
import type { SalesOrderFetchPageGateway } from "../ports/sales-order-fetch-page.gateway";
import { SalesOrderSyncIntegrationStore } from "../../infrastructure/db/sales-order-sync-integration.store";
import { SalesOrderSyncCommandStore } from "../../infrastructure/db/sales-order-sync-command.store";

export type SyncAllSalesOrdersCommand = {
  externalRequestId: string;
  pageSize?: number;
  maxPages?: number;
  source?: "API2" | "JOB" | "ADMIN";
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class SyncAllSalesOrdersUseCase {
  private readonly logger = getLogger("SyncAllSalesOrdersUseCase");

  constructor(
    private readonly fetchPageGateway: SalesOrderFetchPageGateway,
    private readonly integrationStore: SalesOrderSyncIntegrationStore,
    private readonly commandStore: SalesOrderSyncCommandStore,
    private readonly options: { noWrite?: boolean } = {}
  ) {}

  async execute(command: SyncAllSalesOrdersCommand) {
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
      let page = 1;
      let processedPages = 0;
      let processedOrders = 0;
      let processedItems = 0;

      while (processedPages < maxPages) {
        const pageResult = await this.fetchPageGateway.fetchPage(page, pageSize);

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
          for (const order of pageResult.items) {
            const savedOrder = await this.integrationStore.upsertSalesOrder({
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
            });

            for (const item of order.items) {
              await this.integrationStore.upsertSalesOrderItem(savedOrder.id, {
                omieItemId: item.omieItemId,
                productCode: item.productCode,
                productOmieId: item.productOmieId,
                description: item.description,
                unit: item.unit,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                rawPayload: item.rawPayload,
              });

              processedItems += 1;
            }

            processedOrders += 1;
          }
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

        // Delay leve para reduzir pressão no Omie
        await sleep(300);
      }

      await this.commandStore.markConfirmed(command.externalRequestId);

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
