export function createListOrdersUseCase(deps: { prisma: any }) {
  return {
    /**
     * Replica a lógica legacy:
     * - paginação simples (page, pageSize)
     * - retorna orders com campos resumidos + items mínimos
     * - ordena por lastSyncAt desc
     */
    async execute(input: { page: number; pageSize: number }) {
      const page = Math.max(Number(input?.page ?? 1), 1);
      const pageSize = Math.min(Math.max(Number(input?.pageSize ?? 50), 1), 200);

      const where = {
        etapa: "20",
        cancelado: "N",
        encerrado: "N",
      };

      const [total, orders] = await Promise.all([
        deps.prisma.omieOrder.count({ where }),
        deps.prisma.omieOrder.findMany({
          where,
          select: {
            omieCode: true,
            numeroPedido: true,
            etapa: true,
            cancelado: true,
            encerrado: true,
            dataPrevisao: true,
            lastSyncAt: true,
            items: {
              select: {
                omieItemCode: true,
                description: true,
                quantity: true,
                unit: true,
              },
              orderBy: { description: "asc" },
            },
          },
          orderBy: { lastSyncAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      // legacy retornava dentro do sendOk: { page, pageSize, total, orders }
      return { page, pageSize, total, orders };
    },
  };
}
