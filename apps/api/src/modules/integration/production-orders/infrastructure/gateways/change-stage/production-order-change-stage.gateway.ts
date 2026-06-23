import type { IntegrationStatus } from "../../db/production-order-integration.store";

export type ChangeProductionOrderStageCommand = {
    externalRequestId: string;
    omieCode: string;
    stage: string;
};

export interface ProductionOrderChangeStageGateway {
    changeStage(
        command: ChangeProductionOrderStageCommand
    ): Promise<{
        externalRequestId: string;
        status: IntegrationStatus;
    }>;
}
