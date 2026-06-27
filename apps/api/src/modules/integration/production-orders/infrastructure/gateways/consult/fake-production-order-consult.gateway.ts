// ---------------------------------------------------------------------------
// Gateway — Fake Production Order Consult
// ---------------------------------------------------------------------------
// Lê do espelho local como fallback. Útil para testar a rota de refresh
// sem depender do Omie.
// ---------------------------------------------------------------------------

import type { ProductionOrderConsultGateway, ProductionOrderConsultResult } from "../../../application/ports/production-order-consult.gateway";

export class FakeProductionOrderConsultGateway
    implements ProductionOrderConsultGateway {
    async consult(omieId: string): Promise<ProductionOrderConsultResult | null> {
        console.log("[OP][FAKE][CONSULT] consult", { omieId });

        const { prisma } = await import("@/shared/db/prisma");
        const record = await prisma.omieProductionOrder.findUnique({
            where: { omieId },
            include: { items: true },
        });

        if (!record) return null;

        return {
            omieId: record.omieId,
            internalCode: record.internalCode,
            orderNumber: record.orderNumber,
            productCode: record.productCode,
            productIntegrationCode: record.productIntegrationCode,
            quantity: record.quantity,
            forecastDate: record.forecastDate?.toISOString() ?? null,
            startDate: record.startDate?.toISOString() ?? null,
            completionDate: record.completionDate?.toISOString() ?? null,
            stage: record.stage,
            projectCode: record.projectCode,
            completed: record.completed,
            active: record.active,
            rawPayload: record.rawPayload,
            items: record.items.map((i) => ({
                omieItemCode: i.omieItemCode,
                productMeshId: i.productMeshId ? Number(i.productMeshId) : null,
                useFromStock: i.useFromStock ?? null,
                quantity: i.quantity ?? null,
                stockLocationCode: i.stockLocationCode ? Number(i.stockLocationCode) : null,
                observation: i.observation ?? null,
            })),
        };
    }
}
