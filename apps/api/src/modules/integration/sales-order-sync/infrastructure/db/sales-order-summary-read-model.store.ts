import { prisma } from "@/shared/db/prisma";

export type SalesOrderSummaryRecord = {
    omieId: string;
    orderNumber: string | null;
    stage: string;
    isCanceled: boolean;
    isClosed: boolean;
    customerOmieId: string | null;
    companyOmieId: string | null;
    customerName: string | null;
    forecastDate: Date | null;
    totalAmount: number | null;
    totalItems: number;
    totalQuantity: number;
    lastSyncAt: Date | null;
};

export type ListSalesOrderSummaryParams = {
    stage?: string | null;
    isCanceled?: boolean;
    isClosed?: boolean;
    customerOmieId?: string | null;
    activeOnly?: boolean;
    q?: string | null;
    limit?: number;
    offset?: number;
};

export type SalesOrderSummaryStats = {
    totalOrders: number;
    totalCanceled: number;
    totalClosed: number;
    totalAmount: number;
    totalItems: number;
    totalQuantity: number;
    byStage: { stage: string; count: number }[];
};

export class SalesOrderSummaryReadModelStore {
    async replaceAll(records: SalesOrderSummaryRecord[]) {
        await prisma.$transaction(async (tx) => {
            await tx.salesOrderSummaryReadModel.deleteMany({});

            if (records.length === 0) {
                return;
            }

            await tx.salesOrderSummaryReadModel.createMany({
                data: records.map((record) => ({
                    omieId: record.omieId,
                    orderNumber: record.orderNumber,
                    stage: record.stage,
                    isCanceled: record.isCanceled,
                    isClosed: record.isClosed,
                    customerOmieId: record.customerOmieId,
                    companyOmieId: record.companyOmieId,
                    customerName: record.customerName,
                    forecastDate: record.forecastDate,
                    totalAmount: record.totalAmount,
                    totalItems: record.totalItems,
                    totalQuantity: record.totalQuantity,
                    lastSyncAt: record.lastSyncAt,
                })),
            });
        });
    }

    async list(params: ListSalesOrderSummaryParams = {}) {
        const {
            stage = null,
            isCanceled,
            isClosed,
            customerOmieId = null,
            activeOnly,
            q = null,
            limit = 100,
            offset = 0,
        } = params;

        const safeLimit = Math.max(1, Math.min(Number(limit || 100), 500));
        const safeOffset = Math.max(0, Number(offset || 0));

        const where: Record<string, unknown> = {};

        if (stage !== null && stage !== "") {
            where.stage = stage;
        }

        if (isCanceled !== undefined) {
            where.isCanceled = isCanceled;
        }

        if (isClosed !== undefined) {
            where.isClosed = isClosed;
        }

        // activeOnly = !isCanceled AND !isClosed
        if (activeOnly === true) {
            where.isCanceled = false;
            where.isClosed = false;
        }

        if (customerOmieId !== null && customerOmieId !== "") {
            where.customerOmieId = customerOmieId;
        }

        if (q !== null && q !== "") {
            where.OR = [
                { orderNumber: { contains: q, mode: "insensitive" as const } },
                { customerOmieId: { contains: q, mode: "insensitive" as const } },
                { customerName: { contains: q, mode: "insensitive" as const } },
            ];
        }

        const [total, rows] = await Promise.all([
            prisma.salesOrderSummaryReadModel.count({ where: where as any }),
            prisma.salesOrderSummaryReadModel.findMany({
                where: where as any,
                orderBy: { updatedAt: "desc" },
                take: safeLimit,
                skip: safeOffset,
            }),
        ]);

        return {
            meta: {
                total,
                pageSize: safeLimit,
                pageCount: rows.length,
                offset: safeOffset,
            },
            data: rows,
        };
    }

    async getByOmieId(omieId: string): Promise<SalesOrderSummaryRecord | null> {
        const record = await prisma.salesOrderSummaryReadModel.findFirst({
            where: { omieId },
        });

        return record;
    }

    async getStats(): Promise<SalesOrderSummaryStats> {
        const [totalOrders, totalCanceled, totalClosed, byStage] =
            await Promise.all([
                prisma.salesOrderSummaryReadModel.count(),
                prisma.salesOrderSummaryReadModel.count({
                    where: { isCanceled: true },
                }),
                prisma.salesOrderSummaryReadModel.count({
                    where: { isClosed: true },
                }),
                prisma.salesOrderSummaryReadModel.groupBy({
                    by: ["stage"],
                    _count: { _all: true },
                    orderBy: { stage: "asc" },
                }),
            ]);

        const summary = await prisma.salesOrderSummaryReadModel.aggregate({
            _sum: {
                totalAmount: true,
                totalItems: true,
                totalQuantity: true,
            },
        });

        return {
            totalOrders,
            totalCanceled,
            totalClosed,
            totalAmount: Number(summary._sum.totalAmount ?? 0),
            totalItems: summary._sum.totalItems ?? 0,
            totalQuantity: Number(summary._sum.totalQuantity ?? 0),
            byStage: byStage.map((s) => ({
                stage: s.stage,
                count: s._count._all,
            })),
        };
    }
}
