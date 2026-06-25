// ---------------------------------------------------------------------------
// RefreshProductionOrderReadModelUseCase
// ---------------------------------------------------------------------------
// Responsável por montar o read model de ordens de produção a partir dos
// dados do espelho local (OP, produto, estrutura, estoque).
//
// Contém o core buildProductionOrderReadModel(op) com todo o fluxo:
//   1. Entrada     → OP + produto + estrutura + estoque_map
//   2. Materiais   → totalRequired, currentStock, projectedStock, status
//   3. Flags       → missing / critical / partial / issue
//   4. Readiness   → canStart + blockingReasons + warnings
//   5. Priority    → high / medium / low
//   6. Alerts      → strings humanas curtas
//   7. Ordenação   → materiais por impacto (CRITICAL → PARTIAL → OK)
//   8. Output      → objeto pronto para persistir
// ---------------------------------------------------------------------------

import { prisma } from "@/shared/db/prisma";
import { getLogger } from "@/shared/logger";
import {
    ProductionOrderReadModelStore,
    type ProductionOrderReadModelRecord,
    type MaterialItem,
    type MaterialsSummary,
    type ReadinessInfo,
} from "../../infrastructure/db/production-order-read-model.store";

const logger = getLogger("RefreshProductionOrderReadModelUseCase");

// ─── Helpers de precisão ──────────────────────────────────────────────

const DECIMAL_PRECISION = 4;

function round(value: number, decimals = DECIMAL_PRECISION): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

// ─── Tipos internos ───────────────────────────────────────────────────

type OpRow = {
    omieCode: string;
    orderNumber: string | null;
    productCode: string | null;
    quantity: string;
    forecastDate: Date | null;
    startDate: Date | null;
    completionDate: Date | null;
    stage: string | null;
    completed: boolean;
    active: boolean;
    lastSyncAt: Date;
};

type ProductRow = {
    omieCode: string;
    description: string | null;
    unit: string | null;
};

type StructureItemRow = {
    codProdutoPai: string;
    codProdutoComponente: string;
    descrProdutoComponente: string | null;
    quantidade: number;
    unidade: string | null;
    percentualPerda: number | null;
};

type StockRow = {
    omieCode: string;
    stockQuantity: number;
};

// ─── Mapa produto: OmieCode → internalCode ────────────────────────────
// A OP usa código Omie (numérico), a estrutura usa código interno (ex: "100kg").
// Usamos o catálogo como ponte entre os dois mundos.

type CatalogBridge = {
    omieToInternal: Map<string, string>;  // "9116171995" → "100kg"
    internalToOmie: Map<string, string>;  // "100kg" → "9116171995"
    productNameMap: Map<string, string>;  // "9116171995" → "100% cacau 1 Kg"
    productUnitMap: Map<string, string>;  // "9116171995" → "KG"
};

async function buildCatalogBridge(): Promise<CatalogBridge> {
    const products = await prisma.omieProduct.findMany({
        select: {
            omieCode: true,
            description: true,
            rawPayload: true,
        },
    });

    const omieToInternal = new Map<string, string>();
    const internalToOmie = new Map<string, string>();
    const productNameMap = new Map<string, string>();
    const productUnitMap = new Map<string, string>();

    for (const p of products) {
        const raw = p.rawPayload as Record<string, unknown> | null;
        const internalCode =
            typeof raw?.codigo_produto === "string"
                ? raw.codigo_produto
                : typeof raw?.codigoProduto === "string"
                    ? raw.codigoProduto
                    : null;

        if (internalCode && p.omieCode) {
            omieToInternal.set(p.omieCode, internalCode);
            internalToOmie.set(internalCode, p.omieCode);
        }

        if (p.omieCode) {
            productNameMap.set(p.omieCode, p.description ?? "");
            const unit =
                typeof raw?.unidade === "string"
                    ? raw.unidade
                    : null;
            productUnitMap.set(p.omieCode, unit ?? "");
        }
    }

    return { omieToInternal, internalToOmie, productNameMap, productUnitMap };
}

// ─── Status do material ────────────────────────────────────────────────

function calculateMaterialStatus(
    currentStock: number,
    totalRequired: number
): MaterialItem["status"] {
    if (currentStock <= 0) return "MISSING";
    if (currentStock < totalRequired * 0.1) return "CRITICAL";
    if (currentStock < totalRequired) return "PARTIAL";
    return "OK";
}

// ─── Flags ─────────────────────────────────────────────────────────────

