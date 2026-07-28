import type { FastifyInstance } from "fastify";
import { SalesOrderSummaryReadModelStore } from "../../../../infrastructure/db/sales-order-summary-read-model.store";

export async function registerGetSalesOrderByIdRoute(
    app: FastifyInstance
) {
    const store = new SalesOrderSummaryReadModelStore();

    // GET /v1/admin/read/sales-orders/:omieId — detalhe de um pedido
    app.get<{ Params: { omieId: string } }>(
        "/v1/admin/read/sales-orders/:omieId",
        async (request, reply) => {
            const { omieId } = request.params;

            const record = await store.getByOmieId(omieId);

            if (!record) {
                return reply.code(404).send({
                    success: false,
                    error: "NOT_FOUND",
                    message: "Sales order not found",
                });
            }

            return reply.send({
                success: true,
                data: record,
            });
        }
    );

    // ── Alias canônico ─────────────────────────────────────────────

    app.get<{ Params: { omieId: string } }>(
        "/v1/integration/sales-order-sync/read/:omieId",
        async (request, reply) => {
            const { omieId } = request.params;

            const record = await store.getByOmieId(omieId);

            if (!record) {
                return reply.code(404).send({
                    success: false,
                    error: "NOT_FOUND",
                    message: "Sales order not found",
                });
            }

            return reply.send({
                success: true,
                data: record,
            });
        }
    );
}
