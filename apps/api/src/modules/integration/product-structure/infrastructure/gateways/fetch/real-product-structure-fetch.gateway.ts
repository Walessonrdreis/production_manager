import { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import {
  ProductStructureFetchGateway,
  ProductStructureFetchResult,
} from "../../../application/ports/product-structure-fetch.gateway";

export class RealProductStructureFetchGateway
  implements ProductStructureFetchGateway
{
  constructor(private readonly omieClient: OmieHttpClientPort) {}

  async fetchByProductCode(productCode: string): Promise<ProductStructureFetchResult> {
    const response = await this.omieClient.post<any>("produto/estrutura/", {
      call: "ConsultarEstrutura",
      param: [{ codProduto: productCode }],
    });

    const itens = response?.itens ?? [];

    return {
      productCode,
      hasStructure: itens.length > 0,
      items: itens.map((item: any) => ({
        componentCode: item.codProdMalha,
        quantity: item.quantProdMalha,
        unit: item.unidProdMalha,
        loss: item.percPerdaProdMalha,
      })),
      rawPayload: response,
    };
  }
}