import type { ProductStructureDeleteGateway } from "../ports/product-structure-delete.gateway";
import type { ProductStructureFetchGateway } from "../ports/product-structure-fetch.gateway";
import type { ProductStructureIntegrationStore } from "../../infrastructure/db/product-structure-integration.store";
import type { ProductStructureCommandStore } from "../../infrastructure/db/product-structure-command.store";

export type ProcessDeleteProductStructureData = {
    externalRequestId: string;
    productCode: string;
};

/**
 * Use case — Process delete product structure (BOM) from PgBoss worker
 *
 * Executa o delete real: exclui no Omie, atualiza espelho local, marca como confirmado.
 * Substitui a lógica inline que estava no handler.
 */
export class ProcessDeleteProductStructureUseCase {
    constructor(
        private readonly deleteGateway: ProductStructureDeleteGateway,
        private readonly fetchGateway: ProductStructureFetchGateway,
        private readonly integrationStore: ProductStructureIntegrationStore,
        private readonly commandStore: ProductStructureCommandStore,
        private readonly options: { isFake: boolean }
    ) { }

    async execute(data: ProcessDeleteProductStructureData): Promise<void> {
        const { externalRequestId, productCode } = data;

        if (!this.options.isFake) {
            await this.deleteGateway.delete(productCode);

            // Pós-delete: atualiza espelho local
            const result = await this.fetchGateway.fetchByProductCode(productCode);
            await this.integrationStore.save(result);
        }

        // Cria registro de auditoria (se não existir) e marca como confirmado
        await this.commandStore.enqueue({
            externalRequestId,
            productCode,
            commandType: "DELETE",
            source: "JOB",
        });
        await this.commandStore.markConfirmed(externalRequestId);
    }
}
