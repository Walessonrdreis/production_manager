// ---------------------------------------------------------------------------
// Route — Refresh Production Order Read-Model
// ---------------------------------------------------------------------------
// POST /v1/admin/production-orders/read-model/refresh
// Dispara o refresh completo do read model de OPs.
// Operação administrativa — não é integração com Omie.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { RefreshProductionOrderReadModelUseCase } from "../../../../application/use-cases/refresh-production-order-read-model.usecase";
import { ProductionOrderReadModelStore } from "../../../../infrastructure/db/production-order-read-model.store";

export async function registerRefreshProductionOrderReadModelRoute(
    app: FastifyInstance
) {
    app.post(
        "/v1/admin/production-orders/read-model/refresh",
        async (request, reply) => {
            try {
                const body = (request.body ?? {}) as {
                    omieCode?: string;
                };

                const store = new ProductionOrderReadModelStore();
                const useCase = new RefreshProductionOrderReadModelUseCase(store);

                if (body.omieCode) {
                    // Refresh de uma OP específica
                    const record = await useCase.refreshOne(body.omieCode);
                    return reply.code(200).send({
                        success: true,
                        message: `Production order ${body.omieCode} refreshed`,
                        data: record,
                    });
                }

                // Refresh completo
                const result = await useCase.execute();
                return reply.code(200).send({
                    success: true,
                    message: "Production order read-model refresh completed",
                    data: result,
                });
            } catch (error) {
                console.error("[ADMIN][REFRESH-READ-MODEL][ERROR]", error);
                return reply.code(500).send({
                    success: false,
                    error: "INTERNAL_ERROR",
                    message:
                        error instanceof Error
                            ? error.message
                            : "An unexpected error occurred",
                });
            }
        }
    );
}
