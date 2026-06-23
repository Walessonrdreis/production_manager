// ---------------------------------------------------------------------------
// Callback — Confirm Production Order (Fake-only)
// ---------------------------------------------------------------------------
// Callbacks são respostas que ENTRAM no sistema.
// Diferente de commands, não enfileiram — atualizam o comando diretamente.

import type { FastifyInstance } from "fastify";
import { FakeProductionOrderLifecycleGateway } from "../../../../infrastructure/gateways/lifecycle/fake-production-order-lifecycle.gateway";

export async function registerConfirmProductionOrderCallbackRoute(app: FastifyInstance) {
    app.post(
        "/v1/integration/production-orders/callbacks/:externalRequestId/confirm",
        async (request, reply) => {
            const { externalRequestId } = request.params as {
                externalRequestId: string;
            };

            if (process.env.PRODUCTION_ORDER_GATEWAY === "real") {
                return reply.code(405).send({
                    success: false,
                    error: "METHOD_NOT_ALLOWED",
                    message: "Confirm is available only when PRODUCTION_ORDER_GATEWAY=fake",
                });
            }

            const lifecycle = new FakeProductionOrderLifecycleGateway();
            const record = await lifecycle.confirm(externalRequestId);

            if (!record) {
                return reply.code(404).send({
                    success: false,
                    error: "NOT_FOUND",
                    message: "Production order request not found",
                });
            }

            return reply.code(200).send({ success: true, data: record });
        }
    );
}
