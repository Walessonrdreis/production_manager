import type { ProductionOrderChangeStageGateway } from "../ports/production-order-change-stage.gateway";
import type { ProductionOrderCommandStore } from "../../infrastructure/db/production-order-command.store";
import type { ProcessChangeStageProductionOrderData } from "../dto/change-stage-production-order.dto";

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
        const { externalRequestId, omieId, stage } = data;

        if (!this.options.isFake) {
            const result = await this.changeStageGateway.changeStage({
                externalRequestId,
                omieId,
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
            payload: { omieId, stage },
        });
        await this.commandStore.markConfirmed(externalRequestId);
    }
}
