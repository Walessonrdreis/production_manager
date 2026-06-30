// ---------------------------------------------------------------------------
// Route — Get Production Order by Order Number (Read-Model)
// ---------------------------------------------------------------------------
// GET /v1/integration/production-orders/read/by-number/:orderNumber
// Retorna uma OP específica localizada pelo número do pedido.
//
// C2: Endpoint para consulta rápida por número da OP.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { ProductionOrderReadModelStore } from "../../../../infrastructure/db/production-order-read-model.store";

export async function registerGetProductionOrderByNumberRoute(
    app: FastifyInstance
) {
    app.get(
        "/v1/integration/production-orders/read/by-number/:orderNumber",
        async (request, reply) => {
            try {
                const { orderNumber } = request.params as { orderNumber: string };
                const store = new ProductionOrderReadModelStore();

                const record = await store.getByOrderNumber(orderNumber);

                if (!record) {
                    return reply.code(404).send({
                        success: false,
                        error: "NOT_FOUND",
                        message: `Production order with number ${orderNumber} not found`,
                    });
                }

                return reply.code(200).send({
                    success: true,
                    data: record,
                });
            } catch (error) {
                console.error("[READ-MODEL][BY-NUMBER][ERROR]", error);
                return reply.code(500).send({
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: "An unexpected error occurred",
                });
            }
        }
    );
}
