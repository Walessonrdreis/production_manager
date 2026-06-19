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

        for (const productId of this.productIds) {
            try {
                const externalRequestId = `job-refresh-stock-${productId}-${Date.now()}`;
                await this.useCase.process({
                    externalRequestId,
                    productId,
                });
                this.logger.info("Estoque atualizado", { productId });
            } catch (error) {
                this.logger.error("Falha ao atualizar estoque", {
                    productId,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
    }
}
