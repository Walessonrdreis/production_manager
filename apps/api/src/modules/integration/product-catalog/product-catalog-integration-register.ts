import type { FastifyInstance } from "fastify";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { productCatalogIntegrationRoutes } from "./presentation/http/routes";
import { registerProductCatalogJobs } from "./infrastructure/jobs/product-catalog-jobs.register";

export function createProductCatalogIntegration() {
  return {
    name: "product-catalog-integration",
    register: (app: FastifyInstance) => {
      app.register(productCatalogIntegrationRoutes);

      const omieClient = (app as any).omieClient as OmieHttpClientPort;
      if (omieClient) {
        registerProductCatalogJobs(omieClient);
      }
    },
  };
}