// ---------------------------------------------------------------------------
// ProductionOrderReadModelStore — CRUD puro, sem lógica de negócio
// ---------------------------------------------------------------------------
// Segue o padrão de ProductCatalogProductionReadyReadModelStore.
// Apenas persistência — cálculos e flags ficam no UseCase.
// ---------------------------------------------------------------------------

import { prisma } from "@/shared/db/prisma";
import { normalize } from "@/shared/search/normalize";
import { tokenize } from "@/shared/search/tokenize";
import { detectQueryType } from "@/shared/search/detect-query-type";
import { score } from "@/shared/search/score";

export type MaterialItem = {
    componentCode: string;
    componentName: string | null;
    unit: string | null;
    quantityPerUnit: number;
    lossPercent: number | null;
    totalRequired: number;
    currentStock: number;
    projectedStock: number;
    status: "MISSING" | "CRITICAL" | "PARTIAL" | "OK" | "NO_STOCK_DATA";
    stockResolution?: "bridge" | "fallback_internal" | "not_found";
};

export type MaterialsSummary = {
    totalComponents: number;
    missingCount: number;
    criticalCount: number;
    partialCount: number;
    okCount: number;
    noStockDataCount: number;
};

export type ReadinessInfo = {
    canStartProduction: boolean;
    blockingReasons: string[];
    warnings: string[];
};

export type ProductionOrderReadModelRecord = {
    omieId: string;
    orderNumber: string | null;
    productCode: string | null;
    productOmieId: string | null;
    productName: string | null;
    productNameNormalized: string | null;
    productCodeNormalized: string | null;
    orderNumberNormalized: string | null;
    normalizeVersion: number;
    productUnit: string | null;
    quantity: number;
    stage: string | null;
    stageName: string | null;
    stageOrder: number;
    stageGroup: string;
    operationalStatus: string;
    isOpen: boolean;
    isLate: boolean;
    isReady: boolean;
    isBlocked: boolean;
    hasStockIssue: boolean;
    hasMissingMaterials: boolean;
    hasCriticalMaterial: boolean;
    hasPartialStock: boolean;
    hasStructure: boolean;
    priority: string;
    expectedAt: Date | null;
    startedAt: Date | null;
    completedAt: Date | null;
    daysOverdue: number;
    materialsJson: MaterialItem[] | null;
    materialsSummaryJson: MaterialsSummary | null;
    readinessJson: ReadinessInfo | null;
    alertsJson: string[] | null;
    lastSyncAt: Date | null;
};

export type ListOpenOrdersParams = {
    limit?: number;
    offset?: number;
    priority?: string;
    operationalStatus?: string;
    isLate?: boolean;
    isBlocked?: boolean;
    hasStockIssue?: boolean;
};

export class ProductionOrderReadModelStore {
    // ─── Substituição total (usado no refresh) ──────────────────────────

    async replaceAll(records: ProductionOrderReadModelRecord[]) {
        await prisma.$transaction(async (tx) => {
            await tx.productionOrderReadModel.deleteMany({});

            if (records.length === 0) {
                return;
            }

            await tx.productionOrderReadModel.createMany({
                data: records.map((r) => ({
                    omieId: r.omieId,
                    orderNumber: r.orderNumber,
                    productCode: r.productCode,
                    productOmieId: r.productOmieId,
                    productName: r.productName,
                    productNameNormalized: r.productNameNormalized,
                    productCodeNormalized: r.productCodeNormalized,
                    orderNumberNormalized: r.orderNumberNormalized,
                    normalizeVersion: r.normalizeVersion,
                    productUnit: r.productUnit,
                    quantity: Number(r.quantity),
                    stage: r.stage,
                    stageName: r.stageName,
                    stageOrder: r.stageOrder,
                    stageGroup: r.stageGroup,
                    operationalStatus: r.operationalStatus,
                    isOpen: r.isOpen,
                    isLate: r.isLate,
                    isReady: r.isReady,
                    isBlocked: r.isBlocked,
                    hasStockIssue: r.hasStockIssue,
                    hasMissingMaterials: r.hasMissingMaterials,
                    hasCriticalMaterial: r.hasCriticalMaterial,
                    hasPartialStock: r.hasPartialStock,
                    hasStructure: r.hasStructure,
                    priority: r.priority,
                    expectedAt: r.expectedAt,
                    startedAt: r.startedAt,
                    completedAt: r.completedAt,
                    daysOverdue: r.daysOverdue,
                    materialsJson: r.materialsJson as any,
                    materialsSummaryJson: r.materialsSummaryJson as any,
                    readinessJson: r.readinessJson as any,
                    alertsJson: r.alertsJson as any,
                    lastSyncAt: r.lastSyncAt,
                })),
            });
        });
    }

