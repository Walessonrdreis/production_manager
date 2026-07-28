import { CreateProductionOrderRequest } from "../../presentation/http/schemas";

export interface ProductionOrderIntegrationGateway {
  createProductionOrder(
    command: CreateProductionOrderRequest
  ): Promise<{
    externalRequestId: string;
    status: "ACCEPTED";
  }>;
}