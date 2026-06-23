import type { IntegrationStatus } from "../../db/production-order-integration.store";

export type UpdateProductionOrderCommand = {
    externalRequestId: string;
    omieCode: string;
    quantity?: number;
    forecastDate?: string;
    notes?: string;
};

export interface ProductionOrderUpdateGateway {
    updateProductionOrder(
        command: UpdateProductionOrderCommand
    ): Promise<{
        externalRequestId: string;
        status: IntegrationStatus;
    }>;
}
