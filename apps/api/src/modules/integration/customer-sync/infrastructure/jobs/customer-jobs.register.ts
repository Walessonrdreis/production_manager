import cron from "node-cron";
import { env } from "@/config";
import { getLogger } from "@/shared/logger";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { SyncAllCustomersUseCase } from "../../application/use-cases/sync-all-customers.usecase";
import { OmieCustomerStore } from "../db/omie-customer.store";
import { CustomerCommandStore } from "../db/customer-command.store";
import { FakeCustomerFetchPageGateway } from "../gateways/customer-fetch-page/fake-customer-fetch-page.gateway";
import { RealCustomerFetchPageGateway } from "../gateways/customer-fetch-page/real-customer-fetch-page.gateway";

export function registerCustomerJobs(omieClient: OmieHttpClientPort) {
    const logger = getLogger("customer-sync:cron");

    if (env.ENABLE_OMIE_CUSTOMER_SYNC_JOB) {
        const syncSchedule = env.OMIE_CUSTOMER_SYNC_CRON ?? "0 */12 * * *";

        cron.schedule(syncSchedule, async () => {
            const runLogger = getLogger("customer-sync:cron:sync");

            try {
                const fetchPageGateway =
                    env.CUSTOMER_SYNC_GATEWAY === "real"
                        ? new RealCustomerFetchPageGateway(omieClient)
                        : new FakeCustomerFetchPageGateway();

                const useCase = new SyncAllCustomersUseCase(
                    fetchPageGateway,
                    new OmieCustomerStore(),
                    new CustomerCommandStore(),
                    {
                        noWrite: env.CUSTOMER_SYNC_GATEWAY === "fake",
                    }
                );

                await useCase.execute({
                    externalRequestId: `customer-sync-job-${Date.now()}`,
                    pageSize: 100,
                    maxPages: 1000,
                    source: "JOB",
                });

                runLogger.info("Global customer-sync completed");
            } catch (error) {
                runLogger.error("Global customer-sync failed", error as any);
            }
        });
    } else {
        logger.info("Customer sync job is disabled");
    }
}
