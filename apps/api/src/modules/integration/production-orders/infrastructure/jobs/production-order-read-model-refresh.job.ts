// ---------------------------------------------------------------------------
// Job — Production Order Read-Model Refresh (Cron)
// ---------------------------------------------------------------------------
// Executa periodicamente o refresh do read model de OPs.
// Controlado por env.ENABLE_OMIE_PRODUCTION_ORDER_READ_MODEL_REFRESH_JOB
// e env.OMIE_PRODUCTION_ORDER_READ_MODEL_REFRESH_CRON.
// ---------------------------------------------------------------------------

import { getLogger } from "@/shared/logger";
import { RefreshProductionOrderReadModelUseCase } from "../../application/use-cases/refresh-production-order-read-model.usecase";
import { ProductionOrderReadModelStore } from "../../infrastructure/db/production-order-read-model.store";

const logger = getLogger("production-orders:read-model-refresh-job");

export class ProductionOrderReadModelRefreshJob {
    async execute() {
        logger.info("Starting production order read-model refresh job");

        try {
            const store = new ProductionOrderReadModelStore();
            const useCase = new RefreshProductionOrderReadModelUseCase(store);
            const result = await useCase.execute();

            logger.info("Production order read-model refresh job completed", {
                records: result.refreshedRecords,
            });

            return result;
        } catch (error) {
            logger.error("Production order read-model refresh job failed", error as any);
            throw error;
        }
    }
}
