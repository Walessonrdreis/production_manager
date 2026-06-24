// ---------------------------------------------------------------------------
// Fake Gateway — Product Creation (dev/test)
// ---------------------------------------------------------------------------

import type { ProductCreationGateway, CreateProductCommand } from "../../../application/ports/product-creation.gateway";
import { getLogger } from "@/shared/logger";

const logger = getLogger("FakeProductCreationGateway");

export class FakeProductCreationGateway implements ProductCreationGateway {
    async create(
        command: CreateProductCommand
    ): Promise<{
        externalRequestId: string;
        productCode: string;
        status: "ACCEPTED" | "CONFIRMED" | "FAILED";
    }> {
        logger.info("[FAKE] Creating product", {
            externalRequestId: command.externalRequestId,
            description: command.description,
        });

        // Simula criação devolvendo um código fictício
        return {
            externalRequestId: command.externalRequestId,
            productCode: `FAKE-${command.externalRequestId.substring(0, 8)}`,
            status: "CONFIRMED",
        };
    }
}
