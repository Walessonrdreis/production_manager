// ---------------------------------------------------------------------------
// Callback — Fail Sales Order Sync (Fake-only)
// ---------------------------------------------------------------------------
// Callbacks são respostas que ENTRAM no sistema.
// Diferente de commands, não enfileiram — atualizam o comando diretamente.
// Em modo real, a falha viria do Omie via webhook.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@/shared/db/prisma";
import { env } from "@/config";
import { SalesOrderSyncCommandStore } from "../../../../infrastructure/db/sales-order-sync-command.store";

const FailBodySchema = z.object({
    code: z.string(),
    message: z.string(),
});

export async function registerFailSalesOrderSyncCallbackRoute(
    app: FastifyInstance
) {
    app.post(
        "/v1/integration/sales-order-sync/callbacks/:externalRequestId/fail",
        async (request, reply) => {
            const { externalRequestId } = request.params as {
                externalRequestId: string;
            };

            if (env.SALES_ORDER_SYNC_GATEWAY === "real") {
                return reply.code(405).send({
                    success: false,
                    error: "METHOD_NOT_ALLOWED",
                    message:
                        "Fail callback is available only when SALES_ORDER_SYNC_GATEWAY=fake",
                });
            }

            const body = FailBodySchema.parse(request.body);

            const commandStore = new SalesOrderSyncCommandStore(prisma);
            const existing = await commandStore.findByExternalRequestId(
                externalRequestId
            );

            if (!existing) {
                return reply.code(404).send({
                    success: false,
                    error: "NOT_FOUND",
                    message: "Sales order sync command not found",
                });
            }

            const record = await commandStore.markFailed(
                externalRequestId,
                body
            );

            return reply.code(200).send({ success: true, data: record });
        }
    );
}
