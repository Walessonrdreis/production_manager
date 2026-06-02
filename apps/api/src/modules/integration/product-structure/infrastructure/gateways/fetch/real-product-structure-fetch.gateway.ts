// apps/api/src/modules/integration/product-structure/infrastructure/gateways/fetch/real-product-structure-fetch.gateway.ts

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
      param: [{ codigo_produto: productCode }],
    });

    const items = (response?.itens ?? []).map((item: any) => ({
      componentCode: item.codigo_produto_componente,
      quantity: item.quantidade,
      unit: item.unidade,
    }));

    return {
      productCode,
      hasStructure: items.length > 0,
      items,
      rawPayload: response,
    };
  }
}
