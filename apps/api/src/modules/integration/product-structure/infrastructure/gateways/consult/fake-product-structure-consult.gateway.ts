// ---------------------------------------------------------------------------
// Gateway — Fake Product Structure Consult
// ---------------------------------------------------------------------------
// Lê do espelho local como fallback. Útil para testar a rota de refresh
// sem depender do Omie.
// ---------------------------------------------------------------------------

import type {
    ProductStructureConsultGateway,
    ProductStructureConsultResult,
} from "../../../application/ports/product-structure-consult.gateway";

export class FakeProductStructureConsultGateway
    implements ProductStructureConsultGateway {

    async consult(productCode: string): Promise<ProductStructureConsultResult | null> {
        console.log("[PS][FAKE][CONSULT] consult", { productCode });

        const { prisma } = await import("@/shared/db/prisma");
        const record = await prisma.productStructure.findUnique({
            where: { codProduto: productCode },
            include: { items: true },
        });

        if (!record) return null;

        return {
            productCode: record.codProduto,
            description: record.descrProduto,
            familyCode: record.codFamilia,
            familyDescription: record.descrFamilia,
            productType: record.tipoProduto,
            unit: record.unidProduto,
            grossWeight: record.pesoBruto ? Number(record.pesoBruto) : null,
            netWeight: record.pesoLiquido ? Number(record.pesoLiquido) : null,
            omieProductId: record.idProdutoOmie ? String(record.idProdutoOmie) : null,
            omieProductIntegrationId: record.intProdutoOmie,
            hasStructure: record.hasStructure,
            items: (record.items ?? []).map((item) => ({
                componentCode: item.codProdutoComponente,
                description: item.descrProdutoComponente,
                familyCode: item.codFamiliaComponente,
                familyDescription: item.descrFamiliaComponente,
                quantity: String(item.quantidade),
                unit: item.unidade,
                loss: item.percentualPerda,
                omieMeshId: item.idMalhaOmie ? String(item.idMalhaOmie) : null,
                productType: item.tipoProdutoComponente,
            })),
            rawPayload: {
                fake: true,
                source: "local_mirror",
                productCode,
            },
        };
    }
}
