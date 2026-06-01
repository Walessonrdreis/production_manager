import type { CreateProductionOrderRequest } from "../../../presentation/http/schemas";
import type { IntegrationStatus } from "../../db/production-order-integration.store";

export interface ProductionOrderCreationGateway {
  createProductionOrder(
    command: CreateProductionOrderRequest
  ): Promise<{
    externalRequestId: string;
    status: IntegrationStatus;
  }>;
}