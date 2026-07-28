// ---------------------------------------------------------------------------
// Use Case — Sync Production Order Items (ConsultarOrdemProducao)
// ---------------------------------------------------------------------------
// Após o sync global (que usa ListarOrdemProducao — sem itens), este use case
// consulta cada ordem individualmente via ConsultarOrdemProducao para obter
// os itens (itens + itensDetalhes) e persiste no espelho local.
//
// Processa em lotes para evitar sobrecarga na API Omie.
// ---------------------------------------------------------------------------

import { getLogger } from "@/shared/logger";
import type { PrismaClient, Prisma } from "@prisma/client";
import type { ProductionOrderConsultGateway } from "../ports/production-order-consult.gateway";

const logger = getLogger("SyncProductionOrderItemsUseCase");

export type SyncProductionOrderItemsCommand = {
    externalRequestId: string;
    /** Se omitido, busca ordens sem itens. Máximo 50 por execução. */
    omieIds?: string[];
    /** Máximo de ordens para processar nesta execução (default: 50) */
    maxOrders?: number;
};

export class SyncProductionOrderItemsUseCase {
    constructor(
        private readonly consultGateway: ProductionOrderConsultGateway,
        private readonly prisma: PrismaClient,
    ) { }

    async execute(command: SyncProductionOrderItemsCommand): Promise<{
        processed: number;
        updated: number;
        failed: number;
        hasMore: boolean;
    }> {
        const maxOrders = Math.min(command.maxOrders ?? 50, 100);
        const { externalRequestId } = command;

        // ── Buscar ordens que precisam de itens ──────────────────────────
        const where = command.omieIds
            ? { omieId: { in: command.omieIds } }
            : {
                items: { none: {} },
            };

        const orders = await this.prisma.omieProductionOrder.findMany({
            where,
            take: maxOrders,
            select: {
                id: true,
                omieId: true,
            },
            orderBy: { lastSyncAt: "asc" },
        });

        if (orders.length === 0) {
            logger.info("No orders need items sync", { externalRequestId });
            return { processed: 0, updated: 0, failed: 0, hasMore: false };
        }

        // ── Processamento sequencial ──
        // Estritamente 1 chamada por vez para não sobrecarregar a API Omie.
        let updated = 0;
        let failed = 0;
        let processedItems = 0;

        for (const order of orders) {
            try {
                const consultResult = await this.consultGateway.consult(
                    order.omieId,
                );

                if (!consultResult) {
                    logger.warn("Consult returned null, skipping", {
                        externalRequestId,
                        omieId: order.omieId,
                    });
                    failed++;
                    continue;
                }

                await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                    await tx.omieProductionOrder.update({
                        where: { id: order.id },
                        data: {
                            rawPayload: consultResult.rawPayload as Prisma.InputJsonValue,
                            lastSyncAt: new Date(),
                        },
                    });

                    for (const item of consultResult.items) {
                        await tx.omieProductionOrderItem.upsert({
                            where: {
                                omieItemCode_omieProductionOrderId: {
                                    omieItemCode: item.omieItemCode,
                                    omieProductionOrderId: order.id,
                                },
                            },
                            create: {
                                omieItemCode: item.omieItemCode,
                                omieProductionOrderId: order.id,
                                productMeshId: item.productMeshId,
                                useFromStock: item.useFromStock,
                                quantity: item.quantity,
                                stockLocationCode: item.stockLocationCode,
                                observation: item.observation,
                                rawPayload: {},
                                lastSyncAt: new Date(),
                            },
                            update: {
                                productMeshId: item.productMeshId,
                                useFromStock: item.useFromStock,
                                quantity: item.quantity,
                                stockLocationCode: item.stockLocationCode,
                                observation: item.observation,
                                lastSyncAt: new Date(),
                            },
                        });
                    }
                });

                updated++;
                processedItems += consultResult.items.length;
            } catch (error) {
                logger.error("Failed to sync items for order", {
                    externalRequestId,
                    omieId: order.omieId,
                    error: error instanceof Error ? error.message : String(error),
                });
                failed++;
            }
        }

        const processed = orders.length;
        const hasMore = orders.length >= maxOrders
            ? await this.prisma.omieProductionOrder.count({
                where: { items: { none: {} } },
            }) > 0
            : false;

        return {
            processed,
            updated,
            failed,
            hasMore,
        };
    }
}
