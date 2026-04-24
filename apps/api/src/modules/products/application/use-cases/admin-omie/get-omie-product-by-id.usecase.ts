import { AppError } from "@/shared/errors/AppError";
import { OmieAdapter } from "@/shared/integrations/omie";

export function createGetOmieProductByIdUseCase(deps: { prisma: any }) {
  return {
    async execute(input: { id: string; includeRaw?: boolean }) {
      const omieProduct = await deps.prisma.omieProduct.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          omieId: true,
          omieCode: true,
          description: true,
          sku: true,
          familyDescription: true,
          active: true,
          rawPayload: true,
        },
      });

      if (!omieProduct) {
        throw new AppError("OMIE_PRODUCT_NOT_FOUND", 404, "Omie product not found");
      }

      const data: Record<string, unknown> = {
        id: omieProduct.id,
        description: omieProduct.description,
        sku: omieProduct.sku,
        familyDescription:
          omieProduct.familyDescription ??
          OmieAdapter.extractFamilyDescription(omieProduct.rawPayload),
        active: omieProduct.active,
        omieCode: omieProduct.omieCode,
      };

      if (input.includeRaw) data.rawPayload = omieProduct.rawPayload;

      return { data };
    },
  };
}