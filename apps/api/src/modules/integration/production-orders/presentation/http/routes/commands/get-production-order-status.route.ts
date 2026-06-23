// ---------------------------------------------------------------------------
// Route — Get Production Order Status (Command Tracking)
// ---------------------------------------------------------------------------
// Tracking de comando: busca status por externalRequestId.
// Usa o padrão Real/Fake gateway selecionado via env var.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { env } from "@/config";

import { prisma } from "@/shared/db/prisma";
import { FakeProductionOrderQueryGateway } from "../../../../infrastructure/gateways/query/fake-production-order-query.gateway";
import { RealProductionOrderQueryGateway } from "../../../../infrastructure/gateways/query/real-production-order-query.gateway";

export async function registerGetProductionOrderStatusRoute(
    app: FastifyInstance
) {
    app.get(
        "/v1/integration/production-orders/commands/:externalRequestId",
        async (request, reply) => {
            try {
                const { externalRequestId } = request.params as {
                    externalRequestId: string;
                };

                const isFake = env.PRODUCTION_ORDER_GATEWAY === "fake";
                const queryGateway = isFake
                    ? new FakeProductionOrderQueryGateway()
                    : new RealProductionOrderQueryGateway(prisma);

                const record = await queryGateway.getByExternalRequestId(externalRequestId);

                if (!record) {
                    return reply.code(404).send({
                        success: false,
                        error: "NOT_FOUND",
                        message: "Production order request not found",
                    });
                }

                return reply.code(200).send({ success: true, data: record });
            } catch (error) {
                console.error("[OP][STATUS][ERROR]", error);
                return reply.code(500).send({
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: "An unexpected error occurred",
                });
            }
        }
    );
}
