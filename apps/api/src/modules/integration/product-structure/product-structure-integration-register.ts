// apps/api/src/modules/integration/product-structure/product-structure-integration-register.ts

import type { FastifyInstance } from "fastify";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { productStructureIntegrationRoutes } from "./presentation/http/routes";
import { registerProductStructureJobs } from "./infrastructure/jobs/product-structure-jobs.register";

export function createProductStructureIntegration() {
  return {
    name: "product-structure-integration",
    register: (app: FastifyInstance) => {
      app.register(productStructureIntegrationRoutes);

      const omieClient = (app as any).omieClient as OmieHttpClientPort;
      if (omieClient) {
        registerProductStructureJobs(omieClient);
      }
    },
  };
}