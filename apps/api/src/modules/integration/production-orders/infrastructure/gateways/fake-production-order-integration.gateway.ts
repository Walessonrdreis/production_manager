import type { ProductionOrderIntegrationGateway } from "../../application/ports/production-order-integration.gateway";
import type { CreateProductionOrderRequest } from "../../presentation/http/schemas";
import { productionOrderIntegrationStore } from "../db/production-order-integration.store";

export class FakeProductionOrderIntegrationGateway
  implements ProductionOrderIntegrationGateway
{
  async createProductionOrder(command: CreateProductionOrderRequest): Promise<{
    externalRequestId: string;
    status: "ACCEPTED";
  }> {
    console.log("[OP][FAKE][GATEWAY] create", {
      externalRequestId: command.externalRequestId,
    });

    // ✅ idempotência: mesmo externalRequestId -> re-upsert sem duplicar
    productionOrderIntegrationStore.upsertAccepted({
      externalRequestId: command.externalRequestId,
      productId: command.productId,
      quantity: command.quantity,
      scheduledDate: command.scheduledDate,
      notes: command.notes,
      omieProductionOrderId: undefined,
      lastError: undefined,
    });

    return { externalRequestId: command.externalRequestId, status: "ACCEPTED" };
  }
}