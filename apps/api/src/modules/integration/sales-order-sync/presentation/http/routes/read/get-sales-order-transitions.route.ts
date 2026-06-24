import type { FastifyInstance } from "fastify";
import { SalesOrderStageTransitionStore } from "../../../../infrastructure/db/sales-order-stage-transition.store";

type ListTransitionsQueryString = {
    salesOrderOmieId?: string;
    toStage?: string;
    limit?: number;
    offset?: number;
};

export async function registerGetSalesOrderTransitionsRoutes(
    app: FastifyInstance
) {
    const store = new SalesOrderStageTransitionStore();

    // GET /v1/admin/read/sales-orders/transitions — listar histórico de transições
    app.get(
        "/v1/admin/read/sales-orders/transitions",
        async (request, reply) => {
            const query = request.query as ListTransitionsQueryString;

            const result = await store.list({
                salesOrderOmieId: query.salesOrderOmieId,
                toStage: query.toStage,
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

    // GET /v1/admin/read/sales-orders/:omieId/transitions — transições de um pedido
    app.get<{ Params: { omieId: string } }>(
        "/v1/admin/read/sales-orders/:omieId/transitions",
        async (request, reply) => {
            const { omieId } = request.params;

            const transitions = await store.listByOrder(omieId);

            return reply.send({
                success: true,
                data: transitions,
            });
        }
    );

    // ── Aliases canônicos ───────────────────────────────────────────

    app.get(
        "/v1/integration/sales-order-sync/read/transitions",
        async (request, reply) => {
            const query = request.query as ListTransitionsQueryString;

            const result = await store.list({
                salesOrderOmieId: query.salesOrderOmieId,
                toStage: query.toStage,
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

    app.get<{ Params: { omieId: string } }>(
        "/v1/integration/sales-order-sync/read/:omieId/transitions",
        async (request, reply) => {
            const { omieId } = request.params;

            const transitions = await store.listByOrder(omieId);

            return reply.send({
                success: true,
                data: transitions,
            });
        }
    );
}
