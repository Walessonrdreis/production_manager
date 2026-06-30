// ---------------------------------------------------------------------------
// Route — Get Production Orders with Stock Issues (Read-Model)
// ---------------------------------------------------------------------------
// GET /v1/integration/production-orders/read/stock-issues
// Retorna OPs com problemas de estoque (hasStockIssue, hasMissingMaterials,
// hasCriticalMaterial) a partir do read model.
//
// C2: Endpoint para triagem de OPs com falta de materiais.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { ProductionOrderReadModelStore } from "../../../../infrastructure/db/production-order-read-model.store";

export async function registerGetStockIssuesRoute(
    app: FastifyInstance
) {
    app.get(
        "/v1/integration/production-orders/read/stock-issues",
        async (request, reply) => {
            try {
                const query = request.query as {
                    limit?: string;
                    offset?: string;
                    type?: "missing" | "critical" | "partial" | "any";
                };

                const store = new ProductionOrderReadModelStore();

                const type = query.type ?? "any";

                const params: Record<string, unknown> = {
                    limit: query.limit ? parseInt(query.limit, 10) : 50,
                    offset: query.offset ? parseInt(query.offset, 10) : 0,
                };

                if (type === "missing") {
                    params.hasMissingMaterials = true;
                } else if (type === "critical") {
                    params.hasCriticalMaterial = true;
                } else if (type === "partial") {
                    params.hasPartialStock = true;
                } else {
                    params.hasStockIssue = true;
                }

                const result = await store.listOrders(params as any);

                return reply.code(200).send({
                    success: true,
                    summary: result.summary,
                    meta: result.meta,
                    data: result.data,
                });
            } catch (error) {
                console.error("[READ-MODEL][STOCK-ISSUES][ERROR]", error);
                return reply.code(500).send({
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: "An unexpected error occurred",
                });
            }
        }
    );
}
