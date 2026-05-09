import { OmieAdapter } from "@/shared/integrations/omie";

export function createOmieProductRepoPrisma(prisma: any) {
  return {
    async upsertFromOmieItem(item: any) {
      const dto = OmieAdapter.toProductDTO(item);

      // mantém a mesma extração “forte” do código que você tinha
      const omieCode = String(item?.codigo ?? item?.cod_int ?? item?.codigo_item ?? dto?.omieId ?? "").trim();
      if (!omieCode) {
        throw new Error("OMIE_CODE_NOT_FOUND");
      }

      const rawOmieIdValue = item?.id ?? item?.codigo_produto;
      const omieId =
        rawOmieIdValue !== undefined && rawOmieIdValue !== null
          ? String(rawOmieIdValue).trim()
          : null;

      const now = new Date();
      const familyDescription = OmieAdapter.extractFamilyDescription(dto.rawPayload);

      await prisma.omieProduct.upsert({
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

      return { omieCode, omieId, dto };
    },
  };
}