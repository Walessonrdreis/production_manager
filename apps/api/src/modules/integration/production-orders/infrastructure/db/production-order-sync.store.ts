// ---------------------------------------------------------------------------
// Store — Persistência do espelho local de ordens de produção (Omie → DB)
// ---------------------------------------------------------------------------
// Recebe ProductionOrderSyncPageItem, adapta via mapProductionOrder e
// persiste em OmieProductionOrder + OmieProductionOrderItem.
// Segue o padrão de ProductStructureIntegrationStore.
// ---------------------------------------------------------------------------

import type { PrismaClient, Prisma } from "@prisma/client";
import { mapProductionOrder } from "@/shared/integrations/omie/OmieProductionOrdersAdapter";
import type { ProductionOrderSyncPageItem } from "../../application/ports/production-order-sync-page.gateway";
import type { ProductionOrderConsultResult } from "../../application/ports/production-order-consult.gateway";

export class ProductionOrderSyncStore {
    constructor(private readonly prisma: PrismaClient) { }

    async save(item: ProductionOrderSyncPageItem): Promise<void> {
        const { order, items } = mapProductionOrder(item.raw);

        await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const savedOrder = await tx.omieProductionOrder.upsert({
                where: { omieId: order.omieId },
                create: {
                    omieId: order.omieId,
                    internalCode: order.internalCode,
                    orderNumber: order.orderNumber,
                    productOmieId: order.productCode,
                    productIntegrationCode: order.productIntegrationCode,
                    quantity: order.quantity,
                    forecastDate: order.forecastDate
                        ? new Date(order.forecastDate)
                        : null,
                    startDate: order.startDate ? new Date(order.startDate) : null,
                    completionDate: order.completionDate
                        ? new Date(order.completionDate)
                        : null,
                    stage: order.stage,
                    projectCode: order.projectCode,
                    completed: order.completed,
                    active: true,
                    rawPayload: order.rawPayload as Prisma.InputJsonValue,
                    lastSyncAt: new Date(),
                },
                update: {
                    internalCode: order.internalCode,
                    orderNumber: order.orderNumber,
                    productOmieId: order.productCode,
                    productIntegrationCode: order.productIntegrationCode,
                    quantity: order.quantity,
                    forecastDate: order.forecastDate
                        ? new Date(order.forecastDate)
                        : null,
                    startDate: order.startDate ? new Date(order.startDate) : null,
                    completionDate: order.completionDate
                        ? new Date(order.completionDate)
                        : null,
                    stage: order.stage,
                    projectCode: order.projectCode,
                    completed: order.completed,
                    active: true,
                    rawPayload: order.rawPayload as Prisma.InputJsonValue,
                    lastSyncAt: new Date(),
                },
                select: { id: true },
            });

            for (const it of items) {
                await tx.omieProductionOrderItem.upsert({
                    where: {
                        omieItemCode_omieProductionOrderId: {
                            omieItemCode: it.omieItemCode,
                            omieProductionOrderId: savedOrder.id,
                        },
                    },
                    create: {
                        omieItemCode: it.omieItemCode,
                        omieProductionOrderId: savedOrder.id,
                        productMeshId: it.productMeshId,
                        useFromStock: it.useFromStock,
                        quantity: it.quantity,
                        stockLocationCode: it.stockLocationCode,
                        observation: it.observation,
                        rawPayload: it.rawPayload as Prisma.InputJsonValue,
                        lastSyncAt: new Date(),
                    },
                    update: {
                        productMeshId: it.productMeshId,
                        useFromStock: it.useFromStock,
                        quantity: it.quantity,
                        stockLocationCode: it.stockLocationCode,
                        observation: it.observation,
                        rawPayload: it.rawPayload as Prisma.InputJsonValue,
                        lastSyncAt: new Date(),
                    },
                });
            }
        });
    }

    /**
     * Batch persist — upserts múltiplos itens em uma única transação.
     * Mais eficiente que save() individual para sync de páginas inteiras.
     */
    async saveMany(items: ProductionOrderSyncPageItem[]): Promise<void> {
        if (items.length === 0) return;

        await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            for (const item of items) {
                const { order, items: orderItems } = mapProductionOrder(item.raw);

                const savedOrder = await tx.omieProductionOrder.upsert({
                    where: { omieId: order.omieId },
                    create: {
                        omieId: order.omieId,
                        internalCode: order.internalCode,
                        orderNumber: order.orderNumber,
                        productOmieId: order.productCode,
                        productIntegrationCode: order.productIntegrationCode,
                        quantity: order.quantity,
                        forecastDate: order.forecastDate
                            ? new Date(order.forecastDate)
                            : null,
                        startDate: order.startDate ? new Date(order.startDate) : null,
                        completionDate: order.completionDate
                            ? new Date(order.completionDate)
                            : null,
                        stage: order.stage,
                        projectCode: order.projectCode,
                        completed: order.completed,
                        active: true,
                        rawPayload: order.rawPayload as Prisma.InputJsonValue,
                        lastSyncAt: new Date(),
                    },
                    update: {
                        internalCode: order.internalCode,
                        orderNumber: order.orderNumber,
                        productOmieId: order.productCode,
                        productIntegrationCode: order.productIntegrationCode,
                        quantity: order.quantity,
                        forecastDate: order.forecastDate
                            ? new Date(order.forecastDate)
                            : null,
                        startDate: order.startDate ? new Date(order.startDate) : null,
                        completionDate: order.completionDate
                            ? new Date(order.completionDate)
                            : null,
                        stage: order.stage,
                        projectCode: order.projectCode,
                        completed: order.completed,
                        active: true,
                        rawPayload: order.rawPayload as Prisma.InputJsonValue,
                        lastSyncAt: new Date(),
                    },
                    select: { id: true },
                });

                for (const it of orderItems) {
                    await tx.omieProductionOrderItem.upsert({
                        where: { omieItemCode: it.omieItemCode },
                        create: {
                            omieItemCode: it.omieItemCode,
                            omieProductionOrderId: savedOrder.id,
                            productMeshId: it.productMeshId,
                            useFromStock: it.useFromStock,
                            quantity: it.quantity,
                            stockLocationCode: it.stockLocationCode,
                            observation: it.observation,
                            rawPayload: it.rawPayload as Prisma.InputJsonValue,
                            lastSyncAt: new Date(),
                        },
                        update: {
                            productMeshId: it.productMeshId,
                            useFromStock: it.useFromStock,
                            quantity: it.quantity,
                            stockLocationCode: it.stockLocationCode,
                            observation: it.observation,
                            rawPayload: it.rawPayload as Prisma.InputJsonValue,
                            lastSyncAt: new Date(),
                        },
                    });
                }
            }
        });
    }

    /**
     * Persiste o resultado de uma consulta individual (ConsultarOrdemProducao).
     * O resultado já vem pré-mapeado pelo adapter, usamos os campos
     * diretamente sem chamar mapProductionOrder novamente.
     *
     * Usado pelo passo de backfill pós-sync para registros incompletos.
     */
    async saveFromConsultResult(item: ProductionOrderConsultResult): Promise<void> {
        await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const savedOrder = await tx.omieProductionOrder.upsert({
                where: { omieId: item.omieId },
                create: {
                    omieId: item.omieId,
                    internalCode: item.internalCode,
                    orderNumber: item.orderNumber,
                    productOmieId: item.productCode,
                    productIntegrationCode: item.productIntegrationCode,
                    quantity: item.quantity,
                    forecastDate: item.forecastDate
                        ? new Date(item.forecastDate)
                        : null,
                    startDate: item.startDate ? new Date(item.startDate) : null,
                    completionDate: item.completionDate
                        ? new Date(item.completionDate)
                        : null,
                    stage: item.stage,
                    projectCode: item.projectCode,
                    completed: item.completed,
                    active: item.active,
                    rawPayload: item.rawPayload as Prisma.InputJsonValue,
                    lastSyncAt: new Date(),
                },
                update: {
                    internalCode: item.internalCode,
                    orderNumber: item.orderNumber,
                    productOmieId: item.productCode,
                    productIntegrationCode: item.productIntegrationCode,
                    quantity: item.quantity,
                    forecastDate: item.forecastDate
                        ? new Date(item.forecastDate)
                        : null,
                    startDate: item.startDate ? new Date(item.startDate) : null,
                    completionDate: item.completionDate
                        ? new Date(item.completionDate)
                        : null,
                    stage: item.stage,
                    projectCode: item.projectCode,
                    completed: item.completed,
                    active: item.active,
                    rawPayload: item.rawPayload as Prisma.InputJsonValue,
                    lastSyncAt: new Date(),
                },
                select: { id: true },
            });

            for (const it of item.items) {
                await tx.omieProductionOrderItem.upsert({
                    where: {
                        omieItemCode_omieProductionOrderId: {
                            omieItemCode: it.omieItemCode,
                            omieProductionOrderId: savedOrder.id,
                        },
                    },
                    create: {
                        omieItemCode: it.omieItemCode,
                        omieProductionOrderId: savedOrder.id,
                        productMeshId: it.productMeshId,
                        useFromStock: it.useFromStock,
                        quantity: it.quantity,
                        stockLocationCode: it.stockLocationCode,
                        observation: it.observation,
                        rawPayload: item.rawPayload as Prisma.InputJsonValue,
                        lastSyncAt: new Date(),
                    },
                    update: {
                        productMeshId: it.productMeshId,
                        useFromStock: it.useFromStock,
                        quantity: it.quantity,
                        stockLocationCode: it.stockLocationCode,
                        observation: it.observation,
                        rawPayload: item.rawPayload as Prisma.InputJsonValue,
                        lastSyncAt: new Date(),
                    },
                });
            }
        });
    }
}
