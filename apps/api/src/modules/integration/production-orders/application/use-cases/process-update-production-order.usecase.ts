import type { ProductionOrderUpdateGateway } from "../ports/production-order-update.gateway";
import type { ProductionOrderCommandStore } from "../../infrastructure/db/production-order-command.store";
import type { ProcessUpdateProductionOrderData } from "../dto/update-production-order.dto";

/**
 * Use case — Process update production order from PgBoss worker
 *
 * Executa a atualização real no Omie, cria registro de auditoria e marca como confirmado.
 */
export class ProcessUpdateProductionOrderUseCase {
    constructor(
        private readonly updateGateway: ProductionOrderUpdateGateway,
        private readonly commandStore: ProductionOrderCommandStore,
        private readonly options: { isFake: boolean }
    ) { }

    async execute(data: ProcessUpdateProductionOrderData): Promise<void> {
        const { externalRequestId, omieId, quantity, forecastDate, notes } = data;

        if (!this.options.isFake) {
            const result = await this.updateGateway.updateProductionOrder({
                externalRequestId,
                omieId,
                quantity,
                forecastDate,
                notes,
            });

            if (result.status === "FAILED") {
                throw new Error(`Omie rejeitou a atualização da OP: ${externalRequestId}`);
            }
        }

        // Cria registro de auditoria (se não existir) e marca como confirmado
        await this.commandStore.enqueue({
            externalRequestId,
            commandType: "UPDATE_OP",
            source: "JOB",
            payload: { omieId, quantity, forecastDate, notes },
        });
        await this.commandStore.markConfirmed(externalRequestId);
    }
}
