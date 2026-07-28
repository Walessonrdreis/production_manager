// ---------------------------------------------------------------------------
// Real Query Gateway — Consulta real no espelho local (omie_production_order)
// ---------------------------------------------------------------------------
// Usa ProductionOrderQueryStore internamente.
// Ativado quando PRODUCTION_ORDER_GATEWAY=real
// ---------------------------------------------------------------------------

import type { PrismaClient } from "@prisma/client";
import type { ProductionOrderQueryGateway } from "../../../application/ports/production-order-query.gateway";
import { ProductionOrderQueryStore } from "../../db/production-order-query.store";

export class RealProductionOrderQueryGateway implements ProductionOrderQueryGateway {
    private readonly store: ProductionOrderQueryStore;

    constructor(prisma: PrismaClient) {
        this.store = new ProductionOrderQueryStore(prisma);
    }

    // ─── Tracking (tabela production_order_integration) ───────────────

    async getByExternalRequestId(externalRequestId: string) {
        console.log("[OP][REAL][QUERY] getByExternalRequestId", { externalRequestId });
        // Fallback: consulta direta no Prisma
        const { prisma } = await import("@/shared/db/prisma");
        const record = await prisma.productionOrderIntegration.findUnique({
            where: { externalRequestId },
        });
        return record;
    }

    async listByProductId(productId: string) {
        console.log("[OP][REAL][QUERY] listByProductId", { productId });
        const { prisma } = await import("@/shared/db/prisma");
        const records = await prisma.productionOrderIntegration.findMany({
            where: { productId },
            orderBy: { createdAt: "desc" },
        });
        return records;
    }

    // ─── Espelho local (omie_production_order) ────────────────────────

    async listProductionOrders(page = 1, limit = 20, filters?: any) {
        console.log("[OP][REAL][QUERY] listProductionOrders", { page, limit, filters });
        return this.store.listProductionOrders(page, limit, filters);
    }

    async getProductionOrderByCode(omieId: string) {
        console.log("[OP][REAL][QUERY] getProductionOrderByCode", { omieId });
        return this.store.getProductionOrderByCode(omieId);
    }

    async getProductionOrderStats() {
        console.log("[OP][REAL][QUERY] getProductionOrderStats");
        return this.store.getProductionOrderStats();
    }
}
