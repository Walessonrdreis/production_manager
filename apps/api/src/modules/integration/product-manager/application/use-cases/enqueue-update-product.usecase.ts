// ---------------------------------------------------------------------------
// Use Case — Enqueue Update Product
// ---------------------------------------------------------------------------

import { enqueueJob } from "@/shared/infra/job-queue";
import { getLogger } from "@/shared/logger";
import type { EnqueueUpdateProductData } from "../dto/update-product.dto";

const logger = getLogger("EnqueueUpdateProductUseCase");

export type EnqueueUpdateProductResult = {
    status: "ACCEPTED";
    externalRequestId: string;
};

export class EnqueueUpdateProductUseCase {
    constructor(
        private readonly options: { noWrite?: boolean } = {}
    ) { }

    async execute(
        command: EnqueueUpdateProductData
    ): Promise<EnqueueUpdateProductResult> {
        if (this.options.noWrite) {
            return { status: "ACCEPTED", externalRequestId: command.externalRequestId };
        }

        logger.info("Enqueuing product update", {
            externalRequestId: command.externalRequestId,
            productCode: command.productCode,
        });

        await enqueueJob("product-manager.update", {
            externalRequestId: command.externalRequestId,
            productCode: command.productCode,
            description: command.description,
            sku: command.sku,
            familyDescription: command.familyDescription,
            brand: command.brand,
            unit: command.unit,
            ncm: command.ncm,
        }, {
            retryLimit: 5,
            retryBackoff: true,
            singletonKey: `product-manager-update-${command.externalRequestId}`,
        });

        return { status: "ACCEPTED", externalRequestId: command.externalRequestId };
    }
}
