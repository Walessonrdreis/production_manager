import type { FastifyInstance } from "fastify";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { productionOrdersIntegrationRoutes } from "./presentation/http/routes";
import { registerProductionOrderJobs } from "./infrastructure/jobs/production-order-jobs.register";

export function createProductionOrderIntegration() {
  return {
    name: "production-order-integration",
    register: async (app: FastifyInstance) => {
      await productionOrdersIntegrationRoutes(app);

      const omieClient = (app as any).omieClient as OmieHttpClientPort;
      if (omieClient) {
        registerProductionOrderJobs(omieClient);
      }
    },
  };
}
