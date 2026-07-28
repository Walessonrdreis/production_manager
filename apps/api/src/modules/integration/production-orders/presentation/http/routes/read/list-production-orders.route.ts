// ---------------------------------------------------------------------------
// Route — List Production Orders (Read-Model)
// ---------------------------------------------------------------------------
// GET /v1/integration/production-orders/read
// Retorna lista paginada do espelho local (omie_production_order).
// Usa o padrão Real/Fake gateway selecionado via env var.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { env } from "@/config";

import { prisma } from "@/shared/db/prisma";
import { FakeProductionOrderQueryGateway } from "../../../../infrastructure/gateways/query/fake-production-order-query.gateway";
import { RealProductionOrderQueryGateway } from "../../../../infrastructure/gateways/query/real-production-order-query.gateway";

export async function registerListProductionOrdersRoute(app: FastifyInstance) {
    app.get("/v1/integration/production-orders/read", async (request, reply) => {
        try {
            const query = request.query as {
                page?: string;
                limit?: string;
                completed?: string;
                active?: string;
                productCode?: string;
            };

            const page = Math.max(1, parseInt(query.page ?? "1", 10));
            const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "20", 10)));

            const filters: Record<string, unknown> = {};
            if (query.completed !== undefined) filters.completed = query.completed === "true";
            if (query.active !== undefined) filters.active = query.active === "true";
            if (query.productCode) filters.productCode = query.productCode;

            const isFake = env.PRODUCTION_ORDER_GATEWAY === "fake";
            const queryGateway = isFake
                ? new FakeProductionOrderQueryGateway()
                : new RealProductionOrderQueryGateway(prisma);

            const result = await queryGateway.listProductionOrders(page, limit, filters as any);

            return reply.code(200).send({
                success: true,
                data: result,
            });
        } catch (error) {
            console.error("[OP][LIST][ERROR]", error);
            return reply.code(500).send({
                success: false,
                error: "INTERNAL_ERROR",
                message: "An unexpected error occurred",
            });
        }
    });
}
