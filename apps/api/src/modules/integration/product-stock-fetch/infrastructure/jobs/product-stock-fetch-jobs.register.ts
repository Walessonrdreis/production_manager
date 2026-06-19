// ---------------------------------------------------------------------------
// Jobs Register: product-stock-fetch-jobs.register.ts
// Registra os jobs agendados (cron) para refresh de estoque.
// ---------------------------------------------------------------------------

import cron from "node-cron";
import { env } from "@/config";
import { getLogger } from "@/shared/logger";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { RefreshProductStockUseCase } from "../../application/use-cases/refresh-product-stock.usecase";
import { ProductStockIntegrationStore } from "../db/product-stock-integration.store";
import { ProductStockCommandStore } from "../db/product-stock-command.store";
import { FakeProductStockIntegrationStore } from "../db/fake-product-stock-integration.store";
import { FakeProductStockCommandStore } from "../db/fake-product-stock-command.store";
import { RealProductStockFetchGateway } from "../gateways/product-stock-fetch/real-product-stock-fetch.gateway";
import { FakeProductStockFetchGateway } from "../gateways/product-stock-fetch/fake-product-stock-fetch.gateway";
import { RefreshProductStockJob } from "./refresh-product-stock.job";

export function registerProductStockFetchJobs(omieClient: OmieHttpClientPort) {
    const logger = getLogger("product-stock-fetch:cron");

    if (env.ENABLE_PRODUCT_STOCK_FETCH_REFRESH_JOB) {
        const cronExpr = env.PRODUCT_STOCK_FETCH_REFRESH_CRON ?? "*/30 * * * *";

        cron.schedule(cronExpr, async () => {
            const runLogger = getLogger("product-stock-fetch:cron:refresh");

            try {
                const useFake = env.PRODUCT_STOCK_FETCH_GATEWAY === "fake";

                const fetchGateway = useFake
                    ? new FakeProductStockFetchGateway()
                    : new RealProductStockFetchGateway(omieClient);

                const integrationStore = useFake
                    ? new FakeProductStockIntegrationStore()
                    : new ProductStockIntegrationStore();

                const commandStore = useFake
                    ? new FakeProductStockCommandStore()
                    : new ProductStockCommandStore();

                const useCase = new RefreshProductStockUseCase(
                    fetchGateway,
                    integrationStore,
                    commandStore,
                );

                // TODO: obter lista de productIds para refresh automático
                const productIds: string[] = [];

                const job = new RefreshProductStockJob(useCase, productIds);
                await job.execute();

                runLogger.info("Refresh de estoque concluído");
            } catch (error) {
                runLogger.error("Falha no refresh automático de estoque", {
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        });

        logger.info("Job de refresh de estoque registrado", { cron: cronExpr });
    }
}
