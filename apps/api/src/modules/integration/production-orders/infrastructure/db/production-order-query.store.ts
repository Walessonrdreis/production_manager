// ---------------------------------------------------------------------------
// Query Store — Leitura do espelho local de OP (omie_production_order)
// ---------------------------------------------------------------------------
// Responsável exclusivamente por consultas READ no espelho local.
// Não executa efeitos colaterais — apenas queries Prisma.
// Segue o padrão Read-Model da arquitetura.
// ---------------------------------------------------------------------------

import type { PrismaClient } from "@prisma/client";

export type ProductionOrderListFilters = {
    completed?: boolean;
    active?: boolean;
    productCode?: string;
};

export type ProductionOrderListResult = {
    id: string;
    omieId: string;
    internalCode: string | null;
    orderNumber: string | null;
    productOmieId: string | null;
    productIntegrationCode: string | null;
    quantity: string;
    forecastDate: string | null;
    startDate: string | null;
    completionDate: string | null;
    stage: string | null;
    projectCode: string | null;
    completed: boolean;
    active: boolean;
    lastSyncAt: string;
};

export type ProductionOrderDetailResult = ProductionOrderListResult & {
    items: Array<{
        omieItemCode: string;
        productMeshId: number | null;
        useFromStock: string | null;
        quantity: string | null;
        stockLocationCode: number | null;
        observation: string | null;
    }>;
};

export type ProductionOrderStatsResult = {
    total: number;
    active: number;
    completed: number;
    withOrderNumber: number;
};

export class ProductionOrderQueryStore {
    constructor(private readonly prisma: PrismaClient) { }

    // ─── Listagem Paginada ──────────────────────────────────────────────

    async listProductionOrders(
        page = 1,
        limit = 20,
        filters?: ProductionOrderListFilters
    ): Promise<{ items: ProductionOrderListResult[]; total: number; page: number; limit: number }> {
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (filters?.completed !== undefined) where.completed = filters.completed;
        if (filters?.active !== undefined) where.active = filters.active;
        if (filters?.productCode) {
            where.productOmieId = filters.productCode;
        }

        const [items, total] = await this.prisma.$transaction([
            this.prisma.omieProductionOrder.findMany({
                where: where as any,
                skip,
                take: limit,
                orderBy: { lastSyncAt: "desc" },
            }),
            this.prisma.omieProductionOrder.count({
                where: where as any,
            }),
        ]);

        return {
            items: items.map((item) => ({
                id: item.id,
                omieId: item.omieId,
                internalCode: item.internalCode,
                orderNumber: item.orderNumber,
                productOmieId: item.productOmieId,
                productIntegrationCode: item.productIntegrationCode,
                quantity: item.quantity,
                forecastDate: item.forecastDate?.toISOString() ?? null,
                startDate: item.startDate?.toISOString() ?? null,
                completionDate: item.completionDate?.toISOString() ?? null,
                stage: item.stage,
                projectCode: item.projectCode,
                completed: item.completed,
                active: item.active,
                lastSyncAt: item.lastSyncAt.toISOString(),
            })),
            total,
            page,
            limit,
        };
    }

    // ─── Detalhe por omieCode ──────────────────────────────────────────

    async getProductionOrderByCode(
        omieId: string
    ): Promise<ProductionOrderDetailResult | null> {
        const record = await this.prisma.omieProductionOrder.findUnique({
            where: { omieId },
            include: { items: true },
        });

        if (!record) return null;

        return {
            id: record.id,
            omieId: record.omieId,
            internalCode: record.internalCode,
            orderNumber: record.orderNumber,
            productOmieId: record.productOmieId,
            productIntegrationCode: record.productIntegrationCode,
            quantity: record.quantity,
            forecastDate: record.forecastDate?.toISOString() ?? null,
            startDate: record.startDate?.toISOString() ?? null,
            completionDate: record.completionDate?.toISOString() ?? null,
            stage: record.stage,
            projectCode: record.projectCode,
            completed: record.completed,
            active: record.active,
            lastSyncAt: record.lastSyncAt.toISOString(),
            items: record.items.map((item) => ({
                omieItemCode: item.omieItemCode,
                productMeshId: item.productMeshId ? Number(item.productMeshId) : null,
                useFromStock: item.useFromStock,
                quantity: item.quantity,
                stockLocationCode: item.stockLocationCode ? Number(item.stockLocationCode) : null,
                observation: item.observation,
            })),
        };
    }

    // ─── Estatísticas ──────────────────────────────────────────────────

    async getProductionOrderStats(): Promise<ProductionOrderStatsResult> {
        const [total, active, completed, withOrderNumber] = await Promise.all([
            this.prisma.omieProductionOrder.count(),
            this.prisma.omieProductionOrder.count({ where: { active: true } }),
            this.prisma.omieProductionOrder.count({ where: { completed: true } }),
            this.prisma.omieProductionOrder.count({
                where: { orderNumber: { not: null } },
            }),
        ]);

        return { total, active, completed, withOrderNumber };
    }

    // ─── Incompletos (backfill) ────────────────────────────────────────

    /**
     * Retorna lista de omieCodes de registros incompletos.
     * Usado pelo passo de backfill pós-sync (Change Detection ≠ Completeness).
     */
    async listIncompleteOmieCodes(
        limit = 100
    ): Promise<string[]> {
        const records = await this.prisma.omieProductionOrder.findMany({
            where: {
                orderNumber: null,
            },
            select: { omieId: true },
            take: limit,
        });

        return records.map((r) => r.omieId);
    }
}
