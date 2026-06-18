import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { env } from "@/config";

import { FakeSalesOrderFetchPageGateway } from "../gateways/fetch-page/fake-sales-order-fetch-page.gateway";
import { RealSalesOrderFetchPageGateway } from "../gateways/fetch-page/real-sales-order-fetch-page.gateway";
import { SalesOrderSyncIntegrationStore } from "../db/sales-order-sync-integration.store";
import { SalesOrderSyncCommandStore } from "../db/sales-order-sync-command.store";
import { SalesOrderSyncStateStore } from "../db/sales-order-sync-state.store";
import { SyncAllSalesOrdersUseCase } from "../../application/use-cases/sync-all-sales-orders.usecase";

// 🔒 lock em memória (singleton no processo)
let isRunning = false;

export class SyncSalesOrdersJob {
  private readonly logger = getLogger("SyncSalesOrdersJob");

  constructor(private readonly omieClient: OmieHttpClientPort) {}

  async execute() {
    // ✅ previne execução concorrente
    if (isRunning) {
      this.logger.warn("Sales-order sync skipped: job already running");
      return;
    }

    isRunning = true;

    const externalRequestId = `sales-order-sync-job-${Date.now()}`;

    this.logger.info("Sales-order job started", {
      externalRequestId,
      gatewayMode: env.SALES_ORDER_SYNC_GATEWAY,
    });

    const fetchPageGateway =
      env.SALES_ORDER_SYNC_GATEWAY === "real"
        ? new RealSalesOrderFetchPageGateway(this.omieClient)
        : new FakeSalesOrderFetchPageGateway();

    const useCase = new SyncAllSalesOrdersUseCase(
      fetchPageGateway,
      new SalesOrderSyncIntegrationStore(prisma),
      new SalesOrderSyncCommandStore(prisma),
      new SalesOrderSyncStateStore(),
      {
        noWrite: env.SALES_ORDER_SYNC_GATEWAY === "fake",
      }
    );

    const startTime = Date.now();

    try {
      const result = await useCase.execute({
        externalRequestId,
        pageSize: 100,
        maxPages: 1000,
        source: "JOB",
      });

      const durationMs = Date.now() - startTime;

      this.logger.info("Sales-order job completed", {
        externalRequestId,
        result,
        durationMs,
      });

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;

      this.logger.error("Sales-order job failed", {
        externalRequestId,
        error,
        durationMs,
      });

      throw error;
    } finally {
      // ✅ libera lock SEMPRE (mesmo com erro)
      isRunning = false;
    }
  }
}