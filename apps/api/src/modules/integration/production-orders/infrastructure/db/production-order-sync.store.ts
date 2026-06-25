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

export class ProductionOrderSyncStore {
    constructor(private readonly prisma: PrismaClient) { }

    async save(item: ProductionOrderSyncPageItem): Promise<void> {
        const { order, items } = mapProductionOrder(item.raw);

        await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const savedOrder = await tx.omieProductionOrder.upsert({
                where: { omieCode: order.omieCode },
                create: {
                    omieCode: order.omieCode,
                    internalCode: order.internalCode,
                    orderNumber: order.orderNumber,
                    productCode: order.productCode,
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
                    productCode: order.productCode,
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
                    where: { omieCode: order.omieCode },
                    create: {
                        omieCode: order.omieCode,
                        internalCode: order.internalCode,
                        orderNumber: order.orderNumber,
                        productCode: order.productCode,
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
                        productCode: order.productCode,
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
}
