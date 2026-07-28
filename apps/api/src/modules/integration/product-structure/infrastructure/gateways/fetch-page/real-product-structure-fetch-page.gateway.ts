import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import type {
    ProductStructureFetchPageGateway,
    ProductStructureFetchPageInput,
    ProductStructureFetchPageResult,
    ProductStructurePageItem,
} from "../../../application/ports/product-structure-fetch-page.gateway";

function getString(value: unknown, fallback: string | null = null): string | null {
    if (typeof value === "string" && value.trim() !== "") return value.trim();
    if (typeof value === "number") return String(value);
    return fallback;
}

function getNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value.replace(",", "."));
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

export class RealProductStructureFetchPageGateway
    implements ProductStructureFetchPageGateway {
    constructor(private readonly omieClient: OmieHttpClientPort) { }

    async fetchPage(
        input: ProductStructureFetchPageInput
    ): Promise<ProductStructureFetchPageResult> {
        const { page, pageSize } = input;

        const response = await this.omieClient.post<any>("geral/malha/", {
            call: "ListarEstruturas",
            param: [
                {
                    nPagina: page,
                    nRegPorPagina: pageSize,
                },
            ],
        });

        const encontrados = Array.isArray(response?.produtosEncontrados)
            ? response.produtosEncontrados
            : [];

        const totalPages =
            response?.nTotPaginas != null ? Number(response.nTotPaginas) : null;

        const items: ProductStructurePageItem[] = encontrados.map((entry: any) => {
            const ident = entry?.ident ?? {};
            const itens = Array.isArray(entry?.itens) ? entry.itens : [];

            return {
                productCode: String(ident.codProduto ?? ""),
                description: getString(ident.descrProduto) ?? "",
                familyCode: getString(ident.codFamilia),
                familyDescription: getString(ident.descrFamilia),
                productType: getString(ident.tipoProduto),
                unit: getString(ident.unidProduto),
                grossWeight: getNumber(ident.pesoBrutoProduto),
                netWeight: getNumber(ident.pesoLiqProduto),
                omieProductId: getString(ident.idProduto),
                hasStructure: itens.length > 0,
                items: itens.map((item: any) => ({
                    componentCode: String(item.codProdMalha ?? ""),
                    description: getString(item.descrProdMalha),
                    familyCode: getString(item.codFamMalha),
                    familyDescription: getString(item.descrFamMalha),
                    quantity: String(item.quantProdMalha ?? "0"),
                    unit: getString(item.unidProdMalha),
                    loss: getString(item.percPerdaProdMalha),
                    omieMeshId: getString(item.idMalha),
                    grossWeight: getNumber(item.pesoBrutoProdMalha),
                    netWeight: getNumber(item.pesoLiqProdMalha),
                })),
            };
        });

        return {
            items,
            hasNextPage: totalPages != null ? page < totalPages : items.length > 0,
            totalPages,
            currentPage: page,
        };
    }
}
