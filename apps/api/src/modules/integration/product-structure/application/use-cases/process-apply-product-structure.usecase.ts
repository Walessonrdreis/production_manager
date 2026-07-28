import type { ProductStructureApplyGateway, ApplyProductStructureItem } from "../ports/product-structure-apply.gateway";
import type { ProductStructureFetchGateway } from "../ports/product-structure-fetch.gateway";
import type { ProductStructureIntegrationStore } from "../../infrastructure/db/product-structure-integration.store";
import type { ProductStructureCommandStore } from "../../infrastructure/db/product-structure-command.store";

export type ProcessApplyProductStructureData = {
    externalRequestId: string;
    productCode: string;
    items: ApplyProductStructureItem[];
};

/**
 * Use case — Process apply product structure (BOM) from PgBoss worker
 *
 * Executa o apply real: envia ao Omie, atualiza espelho local, marca como confirmado.
 * Substitui a lógica inline que estava no handler.
 */
export class ProcessApplyProductStructureUseCase {
    constructor(
        private readonly applyGateway: ProductStructureApplyGateway,
        private readonly fetchGateway: ProductStructureFetchGateway,
        private readonly integrationStore: ProductStructureIntegrationStore,
        private readonly commandStore: ProductStructureCommandStore,
        private readonly options: { isFake: boolean }
    ) { }

    async execute(data: ProcessApplyProductStructureData): Promise<void> {
        const { externalRequestId, productCode, items } = data;

        if (!this.options.isFake) {
            await this.applyGateway.apply(productCode, items);

            // Pós-apply: sincroniza espelho local
            const result = await this.fetchGateway.fetchByProductCode(productCode);
            await this.integrationStore.save(result);
        }

        // Cria registro de auditoria (se não existir) e marca como confirmado
        await this.commandStore.enqueue({
            externalRequestId,
            productCode,
            commandType: "APPLY",
            payload: { items },
            source: "JOB",
        });
        await this.commandStore.markConfirmed(externalRequestId);
    }
}
