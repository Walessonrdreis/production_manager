// ---------------------------------------------------------------------------
// Route — List Unified Production Orders (Read-Model)
// ---------------------------------------------------------------------------
// GET /v1/integration/production-orders/read/list-unified
// Lista unificada do read-model com filtros combinados.
// Suporta filtros por flags (isOpen, isLate, isBlocked, etc.),
// status operacional, prioridade, código do produto e número da OP.
//
// C1-P0: Substitui list-open-production-orders.route.ts como endpoint
// principal de listagem, suportando OPs abertas E fechadas.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { ProductionOrderReadModelStore } from "../../../../infrastructure/db/production-order-read-model.store";

export async function registerListUnifiedProductionOrdersRoute(
    app: FastifyInstance
) {
    app.get(
        "/v1/integration/production-orders/read/list-unified",
        async (request, reply) => {
            try {
                const query = request.query as {
                    limit?: string;
                    offset?: string;
                    priority?: string;
                    operationalStatus?: string;
                    isOpen?: string;
                    isLate?: string;
                    isBlocked?: string;
                    hasStockIssue?: string;
                    hasMissingMaterials?: string;
                    hasCriticalMaterial?: string;
                    hasPartialStock?: string;
                    isReady?: string;
                    stage?: string;
                    productCode?: string;
                    orderNumber?: string;
                    startDateFrom?: string;
                    startDateTo?: string;
                    completionDateFrom?: string;
                    completionDateTo?: string;
                    q?: string;
                };

                const store = new ProductionOrderReadModelStore();

                function parseBool(val: string | undefined): boolean | undefined {
                    if (val === undefined) return undefined;
                    return val === "true";
                }

                const result = await store.listOrders({
                    limit: query.limit ? parseInt(query.limit, 10) : 50,
                    offset: query.offset ? parseInt(query.offset, 10) : 0,
                    priority: query.priority,
                    operationalStatus: query.operationalStatus,
                    isOpen: parseBool(query.isOpen),
                    isLate: parseBool(query.isLate),
                    isBlocked: parseBool(query.isBlocked),
                    hasStockIssue: parseBool(query.hasStockIssue),
                    hasMissingMaterials: parseBool(query.hasMissingMaterials),
                    hasCriticalMaterial: parseBool(query.hasCriticalMaterial),
                    hasPartialStock: parseBool(query.hasPartialStock),
                    isReady: parseBool(query.isReady),
                    stage: query.stage,
                    productCode: query.productCode,
                    orderNumber: query.orderNumber,
                    startDateFrom: query.startDateFrom,
                    startDateTo: query.startDateTo,
                    completionDateFrom: query.completionDateFrom,
                    completionDateTo: query.completionDateTo,
                    q: query.q,
                });

                // ─── Recalcular isLate/daysOverdue ao vivo ──────────────────
                const now = new Date();
                const rowsWithLiveData = result.data.map((row) => {
                    let isLate = row.isLate;
                    let daysOverdue = row.daysOverdue;

                    if (row.expectedAt && row.expectedAt < now && row.isOpen) {
                        isLate = true;
                        const diffMs = now.getTime() - row.expectedAt.getTime();
                        daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    }

                    return {
                        ...row,
                        isLate,
                        daysOverdue,
                    };
                });

                return reply.code(200).send({
                    success: true,
                    summary: result.summary,
                    meta: result.meta,
                    data: rowsWithLiveData,
                });
            } catch (error) {
                console.error("[READ-MODEL][LIST-UNIFIED][ERROR]", error);
                return reply.code(500).send({
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: "An unexpected error occurred",
                });
            }
        }
    );
}
