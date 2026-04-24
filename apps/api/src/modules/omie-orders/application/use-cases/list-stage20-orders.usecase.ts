export function createListStage20OrdersUseCase(deps: { prisma: any }) {
  return {
    /**
     * Replica a lógica legacy:
     * - page, pageSize (1..200)
     * - filtro opcional q (busca por descrição nos itens)
     * - apenas etapa 20, não cancelado, não encerrado
     * - orderBy lastSyncAt desc
     * - retorna { data, meta }
     */
    async execute(input: { page: number; pageSize: number; q?: string }) {
      const page = Math.max(Number(input?.page ?? 1), 1);
      const pageSize = Math.min(Math.max(Number(input?.pageSize ?? 50), 1), 200);
      const q = input?.q?.trim();

      const where: any = {
        etapa: "20",
        cancelado: "N",
        encerrado: "N",
        ...(q
          ? {
              items: {
                some: {
                  description: {
                    contains: q,
                    mode: "insensitive" as const,
                  },
                },
              },
            }
          : {}),
      };

      const [total, data] = await Promise.all([
        deps.prisma.omieOrder.count({ where }),
        deps.prisma.omieOrder.findMany({
          where,
          include: {
            items: {
              select: {
                description: true,
                quantity: true,
              },
            },
          },
          orderBy: { lastSyncAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      // legado retornava paginated(data, { page, pageSize, total }, { self: ... })
      return { data, meta: { page, pageSize, total } };
    },
  };
}