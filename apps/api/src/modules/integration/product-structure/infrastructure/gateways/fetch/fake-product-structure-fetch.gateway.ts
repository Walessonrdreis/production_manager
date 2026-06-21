// apps/api/src/modules/integration/product-structure/infrastructure/gateways/fetch/fake-product-structure-fetch.gateway.ts

import {
  ProductStructureFetchGateway,
  ProductStructureFetchResult,
} from "../../../application/ports/product-structure-fetch.gateway";

export class FakeProductStructureFetchGateway
  implements ProductStructureFetchGateway {
  async fetchByProductCode(productCode: string): Promise<ProductStructureFetchResult> {
    return {
      productCode,
      description: `Fake Product ${productCode}`,
      familyCode: "fkg",
      familyDescription: "Fake Group",
      productType: "04",
      unit: "KG",
      grossWeight: 1.5,
      netWeight: 1.2,
      omieProductId: "9116172021",
      omieProductIntegrationId: "int-001",
      hasStructure: true,
      items: [
        {
          componentCode: "FAKE-COMP-001",
          description: "Fake Component Alpha",
          familyCode: "insumos",
          familyDescription: "Insumos",
          quantity: "1.010000",
          unit: "KG",
          loss: "0",
          omieMeshId: "9209354337",
          productType: "P",
        },
        {
          componentCode: "FAKE-COMP-002",
          description: "Fake Component Beta",
          familyCode: "emba",
          familyDescription: "Embalagem",
          quantity: "2.000000",
          unit: "UN",
          loss: "0",
          omieMeshId: "9410001749",
          productType: "S",
        },
      ],
      rawPayload: {
        fake: true,
        reason: "Fake gateway ativo",
      },
    };
  }
}