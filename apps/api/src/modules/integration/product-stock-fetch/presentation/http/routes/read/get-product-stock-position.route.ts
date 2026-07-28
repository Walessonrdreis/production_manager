// ---------------------------------------------------------------------------
// Read Route: GetProductStockPositionRoute
// GET /v1/integration/product-stock-fetch/read/position?productId=...
// Retorna a posição de estoque consultada no Omie.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "@/config";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { GetProductStockPositionUseCase } from "../../../../application/use-cases/get-product-stock-position.usecase";
import { RealProductStockFetchGateway } from "../../../../infrastructure/gateways/product-stock-fetch/real-product-stock-fetch.gateway";
import { FakeProductStockFetchGateway } from "../../../../infrastructure/gateways/product-stock-fetch/fake-product-stock-fetch.gateway";

const GetStockPositionQuerySchema = z.object({
    productId: z.string().min(1),
});

export async function registerGetProductStockPositionRoute(app: FastifyInstance) {
    app.get("/v1/integration/product-stock-fetch/read/position", async (request, reply) => {
        const parsed = GetStockPositionQuerySchema.safeParse(request.query);
        if (!parsed.success) {
            return reply.code(400).send({
                success: false,
                error: "VALIDATION_ERROR",
                message: parsed.error.issues,
            });
        }

        const { productId } = parsed.data;
        const omieClient = (app as any).omieClient as OmieHttpClientPort;
        const useFake = env.PRODUCT_STOCK_FETCH_GATEWAY === "fake";

        const fetchGateway = useFake
            ? new FakeProductStockFetchGateway()
            : new RealProductStockFetchGateway(omieClient);

        const useCase = new GetProductStockPositionUseCase(fetchGateway);

        const result = await useCase.execute(productId);

        return reply.send({
            success: true,
            data: result,
        });
    });
}
