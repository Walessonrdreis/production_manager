import type { FastifyInstance } from "fastify";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { env } from "@/config";

import { salesOrderSyncRoutes } from "./presentation/http/routes";
import { registerSalesOrderSyncJobs } from "./infrastructure/jobs/sales-order-sync-jobs.register";

export function createSalesOrderSyncIntegration() {
  return {
    name: "sales-order-sync-integration",
    register: async (app: FastifyInstance) => {
      await salesOrderSyncRoutes(app);

      const omieClient = (app as any).omieClient as OmieHttpClientPort;

      if (env.ENABLE_OMIE_SALES_ORDER_SYNC_JOB) {
        registerSalesOrderSyncJobs(omieClient);
      }
    },
  };
}