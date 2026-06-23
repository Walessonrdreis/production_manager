// ---------------------------------------------------------------------------
// Gateway — Real Product Structure Consult (Omie)
// ---------------------------------------------------------------------------
// Chama ConsultarEstrutura via OmieClientWithCircuitBreaker, parseia
// a resposta e retorna dados frescos da estrutura do produto.
// ---------------------------------------------------------------------------

import { env } from "@/config";
import type { OmieClientWithCircuitBreaker } from "@/shared/integrations/omie/omie-client-with-circuit-breaker";
import type {
    ProductStructureConsultGateway,
    ProductStructureConsultResult,
} from "../../../application/ports/product-structure-consult.gateway";

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

export class RealProductStructureConsultGateway
    implements ProductStructureConsultGateway {

    constructor(private readonly omieClient: OmieClientWithCircuitBreaker) { }

    async consult(productCode: string): Promise<ProductStructureConsultResult | null> {
        if (!this.omieClient) {
            throw new Error("OMIE_CLIENT_NOT_CONFIGURED");
        }

        const payload = {
            call: "ConsultarEstrutura",
            app_key: env.OMIE_APP_KEY,
            app_secret: env.OMIE_APP_SECRET,
            param: [{ codProduto: productCode }],
        };

        const apiResponse = await this.omieClient.post<any>(
            "/api/v1/produto/estrutura/",
            payload
        );

        const response =
            apiResponse && typeof apiResponse === "object" && "data" in apiResponse
                ? (apiResponse as any).data
                : apiResponse;

        if (response?.faultstring || response?.error) {
            console.error("[PS][CONSULT][OMIE_ERROR]", response?.faultstring || response?.error);
            return null;
        }

        // A resposta do ConsultarEstrutura retorna os dados no root
        if (!response || !response.descrProduto) {
            console.warn("[PS][CONSULT] No product structure found for", productCode);
            return null;
        }

        const itens = Array.isArray(response?.itens) ? response.itens : [];

        return {
            productCode,
            description: getString(response.descrProduto),
            familyCode: getString(response.codFamilia),
            familyDescription: getString(response.descrFamilia),
            productType: getString(response.tipoProduto),
            unit: getString(response.unidProduto),
            grossWeight: getNumber(response.pesoBruto ?? response.pesoBrutoProduto),
            netWeight: getNumber(response.pesoLiquido ?? response.pesoLiqProduto),
            omieProductId: getString(response.idProdutoOmie ?? response.idProduto),
            omieProductIntegrationId: getString(response.intProdutoOmie),
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
                productType: getString(item.tipoProdMalha),
            })),
            rawPayload: response,
        };
    }
}
