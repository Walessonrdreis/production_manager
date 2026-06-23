import type { ProductStructureFetchGateway } from "../ports/product-structure-fetch.gateway";
import type { ProductStructureIntegrationStore } from "../../infrastructure/db/product-structure-integration.store";
import type { ProductStructureCommandStore } from "../../infrastructure/db/product-structure-command.store";

export type ProcessSyncProductStructureData = {
    externalRequestId: string;
    productCode: string;
};

/**
 * Use case — Process sync product structure (BOM) from PgBoss worker
 *
 * Executa o sync real: busca do Omie, salva espelho local, marca como confirmado.
 * Substitui a lógica inline que estava no handler.
 */
export class ProcessSyncProductStructureUseCase {
    constructor(
        private readonly fetchGateway: ProductStructureFetchGateway,
        private readonly integrationStore: ProductStructureIntegrationStore,
        private readonly commandStore: ProductStructureCommandStore,
        private readonly options: { isFake: boolean }
    ) { }

    async execute(data: ProcessSyncProductStructureData): Promise<void> {
        const { externalRequestId, productCode } = data;

        if (!this.options.isFake) {
            const result = await this.fetchGateway.fetchByProductCode(productCode);
            await this.integrationStore.save(result);
        }

        // Cria registro de auditoria (se não existir) e marca como confirmado
        await this.commandStore.enqueue({
            externalRequestId,
            productCode,
            commandType: "SYNC",
            source: "JOB",
        });
        await this.commandStore.markConfirmed(externalRequestId);
    }
}
