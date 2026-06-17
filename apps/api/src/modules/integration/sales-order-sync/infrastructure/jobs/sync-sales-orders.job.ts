import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { env } from "@/config";

import { FakeSalesOrderFetchPageGateway } from "../gateways/fetch-page/fake-sales-order-fetch-page.gateway";
import { RealSalesOrderFetchPageGateway } from "../gateways/fetch-page/real-sales-order-fetch-page.gateway";
import { SalesOrderSyncIntegrationStore } from "../db/sales-order-sync-integration.store";
import { SalesOrderSyncCommandStore } from "../db/sales-order-sync-command.store";
import { SyncAllSalesOrdersUseCase } from "../../application/use-cases/sync-all-sales-orders.usecase";

export class SyncSalesOrdersJob {
  private readonly logger = getLogger("SyncSalesOrdersJob");

  constructor(private readonly omieClient: OmieHttpClientPort) {}

  async execute() {
    const fetchPageGateway =
      env.SALES_ORDER_SYNC_GATEWAY === "real"
        ? new RealSalesOrderFetchPageGateway(this.omieClient)
        : new FakeSalesOrderFetchPageGateway();

    const useCase = new SyncAllSalesOrdersUseCase(
      fetchPageGateway,
      new SalesOrderSyncIntegrationStore(prisma),
      new SalesOrderSyncCommandStore(prisma),
      {
        noWrite: env.SALES_ORDER_SYNC_GATEWAY === "fake",
      }
    );

    const result = await useCase.execute({
      externalRequestId: `sales-order-sync-job-${Date.now()}`,
      pageSize: 100,
      maxPages: 1000,
      source: "JOB",
    });

    this.logger.info("Sales-order sync job completed", result);

    return result;
  }
}