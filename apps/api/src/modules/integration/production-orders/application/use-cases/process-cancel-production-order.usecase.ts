import type { ProductionOrderCancelGateway } from "../../infrastructure/gateways/cancel/production-order-cancel.gateway";
import type { ProductionOrderCommandStore } from "../../infrastructure/db/production-order-command.store";

export type ProcessCancelProductionOrderData = {
    externalRequestId: string;
    omieCode: string;
    reason?: string;
};

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
        const { externalRequestId, omieCode, reason } = data;

        if (!this.options.isFake) {
            const result = await this.cancelGateway.cancelProductionOrder({
                externalRequestId,
                omieCode,
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
            payload: { omieCode, reason },
        });
        await this.commandStore.markConfirmed(externalRequestId);
    }
}
