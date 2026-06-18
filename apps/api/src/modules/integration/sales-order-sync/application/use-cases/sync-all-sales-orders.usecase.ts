import { getLogger } from "@/shared/logger";
import type {
  SalesOrderFetchPageGateway,
  SalesOrderFetchPageInput,
} from "../ports/sales-order-fetch-page.gateway";
import { SalesOrderSyncIntegrationStore } from "../../infrastructure/db/sales-order-sync-integration.store";
import { SalesOrderSyncCommandStore } from "../../infrastructure/db/sales-order-sync-command.store";
import { SalesOrderSyncStateStore } from "../../infrastructure/db/sales-order-sync-state.store";

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
    private readonly stateStore: SalesOrderSyncStateStore,
    private readonly options: { noWrite?: boolean } = {}
  ) {}

  private extractRedundantWaitSeconds(sample: string): number | null {
    const match = sample.match(/aguarde\s+(\d+)\s+segundos/i);
    if (!match) return null;

    const seconds = Number(match[1]);
    if (!Number.isFinite(seconds) || seconds <= 0) return null;

    return seconds;
  }

  private async fetchPageWithRetry(
    input: SalesOrderFetchPageInput & {
      externalRequestId: string;
      maxAttempts?: number;
    }
  ) {
    const {
      page,
      pageSize,
      updatedSince,
      externalRequestId,
      maxAttempts = 3,
    } = input;

    let lastError: unknown = null;
    let redundantWaits = 0;
    const maxRedundantWaits = 5;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const pageResult = await this.fetchPageGateway.fetchPage({
          page,
          pageSize,
          updatedSince,
        });

        if (attempt > 1 || redundantWaits > 0) {
          this.logger.info("Sales-order fetch page recovered after retry", {
            externalRequestId,
            page,
            pageSize,
            attempt,
            maxAttempts,
            redundantWaits,
          });
        }

        return pageResult;
      } catch (error: any) {
        lastError = error;

        const sample = String(error?.details?.sample ?? "");
        const sampleLower = sample.toLowerCase();
        const isRedundant =
          sampleLower.includes("redundant") ||
          sampleLower.includes("consumo redundante");

        if (isRedundant) {
          redundantWaits += 1;

          const waitSeconds = this.extractRedundantWaitSeconds(sample) ?? 60;
          const waitMs = (waitSeconds + 2) * 1000;

          this.logger.warn("Sales-order REDUNDANT detected, waiting before retry", {
            externalRequestId,
            page,
            pageSize,
            redundantWaits,
            maxRedundantWaits,
            waitSeconds,
            waitMs,
            code: error?.code,
            details: error?.details,
          });

          if (redundantWaits > maxRedundantWaits) {
            throw error;
          }

          await sleep(waitMs);

          attempt -= 1;
          continue;
        }

        this.logger.warn("Sales-order fetch page failed", {
          externalRequestId,
          page,
          pageSize,
          attempt,
          maxAttempts,
          message: error?.message,
          code: error?.code,
          details: error?.details,
        });

        if (attempt < maxAttempts) {
          await sleep(1000 * attempt);
          continue;
        }
      }
    }

    throw lastError;
  }

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
        const pageResult = await this.fetchPageWithRetry({
          page,
          pageSize,
          updatedSince: lastSyncAt,
          externalRequestId: command.externalRequestId,
        });

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

        await sleep(700);
      }

      await this.commandStore.markConfirmed(command.externalRequestId);
      await this.stateStore.updateLastSync(new Date());

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