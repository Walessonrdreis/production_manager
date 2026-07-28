import type { ProductionOrderLifecycleGateway } from "./production-order-lifecycle.gateway";
import { productionOrderIntegrationStore } from "../../db/production-order-integration.store";

export class FakeProductionOrderLifecycleGateway
  implements ProductionOrderLifecycleGateway
{
  async confirm(externalRequestId: string) {
    console.log("[OP][FAKE][LIFECYCLE] confirm", { externalRequestId });
    return productionOrderIntegrationStore.markConfirmed(externalRequestId);
  }

  async fail(
    externalRequestId: string,
    err: { code: string; message: string }
  ) {
    console.log("[OP][FAKE][LIFECYCLE] fail", { externalRequestId, code: err.code });
    return productionOrderIntegrationStore.markFailed(externalRequestId, err);
  }
}
