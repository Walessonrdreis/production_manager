// ---------------------------------------------------------------------------
// Module Register: product-stock-fetch-integration-register.ts
// Factory function no padrão canônico.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { productStockFetchIntegrationRoutes } from "./presentation/http/routes";
import { registerProductStockFetchJobs } from "./infrastructure/jobs/product-stock-fetch-jobs.register";

export function createProductStockFetchIntegration() {
    return {
        name: "product-stock-fetch-integration",
        register: (app: FastifyInstance) => {
            app.register(productStockFetchIntegrationRoutes);

            const omieClient = (app as any).omieClient as OmieHttpClientPort;
            if (omieClient) {
                registerProductStockFetchJobs(omieClient);
            }
        },
    };
}
