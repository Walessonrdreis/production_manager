// ---------------------------------------------------------------------------
// Route — Get Production Order Stats (Read-Model)
// ---------------------------------------------------------------------------
// GET /v1/integration/production-orders/read/stats
// Retorna contagens do espelho local.
// Usa o padrão Real/Fake gateway selecionado via env var.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { env } from "@/config";

import { prisma } from "@/shared/db/prisma";
import { FakeProductionOrderQueryGateway } from "../../../../infrastructure/gateways/query/fake-production-order-query.gateway";
import { RealProductionOrderQueryGateway } from "../../../../infrastructure/gateways/query/real-production-order-query.gateway";

export async function registerGetProductionOrderStatsRoute(app: FastifyInstance) {
    app.get(
        "/v1/integration/production-orders/read/stats",
        async (request, reply) => {
            try {
                const isFake = env.PRODUCTION_ORDER_GATEWAY === "fake";
                const queryGateway = isFake
                    ? new FakeProductionOrderQueryGateway()
                    : new RealProductionOrderQueryGateway(prisma);

                const stats = await queryGateway.getProductionOrderStats();

                return reply.code(200).send({
                    success: true,
                    data: stats,
                });
            } catch (error) {
                console.error("[OP][STATS][ERROR]", error);
                return reply.code(500).send({
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: "An unexpected error occurred",
                });
            }
        }
    );
}
