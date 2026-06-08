import type { ProductionOrderCreationGateway } from "./production-order-creation.gateway";
import type { CreateProductionOrderRequest } from "../../../presentation/http/schemas";
import { productionOrderIntegrationStore } from "../../db/production-order-integration.store";

export class FakeProductionOrderCreationGateway
  implements ProductionOrderCreationGateway
{
  async createProductionOrder(
    command: CreateProductionOrderRequest
  ): Promise<{ externalRequestId: string; status: "ACCEPTED" }> {
    console.log("[OP][FAKE][CREATION] create", {
      externalRequestId: command.externalRequestId,
    });

    await productionOrderIntegrationStore.upsertAccepted({
      externalRequestId: command.externalRequestId,
      productId: command.productId,
      quantity: command.quantity,
    });

    return { externalRequestId: command.externalRequestId, status: "ACCEPTED" };
  }
}