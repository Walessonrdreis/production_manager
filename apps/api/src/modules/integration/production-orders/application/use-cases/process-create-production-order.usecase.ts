import type { ProductionOrderCreationGateway } from "../ports/production-order-creation.gateway";
import type { ProductionOrderCommandStore } from "../../infrastructure/db/production-order-command.store";
import type { ProcessCreateProductionOrderData } from "../dto/create-production-order.dto";

/**
 * Use case — Process create production order from PgBoss worker
 *
 * Executa a criação real no Omie, cria registro de auditoria e marca como confirmado.
 */
export class ProcessCreateProductionOrderUseCase {
    constructor(
        private readonly creationGateway: ProductionOrderCreationGateway,
        private readonly commandStore: ProductionOrderCommandStore,
        private readonly options: { isFake: boolean }
    ) { }

    async execute(data: ProcessCreateProductionOrderData): Promise<void> {
        const { externalRequestId, productId, quantity, scheduledDate, notes } = data;

        if (!this.options.isFake) {
            const result = await this.creationGateway.createProductionOrder({
                externalRequestId,
                productId,
                quantity,
                scheduledDate,
                notes,
            });

            if (result.status === "FAILED") {
                throw new Error(`Omie rejeitou a criação da OP: ${externalRequestId}`);
            }
        }

        // Cria registro de auditoria (se não existir) e marca como confirmado
        await this.commandStore.enqueue({
            externalRequestId,
            commandType: "CREATE_OP",
            source: "JOB",
            payload: { productId, quantity, scheduledDate, notes },
        });
        await this.commandStore.markConfirmed(externalRequestId);
    }
}
