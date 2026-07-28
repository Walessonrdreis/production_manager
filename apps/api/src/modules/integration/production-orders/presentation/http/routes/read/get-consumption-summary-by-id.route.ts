// ---------------------------------------------------------------------------
// Route — Get Consumption Summary by OmieId (Read-Model)
// ---------------------------------------------------------------------------
// GET /v1/integration/production-orders/read/consumption/:omieId
// Retorna consumo de materiais de uma OP específica a partir do materialsJson.
// C1.3 spec v2 — sem JOIN, usa JSON pronto do read-model.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { ProductionOrderReadModelStore } from "../../../../infrastructure/db/production-order-read-model.store";

export async function registerGetConsumptionSummaryByIdRoute(
    app: FastifyInstance
) {
    app.get(
        "/v1/integration/production-orders/read/consumption/:omieId",
        async (request, reply) => {
            try {
                const { omieId } = request.params as { omieId: string };
                const store = new ProductionOrderReadModelStore();

                const consumption = await store.getConsumptionSummaryByOmieId(omieId);

                if (!consumption) {
                    return reply.code(404).send({
                        success: false,
                        error: "NOT_FOUND",
                        message: "Production order not found",
                    });
                }

                return reply.code(200).send({
                    success: true,
                    data: consumption,
                });
            } catch (error) {
                console.error("[READ-MODEL][CONSUMPTION-BY-ID][ERROR]", error);
                return reply.code(500).send({
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: "An unexpected error occurred",
                });
            }
        }
    );
}
