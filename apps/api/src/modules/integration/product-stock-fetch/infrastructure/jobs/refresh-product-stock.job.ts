// ---------------------------------------------------------------------------
// Job: RefreshProductStockJob
// Wrapper para RefreshProductStockUseCase usado em tarefas agendadas.
// ---------------------------------------------------------------------------

import { RefreshProductStockUseCase } from "../../application/use-cases/refresh-product-stock.usecase";
import { getLogger } from "@/shared/logger";

export class RefreshProductStockJob {
    private readonly logger = getLogger("RefreshProductStockJob");

    constructor(
        private readonly useCase: RefreshProductStockUseCase,
        private readonly productIds: string[],
    ) { }

    async execute(): Promise<void> {
        this.logger.info("Executando refresh de estoque", {
            productCount: this.productIds.length,
        });

        for (const productOmieId of this.productIds) {
            try {
                const externalRequestId = `job-refresh-stock-${productOmieId}-${Date.now()}`;
                await this.useCase.process({
                    externalRequestId,
                    productOmieId,
                });
                this.logger.info("Estoque atualizado", { productOmieId });
            } catch (error) {
                this.logger.error("Falha ao atualizar estoque", {
                    productOmieId,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
    }
}