    // ─── Upsert individual (para refresh de uma OP só) ──────────────────

    async upsertOne(record: ProductionOrderReadModelRecord) {
        await prisma.productionOrderReadModel.upsert({
            where: { omieId: record.omieId },
            create: {
                omieId: record.omieId,
                orderNumber: record.orderNumber,
                productCode: record.productCode,
                productOmieId: record.productOmieId,
                productName: record.productName,
                productNameNormalized: record.productNameNormalized,
                productCodeNormalized: record.productCodeNormalized,
                orderNumberNormalized: record.orderNumberNormalized,
                normalizeVersion: record.normalizeVersion,
                productUnit: record.productUnit,
                quantity: Number(record.quantity),
                stage: record.stage,
                stageName: record.stageName,
                stageOrder: record.stageOrder,
                stageGroup: record.stageGroup,
                operationalStatus: record.operationalStatus,
                isOpen: record.isOpen,
                isLate: record.isLate,
                isReady: record.isReady,
                isBlocked: record.isBlocked,
                hasStockIssue: record.hasStockIssue,
                hasMissingMaterials: record.hasMissingMaterials,
                hasCriticalMaterial: record.hasCriticalMaterial,
                hasPartialStock: record.hasPartialStock,
                hasStructure: record.hasStructure,
                priority: record.priority,
                expectedAt: record.expectedAt,
                startedAt: record.startedAt,
                completedAt: record.completedAt,
                daysOverdue: record.daysOverdue,
                materialsJson: record.materialsJson as any,
                materialsSummaryJson: record.materialsSummaryJson as any,
                readinessJson: record.readinessJson as any,
                alertsJson: record.alertsJson as any,
                lastSyncAt: record.lastSyncAt,
            },
            update: {
                orderNumber: record.orderNumber,
                productCode: record.productCode,
                productOmieId: record.productOmieId,
                productName: record.productName,
                productNameNormalized: record.productNameNormalized,
                productCodeNormalized: record.productCodeNormalized,
                orderNumberNormalized: record.orderNumberNormalized,
                normalizeVersion: record.normalizeVersion,
                productUnit: record.productUnit,
                quantity: Number(record.quantity),
                stage: record.stage,
                stageName: record.stageName,
                stageOrder: record.stageOrder,
                stageGroup: record.stageGroup,
                operationalStatus: record.operationalStatus,
                isOpen: record.isOpen,
                isLate: record.isLate,
                isReady: record.isReady,
                isBlocked: record.isBlocked,
                hasStockIssue: record.hasStockIssue,
                hasMissingMaterials: record.hasMissingMaterials,
                hasCriticalMaterial: record.hasCriticalMaterial,
                hasPartialStock: record.hasPartialStock,
                hasStructure: record.hasStructure,
                priority: record.priority,
                expectedAt: record.expectedAt,
                startedAt: record.startedAt,
                completedAt: record.completedAt,
                daysOverdue: record.daysOverdue,
                materialsJson: record.materialsJson as any,
                materialsSummaryJson: record.materialsSummaryJson as any,
                readinessJson: record.readinessJson as any,
                alertsJson: record.alertsJson as any,
                lastSyncAt: record.lastSyncAt,
            },
        });
    }

