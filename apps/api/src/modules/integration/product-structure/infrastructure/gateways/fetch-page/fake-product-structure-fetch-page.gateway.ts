import type {
    ProductStructureFetchPageGateway,
    ProductStructureFetchPageInput,
    ProductStructureFetchPageResult,
} from "../../../application/ports/product-structure-fetch-page.gateway";

export class FakeProductStructureFetchPageGateway
    implements ProductStructureFetchPageGateway {
    async fetchPage(input: ProductStructureFetchPageInput): Promise<ProductStructureFetchPageResult> {
        const { page, pageSize } = input;

        if (page > 1) {
            return { items: [], hasNextPage: false, totalPages: 1, currentPage: page };
        }

        const items = Array.from({ length: Math.min(pageSize, 3) }).map((_, index) => ({
            productCode: `FAKE-STR-${String(index + 1).padStart(4, "0")}`,
            description: `Fake Product Structure ${index + 1}`,
            familyCode: "fkg",
            familyDescription: "Fake Group",
            productType: "04",
            unit: "KG",
            grossWeight: 1.0,
            netWeight: 1.0,
            omieProductId: `911617${2021 + index}`,
            hasStructure: true,
            items: [
                {
                    componentCode: `FAKE-COMP-${String(index + 1).padStart(4, "0")}-A`,
                    description: `Fake Component A for ${index + 1}`,
                    familyCode: "insumos",
                    familyDescription: "Insumos",
                    quantity: "1.01",
                    unit: "KG",
                    loss: "0",
                    omieMeshId: `9209354${337 + index}`,
                    grossWeight: 1.0,
                    netWeight: 1.0,
                },
                {
                    componentCode: `FAKE-COMP-${String(index + 1).padStart(4, "0")}-B`,
                    description: `Fake Component B for ${index + 1}`,
                    familyCode: "emba",
                    familyDescription: "Embalagem",
                    quantity: "1",
                    unit: "UN",
                    loss: "0",
                    omieMeshId: `9410001${749 + index}`,
                    grossWeight: 0,
                    netWeight: 0,
                },
            ],
        }));

        return { items, hasNextPage: false, totalPages: 1, currentPage: page };
    }
}
