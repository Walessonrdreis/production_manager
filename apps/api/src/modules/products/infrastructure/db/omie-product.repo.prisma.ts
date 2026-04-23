// src/modules/products/infrastructure/db/omie-product.repo.prisma.ts
import { OmieAdapter } from "@/shared/integrations/omie";

export function createOmieProductRepoPrisma(prisma: any) {
  return {
    findById(id: string) {
      return prisma.omieProduct.findUnique({ where: { id } });
    },

    findManyIds(ids: string[]) {
      return prisma.omieProduct.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });
    },

    findForCodeResolution(id: string) {
      return prisma.omieProduct.findUnique({
        where: { id },
        select: { omieCode: true, omieId: true, rawPayload: true },
      });
    },

    // ✅ ADICIONADO: usado pelo sync-omie-products.usecase.ts
    async upsertFromOmieItem(item: any) {
      const dto = OmieAdapter.toProductDTO(item);

      const omieCode = String(
        item?.codigo ?? item?.cod_int ?? item?.codigo_item ?? dto?.omieId ?? ""
      ).trim();

      if (!omieCode) {
        // o use case captura e conta como failed
        throw new Error("OMIE_CODE_NOT_FOUND");
      }

      const rawOmieIdValue = item?.id ?? item?.codigo_produto;
      const omieId =
        rawOmieIdValue !== undefined && rawOmieIdValue !== null
          ? String(rawOmieIdValue).trim()
          : null;

      const now = new Date();
      const familyDescription = OmieAdapter.extractFamilyDescription(dto.rawPayload);

      return prisma.omieProduct.upsert({
        where: { omieCode },
        create: {
          omieCode,
          omieId,
          sku: dto.sku,
          description: dto.description,
          familyDescription,
          active: dto.active,
          rawPayload: dto.rawPayload,
          lastSyncAt: now,
        },
        update: {
          omieId,
          sku: dto.sku,
          description: dto.description,
          familyDescription,
          active: dto.active,
          rawPayload: dto.rawPayload,
          lastSyncAt: now,
        },
      } as any);
    },
  };
}