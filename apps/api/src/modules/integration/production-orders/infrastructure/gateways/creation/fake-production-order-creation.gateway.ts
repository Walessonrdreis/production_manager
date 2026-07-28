import type { ProductionOrderCreationGateway, CreateProductionOrderCommand } from "../../../application/ports/production-order-creation.gateway";
import { productionOrderIntegrationStore } from "../../db/production-order-integration.store";

export class FakeProductionOrderCreationGateway
  implements ProductionOrderCreationGateway {
  async createProductionOrder(
    command: CreateProductionOrderCommand
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