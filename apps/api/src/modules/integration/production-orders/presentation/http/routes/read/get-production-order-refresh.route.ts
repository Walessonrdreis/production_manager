// ---------------------------------------------------------------------------
// Route — Refresh Production Order from Omie (Read + Sync)
// ---------------------------------------------------------------------------
// GET /v1/integration/production-orders/read/:omieId/refresh
// Consulta a OP no Omie (ConsultarOrdemProducao), atualiza o espelho local
// e retorna os dados frescos.
// Síncrona (sem fila) — o usuário quer o dado agora.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { env } from "@/config";
import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import { createOmieClientWithCircuitBreaker } from "@/shared/integrations/omie/omie-client-with-circuit-breaker";
import { ProductionOrderSyncStore } from "../../../../infrastructure/db/production-order-sync.store";
import { RealProductionOrderConsultGateway } from "../../../../infrastructure/gateways/consult/real-production-order-consult.gateway";
import { FakeProductionOrderConsultGateway } from "../../../../infrastructure/gateways/consult/fake-production-order-consult.gateway";

const logger = getLogger("get-production-order-refresh.route");

export async function registerGetProductionOrderRefreshRoute(app: FastifyInstance) {
    app.get(
        "/v1/integration/production-orders/read/:omieId/refresh",
        async (request, reply) => {
            try {
                const { omieId } = request.params as { omieId: string };

                if (!omieId || isNaN(Number(omieId))) {
                    return reply.code(400).send({
                        success: false,
                        error: "VALIDATION_ERROR",
                        message: "Invalid omieId — must be a numeric string",
                    });
                }

                const isFake = env.PRODUCTION_ORDER_GATEWAY === "fake";

                const consultGateway = isFake
                    ? new FakeProductionOrderConsultGateway()
                    : new RealProductionOrderConsultGateway(
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

                const freshData = await consultGateway.consult(omieId);

                if (!freshData) {
                    return reply.code(404).send({
                        success: false,
                        error: "NOT_FOUND",
                        message: `Production order ${omieId} not found in Omie`,
                    });
                }

                // Atualiza o espelho local (a menos que esteja em fake mode)
                if (!isFake) {
                    const syncStore = new ProductionOrderSyncStore(prisma);
                    await syncStore.save({
                        omieId: freshData.omieId,
                        number: freshData.orderNumber ?? "",
                        internalCode: freshData.internalCode,
                        productCode: Number(freshData.productCode ?? 0),
                        quantity: Number(freshData.quantity),
                        stage: freshData.stage ?? "",
                        completed: freshData.completed,
                        forecastDate: freshData.forecastDate
                            ? new Date(freshData.forecastDate).toISOString()
                            : null,
                        completionDate: freshData.completionDate
                            ? new Date(freshData.completionDate).toISOString()
                            : null,
                        startDate: freshData.startDate
                            ? new Date(freshData.startDate).toISOString()
                            : null,
                        stockLocationCode: null,
                        raw: freshData.rawPayload,
                    });
                }

                return reply.code(200).send({
                    success: true,
                    data: freshData,
                });
            } catch (error) {
                logger.error(error, "[OP][REFRESH][ERROR]");

                return reply.code(500).send({
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: "An unexpected error occurred",
                });
            }
        }
    );
}
