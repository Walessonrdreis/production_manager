import type { FastifyInstance } from "fastify";

import { registerSyncCustomerRoute } from "./routes/commands/sync-customer.route";
import { registerSyncAllCustomersRoute } from "./routes/commands/sync-all-customers.route";
import { registerGetCustomerReadModelRoute } from "./routes/read/get-customer-read-model.route";
import { registerGetCustomerSyncStatusRoute } from "./routes/read/get-customer-sync-status.route";
import { registerGetCustomerSyncHistoryRoute } from "./routes/read/get-customer-sync-history.route";
import { registerGetCustomerSyncFailuresRoute } from "./routes/read/get-customer-sync-failures.route";
import { registerGetCustomerStatsRoute } from "./routes/read/get-customer-stats.route";
import { registerGetCustomerLastSyncRoute } from "./routes/read/get-customer-last-sync.route";
import { registerGetCustomerSummaryRoute } from "./routes/read/get-customer-summary.route";

export async function customerSyncIntegrationRoutes(app: FastifyInstance) {
    registerSyncCustomerRoute(app);
    registerSyncAllCustomersRoute(app);
    registerGetCustomerReadModelRoute(app);
    registerGetCustomerSyncStatusRoute(app);
    registerGetCustomerSyncHistoryRoute(app);
    registerGetCustomerSyncFailuresRoute(app);
    registerGetCustomerStatsRoute(app);
    registerGetCustomerLastSyncRoute(app);
    registerGetCustomerSummaryRoute(app);
}
