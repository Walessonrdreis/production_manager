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
import { normalize, NORMALIZE_VERSION } from "@/shared/search/normalize";
import { resolveStage } from "@/shared/stage/resolve-stage";

const logger = getLogger("RefreshProductionOrderReadModelUseCase");

// ─── Helpers de precisão ──────────────────────────────────────────────

const DECIMAL_PRECISION = 4;

function round(value: number, decimals = DECIMAL_PRECISION): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

// ─── Helper: extrair codigo numerico Omie do rawPayload ───────────────
// O Omie retorna codigo_produto como numero (9427871245), mas pode vir
// como string em alguns endpoints. Esta funcao normaliza para string.

function extractNumericOmieCode(raw: Record<string, unknown> | null): string | null {
    if (!raw) return null;
    const v = raw.codigo_produto ?? raw.codigoProduto ?? null;
    if (v === null || v === undefined) return null;
    return String(v);
}

// ─── Tipos internos ───────────────────────────────────────────────────

type OpRow = {
    omieId: string;
    orderNumber: string | null;
    productOmieId: string | null;
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

// ─── Bridge: mapeamento entre os dois mundos ──────────────────────────
// Omie product API retorna dois identificadores:
//   "codigo": "42avkg"      → codigo visivel (omieCode)
//   "codigo_produto": 9116172021 → ID numerico (omieId)
//
// A OP usa productCode = ID numerico (ex: "9116172083").
// A estrutura (BOM) usa codigo visivel (ex: "42avkg").
//
// Maps:
//   omieToInternal:  omieCode  (visivel) → omieId (numerico)
//                    ex: "42avkg" → "9116172021"
//
//   internalToOmie:  omieId    (numerico) → omieCode (visivel)
//                    ex: "9116172021" → "42avkg"
// -----------------------------------------------------------------------
type CatalogBridge = {
    /** omieCode (visivel) → omieId (numerico) */
    omieToInternal: Map<string, string>;
    /** omieId (numerico) → omieCode (visivel) */
    internalToOmie: Map<string, string>;
    /** omieCode (visivel) → nome do produto */
    productNameMap: Map<string, string>;
    /** omieCode (visivel) → unidade */
    productUnitMap: Map<string, string>;
};

async function buildCatalogBridge(): Promise<CatalogBridge> {
    const products = await prisma.omieProduct.findMany({
        select: {
            omieCode: true,
            omieId: true,
            description: true,
            rawPayload: true,
        },
    });

    const omieToInternal = new Map<string, string>();
    const internalToOmie = new Map<string, string>();
    const productNameMap = new Map<string, string>();
    const productUnitMap = new Map<string, string>();

    for (const p of products) {
        const productOmieId = p.omieId;

        if (productOmieId && p.omieCode) {
            omieToInternal.set(p.omieCode, productOmieId);
            internalToOmie.set(productOmieId, p.omieCode);
        }

        if (p.omieCode) {
            productNameMap.set(p.omieCode, p.description ?? "");
            const pRaw = p.rawPayload as Record<string, unknown> | null;
            const unit =
                pRaw?.unidade != null
                    ? String(pRaw.unidade)
                    : null;
            productUnitMap.set(p.omieCode, unit ?? "");
        }
    }

    return { omieToInternal, internalToOmie, productNameMap, productUnitMap };
}

// ─── Resolução de chave de estoque ────────────────────────────────────
// A estrutura (BOM) usa codigo visivel (ex: "icekg").
// stockMap é chaveado por productOmieId (numerico, ex: "9116172062").
//
// Maps:
//   omieToInternal:  visivel → numerico  (omieCode → omieId)
//   internalToOmie:  numerico → visivel  (omieId → omieCode)
//
// Portanto, converter codigo visivel (componentCode) → numerico (stockMap)
// usa omieToInternal.get(componentCode).
// -----------------------------------------------------------------------
function resolveStockLookupKey(
    componentCode: string,
    bridge: CatalogBridge,
    stockMap: Map<string, number>
): { omieCode: string; resolution: "bridge" | "fallback_internal" | "not_found" } | null {
    // 1. Bridge: codigo visivel (componentCode) → codigo numerico via omieToInternal
    const numericCode = bridge.omieToInternal.get(componentCode);
    if (numericCode && stockMap.has(numericCode)) {
        return { omieCode: numericCode, resolution: "bridge" };
    }

    // 2. Fallback: tentar usar o codigo visivel diretamente como chave de estoque
    if (stockMap.has(componentCode)) {
        return { omieCode: componentCode, resolution: "fallback_internal" };
    }

    // 3. Nao encontrado → sem dados de estoque para este material
    return null;
}

// ─── Status do material ────────────────────────────────────────────────

function calculateMaterialStatus(
    currentStock: number | null,
    totalRequired: number
): MaterialItem["status"] {
    if (currentStock === null) return "NO_STOCK_DATA";
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
    const hasNoStockData = materials.some((m) => m.status === "NO_STOCK_DATA");
    const hasStockIssue = hasMissingMaterials || hasCriticalMaterial || hasPartialStock || hasNoStockData;

    return { hasMissingMaterials, hasCriticalMaterial, hasPartialStock, hasStockIssue, hasNoStockData };
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
        } else if (m.status === "NO_STOCK_DATA") {
            blockingReasons.push(
                `Dados de estoque não encontrados para componente '${m.componentName || m.componentCode}'`
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
        } else if (m.status === "NO_STOCK_DATA") {
            alerts.push(`${m.componentName || m.componentCode} — sem dados de estoque`);
        }
    }

    return alerts;
}

