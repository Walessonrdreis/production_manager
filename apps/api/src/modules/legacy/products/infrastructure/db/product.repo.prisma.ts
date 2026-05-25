// src/modules/products/infrastructure/db/product.repo.prisma.ts
export function createProductRepoPrisma(prisma: any) {
  return {
    // ✅ ADICIONADO: necessário para product-sector e plans (validação de existência)
    findById(id: string) {
      return prisma.product.findUnique({ where: { id } });
    },

    findByOmieProductId(omieProductId: string) {
      return prisma.product.findUnique({ where: { omieProductId } });
    },

    createManaged(omieProductId: string) {
      return prisma.product.create({ data: { omieProductId } });
    },

    createManyManaged(omieProductIds: string[]) {
      return prisma.product.createMany({
        data: omieProductIds.map((omieProductId) => ({ omieProductId })),
        skipDuplicates: true,
      });
    },

    listManaged() {
      return prisma.product.findMany({
        include: {
          omieProduct: true,
          productSector: { include: { sector: true } },
        },
        orderBy: { omieProduct: { description: "asc" } },
      });
    },

    findManagedById(id: string) {
      return prisma.product.findUnique({
        where: { id },
        include: {
          omieProduct: true,
          productSector: { include: { sector: true } },
        },
      });
    },

    existsById(id: string) {
      return prisma.product.findUnique({ where: { id }, select: { id: true } });
    },

    updateManaged(id: string, data: { nickname?: string; active?: boolean }) {
      return prisma.product.update({
        where: { id },
        data,
        select: { id: true, nickname: true, active: true, omieProductId: true },
      });
    },

    deleteById(id: string) {
      return prisma.product.delete({ where: { id } });
    },

    findForOmieResolution(id: string) {
      return prisma.product.findUnique({
        where: { id },
        select: { id: true, omieProductId: true },
      });
    },
  };
}