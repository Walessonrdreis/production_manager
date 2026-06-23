// ---------------------------------------------------------------------------
// Route — Refresh Product Structure from Omie (Read + Sync)
// ---------------------------------------------------------------------------
// GET /v1/integration/product-structure/read/:productCode/refresh
// Consulta a estrutura do produto no Omie (ConsultarEstrutura), atualiza
// o espelho local e retorna os dados frescos.
// Síncrona (sem fila) — o usuário quer o dado agora.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { env } from "@/config";
import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import { createOmieClientWithCircuitBreaker } from "@/shared/integrations/omie/omie-client-with-circuit-breaker";
import { ProductStructureIntegrationStore } from "../../../../infrastructure/db/product-structure-integration.store";
import { RealProductStructureConsultGateway } from "../../../../infrastructure/gateways/consult/real-product-structure-consult.gateway";
import { FakeProductStructureConsultGateway } from "../../../../infrastructure/gateways/consult/fake-product-structure-consult.gateway";

const logger = getLogger("get-product-structure-refresh.route");

export async function registerGetProductStructureRefreshRoute(app: FastifyInstance) {
    app.get(
        "/v1/integration/product-structure/read/:productCode/refresh",
        async (request, reply) => {
            try {
                const { productCode } = request.params as { productCode: string };

                if (!productCode || productCode.trim() === "") {
                    return reply.code(400).send({
                        success: false,
                        error: "VALIDATION_ERROR",
                        message: "Invalid productCode — must be a non-empty string",
                    });
                }

                const isFake = env.PRODUCT_STRUCTURE_GATEWAY === "fake";

                const consultGateway = isFake
                    ? new FakeProductStructureConsultGateway()
                    : new RealProductStructureConsultGateway(
                        createOmieClientWithCircuitBreaker({
                            baseUrl: env.OMIE_BASE_URL,
                            appKey: env.OMIE_APP_KEY,
                            appSecret: env.OMIE_APP_SECRET,
                            timeoutMs: 10000,
                            retry: { attempts: 2, baseDelayMs: 1000, maxDelayMs: 3000 },
                            debug: process.env.NODE_ENV !== "production",
                            circuitBreaker: {
                                failureThreshold: 3,
                                resetTimeoutMs: 30000,
                                successThreshold: 2,
                            },
                        })
                    );

                const freshData = await consultGateway.consult(productCode);

                if (!freshData) {
                    return reply.code(404).send({
                        success: false,
                        error: "NOT_FOUND",
                        message: `Product structure ${productCode} not found in Omie`,
                    });
                }

                // Atualiza o espelho local (a menos que esteja em fake mode)
                if (!isFake) {
                    const syncStore = new ProductStructureIntegrationStore(prisma);
                    await syncStore.save(freshData);
                }

                return reply.code(200).send({
                    success: true,
                    data: freshData,
                });
            } catch (error) {
                logger.error(error, "[PS][REFRESH][ERROR]");

                return reply.code(500).send({
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: "An unexpected error occurred",
                });
            }
        }
    );
}