function calculateFlags(materials: MaterialItem[]) {
    const hasMissingMaterials = materials.some((m) => m.status === "MISSING");
    const hasCriticalMaterial = materials.some((m) => m.status === "CRITICAL");
    const hasPartialStock = materials.some((m) => m.status === "PARTIAL");
    const hasStockIssue = hasMissingMaterials || hasCriticalMaterial || hasPartialStock;

    return { hasMissingMaterials, hasCriticalMaterial, hasPartialStock, hasStockIssue };
}

// ─── Readiness ─────────────────────────────────────────────────────────

function calculateReadiness(
    materials: MaterialItem[],
    isLate: boolean,
    daysOverdue: number
): ReadinessInfo {
    const blockingReasons: string[] = [];
    const warnings: string[] = [];

    for (const m of materials) {
        if (m.status === "MISSING") {
            blockingReasons.push(
                `Componente '${m.componentName || m.componentCode}' sem estoque (${m.currentStock} ${m.unit || ""} para ${m.totalRequired} ${m.unit || ""} necessários)`
            );
        } else if (m.status === "CRITICAL") {
            blockingReasons.push(
                `Componente '${m.componentName || m.componentCode}' com estoque crítico (${m.currentStock} ${m.unit || ""} para ${m.totalRequired} ${m.unit || ""} necessários)`
            );
        } else if (m.status === "PARTIAL") {
            warnings.push(
                `Componente '${m.componentName || m.componentCode}' com estoque parcial (${m.currentStock} ${m.unit || ""} para ${m.totalRequired} ${m.unit || ""} necessários)`
            );
        }
    }

    if (isLate) {
        warnings.push(`OP atrasada ${daysOverdue} dias`);
    }

    const canStartProduction = blockingReasons.length === 0;

    return { canStartProduction, blockingReasons, warnings };
}

// ─── Prioridade ────────────────────────────────────────────────────────

function calculatePriority(
    isLate: boolean,
    hasStockIssue: boolean,
    hasCriticalMaterial: boolean
): string {
    if (isLate && hasStockIssue) return "high";
    if (isLate || hasCriticalMaterial) return "medium";
    return "low";
}

// ─── Alertas ───────────────────────────────────────────────────────────

function buildAlerts(
    materials: MaterialItem[],
    isLate: boolean,
    daysOverdue: number
): string[] {
    const alerts: string[] = [];

    if (isLate) {
        alerts.push(`OP atrasada — ${daysOverdue} dias`);
    }

    for (const m of materials) {
        if (m.status === "MISSING") {
            alerts.push(`${m.componentName || m.componentCode} sem estoque`);
        } else if (m.status === "CRITICAL") {
            alerts.push(
                `${m.componentName || m.componentCode} crítico — ${m.currentStock} ${m.unit || ""} restantes`
            );
        } else if (m.status === "PARTIAL") {
            alerts.push(
                `${m.componentName || m.componentCode} parcial — ${m.currentStock} ${m.unit || ""} de ${m.totalRequired} ${m.unit || ""}`
            );
        }
    }

    return alerts;
}

// ─── Ordenação de materiais ────────────────────────────────────────────

const STATUS_ORDER: Record<MaterialItem["status"], number> = {
    MISSING: 0,
    CRITICAL: 1,
    PARTIAL: 2,
    OK: 3,
};

