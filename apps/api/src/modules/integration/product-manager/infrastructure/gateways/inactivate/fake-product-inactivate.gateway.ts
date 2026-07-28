// ---------------------------------------------------------------------------
// Fake Gateway — Product Inactivate (dev/test)
// ---------------------------------------------------------------------------

import type { ProductInactivateGateway, InactivateProductCommand } from "../../../application/ports/product-inactivate.gateway";
import { getLogger } from "@/shared/logger";

const logger = getLogger("FakeProductInactivateGateway");

export class FakeProductInactivateGateway implements ProductInactivateGateway {
    async inactivate(
        command: InactivateProductCommand
    ): Promise<{
        externalRequestId: string;
        productCode: string;
        status: "ACCEPTED" | "CONFIRMED" | "FAILED";
    }> {
        logger.info("[FAKE] Inactivating product", {
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
