import { productionOrderIntegrationStore } from "../../db/production-order-integration.store";
import type { ProductionOrderCancelGateway, CancelProductionOrderCommand } from "../../../application/ports/production-order-cancel.gateway";

export class FakeProductionOrderCancelGateway implements ProductionOrderCancelGateway {
    async cancelProductionOrder(
        command: CancelProductionOrderCommand
    ): Promise<{ externalRequestId: string; status: "ACCEPTED" }> {
        console.log("[OP][FAKE][CANCEL] cancel", {
            externalRequestId: command.externalRequestId,
            omieId: command.omieId,
            reason: command.reason,
        });

        await productionOrderIntegrationStore.upsertAccepted({
            externalRequestId: command.externalRequestId,
            productId: "",
            quantity: 0,
        });

        return { externalRequestId: command.externalRequestId, status: "ACCEPTED" };
    }
}
