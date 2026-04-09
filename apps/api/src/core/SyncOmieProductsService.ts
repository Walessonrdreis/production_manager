import { prisma } from '../db';
import { omieClient } from '../integrations/omie/OmieClient';
import { OmieAdapter } from '../integrations/omie/OmieAdapter';

const OMIE_PRODUCTS_PATH = "<<PREENCHER_DEPOIS>>";
const OMIE_PRODUCTS_PAYLOAD = {
  // <<PREENCHER_DEPOIS>>
  call: "",
  param: [{
    pagina: 1,
    registros_por_pagina: 100,
    apenas_importado_api: "N",
    filtrar_apenas_omiepdv: "N"
  }]
};

export class SyncOmieProductsService {
  async execute(): Promise<{ upserted: number }> {
    // 1. Chama a Omie via client
    const data = await omieClient.post<any>(OMIE_PRODUCTS_PATH, OMIE_PRODUCTS_PAYLOAD);
    
    // 2. Extrai items do payload
    const items = data.produtos ?? data.lista ?? [];
    
    let upsertedCount = 0;

    // 3. Upsert para cada item
    for (const item of items) {
      const dto = OmieAdapter.toProductDTO(item);
      
      await prisma.omieProduct.upsert({
        where: { omieId: dto.omieId },
        create: {
          omieId: dto.omieId,
          sku: dto.sku,
          description: dto.description,
          active: dto.active,
          rawPayload: dto.rawPayload,
          lastSyncAt: new Date(),
        },
        update: {
          sku: dto.sku,
          description: dto.description,
          active: dto.active,
          rawPayload: dto.rawPayload,
          lastSyncAt: new Date(),
        },
      });

      upsertedCount++;
    }

    // 4. Retorna contagem
    return { upserted: upsertedCount };
  }
}