    // ─── Listar OPs abertas (isOpen = true) ─────────────────────────────

    async listOpenOrders(params?: ListOpenOrdersParams) {
        const {
            limit = 100,
            offset = 0,
            priority,
            operationalStatus,
            isLate,
            isBlocked,
            hasStockIssue,
        } = params ?? {};

        const safeLimit = Math.max(1, Math.min(Number(limit || 100), 500));
        const safeOffset = Math.max(0, Number(offset || 0));

        const where: Record<string, unknown> = {
            isOpen: true,
        };

        if (priority) where.priority = priority;
        if (operationalStatus) where.operationalStatus = operationalStatus;
        if (isLate !== undefined) where.isLate = isLate;
        if (isBlocked !== undefined) where.isBlocked = isBlocked;
        if (hasStockIssue !== undefined) where.hasStockIssue = hasStockIssue;

        const [total, rows] = await Promise.all([
            prisma.productionOrderReadModel.count({ where: where as any }),
            prisma.productionOrderReadModel.findMany({
                where: where as any,
                orderBy: [
                    { priority: "desc" },
                    { daysOverdue: "desc" },
                    { expectedAt: "asc" },
                ],
                take: safeLimit,
                skip: safeOffset,
            }),
        ]);

        return {
            summary: {
                total,
                returned: rows.length,
            },
            meta: {
                pageSize: safeLimit,
                offset: safeOffset,
            },
            data: rows,
        };
    }

    // ─── Buscar por omieId ────────────────────────────────────────────

    async getByOmieCode(omieId: string) {
        return prisma.productionOrderReadModel.findUnique({
            where: { omieId },
        });
    }

    // ─── Buscar por orderNumber (C2) ───────────────────────────────

    async getByOrderNumber(orderNumber: string) {
        return prisma.productionOrderReadModel.findFirst({
            where: { orderNumber },
        });
    }

    // ─── Summary agregado (C1-P0) ───────────────────────────────────

    async getSummary() {
        const [
            total,
            totalOpen,
            totalClosed,
            totalLate,
            totalBlocked,
            totalReady,
            totalWithStockIssue,
            totalMissingMaterials,
            totalCriticalMaterial,
            totalPartialStock,
            totalHighPriority,
        ] = await Promise.all([
            prisma.productionOrderReadModel.count(),
            prisma.productionOrderReadModel.count({ where: { isOpen: true } }),
            prisma.productionOrderReadModel.count({ where: { isOpen: false } }),
            prisma.productionOrderReadModel.count({ where: { isLate: true } }),
            prisma.productionOrderReadModel.count({ where: { isBlocked: true } }),
            prisma.productionOrderReadModel.count({ where: { isReady: true } }),
            prisma.productionOrderReadModel.count({ where: { hasStockIssue: true } }),
            prisma.productionOrderReadModel.count({ where: { hasMissingMaterials: true } }),
            prisma.productionOrderReadModel.count({ where: { hasCriticalMaterial: true } }),
            prisma.productionOrderReadModel.count({ where: { hasPartialStock: true } }),
            prisma.productionOrderReadModel.count({ where: { priority: "high" } }),
        ]);

        return {
            total,
            totalOpen,
            totalClosed,
            totalLate,
            totalBlocked,
            totalReady,
            totalWithStockIssue,
            totalMissingMaterials,
            totalCriticalMaterial,
            totalPartialStock,
            totalHighPriority,
        };
    }

    // ─── Consumption Summary agregado (C1-P0) ───────────────────────

