export type ProductStructurePageItem = {
    productCode: string;
    description: string;
    familyCode: string | null;
    familyDescription: string | null;
    productType: string | null;
    unit: string | null;
    grossWeight: number | null;
    netWeight: number | null;
    omieProductId: string | null;
    hasStructure: boolean;
    items: Array<{
        componentCode: string;
        description: string | null;
        familyCode: string | null;
        familyDescription: string | null;
        quantity: string;
        unit: string | null;
        loss: string | null;
        omieMeshId: string | null;
        grossWeight: number | null;
        netWeight: number | null;
    }>;
};

export type ProductStructureFetchPageInput = {
    page: number;
    pageSize: number;
    updatedSince?: Date;
};

export type ProductStructureFetchPageResult = {
    items: ProductStructurePageItem[];
    hasNextPage: boolean;
    totalPages: number | null;
    currentPage: number;
};

export interface ProductStructureFetchPageGateway {
    fetchPage(input: ProductStructureFetchPageInput): Promise<ProductStructureFetchPageResult>;
}
