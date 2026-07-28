// ---------------------------------------------------------------------------
// Use Case — Process Create Product
// ---------------------------------------------------------------------------
// Executa a criação real no Omie via gateway, atualiza o espelho e
// marca o comando como CONFIRMED ou FAILED no CommandStore.
// ---------------------------------------------------------------------------

import type { ProductCreationGateway } from "../ports/product-creation.gateway";
import type { ProductManagerCommandStore } from "../../infrastructure/db/product-manager-command.store";
import type { ProcessCreateProductData } from "../dto/create-product.dto";
import { getLogger } from "@/shared/logger";

const logger = getLogger("ProcessCreateProductUseCase");

export class ProcessCreateProductUseCase {
    constructor(
        private readonly creationGateway: ProductCreationGateway,
        private readonly commandStore: ProductManagerCommandStore,
        private readonly options: { isFake: boolean }
    ) { }

    async execute(data: ProcessCreateProductData): Promise<void> {
        const { externalRequestId } = data;

        await this.commandStore.markProcessing(externalRequestId);

        const result = await this.creationGateway.create(data);

        if (result.status === "FAILED") {
            await this.commandStore.markFailed(externalRequestId, {
                code: "OMIE_REJECTED",
                message: "Omie rejeitou a criação do produto",
            });
            logger.error("Product creation failed in Omie", { externalRequestId });
            return;
        }

        // Atualiza o comando com o código do produto gerado
        await this.commandStore.markConfirmed(externalRequestId);

        logger.info("Product created successfully", {
            externalRequestId,
            productCode: result.productCode,
        });
    }
}
