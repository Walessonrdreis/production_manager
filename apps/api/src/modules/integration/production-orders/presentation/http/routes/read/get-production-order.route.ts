// ---------------------------------------------------------------------------
// Route — Get Production Order Detail (Read-Model)
// ---------------------------------------------------------------------------
// GET /v1/integration/production-orders/read/:omieId
// Retorna detalhe da OP + itens do espelho local.
// Usa o padrão Real/Fake gateway selecionado via env var.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { env } from "@/config";

import { prisma } from "@/shared/db/prisma";
import { FakeProductionOrderQueryGateway } from "../../../../infrastructure/gateways/query/fake-production-order-query.gateway";
import { RealProductionOrderQueryGateway } from "../../../../infrastructure/gateways/query/real-production-order-query.gateway";

export async function registerGetProductionOrderRoute(app: FastifyInstance) {
    app.get(
        "/v1/integration/production-orders/read/:omieId",
        async (request, reply) => {
            try {
                const { omieId } = request.params as { omieId: string };

                const isFake = env.PRODUCTION_ORDER_GATEWAY === "fake";
                const queryGateway = isFake
                    ? new FakeProductionOrderQueryGateway()
                    : new RealProductionOrderQueryGateway(prisma);

                const record = await queryGateway.getProductionOrderByCode(omieId);

                if (!record) {
                    return reply.code(404).send({
                        success: false,
                        error: "NOT_FOUND",
                        message: `Production order ${omieId} not found`,
                    });
                }

                return reply.code(200).send({
                    success: true,
                    data: record,
                });
            } catch (error) {
                console.error("[OP][GET][ERROR]", error);
                return reply.code(500).send({
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: "An unexpected error occurred",
                });
            }
        }
    );
}