function sortMaterials(materials: MaterialItem[]): MaterialItem[] {
    return [...materials].sort(
        (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    );
}

// ─── Core: buildProductionOrderReadModel ───────────────────────────────
// Constrói o objeto final do read model para UMA OP.

export function buildProductionOrderReadModel(
    op: OpRow,
    product: ProductRow | null,
    structureItems: StructureItemRow[],
    stockMap: Map<string, number>,
    bridge: CatalogBridge
): ProductionOrderReadModelRecord {
    const opQuantity = round(parseFloat(op.quantity) || 0);
    const omieCode = op.productCode ?? "";

    // ─── 1. Montagem dos materiais ────────────────────────────────────
    const materials: MaterialItem[] = structureItems.map((item) => {
        const quantityPerUnit = round(Number(item.quantidade) || 0);
        const lossPercent = item.percentualPerda ? Number(item.percentualPerda) : 0;
        const lossMultiplier = 1 + lossPercent / 100;
        const totalRequired = round(quantityPerUnit * opQuantity * lossMultiplier);
        const currentStock = round(stockMap.get(item.codProdutoComponente) ?? 0);
        const projectedStock = round(currentStock - totalRequired);
        const status = calculateMaterialStatus(currentStock, totalRequired);

        return {
            componentCode: item.codProdutoComponente,
            componentName: item.descrProdutoComponente,
            unit: item.unidade,
            quantityPerUnit,
            lossPercent: lossPercent > 0 ? lossPercent : null,
            totalRequired,
            currentStock,
            projectedStock,
            status,
        };
    });

    // ─── 2. Ordenação (CRITICAL → PARTIAL → OK) ──────────────────────
    const sortedMaterials = sortMaterials(materials);

    // ─── 3. Flags ─────────────────────────────────────────────────────
    const flags = calculateFlags(materials);

    // ─── 4. Datas e atraso ────────────────────────────────────────────
    const now = new Date();
    const expectedAt = op.forecastDate;
    const startedAt = op.startDate;
    const completedAt = op.completionDate;

    let daysOverdue = 0;
    let isLate = false;

    if (expectedAt && expectedAt < now && !op.completed) {
        const diffMs = now.getTime() - expectedAt.getTime();
        daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        isLate = daysOverdue > 0;
    }

    const isOpen = op.active && !op.completed;

    // ─── 5. Readiness ─────────────────────────────────────────────────
    const readiness = calculateReadiness(materials, isLate, daysOverdue);

    // ─── 6. Prioridade ────────────────────────────────────────────────
    const priority = calculatePriority(
        isLate,
        flags.hasStockIssue,
        flags.hasCriticalMaterial
    );

    // ─── 7. Alertas ───────────────────────────────────────────────────
    const alerts = buildAlerts(materials, isLate, daysOverdue);

    // ─── 8. Operational Status ────────────────────────────────────────
    let operationalStatus = "pending";
    if (readiness.canStartProduction && isOpen) {
        operationalStatus = "ready";
    }
    if (flags.hasStockIssue) {
        operationalStatus = "blocked";
    }
    if (op.completed) {
        operationalStatus = "completed";
    }

    // ─── 9. Materials Summary ─────────────────────────────────────────
    const materialsSummary: MaterialsSummary = {
        totalComponents: materials.length,
        missingCount: materials.filter((m) => m.status === "MISSING").length,
        criticalCount: materials.filter((m) => m.status === "CRITICAL").length,
        partialCount: materials.filter((m) => m.status === "PARTIAL").length,
        okCount: materials.filter((m) => m.status === "OK").length,
    };

    // ─── 10. Output final ─────────────────────────────────────────────
    return {
        omieCode: op.omieCode,
        orderNumber: op.orderNumber,
        productCode: op.productCode,
        productName: product?.description ?? null,
        productUnit: product?.unit ?? null,
        quantity: opQuantity,
        stage: op.stage,
        operationalStatus,
        isOpen,
        isLate,
        isReady: readiness.canStartProduction && isOpen,
        isBlocked: !readiness.canStartProduction && isOpen,
        hasStockIssue: flags.hasStockIssue,
        hasMissingMaterials: flags.hasMissingMaterials,
        hasCriticalMaterial: flags.hasCriticalMaterial,
        hasPartialStock: flags.hasPartialStock,
        priority,
        expectedAt,
        startedAt,
        completedAt,
        daysOverdue,
        materialsJson: sortedMaterials,
        materialsSummaryJson: materialsSummary,
        readinessJson: readiness,
        alertsJson: alerts,
        lastSyncAt: op.lastSyncAt,
    };
}

// ─── UseCase completo ──────────────────────────────────────────────────

export class RefreshProductionOrderReadModelUseCase {
    constructor(
        private readonly readModelStore: ProductionOrderReadModelStore
    ) { }

    async execute() {
        logger.info("Starting production order read-model refresh");

        // 1. Carregar dados de referência
        const bridge = await buildCatalogBridge();

        // 2. Mapa de estoque: internalCode → stockQuantity
        const stocks = await prisma.productStock.findMany({
            select: {
                omieCode: true,
                stockQuantity: true,
            },
        });
        const stockMap = new Map<string, number>(
            stocks.map((s) => [s.omieCode, round(Number(s.stockQuantity) || 0)])
        );

        // 3. Mapa de estrutura: internalCode → items[]
        const allStructureItems = await prisma.productStructureItem.findMany({
            select: {
                codProdutoPai: true,
                codProdutoComponente: true,
                descrProdutoComponente: true,
                quantidade: true,
                unidade: true,
                percentualPerda: true,
            },
        });
        const structureMap = new Map<string, StructureItemRow[]>();
        for (const item of allStructureItems) {
            const items = structureMap.get(item.codProdutoPai) ?? [];
            items.push(item as any);
            structureMap.set(item.codProdutoPai, items);
        }

        // 4. Buscar OPs abertas (completas ou não, mas ativas)
        const ops = await prisma.omieProductionOrder.findMany({
            where: {
                active: true,
            },
            orderBy: { lastSyncAt: "desc" },
        });

        logger.info("Processing production orders", { total: ops.length });

        // 5. Mapa de produtos: omieCode → { description, unit }
        const products = await prisma.omieProduct.findMany({
            select: {
                omieCode: true,
                description: true,
                rawPayload: true,
            },
        });
        const productMap = new Map<string, { description: string; unit: string }>();
        for (const p of products) {
            if (!p.omieCode) continue;
            const raw = p.rawPayload as Record<string, unknown> | null;
            const unit =
                typeof raw?.unidade === "string"
                    ? raw.unidade
                    : typeof raw?.unid_produto === "string"
                        ? raw.unid_produto
                        : "";
            productMap.set(p.omieCode, {
                description: p.description ?? "",
                unit,
            });
        }

        // 6. Construir records
        const records: ProductionOrderReadModelRecord[] = [];

        for (const op of ops) {
            try {
                const product = productMap.get(op.productCode ?? "") ?? null;
                const record = buildProductionOrderReadModel(
                    {
                        omieCode: op.omieCode,
                        orderNumber: op.orderNumber,
                        productCode: op.productCode,
                        quantity: op.quantity,
                        forecastDate: op.forecastDate,
                        startDate: op.startDate,
                        completionDate: op.completionDate,
                        stage: op.stage,
                        completed: op.completed,
                        active: op.active,
                        lastSyncAt: op.lastSyncAt,
                    },
                    product
                        ? { omieCode: op.productCode ?? "", description: product.description, unit: product.unit }
                        : null,
                    structureMap.get(
                        bridge.omieToInternal.get(op.productCode ?? "") ?? ""
                    ) ?? [],
                    stockMap,
                    bridge
                );
                records.push(record);
            } catch (err) {
                logger.warn("Failed to build read model for OP", {
                    omieCode: op.omieCode,
                    error: err instanceof Error ? err.message : String(err),
                });
            }
        }

        // 7. Persistir
        await this.readModelStore.replaceAll(records);

        // 8. Recalcular isLate ao vivo nas flags
        const now = new Date();
        for (const record of records) {
            if (record.expectedAt && record.expectedAt < now && record.isOpen) {
                record.isLate = true;
                const diffMs = now.getTime() - record.expectedAt.getTime();
                record.daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            }
        }

        logger.info("Production order read-model refresh completed", {
            records: records.length,
            openOrders: records.filter((r) => r.isOpen).length,
            blocked: records.filter((r) => r.isBlocked).length,
            late: records.filter((r) => r.isLate).length,
        });

        return {
            ok: true,
            refreshedRecords: records.length,
        };
    }

    // ─── Refresh de uma OP específica ─────────────────────────────────

    async refreshOne(omieCode: string) {
        logger.info("Refreshing single production order", { omieCode });

        const op = await prisma.omieProductionOrder.findUnique({
            where: { omieCode },
        });

        if (!op) {
            throw new Error(`Production order ${omieCode} not found`);
        }

        const bridge = await buildCatalogBridge();

        const stocks = await prisma.productStock.findMany({
            select: { omieCode: true, stockQuantity: true },
        });
        const stockMap = new Map<string, number>(
            stocks.map((s) => [s.omieCode, round(Number(s.stockQuantity) || 0)])
        );

        const allStructureItems = await prisma.productStructureItem.findMany({
            select: {
                codProdutoPai: true,
                codProdutoComponente: true,
                descrProdutoComponente: true,
                quantidade: true,
                unidade: true,
                percentualPerda: true,
            },
        });
        const structureItems = allStructureItems.filter(
            (item) =>
                item.codProdutoPai ===
                (bridge.omieToInternal.get(op.productCode ?? "") ?? "")
        ) as any as StructureItemRow[];

        const productInfo = op.productCode
            ? await prisma.omieProduct.findUnique({
                where: { omieCode: op.productCode },
                select: { description: true, rawPayload: true },
            })
            : null;

        const raw = productInfo?.rawPayload as Record<string, unknown> | null;
        const unit =
            typeof raw?.unidade === "string"
                ? raw.unidade
                : typeof raw?.unid_produto === "string"
                    ? raw.unid_produto
                    : null;

        const record = buildProductionOrderReadModel(
            {
                omieCode: op.omieCode,
                orderNumber: op.orderNumber,
                productCode: op.productCode,
                quantity: op.quantity,
                forecastDate: op.forecastDate,
                startDate: op.startDate,
                completionDate: op.completionDate,
                stage: op.stage,
                completed: op.completed,
                active: op.active,
                lastSyncAt: op.lastSyncAt,
            },
            productInfo
                ? {
                    omieCode: op.productCode ?? "",
                    description: productInfo.description,
                    unit,
                }
                : null,
            structureItems,
            stockMap,
            bridge
        );

        await this.readModelStore.upsertOne(record);

        logger.info("Single production order refresh completed", {
            omieCode,
            operationalStatus: record.operationalStatus,
            priority: record.priority,
        });

        return record;
    }
}
