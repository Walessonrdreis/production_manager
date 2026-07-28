export type ProductStructureSummaryItem = {
    productCode: string;
    description: string | null;
    familyCode: string | null;
    familyDescription: string | null;
    productType: string | null;
    unit: string | null;
    hasStructure: boolean;
    componentCount: number;
    totalComponents: number;
    lastSyncAt: Date | null;
    updatedAt: Date;
};

export function mapProductStructureToSummary(record: {
    codProduto: string;
    descrProduto: string | null;
    codFamilia: string | null;
    descrFamilia: string | null;
    tipoProduto: string | null;
    unidProduto: string | null;
    hasStructure: boolean;
    updatedAt: Date;
    _count: { items: number };
}): ProductStructureSummaryItem {
    return {
        productCode: record.codProduto,
        description: record.descrProduto,
        familyCode: record.codFamilia,
        familyDescription: record.descrFamilia,
        productType: record.tipoProduto,
        unit: record.unidProduto,
        hasStructure: record.hasStructure,
        componentCount: record._count.items,
        totalComponents: record._count.items,
        lastSyncAt: record.updatedAt,
        updatedAt: record.updatedAt,
    };
}
