import type { ProductionOrderCancelGateway } from "../ports/production-order-cancel.gateway";
import type { ProductionOrderCommandStore } from "../../infrastructure/db/production-order-command.store";
import type { ProcessCancelProductionOrderData } from "../dto/cancel-production-order.dto";

/**
 * Use case — Process cancel production order from PgBoss worker
 *
 * Executa o cancelamento real no Omie, cria registro de auditoria e marca como confirmado.
 */
export class ProcessCancelProductionOrderUseCase {
    constructor(
        private readonly cancelGateway: ProductionOrderCancelGateway,
        private readonly commandStore: ProductionOrderCommandStore,
        private readonly options: { isFake: boolean }
    ) { }

    async execute(data: ProcessCancelProductionOrderData): Promise<void> {
        const { externalRequestId, omieId, reason } = data;

        if (!this.options.isFake) {
            const result = await this.cancelGateway.cancelProductionOrder({
                externalRequestId,
                omieId,
                reason,
            });

            if (result.status === "FAILED") {
                throw new Error(`Omie rejeitou o cancelamento da OP: ${externalRequestId}`);
            }
        }

        // Cria registro de auditoria (se não existir) e marca como confirmado
        await this.commandStore.enqueue({
            externalRequestId,
            commandType: "CANCEL_OP",
            source: "JOB",
            payload: { omieId, reason },
        });
        await this.commandStore.markConfirmed(externalRequestId);
    }
}
