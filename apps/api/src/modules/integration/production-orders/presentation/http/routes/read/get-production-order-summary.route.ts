// ---------------------------------------------------------------------------
// Route — Production Order Summary (Read-Model)
// ---------------------------------------------------------------------------
// GET /v1/integration/production-orders/read/summary
// Retorna contagens agregadas do read model para dashboard.
//
// C1-P0: Endpoint de sumário para visão geral do estado das OPs.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { ProductionOrderReadModelStore } from "../../../../infrastructure/db/production-order-read-model.store";

export async function registerGetProductionOrderSummaryRoute(
    app: FastifyInstance
) {
    app.get(
        "/v1/integration/production-orders/read/summary",
        async (_request, reply) => {
            try {
                const store = new ProductionOrderReadModelStore();
                const summary = await store.getSummary();

                return reply.code(200).send({
                    success: true,
                    data: summary,
                });
            } catch (error) {
                console.error("[READ-MODEL][SUMMARY][ERROR]", error);
                return reply.code(500).send({
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: "An unexpected error occurred",
                });
            }
        }
    );
}
