// ---------------------------------------------------------------------------
// Command Route: RefreshProductStockRoute
// POST /v1/integration/product-stock-fetch/commands/refresh
// Retorna 202 Accepted com externalRequestId para idempotência.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "@/config";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { RefreshProductStockUseCase } from "../../../../application/use-cases/refresh-product-stock.usecase";
import { ProductStockIntegrationStore } from "../../../../infrastructure/db/product-stock-integration.store";
import { ProductStockCommandStore } from "../../../../infrastructure/db/product-stock-command.store";
import { FakeProductStockIntegrationStore } from "../../../../infrastructure/db/fake-product-stock-integration.store";
import { FakeProductStockCommandStore } from "../../../../infrastructure/db/fake-product-stock-command.store";
import { RealProductStockFetchGateway } from "../../../../infrastructure/gateways/product-stock-fetch/real-product-stock-fetch.gateway";
import { FakeProductStockFetchGateway } from "../../../../infrastructure/gateways/product-stock-fetch/fake-product-stock-fetch.gateway";

import type {
    RefreshProductStockRequestDTO,
    RefreshProductStockResponseDTO,
} from "../../../../application/dto/refresh-product-stock.dto";

const RefreshProductStockSchema = z.object({
    externalRequestId: z.string().min(1),
    productId: z.string().min(1),
});

export async function registerRefreshProductStockRoute(app: FastifyInstance) {
    app.post("/v1/integration/product-stock-fetch/commands/refresh", async (request, reply) => {
        const parsed = RefreshProductStockSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.code(400).send({
                success: false,
                error: "VALIDATION_ERROR",
                message: parsed.error.issues,
            });
        }

        const { externalRequestId, productId } = parsed.data;

        const omieClient = (app as any).omieClient as OmieHttpClientPort;
        const useFake = env.PRODUCT_STOCK_FETCH_GATEWAY === "fake";

        const fetchGateway = useFake
            ? new FakeProductStockFetchGateway()
            : new RealProductStockFetchGateway(omieClient);

        const integrationStore = useFake
            ? new FakeProductStockIntegrationStore()
            : new ProductStockIntegrationStore();

        const commandStore = useFake
            ? new FakeProductStockCommandStore()
            : new ProductStockCommandStore();

        const useCase = new RefreshProductStockUseCase(
            fetchGateway,
            integrationStore,
            commandStore,
        );

        // Retorna 202 Accepted imediatamente
        const result = await useCase.execute({ externalRequestId, productId });

        // Processa em background (fire-and-forget)
        useCase.process({ externalRequestId, productOmieId: productId }).catch((err) => {
            request.log.error(err, "Erro ao processar refresh de estoque");
        });

        const response: RefreshProductStockResponseDTO = {
            status: "ACCEPTED",
            externalRequestId: result.externalRequestId,
            productId: result.productId,
        };

        return reply.code(202).send({
            success: true,
            data: response,
        });
    });
}
