import type { ProductionOrderChangeStageGateway } from "../../infrastructure/gateways/change-stage/production-order-change-stage.gateway";
import type { ProductionOrderCommandStore } from "../../infrastructure/db/production-order-command.store";

export type ProcessChangeStageProductionOrderData = {
    externalRequestId: string;
    omieCode: string;
    stage: string;
};

/**
 * Use case — Process change stage of production order from PgBoss worker
 *
 * Executa a alteração de etapa real no Omie, cria registro de auditoria e marca como confirmado.
 */
export class ProcessChangeStageProductionOrderUseCase {
    constructor(
        private readonly changeStageGateway: ProductionOrderChangeStageGateway,
        private readonly commandStore: ProductionOrderCommandStore,
        private readonly options: { isFake: boolean }
    ) { }

    async execute(data: ProcessChangeStageProductionOrderData): Promise<void> {
        const { externalRequestId, omieCode, stage } = data;

        if (!this.options.isFake) {
            const result = await this.changeStageGateway.changeStage({
                externalRequestId,
                omieCode,
                stage,
            });

            if (result.status === "FAILED") {
                throw new Error(`Omie rejeitou a alteração de etapa da OP: ${externalRequestId}`);
            }
        }

        // Cria registro de auditoria (se não existir) e marca como confirmado
        await this.commandStore.enqueue({
            externalRequestId,
            commandType: "CHANGE_STAGE",
            source: "JOB",
            payload: { omieCode, stage },
        });
        await this.commandStore.markConfirmed(externalRequestId);
    }
}
