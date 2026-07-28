import { prisma } from "@/shared/db/prisma";
import { mapOmieProductToSummary } from "../mappers/map-omie-product-to-summary";

export class GetProductCatalogSummaryUseCase {
  async execute() {
    const rows = await prisma.omieProduct.findMany({
      where: {
        active: true,
      },
      orderBy: {
        description: "asc",
      },
      select: {
        omieCode: true,
        description: true,
        sku: true,
        familyDescription: true,
        active: true,
        lastSyncAt: true,
        rawPayload: true,
      },
    });

    return rows.map(mapOmieProductToSummary);
  }
}