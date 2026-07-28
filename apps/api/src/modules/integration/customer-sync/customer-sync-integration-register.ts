import type { FastifyInstance } from "fastify";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { customerSyncIntegrationRoutes } from "./presentation/http/routes";
import { registerCustomerJobs } from "./infrastructure/jobs/customer-jobs.register";

export function createCustomerSyncIntegration() {
    return {
        name: "customer-sync-integration",
        register: (app: FastifyInstance) => {
            app.register(customerSyncIntegrationRoutes);

            const omieClient = (app as any).omieClient as OmieHttpClientPort;
            if (omieClient) {
                registerCustomerJobs(omieClient);
            }
        },
    };
}
