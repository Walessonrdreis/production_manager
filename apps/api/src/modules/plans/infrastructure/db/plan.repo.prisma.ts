export function createPlanRepoPrisma(prisma: any) {
  return {
    findById(id: string) {
      return prisma.productionPlan.findUnique({
        where: { id },
      });
    },

    findByIdWithItems(id: string) {
      return prisma.productionPlan.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: { include: { omieProduct: true } },
              sector: true,
            },
          },
        },
      });
    },

    list() {
      return prisma.productionPlan.findMany({
        orderBy: { createdAt: "desc" },
      });
    },

    create(data: { name: string; startDate: Date; endDate: Date }) {
      return prisma.productionPlan.create({
        data,
      });
    },

    createItem(data: {
      planId: string;
      productId: string;
      sectorId: string;
      quantity: number;
      notes?: string;
    }) {
      return prisma.productionPlanItem.create({
        data,
      });
    },
  };
}