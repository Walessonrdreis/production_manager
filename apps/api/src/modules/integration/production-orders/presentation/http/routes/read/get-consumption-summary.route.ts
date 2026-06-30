// ---------------------------------------------------------------------------
// Route — Production Order Consumption Summary (Read-Model)
// ---------------------------------------------------------------------------
// GET /v1/integration/production-orders/read/consumption-summary
// Retorna consumo agregado de materiais em todas as OPs abertas.
// Agrupa por componente, soma totalRequired, e classifica risco de falta.
//
// C1-P0: Endpoint para visão consolidada de necessidade de materiais.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { ProductionOrderReadModelStore } from "../../../../infrastructure/db/production-order-read-model.store";

export async function registerGetConsumptionSummaryRoute(
    app: FastifyInstance
) {
    app.get(
        "/v1/integration/production-orders/read/consumption-summary",
        async (_request, reply) => {
            try {
                const store = new ProductionOrderReadModelStore();
                const result = await store.getConsumptionSummary();

                return reply.code(200).send({
                    success: true,
                    data: result,
                });
            } catch (error) {
                console.error("[READ-MODEL][CONSUMPTION-SUMMARY][ERROR]", error);
                return reply.code(500).send({
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: "An unexpected error occurred",
                });
            }
        }
    );
}
