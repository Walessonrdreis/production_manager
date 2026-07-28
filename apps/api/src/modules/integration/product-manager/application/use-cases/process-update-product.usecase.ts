// ---------------------------------------------------------------------------
// Use Case — Process Update Product
// ---------------------------------------------------------------------------

import type { ProductUpdateGateway } from "../ports/product-update.gateway";
import type { ProductManagerCommandStore } from "../../infrastructure/db/product-manager-command.store";
import type { ProcessUpdateProductData } from "../dto/update-product.dto";
import { getLogger } from "@/shared/logger";

const logger = getLogger("ProcessUpdateProductUseCase");

export class ProcessUpdateProductUseCase {
    constructor(
        private readonly updateGateway: ProductUpdateGateway,
        private readonly commandStore: ProductManagerCommandStore,
        private readonly options: { isFake: boolean }
    ) { }

    async execute(data: ProcessUpdateProductData): Promise<void> {
        const { externalRequestId } = data;

        await this.commandStore.markProcessing(externalRequestId);

        const result = await this.updateGateway.update(data);

        if (result.status === "FAILED") {
            await this.commandStore.markFailed(externalRequestId, {
                code: "OMIE_REJECTED",
                message: "Omie rejeitou a alteração do produto",
            });
            logger.error("Product update failed in Omie", { externalRequestId });
            return;
        }

        await this.commandStore.markConfirmed(externalRequestId);

        logger.info("Product updated successfully", {
            externalRequestId,
            productCode: result.productCode,
        });
    }
}
