// ---------------------------------------------------------------------------
// Route — List Production Order Commands (Read-Model)
// ---------------------------------------------------------------------------
// GET /v1/integration/production-orders/read/commands
// Retorna o histórico de comandos de ordem de produção.
// Suporta filtro por status e paginação.
//
// C2: Endpoint para auditoria e tracking de comandos.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { prisma } from "@/shared/db/prisma";
import { ProductionOrderCommandStore } from "../../../../infrastructure/db/production-order-command.store";

export async function registerListProductionOrderCommandsRoute(
    app: FastifyInstance
) {
    app.get(
        "/v1/integration/production-orders/read/commands",
        async (request, reply) => {
            try {
                const query = request.query as {
                    limit?: string;
                    status?: string;
                    commandType?: string;
                };

                const commandStore = new ProductionOrderCommandStore(prisma);

                const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "20", 10)));

                const where: Record<string, unknown> = {};
                if (query.status) {
                    where.status = query.status.toUpperCase();
                }
                if (query.commandType) {
                    where.commandType = query.commandType.toUpperCase();
                }

                const [total, rows] = await Promise.all([
                    prisma.productionOrderCommand.count({ where: where as any }),
                    prisma.productionOrderCommand.findMany({
                        where: where as any,
                        orderBy: { createdAt: "desc" },
                        take: limit,
                    }),
                ]);

                return reply.code(200).send({
                    success: true,
                    summary: {
                        total,
                        returned: rows.length,
                    },
                    data: rows,
                });
            } catch (error) {
                console.error("[READ-MODEL][COMMANDS-LIST][ERROR]", error);
                return reply.code(500).send({
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: "An unexpected error occurred",
                });
            }
        }
    );
}
