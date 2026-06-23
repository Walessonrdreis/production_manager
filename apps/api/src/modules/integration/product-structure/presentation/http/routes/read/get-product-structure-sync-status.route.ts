import type { FastifyInstance } from "fastify";
import { prisma } from "@/shared/db/prisma";
import { ProductStructureCommandStore } from "../../../../infrastructure/db/product-structure-command.store";

export function registerGetProductStructureSyncStatusRoute(app: FastifyInstance) {
    app.get(
        "/v1/integration/product-structure/commands/:externalRequestId",
        {
            schema: {
                tags: ["product-structure"],
                summary: "Consultar status de um comando de sincronização",
                description: "Retorna o status (ACCEPTED/CONFIRMED/FAILED) de um comando pelo externalRequestId.",
                params: {
                    type: "object",
                    required: ["externalRequestId"],
                    properties: { externalRequestId: { type: "string" } },
                },
            },
        },
        async (request, reply) => {
            const { externalRequestId } = request.params as { externalRequestId: string };

            const store = new ProductStructureCommandStore(prisma);
            const command = await store.findByExternalRequestId(externalRequestId);

            if (!command) {
                return reply.code(404).send({
                    success: false,
                    error: "NOT_FOUND",
                    message: "Comando não encontrado",
                });
            }

            return reply.code(200).send({
                success: true,
                data: {
                    externalRequestId: command.externalRequestId,
                    productCode: command.productCode,
                    commandType: command.commandType,
                    status: command.status,
                    source: command.source,
                    executedAt: command.executedAt,
                    completedAt: command.completedAt,
                    createdAt: command.createdAt,
                    updatedAt: command.updatedAt,
                    lastError: command.lastError,
                },
            });
        }
    );
}
