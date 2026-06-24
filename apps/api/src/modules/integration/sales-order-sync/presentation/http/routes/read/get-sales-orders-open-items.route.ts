import type { FastifyInstance } from "fastify";
import { SalesOrderOpenItemsStore } from "../../../../infrastructure/db/sales-order-open-items.store";

type ListOpenItemsQueryString = {
    q?: string;
    limit?: number;
    offset?: number;
};

export async function registerGetSalesOrdersOpenItemsRoute(
    app: FastifyInstance
) {
    const store = new SalesOrderOpenItemsStore();

    // GET /v1/admin/read/sales-orders/open-items
    // Lista itens de pedidos em aberto (não cancelados, não encerrados)
    // para a equipe de separação/expedição.
    app.get(
        "/v1/admin/read/sales-orders/open-items",
        async (request, reply) => {
            const query = request.query as ListOpenItemsQueryString;

            const result = await store.list({
                q: query.q ?? null,
                limit: query.limit,
                offset: query.offset,
            });

            return reply.send({
                success: true,
                data: result.data,
                meta: result.meta,
            });
        }
    );

    // ── Alias canônico ───────────────────────────────────────────────
    app.get(
        "/v1/integration/sales-order-sync/read/open-items",
        async (request, reply) => {
            const query = request.query as ListOpenItemsQueryString;

            const result = await store.list({
                q: query.q ?? null,
                limit: query.limit,
                offset: query.offset,
            });

            return reply.send({
                success: true,
                data: result.data,
                meta: result.meta,
            });
        }
    );
}
