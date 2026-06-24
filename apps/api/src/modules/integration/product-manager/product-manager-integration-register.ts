// ---------------------------------------------------------------------------
// Module Register — Product Manager Integration
// ---------------------------------------------------------------------------
// Entry point do módulo. Registra rotas e jobs PgBoss.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { productManagerIntegrationRoutes } from "./presentation/http/routes";
import { registerProductManagerJobs } from "./infrastructure/jobs/product-manager-jobs.register";

export function createProductManagerIntegration() {
    return {
        name: "product-manager-integration",
        register: async (app: FastifyInstance) => {
            await productManagerIntegrationRoutes(app);

            const omieClient = (app as any).omieClient as OmieHttpClientPort;
            if (omieClient) {
                registerProductManagerJobs(omieClient);
            }
        },
    };
}
