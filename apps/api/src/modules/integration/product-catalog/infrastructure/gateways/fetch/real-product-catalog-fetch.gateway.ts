import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import type {
  ProductCatalogExternalProduct,
  ProductCatalogFetchGateway,
} from "../../../application/ports/product-catalog-fetch.gateway";

export class RealProductCatalogFetchGateway implements ProductCatalogFetchGateway {
  constructor(private readonly omieClient: OmieHttpClientPort) {}

  async fetchByProductCode(productCode: string): Promise<ProductCatalogExternalProduct | null> {
    const response = await this.omieClient.post<any>("geral/produtos/", {
      call: "ConsultarProduto",
      param: [{ codigo: productCode }],
    });

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