    async getConsumptionSummary() {
        const openOrders = await prisma.productionOrderReadModel.findMany({
            where: { isOpen: true },
            select: {
                omieId: true,
                orderNumber: true,
                productCode: true,
                productName: true,
                quantity: true,
                materialsJson: true,
                materialsSummaryJson: true,
            },
        });

        // ─── Agrupar materiais por componentCode ─────────────────────
        const materialMap = new Map<string, {
            componentCode: string;
            componentName: string | null;
            unit: string | null;
            totalRequired: number;
            currentStock: number;
            projectedStock: number;
            status: string;
            orderCount: number;
            orders: Array<{
                omieId: string;
                orderNumber: string | null;
                quantity: number;
                totalRequired: number;
            }>;
        }>();

        for (const order of openOrders) {
            const materials = order.materialsJson as MaterialItem[] | null;
            if (!materials) continue;

            for (const mat of materials) {
                const existing = materialMap.get(mat.componentCode);
                if (existing) {
                    existing.totalRequired += mat.totalRequired;
                    existing.orderCount += 1;
                    existing.orders.push({
                        omieId: order.omieId,
                        orderNumber: order.orderNumber,
                        quantity: Number(order.quantity),
                        totalRequired: mat.totalRequired,
                    });
                    // Pior status vence (aggregado pessimista)
                    const rank = ["NO_STOCK_DATA", "OK", "PARTIAL", "CRITICAL", "MISSING"];
                    if (rank.indexOf(mat.status) > rank.indexOf(existing.status as any)) {
                        existing.status = mat.status;
                    }
                } else {
                    materialMap.set(mat.componentCode, {
                        componentCode: mat.componentCode,
                        componentName: mat.componentName,
                        unit: mat.unit,
                        totalRequired: mat.totalRequired,
                        currentStock: mat.currentStock,
                        projectedStock: mat.projectedStock,
                        status: mat.status,
                        orderCount: 1,
                        orders: [{
                            omieId: order.omieId,
                            orderNumber: order.orderNumber,
                            quantity: Number(order.quantity),
                            totalRequired: mat.totalRequired,
                        }],
                    });
                }
            }
        }

        const materials = Array.from(materialMap.values());
        const totalComponents = materials.length;
        const missingCount = materials.filter((m) => m.status === "MISSING").length;
        const criticalCount = materials.filter((m) => m.status === "CRITICAL").length;
        const partialCount = materials.filter((m) => m.status === "PARTIAL").length;
        const okCount = materials.filter((m) => m.status === "OK").length;
        const noStockDataCount = materials.filter((m) => m.status === "NO_STOCK_DATA").length;

        // Ordenar: piores status primeiro, depois maior required
        const statusRank: Record<string, number> = {
            MISSING: 0, CRITICAL: 1, PARTIAL: 2, NO_STOCK_DATA: 3, OK: 4,
        };
        materials.sort((a, b) => {
            const rankDiff = (statusRank[a.status] ?? 99) - (statusRank[b.status] ?? 99);
            if (rankDiff !== 0) return rankDiff;
            return b.totalRequired - a.totalRequired;
        });

        return {
            summary: {
                totalOrders: openOrders.length,
                totalComponents,
                missingCount,
                criticalCount,
                partialCount,
                okCount,
                noStockDataCount,
            },
            materials,
        };
    }

    // ─── Summary por OP (C1.2 spec v2) ───────────────────────────

    async getSummaryByOmieId(omieId: string) {
        const record = await prisma.productionOrderReadModel.findUnique({
            where: { omieId },
            select: {
                omieId: true,
                orderNumber: true,
                productCode: true,
                productOmieId: true,
                quantity: true,
                expectedAt: true,
                startedAt: true,
                completedAt: true,
                stage: true,
                operationalStatus: true,
                isReady: true,
                isBlocked: true,
                hasStockIssue: true,
                hasMissingMaterials: true,
                hasCriticalMaterial: true,
                hasPartialStock: true,
                isLate: true,
                daysOverdue: true,
                priority: true,
                productName: true,
                productUnit: true,
                isOpen: true,
                lastSyncAt: true,
            },
        });
        return record;
    }

    // ─── Consumption Summary por OP (C1.3 spec v2) ──────────────

