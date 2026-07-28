// ---------------------------------------------------------------------------
// Callback — Confirm Product Structure (Fake-only)
// ---------------------------------------------------------------------------
// Callbacks são respostas que ENTRAM no sistema.
// Diferente de commands, não enfileiram — atualizam o comando diretamente.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { FakeProductStructureLifecycleGateway } from "../../../../infrastructure/gateways/lifecycle/fake-product-structure-lifecycle.gateway";

export async function registerConfirmProductStructureCallbackRoute(app: FastifyInstance) {
    app.post(
        "/v1/integration/product-structure/callbacks/:externalRequestId/confirm",
        async (request, reply) => {
            const { externalRequestId } = request.params as {
                externalRequestId: string;
            };

            if (process.env.PRODUCT_STRUCTURE_GATEWAY === "real") {
                return reply.code(405).send({
                    success: false,
                    error: "METHOD_NOT_ALLOWED",
                    message: "Confirm is available only when PRODUCT_STRUCTURE_GATEWAY=fake",
                });
            }

            const lifecycle = new FakeProductStructureLifecycleGateway();
            const record = await lifecycle.confirm(externalRequestId);

            if (!record) {
                return reply.code(404).send({
                    success: false,
                    error: "NOT_FOUND",
                    message: "Product structure request not found",
                });
            }

            return reply.code(200).send({ success: true, data: record });
        }
    );
}
