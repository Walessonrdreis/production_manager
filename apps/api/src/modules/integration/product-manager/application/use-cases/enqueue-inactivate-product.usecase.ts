// ---------------------------------------------------------------------------
// Use Case — Enqueue Inactivate Product
// ---------------------------------------------------------------------------

import { enqueueJob } from "@/shared/infra/job-queue";
import { getLogger } from "@/shared/logger";
import type { EnqueueInactivateProductData } from "../dto/inactivate-product.dto";

const logger = getLogger("EnqueueInactivateProductUseCase");

export type EnqueueInactivateProductResult = {
    status: "ACCEPTED";
    externalRequestId: string;
};

export class EnqueueInactivateProductUseCase {
    constructor(
        private readonly options: { noWrite?: boolean } = {}
    ) { }

    async execute(
        command: EnqueueInactivateProductData
    ): Promise<EnqueueInactivateProductResult> {
        if (this.options.noWrite) {
            return { status: "ACCEPTED", externalRequestId: command.externalRequestId };
        }

        logger.info("Enqueuing product inactivation", {
            externalRequestId: command.externalRequestId,
            productCode: command.productCode,
        });

        await enqueueJob("product-manager.inactivate", {
            externalRequestId: command.externalRequestId,
            productCode: command.productCode,
        }, {
            retryLimit: 5,
            retryBackoff: true,
            singletonKey: `product-manager-inactivate-${command.externalRequestId}`,
        });

        return { status: "ACCEPTED", externalRequestId: command.externalRequestId };
    }
}