    async getConsumptionSummaryByOmieId(omieId: string) {
        const record = await prisma.productionOrderReadModel.findUnique({
            where: { omieId },
            select: {
                omieId: true,
                orderNumber: true,
                productCode: true,
                productName: true,
                quantity: true,
                materialsJson: true,
            },
        });

        if (!record) return null;

        const materials = record.materialsJson as MaterialItem[] | null;
        if (!materials || materials.length === 0) {
            return {
                omieId: record.omieId,
                orderNumber: record.orderNumber,
                productCode: record.productCode,
                productName: record.productName,
                totalComponents: 0,
                totalQuantityNeeded: 0,
                itemsWithStockIssue: 0,
                criticalItems: 0,
                hasAnyIssue: false,
                components: [],
            };
        }

        const totalComponents = materials.length;
        const totalQuantityNeeded = materials.reduce((sum, m) => sum + m.totalRequired, 0);
        const itemsWithStockIssue = materials.filter(
            (m) => m.status === "MISSING" || m.status === "CRITICAL" || m.status === "PARTIAL"
        ).length;
        const criticalItems = materials.filter(
            (m) => m.status === "MISSING" || m.status === "CRITICAL"
        ).length;
        const hasAnyIssue = itemsWithStockIssue > 0;

        const components = materials.map((m) => ({
            componentCode: m.componentCode,
            componentName: m.componentName,
            unit: m.unit,
            quantityNeeded: m.totalRequired,
            currentStock: m.currentStock,
            projectedStock: m.projectedStock,
            status: m.status,
        }));

        return {
            omieId: record.omieId,
            orderNumber: record.orderNumber,
            productCode: record.productCode,
            productName: record.productName,
            totalComponents,
            totalQuantityNeeded,
            itemsWithStockIssue,
            criticalItems,
            hasAnyIssue,
            components,
        };
    }

    // ─── Lista unificada com filtros (C1-P0) ─────────────────────────

