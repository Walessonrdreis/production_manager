// ---------------------------------------------------------------------------
// Route — Get Production Order Summary by OmieId (Read-Model)
// ---------------------------------------------------------------------------
// GET /v1/integration/production-orders/read/summary/:omieId
// Retorna campos de resumo de uma OP específica a partir do read-model.
// C1.2 spec v2 — versão leve sem materiais.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { ProductionOrderReadModelStore } from "../../../../infrastructure/db/production-order-read-model.store";

export async function registerGetProductionOrderSummaryByIdRoute(
    app: FastifyInstance
) {
    app.get(
        "/v1/integration/production-orders/read/summary/:omieId",
        async (request, reply) => {
            try {
                const { omieId } = request.params as { omieId: string };
                const store = new ProductionOrderReadModelStore();

                const record = await store.getSummaryByOmieId(omieId);

                if (!record) {
                    return reply.code(404).send({
                        success: false,
                        error: "NOT_FOUND",
                        message: "Production order not found",
                    });
                }

                return reply.code(200).send({
                    success: true,
                    data: {
                        omieId: record.omieId,
                        orderNumber: record.orderNumber,
                        productCode: record.productCode,
                        productOmieId: record.productOmieId,
                        productName: record.productName,
                        productUnit: record.productUnit,
                        quantity: record.quantity,
                        expectedAt: record.expectedAt,
                        startedAt: record.startedAt,
                        completedAt: record.completedAt,
                        stage: record.stage,
                        operationalStatus: record.operationalStatus,
                        isOpen: record.isOpen,
                        isLate: record.isLate,
                        isReady: record.isReady,
                        isBlocked: record.isBlocked,
                        hasStockIssue: record.hasStockIssue,
                        hasMissingMaterials: record.hasMissingMaterials,
                        hasCriticalMaterial: record.hasCriticalMaterial,
                        hasPartialStock: record.hasPartialStock,
                        priority: record.priority,
                        daysOverdue: record.daysOverdue,
                        lastSyncAt: record.lastSyncAt,
                    },
                });
            } catch (error) {
                console.error("[READ-MODEL][SUMMARY-BY-ID][ERROR]", error);
                return reply.code(500).send({
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: "An unexpected error occurred",
                });
            }
        }
    );
}
