// ---------------------------------------------------------------------------
// Use Case — Process Inactivate Product
// ---------------------------------------------------------------------------

import type { ProductInactivateGateway } from "../ports/product-inactivate.gateway";
import type { ProductManagerCommandStore } from "../../infrastructure/db/product-manager-command.store";
import type { ProcessInactivateProductData } from "../dto/inactivate-product.dto";
import { getLogger } from "@/shared/logger";

const logger = getLogger("ProcessInactivateProductUseCase");

export class ProcessInactivateProductUseCase {
    constructor(
        private readonly inactivateGateway: ProductInactivateGateway,
        private readonly commandStore: ProductManagerCommandStore,
        private readonly options: { isFake: boolean }
    ) { }

    async execute(data: ProcessInactivateProductData): Promise<void> {
        const { externalRequestId } = data;

        await this.commandStore.markProcessing(externalRequestId);

        const result = await this.inactivateGateway.inactivate(data);

        if (result.status === "FAILED") {
            await this.commandStore.markFailed(externalRequestId, {
                code: "OMIE_REJECTED",
                message: "Omie rejeitou a inativação do produto",
            });
            logger.error("Product inactivation failed in Omie", { externalRequestId });
            return;
        }

        await this.commandStore.markConfirmed(externalRequestId);

        logger.info("Product inactivated successfully", {
            externalRequestId,
            productCode: result.productCode,
        });
    }
}
