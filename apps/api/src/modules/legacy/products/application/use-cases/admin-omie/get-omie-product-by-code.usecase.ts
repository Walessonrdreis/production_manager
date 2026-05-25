import { AppError } from "@/shared/errors/AppError";
import { OmieAdapter } from "@/shared/integrations/omie";

export function createGetOmieProductByCodeUseCase(deps: { prisma: any }) {
  return {
    async execute(input: { omieCode: string; includeRaw?: boolean }) {
      const omieCode = input.omieCode;

      const omieProduct =
        (await deps.prisma.omieProduct.findUnique({
          where: { omieCode },
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
        })) ??
        (await deps.prisma.omieProduct.findFirst({
          where: { omieId: omieCode },
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
        }));

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