// ---------------------------------------------------------------------------
// Job — Production Order Read-Model Full Refresh (Cron diário — Fase 4)
// ---------------------------------------------------------------------------
// Executa o refresh COMPLETO do read model uma vez por dia.
// Rede de segurança: garante consistência mesmo que o refresh incremental
// (Fase 1/2/3) tenha perdido alguma atualização.
//
// Controlado por:
//   env.ENABLE_OMIE_PRODUCTION_ORDER_READ_MODEL_FULL_REFRESH_JOB
//   env.OMIE_PRODUCTION_ORDER_READ_MODEL_FULL_REFRESH_CRON (default: 0 0 * * *)
// ---------------------------------------------------------------------------

import { getLogger } from "@/shared/logger";
import { RefreshProductionOrderReadModelUseCase } from "../../application/use-cases/refresh-production-order-read-model.usecase";
import { ProductionOrderReadModelStore } from "../../infrastructure/db/production-order-read-model.store";

const logger = getLogger("production-orders:read-model-full-refresh-job");

export class ProductionOrderReadModelFullRefreshJob {
    async execute() {
        logger.info("Starting production order read-model FULL refresh job (daily fallback)");

        try {
            const store = new ProductionOrderReadModelStore();
            const useCase = new RefreshProductionOrderReadModelUseCase(store);
            const result = await useCase.execute();

            logger.info("Production order read-model FULL refresh job completed", {
                records: result.refreshedRecords,
            });

            return result;
        } catch (error) {
            logger.error("Production order read-model FULL refresh job failed", error as any);
            throw error;
        }
    }
}
