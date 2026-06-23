import type { IntegrationStatus } from "../../db/production-order-integration.store";

export type CancelProductionOrderCommand = {
  externalRequestId: string;
  omieCode: string;
  reason?: string;
};

export interface ProductionOrderCancelGateway {
  cancelProductionOrder(
    command: CancelProductionOrderCommand
  ): Promise<{
    externalRequestId: string;
    status: IntegrationStatus;
  }>;
}
