// ---------------------------------------------------------------------------
// Mapper — Production Order → Summary
// ---------------------------------------------------------------------------
// Converte registros do espelho local (OmieProductionOrder + itens) em
// um formato resumido para exibição em listas e dashboards.
// Segue o padrão de ProductStructureSummaryItem.
// ---------------------------------------------------------------------------

export type ProductionOrderSummaryItem = {
    omieId: string;
    orderNumber: string | null;
    productCode: string | null;
    quantity: string;
    stage: string | null;
    completed: boolean;
    active: boolean;
    forecastDate: string | null;
    startDate: string | null;
    completionDate: string | null;
    itemCount: number;
    lastSyncAt: string;
};

export type ProductionOrderDetailSummary = ProductionOrderSummaryItem & {
    internalCode: string | null;
    productIntegrationCode: string | null;
    projectCode: string | null;
    items: Array<{
        omieItemCode: string;
        productMeshId: number | null;
        useFromStock: string | null;
        quantity: string | null;
        stockLocationCode: number | null;
        observation: string | null;
    }>;
};

/**
 * Converte um registro Prisma de OmieProductionOrder em um resumo compacto.
 */
export function mapProductionOrderToSummary(record: {
    omieId: string;
    orderNumber: string | null;
    productCode: string | null;
    quantity: string;
    stage: string | null;
    completed: boolean;
    active: boolean;
    forecastDate: Date | null;
    startDate: Date | null;
    completionDate: Date | null;
    lastSyncAt: Date;
    _count?: { items: number };
    items?: Array<{
        omieItemCode: string;
        productMeshId: bigint | number | null;
        useFromStock: string | null;
        quantity: string | null;
        stockLocationCode: bigint | number | null;
        observation: string | null;
    }>;
}): ProductionOrderSummaryItem {
    return {
        omieId: record.omieId,
        orderNumber: record.orderNumber,
        productCode: record.productCode,
        quantity: record.quantity,
        stage: record.stage,
        completed: record.completed,
        active: record.active,
        forecastDate: record.forecastDate?.toISOString() ?? null,
        startDate: record.startDate?.toISOString() ?? null,
        completionDate: record.completionDate?.toISOString() ?? null,
        itemCount: record._count?.items ?? record.items?.length ?? 0,
        lastSyncAt: record.lastSyncAt.toISOString(),
    };
}

/**
 * Converte um registro Prisma com itens incluídos em detalhes completos.
 */
export function mapProductionOrderToDetail(
    record: Parameters<typeof mapProductionOrderToSummary>[0] & {
        internalCode: string | null;
        productIntegrationCode: string | null;
        projectCode: string | null;
        items: Array<{
            omieItemCode: string;
            productMeshId: bigint | number | null;
            useFromStock: string | null;
            quantity: string | null;
            stockLocationCode: bigint | number | null;
            observation: string | null;
        }>;
    }
): ProductionOrderDetailSummary {
    const summary = mapProductionOrderToSummary(record);
    return {
        ...summary,
        internalCode: record.internalCode,
        productIntegrationCode: record.productIntegrationCode,
        projectCode: record.projectCode,
        items: record.items.map((i) => ({
            omieItemCode: i.omieItemCode,
            productMeshId:
                i.productMeshId != null ? Number(i.productMeshId) : null,
            useFromStock: i.useFromStock,
            quantity: i.quantity,
            stockLocationCode:
                i.stockLocationCode != null
                    ? Number(i.stockLocationCode)
                    : null,
            observation: i.observation,
        })),
    };
}
