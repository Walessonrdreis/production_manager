import type { CreateProductionOrderRequest } from "../../../presentation/http/schemas";

export type ProductionOrderCreationGateway = {
  createProductionOrder(
    command: CreateProductionOrderRequest
  ): Promise<{
    externalRequestId: string;
    status: "ACCEPTED";
  }>;
};