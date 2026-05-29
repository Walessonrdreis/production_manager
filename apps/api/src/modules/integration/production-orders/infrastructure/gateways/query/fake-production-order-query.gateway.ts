import type { ProductionOrderQueryGateway } from "./production-order-query.gateway";
import { productionOrderIntegrationStore } from "../../db/production-order-integration.store";

export class FakeProductionOrderQueryGateway implements ProductionOrderQueryGateway {
  async getByExternalRequestId(externalRequestId: string) {
    console.log("[OP][FAKE][QUERY] getByExternalRequestId", { externalRequestId });
    return productionOrderIntegrationStore.getByExternalRequestId(externalRequestId);
  }

  async listByProductId(productId: string) {
    console.log("[OP][FAKE][QUERY] listByProductId", { productId });
    return productionOrderIntegrationStore.listByProductId(productId);
  }
}