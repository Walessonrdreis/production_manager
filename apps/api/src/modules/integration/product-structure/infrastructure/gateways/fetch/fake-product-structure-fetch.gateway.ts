// apps/api/src/modules/integration/product-structure/infrastructure/gateways/fetch/fake-product-structure-fetch.gateway.ts

import {
  ProductStructureFetchGateway,
  ProductStructureFetchResult,
} from "../../../application/ports/product-structure-fetch.gateway";

export class FakeProductStructureFetchGateway
  implements ProductStructureFetchGateway
{
  async fetchByProductCode(productCode: string): Promise<ProductStructureFetchResult> {
    return {
      productCode,
      hasStructure: false,
      items: [],
      rawPayload: {
        fake: true,
        reason: "Fake gateway ativo",
      },
    };
  }
}