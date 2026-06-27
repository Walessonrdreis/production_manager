import { productionOrderIntegrationStore } from "../../db/production-order-integration.store";
import type { ProductionOrderChangeStageGateway, ChangeProductionOrderStageCommand } from "../../../application/ports/production-order-change-stage.gateway";

export class FakeProductionOrderChangeStageGateway implements ProductionOrderChangeStageGateway {
    async changeStage(
        command: ChangeProductionOrderStageCommand
    ): Promise<{ externalRequestId: string; status: "ACCEPTED" }> {
        console.log("[OP][FAKE][CHANGE_STAGE] changeStage", {
            externalRequestId: command.externalRequestId,
            omieId: command.omieId,
            stage: command.stage,
        });

        await productionOrderIntegrationStore.upsertAccepted({
            externalRequestId: command.externalRequestId,
            productId: "",
            quantity: 0,
        });

        return { externalRequestId: command.externalRequestId, status: "ACCEPTED" };
    }
}
