import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import type {
  ProductCatalogExternalProduct,
  ProductCatalogFetchGateway,
} from "../../../application/ports/product-catalog-fetch.gateway";
import {
  isOmieErrorResponse,
  isOmieHttpErrorWithSample,
  mapHttpErrorToOmieError,
} from "@/shared/integration/strategies/omie-error.mapper";

export class RealProductCatalogFetchGateway implements ProductCatalogFetchGateway {
  constructor(private readonly omieClient: OmieHttpClientPort) { }

  async fetchByProductCode(productCode: string): Promise<ProductCatalogExternalProduct | null> {
    let response: any;

    try {
      response = await this.omieClient.post<any>("geral/produtos/", {
        call: "ConsultarProduto",
        param: [{ codigo: productCode }],
      });
    } catch (httpError) {
      if (isOmieHttpErrorWithSample(httpError)) {
        throw mapHttpErrorToOmieError(httpError);
      }
      throw httpError;
    }

    if (isOmieErrorResponse(response)) {
      throw new Error(
        response?.faultstring || response?.error || "Omie product consult API error",
      );
    }

    if (!response) {
      return null;
    }

    return {
      productCode: String(response.codigo ?? productCode),
      omieId: response.idProduto != null ? String(response.idProduto) : null,
      sku: response.codigo_produto_integracao != null ? String(response.codigo_produto_integracao) : null,
      description: String(response.descricao ?? ""),
      familyDescription: response.descricao_familia != null ? String(response.descricao_familia) : null,
      active: String(response.inativo ?? "N") !== "S",
      rawPayload: response,
    };
  }
}
``