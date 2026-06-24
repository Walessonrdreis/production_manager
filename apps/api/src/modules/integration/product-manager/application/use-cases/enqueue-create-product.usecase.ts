// ---------------------------------------------------------------------------
// Use Case — Enqueue Create Product
// ---------------------------------------------------------------------------
// Cria comando PENDING no CommandStore e enfileira job no PgBoss.
// Retorna 202 Accepted.
// ---------------------------------------------------------------------------

import { enqueueJob } from "@/shared/infra/job-queue";
import { getLogger } from "@/shared/logger";
import type { EnqueueCreateProductData } from "../dto/create-product.dto";

const logger = getLogger("EnqueueCreateProductUseCase");

export type EnqueueCreateProductResult = {
    status: "ACCEPTED";
    externalRequestId: string;
};

export class EnqueueCreateProductUseCase {
    constructor(
        private readonly options: { noWrite?: boolean } = {}
    ) { }

    async execute(
        command: EnqueueCreateProductData
    ): Promise<EnqueueCreateProductResult> {
        if (this.options.noWrite) {
            return { status: "ACCEPTED", externalRequestId: command.externalRequestId };
        }

        logger.info("Enqueuing product creation", {
            externalRequestId: command.externalRequestId,
        });

        await enqueueJob("product-manager.create", {
            externalRequestId: command.externalRequestId,
            description: command.description,
            sku: command.sku,
            familyDescription: command.familyDescription,
            brand: command.brand,
            unit: command.unit,
            ncm: command.ncm,
        }, {
            retryLimit: 5,
            retryBackoff: true,
            singletonKey: `product-manager-create-${command.externalRequestId}`,
        });

        return { status: "ACCEPTED", externalRequestId: command.externalRequestId };
    }
}
