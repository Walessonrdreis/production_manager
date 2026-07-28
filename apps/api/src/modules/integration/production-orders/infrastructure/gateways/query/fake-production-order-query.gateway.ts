import type { ProductionOrderQueryGateway } from "../../../application/ports/production-order-query.gateway";
import { productionOrderIntegrationStore } from "../../db/production-order-integration.store";

export class FakeProductionOrderQueryGateway implements ProductionOrderQueryGateway {
  // ─── Tracking (tabela production_order_integration) ───────────────

  async getByExternalRequestId(externalRequestId: string) {
    console.log("[OP][FAKE][QUERY] getByExternalRequestId", { externalRequestId });
    return await productionOrderIntegrationStore.getByExternalRequestId(externalRequestId);
  }

  async listByProductId(productId: string) {
    console.log("[OP][FAKE][QUERY] listByProductId", { productId });
    return await productionOrderIntegrationStore.listByProductId(productId);
  }

  // ─── Espelho local (omie_production_order) — versão fake ──────────

  async listProductionOrders(page = 1, limit = 20, _filters?: any) {
    console.log("[OP][FAKE][QUERY] listProductionOrders", { page, limit });
    const { prisma } = await import("@/shared/db/prisma");
    const { ProductionOrderQueryStore } = await import("../../db/production-order-query.store");
    const store = new ProductionOrderQueryStore(prisma);
    return store.listProductionOrders(page, limit, _filters);
  }

  async getProductionOrderByCode(omieId: string) {
    console.log("[OP][FAKE][QUERY] getProductionOrderByCode", { omieId });
    const { prisma } = await import("@/shared/db/prisma");
    const { ProductionOrderQueryStore } = await import("../../db/production-order-query.store");
    const store = new ProductionOrderQueryStore(prisma);
    return store.getProductionOrderByCode(omieId);
  }

  async getProductionOrderStats() {
    console.log("[OP][FAKE][QUERY] getProductionOrderStats");
    const { prisma } = await import("@/shared/db/prisma");
    const { ProductionOrderQueryStore } = await import("../../db/production-order-query.store");
    const store = new ProductionOrderQueryStore(prisma);
    return store.getProductionOrderStats();
  }
}