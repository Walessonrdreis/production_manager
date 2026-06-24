// ---------------------------------------------------------------------------
// Fake Gateway — Product Update (dev/test)
// ---------------------------------------------------------------------------

import type { ProductUpdateGateway, UpdateProductCommand } from "../../../application/ports/product-update.gateway";
import { getLogger } from "@/shared/logger";

const logger = getLogger("FakeProductUpdateGateway");

export class FakeProductUpdateGateway implements ProductUpdateGateway {
    async update(
        command: UpdateProductCommand
    ): Promise<{
        externalRequestId: string;
        productCode: string;
        status: "ACCEPTED" | "CONFIRMED" | "FAILED";
    }> {
        logger.info("[FAKE] Updating product", {
            externalRequestId: command.externalRequestId,
            productCode: command.productCode,
        });

        return {
            externalRequestId: command.externalRequestId,
            productCode: command.productCode,
            status: "CONFIRMED",
        };
    }
}
