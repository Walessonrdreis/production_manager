export function createSearchOmieProductsUseCase(deps: { prisma: any }) {
  return {
    async execute(input: { q: string; page: number; pageSize: number }) {
      const q = input.q.trim();
      const page = Math.max(Number(input.page ?? 1), 1);
      const pageSize = Math.min(Math.max(Number(input.pageSize ?? 20), 1), 100);

      const where: any = {
        OR: [
          { description: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { familyDescription: { contains: q, mode: "insensitive" } },
        ],
      };

      const [total, items] = await Promise.all([
        deps.prisma.omieProduct.count({ where }),
        deps.prisma.omieProduct.findMany({
          where,
          orderBy: { description: "asc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            description: true,
            sku: true,
            familyDescription: true,
            active: true,
            omieCode: true,
          },
        }),
      ]);

      return {
        page,
        pageSize,
        total,
        items: items.map((it: any) => ({
          id: it.id,
          description: it.description,
          sku: it.sku,
          familyDescription: it.familyDescription,
          active: it.active,
          ...(it.omieCode ? { omieCode: it.omieCode } : {}),
        })),
      };
    },
  };
}