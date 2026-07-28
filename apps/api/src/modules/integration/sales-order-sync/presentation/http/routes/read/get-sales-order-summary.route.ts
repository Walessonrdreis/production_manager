import type { FastifyInstance } from "fastify";
import { SalesOrderSummaryReadModelStore } from "../../../../infrastructure/db/sales-order-summary-read-model.store";

type ListSalesOrdersQueryString = {
    stage?: string;
    isCanceled?: string;
    isClosed?: string;
    customerOmieId?: string;
    activeOnly?: string;
    q?: string;
    limit?: number;
    offset?: number;
};

export async function registerGetSalesOrderSummaryRoutes(
    app: FastifyInstance
) {
    const store = new SalesOrderSummaryReadModelStore();

    // GET /v1/admin/read/sales-orders — listar pedidos resumidos
    app.get(
        "/v1/admin/read/sales-orders",
        async (request, reply) => {
            const query = request.query as ListSalesOrdersQueryString;

            const isCanceled =
                query.isCanceled !== undefined
                    ? query.isCanceled === "true"
                    : undefined;

            const isClosed =
                query.isClosed !== undefined
                    ? query.isClosed === "true"
                    : undefined;

            const activeOnly =
                query.activeOnly !== undefined
                    ? query.activeOnly === "true"
                    : undefined;

            const result = await store.list({
                stage: query.stage ?? null,
                isCanceled,
                isClosed,
                activeOnly,
                customerOmieId: query.customerOmieId ?? null,
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

    // GET /v1/admin/read/sales-orders/stats — estatísticas agregadas
    app.get(
        "/v1/admin/read/sales-orders/stats",
        async (_request, reply) => {
            const stats = await store.getStats();

            return reply.send({
                success: true,
                data: stats,
            });
        }
    );

    // ── Aliases canônicos ───────────────────────────────────────────
    // Mantém compatibilidade com admin paths e adiciona integration paths

    app.get(
        "/v1/integration/sales-order-sync/read/summary",
        async (request, reply) => {
            const query = request.query as ListSalesOrdersQueryString;

            const result = await store.list({
                stage: query.stage ?? null,
                isCanceled:
                    query.isCanceled !== undefined
                        ? query.isCanceled === "true"
                        : undefined,
                isClosed:
                    query.isClosed !== undefined
                        ? query.isClosed === "true"
                        : undefined,
                activeOnly:
                    query.activeOnly !== undefined
                        ? query.activeOnly === "true"
                        : undefined,
                customerOmieId: query.customerOmieId ?? null,
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

    app.get(
        "/v1/integration/sales-order-sync/read/stats",
        async (_request, reply) => {
            const stats = await store.getStats();

            return reply.send({
                success: true,
                data: stats,
            });
        }
    );
}