// ─── Ordenação de materiais ────────────────────────────────────────────

const STATUS_ORDER: Record<MaterialItem["status"], number> = {
    MISSING: 0,
    NO_STOCK_DATA: 1,
    CRITICAL: 2,
    PARTIAL: 3,
    OK: 4,
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

    // ─── GUARD: Sem estrutura → NO_STRUCTURE ──────────────────────────
    // Se o produto não possui BOM, a OP não pode ser produzida.
    // Early return para evitar falso positivo ("ready" sem estrutura).
    if (!structureItems || structureItems.length === 0) {
        const expectedAt = op.forecastDate;
        const startedAt = op.startDate;
        const completedAt = op.completionDate;
        const isOpen = op.active && !op.completed;

        const stageInfo = resolveStage(op.stage);

        return {
            omieId: op.omieId,
            orderNumber: op.orderNumber,
            orderNumberNormalized: normalize(op.orderNumber),
            productCode: bridge.internalToOmie.get(op.productOmieId) ?? null,
            productCodeNormalized: normalize(bridge.internalToOmie.get(op.productOmieId) ?? null),
            productOmieId: op.productOmieId,
            productName: product?.description ?? null,
            productNameNormalized: normalize(product?.description ?? null),
            productUnit: product?.unit ?? null,
            normalizeVersion: NORMALIZE_VERSION,
            quantity: opQuantity,
            stage: op.stage,
            stageName: stageInfo.stageName,
            stageOrder: stageInfo.stageOrder,
            stageGroup: stageInfo.stageGroup,
            operationalStatus: "NO_STRUCTURE",
            isOpen,
            isLate: false,
            isReady: false,
            isBlocked: isOpen,
            hasStockIssue: true,
            hasMissingMaterials: true,
            hasCriticalMaterial: false,
            hasPartialStock: false,
            hasStructure: false,
            priority: "low",
            expectedAt,
            startedAt,
            completedAt,
            daysOverdue: 0,
            materialsJson: [],
            materialsSummaryJson: {
                totalComponents: 0,
                missingCount: 0,
                criticalCount: 0,
                partialCount: 0,
                okCount: 0,
                noStockDataCount: 0,
            },
            readinessJson: {
                canStartProduction: false,
                blockingReasons: ["Produto não possui estrutura definida"],
                warnings: [],
            },
            alertsJson: ["Produto sem estrutura — não é possível produzir"],
            lastSyncAt: op.lastSyncAt,
        };
    }

    const hasStructure = true;

    // ─── 1. Montagem dos materiais ────────────────────────────────────
    const materials: MaterialItem[] = structureItems.map((item) => {
        const quantityPerUnit = round(Number(item.quantidade) || 0);
        const lossPercent = item.percentualPerda ? Number(item.percentualPerda) : 0;
        const lossMultiplier = 1 + lossPercent / 100;
        const totalRequired = round(quantityPerUnit * opQuantity * lossMultiplier);

        // Resolve a chave de estoque com fallback em camadas
        const stockLookup = resolveStockLookupKey(
            item.codProdutoComponente,
            bridge,
            stockMap
        );

        let currentStock: number | null;
        let stockResolution: MaterialItem["stockResolution"] | undefined;

        if (stockLookup === null) {
            // Nenhum mapeamento encontrado → sem dados de estoque
            currentStock = null;
            stockResolution = "not_found";
        } else {
            currentStock = round(stockMap.get(stockLookup.omieCode) ?? 0);
            stockResolution = stockLookup.resolution;
        }

        const projectedStock = currentStock !== null
            ? round(currentStock - totalRequired)
            : 0;
        const status = calculateMaterialStatus(currentStock, totalRequired);

        return {
            componentCode: item.codProdutoComponente,
            componentName: item.descrProdutoComponente,
            unit: item.unidade,
            quantityPerUnit,
            lossPercent: lossPercent > 0 ? lossPercent : null,
            totalRequired,
            currentStock: currentStock ?? 0,
            projectedStock,
            status,
            stockResolution,
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
        noStockDataCount: materials.filter((m) => m.status === "NO_STOCK_DATA").length,
    };

    // ─── 10. Output final ─────────────────────────────────────────────
    const stageInfo = resolveStage(op.stage);

    return {
        omieId: op.omieId,
        orderNumber: op.orderNumber,
        orderNumberNormalized: normalize(op.orderNumber),
        productCode: bridge.internalToOmie.get(op.productOmieId) ?? null,
        productCodeNormalized: normalize(bridge.internalToOmie.get(op.productOmieId) ?? null),
        productOmieId: op.productOmieId,
        productName: product?.description ?? null,
        productNameNormalized: normalize(product?.description ?? null),
        productUnit: product?.unit ?? null,
        normalizeVersion: NORMALIZE_VERSION,
        quantity: opQuantity,
        stage: op.stage,
        stageName: stageInfo.stageName,
        stageOrder: stageInfo.stageOrder,
        stageGroup: stageInfo.stageGroup,
        operationalStatus,
        isOpen,
        isLate,
        isReady: readiness.canStartProduction && isOpen,
        isBlocked: !readiness.canStartProduction && isOpen,
        hasStockIssue: flags.hasStockIssue,
        hasMissingMaterials: flags.hasMissingMaterials,
        hasCriticalMaterial: flags.hasCriticalMaterial,
        hasPartialStock: flags.hasPartialStock,
        hasStructure: hasStructure,
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
                productOmieId: true,
                stockQuantity: true,
            },
        });
        const stockMap = new Map<string, number>(
            stocks.map((s) => [String(s.productOmieId), round(Number(s.stockQuantity) || 0)])
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

        // 5. Mapa de produtos: omieCode (visivel) → { description, unit }
        //    (usando p.omieCode como chave, que corresponde ao codigo visivel)
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
                raw?.unidade != null
                    ? String(raw.unidade)
                    : raw?.unid_produto != null
                        ? String(raw.unid_produto)
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
                // op.productOmieId e' numerico (omieId), productMap e' chaveado por omieCode (visivel)
                // usar bridge.internalToOmie para converter numerico → visivel
                const visibleCode = bridge.internalToOmie.get(op.productOmieId ?? "");
                const product = visibleCode ? (productMap.get(visibleCode) ?? null) : null;
                const record = buildProductionOrderReadModel(
                    {
                        omieId: op.omieId,
                        orderNumber: op.orderNumber,
                        productOmieId: op.productOmieId,
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
                        ? { omieCode: op.productOmieId ?? "", description: product.description, unit: product.unit }
                        : null,
                    structureMap.get(
                        bridge.internalToOmie.get(op.productOmieId ?? "") ?? ""
                    ) ?? [],
                    stockMap,
                    bridge
                );
                records.push(record);
            } catch (err) {
                logger.warn("Failed to build read model for OP", {
                    omieId: op.omieId,
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

    async refreshOne(omieId: string) {
        logger.info("Refreshing single production order", { omieId });

        const op = await prisma.omieProductionOrder.findUnique({
            where: { omieId },
        });

        if (!op) {
            throw new Error(`Production order ${omieId} not found`);
        }

        const bridge = await buildCatalogBridge();

        const stocks = await prisma.productStock.findMany({
            select: { productOmieId: true, stockQuantity: true },
        });
        const stockMap = new Map<string, number>(
            stocks.map((s) => [String(s.productOmieId), round(Number(s.stockQuantity) || 0)])
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
                (bridge.internalToOmie.get(op.productOmieId ?? "") ?? "")
        ) as any as StructureItemRow[];

        const productInfo = op.productOmieId
            ? await prisma.omieProduct.findFirst({
                where: { omieId: op.productOmieId },
                select: { description: true, rawPayload: true },
            })
            : null;

        const raw = productInfo?.rawPayload as Record<string, unknown> | null;
        const unit =
            raw?.unidade != null
                ? String(raw.unidade)
                : raw?.unid_produto != null
                    ? String(raw.unid_produto)
                    : null;

        const record = buildProductionOrderReadModel(
            {
                omieId: op.omieId,
                orderNumber: op.orderNumber,
                productOmieId: op.productOmieId,
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
                    omieCode: op.productOmieId ?? "",
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
            omieId,
            operationalStatus: record.operationalStatus,
            priority: record.priority,
        });

        return record;
    }
}