    async listOrders(params?: {
        limit?: number;
        offset?: number;
        priority?: string;
        operationalStatus?: string;
        isOpen?: boolean;
        isLate?: boolean;
        isBlocked?: boolean;
        hasStockIssue?: boolean;
        hasMissingMaterials?: boolean;
        hasCriticalMaterial?: boolean;
        hasPartialStock?: boolean;
        isReady?: boolean;
        stage?: string;
        productCode?: string;
        orderNumber?: string;
        startDateFrom?: string;
        startDateTo?: string;
        completionDateFrom?: string;
        completionDateTo?: string;
        q?: string;
    }) {
        const {
            limit = 50,
            offset = 0,
            priority,
            operationalStatus,
            isOpen,
            isLate,
            isBlocked,
            hasStockIssue,
            hasMissingMaterials,
            hasCriticalMaterial,
            hasPartialStock,
            isReady,
            stage,
            productCode,
            orderNumber,
            startDateFrom,
            startDateTo,
            completionDateFrom,
            completionDateTo,
            q,
        } = params ?? {};

        const safeLimit = Math.max(1, Math.min(Number(limit || 50), 500));
        const safeOffset = Math.max(0, Number(offset || 0));

        const where: Record<string, unknown> = {};

        if (isOpen !== undefined) where.isOpen = isOpen;
        if (priority) where.priority = priority;
        if (operationalStatus) where.operationalStatus = operationalStatus;
        if (isLate !== undefined) where.isLate = isLate;
        if (isBlocked !== undefined) where.isBlocked = isBlocked;
        if (hasStockIssue !== undefined) where.hasStockIssue = hasStockIssue;
        if (hasMissingMaterials !== undefined) where.hasMissingMaterials = hasMissingMaterials;
        if (hasCriticalMaterial !== undefined) where.hasCriticalMaterial = hasCriticalMaterial;
        if (hasPartialStock !== undefined) where.hasPartialStock = hasPartialStock;
        if (isReady !== undefined) where.isReady = isReady;
        if (stage) where.stage = stage;
        if (productCode) where.productCode = { contains: productCode, mode: "insensitive" };
        if (orderNumber) where.orderNumber = { contains: orderNumber, mode: "insensitive" };

        // ─── Filtros temporais ────────────────────────────────────────
        if (startDateFrom || startDateTo) {
            const expectedAtFilter: Record<string, Date> = {};
            if (startDateFrom) expectedAtFilter.gte = new Date(startDateFrom);
            if (startDateTo) expectedAtFilter.lte = new Date(startDateTo);
            where.expectedAt = expectedAtFilter;
        }
        if (completionDateFrom || completionDateTo) {
            const completedAtFilter: Record<string, Date> = {};
            if (completionDateFrom) completedAtFilter.gte = new Date(completionDateFrom);
            if (completionDateTo) completedAtFilter.lte = new Date(completionDateTo);
            where.completedAt = completedAtFilter;
        }

        // ─── Busca textual (q) — Universal Search ────────────────────
        // Suporta 4 modos: orderNumber, omieId, code, text
        // Usa campos normalizados para matching robusto.
        let needsScoring = false;

        if (q) {
            const qNormalized = normalize(q);
            const queryType = detectQueryType(q);

            if (queryType === "omieId") {
                where.omieId = q;
            } else if (queryType === "orderNumber") {
                where.OR = [
                    { orderNumber: { contains: q, mode: "insensitive" } },
                    { orderNumberNormalized: { contains: qNormalized, mode: "insensitive" } },
                ];
            } else if (queryType === "code") {
                where.OR = [
                    { productCode: { contains: q, mode: "insensitive" } },
                    { productCodeNormalized: { contains: qNormalized, mode: "insensitive" } },
                    { stageName: { contains: q, mode: "insensitive" } },
                ];
            } else {
                // Text search — busca em múltiplos campos textuais
                needsScoring = true;
                const tokens = tokenize(q);

                if (tokens.length <= 1) {
                    where.OR = [
                        { productName: { contains: q, mode: "insensitive" } },
                        { productNameNormalized: { contains: qNormalized, mode: "insensitive" } },
                        { productCodeNormalized: { contains: qNormalized, mode: "insensitive" } },
                        { orderNumberNormalized: { contains: qNormalized, mode: "insensitive" } },
                        { stageName: { contains: q, mode: "insensitive" } },
                    ];
                } else {
                    // Multi-token: cada token precisa bater em pelo menos um campo
                    where.AND = tokens.map((token) => ({
                        OR: [
                            { productNameNormalized: { contains: token, mode: "insensitive" } },
                            { productCodeNormalized: { contains: token, mode: "insensitive" } },
                            { stageName: { contains: token, mode: "insensitive" } },
                        ],
                    }));
                }
            }
        }

        const [total, rows] = await Promise.all([
            prisma.productionOrderReadModel.count({ where: where as any }),
            prisma.productionOrderReadModel.findMany({
                where: where as any,
                orderBy: [
                    { priority: "desc" },
                    { daysOverdue: "desc" },
                    { expectedAt: "asc" },
                ],
                take: safeLimit,
                skip: safeOffset,
            }),
        ]);

        // ─── Scoring pós-consulta ────────────────────────────────────
        // Re-ranking por relevância quando for busca textual.
        let finalRows = rows;

        if (needsScoring && q) {
            const tokens = tokenize(q);

            const scored = finalRows.map((row) => ({
                row,
                score: score(tokens, {
                    productName: row.productName ?? "",
                    productCode: row.productCode ?? "",
                    orderNumber: row.orderNumber ?? "",
                    stageName: row.stageName ?? "",
                }).score,
            }));

            scored.sort((a, b) => b.score - a.score);
            finalRows = scored.map((s) => s.row);
        }

        return {
            summary: {
                total,
                returned: finalRows.length,
            },
            meta: {
                pageSize: safeLimit,
                offset: safeOffset,
            },
            data: finalRows,
        };
    }
}
