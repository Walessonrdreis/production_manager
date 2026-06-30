// ---------------------------------------------------------------------------
// Route — List Open Production Orders (Read-Model)
// ---------------------------------------------------------------------------
// GET /v1/integration/production-orders/read/list-open
// Retorna OPs abertas do read model, com flags, prioridade, materiais.
// isLate e daysOverdue são recalculados ao vivo (sem alterar banco).
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { ProductionOrderReadModelStore } from "../../../../infrastructure/db/production-order-read-model.store";

export async function registerListOpenProductionOrdersRoute(
    app: FastifyInstance
) {
    app.get(
        "/v1/integration/production-orders/read/list-open",
        async (request, reply) => {
            try {
                const query = request.query as {
                    limit?: string;
                    offset?: string;
                    priority?: string;
                    operationalStatus?: string;
                    isLate?: string;
                    isBlocked?: string;
                    hasStockIssue?: string;
                };

                const store = new ProductionOrderReadModelStore();

                const isLate =
                    query.isLate !== undefined
                        ? query.isLate === "true"
                        : undefined;
                const isBlocked =
                    query.isBlocked !== undefined
                        ? query.isBlocked === "true"
                        : undefined;
                const hasStockIssue =
                    query.hasStockIssue !== undefined
                        ? query.hasStockIssue === "true"
                        : undefined;

                const result = await store.listOpenOrders({
                    limit: query.limit ? parseInt(query.limit, 10) : 100,
                    offset: query.offset ? parseInt(query.offset, 10) : 0,
                    priority: query.priority,
                    operationalStatus: query.operationalStatus,
                    isLate,
                    isBlocked,
                    hasStockIssue,
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
                console.error("[READ-MODEL][LIST-OPEN][ERROR]", error);
                return reply.code(500).send({
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: "An unexpected error occurred",
                });
            }
        }
    );
}
