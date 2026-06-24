import { productionOrderIntegrationStore } from "../../db/production-order-integration.store";
import type { ProductionOrderUpdateGateway, UpdateProductionOrderCommand } from "../../../application/ports/production-order-update.gateway";

export class FakeProductionOrderUpdateGateway implements ProductionOrderUpdateGateway {
    async updateProductionOrder(
        command: UpdateProductionOrderCommand
    ): Promise<{ externalRequestId: string; status: "ACCEPTED" }> {
        console.log("[OP][FAKE][UPDATE] update", {
            externalRequestId: command.externalRequestId,
            omieCode: command.omieCode,
            quantity: command.quantity,
        });

        await productionOrderIntegrationStore.upsertAccepted({
            externalRequestId: command.externalRequestId,
            productId: "",
            quantity: command.quantity ?? 0,
        });

        return { externalRequestId: command.externalRequestId, status: "ACCEPTED" };
    }
}
