import { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import {
  ProductStructureFetchGateway,
  ProductStructureFetchResult,
} from "../../../application/ports/product-structure-fetch.gateway";

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

export class RealProductStructureFetchGateway
  implements ProductStructureFetchGateway {
  constructor(private readonly omieClient: OmieHttpClientPort) { }

  async fetchByProductCode(productCode: string): Promise<ProductStructureFetchResult> {
    const response = await this.omieClient.post<any>("produto/estrutura/", {
      call: "ConsultarEstrutura",
      param: [{ codProduto: productCode }],
    });

    const itens = Array.isArray(response?.itens) ? response.itens : [];

    return {
      productCode,
      description: getString(response?.descrProduto),
      familyCode: getString(response?.codFamilia),
      familyDescription: getString(response?.descrFamilia),
      productType: getString(response?.tipoProduto),
      unit: getString(response?.unidProduto),
      grossWeight: getNumber(response?.pesoBruto ?? response?.pesoBrutoProduto),
      netWeight: getNumber(response?.pesoLiquido ?? response?.pesoLiqProduto),
      omieProductId: getString(response?.idProdutoOmie ?? response?.idProduto),
      omieProductIntegrationId: getString(response?.intProdutoOmie),
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