export function createProductSectorRepoPrisma(prisma: any) {
  return {
    findByProductId(productId: string) {
      return prisma.productSector.findUnique({
        where: { productId },
        include: { sector: true },
      });
    },

    upsert(productId: string, sectorId: string, notes?: string) {
      return prisma.productSector.upsert({
        where: { productId },
        create: { productId, sectorId, notes },
        update: { sectorId, notes },
      });
    },
  };
}