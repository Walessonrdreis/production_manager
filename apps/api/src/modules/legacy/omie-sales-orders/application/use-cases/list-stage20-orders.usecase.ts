import { prisma } from "@/infra/db";

type Input = {
  page: number;
  pageSize: number;
  q?: string;
};

export function createListStage20OrdersUseCase() {
  return {
    async execute(input: Input) {
      const page = input.page;
      const pageSize = input.pageSize;
      const skip = (page - 1) * pageSize;

      const where: any = {
        etapa: "20",
        cancelado: "N",
        encerrado: "N",
      };

      if (input.q && input.q.trim().length > 0) {
        const q = input.q.trim();

        where.OR = [
          { numeroPedido: { contains: q, mode: "insensitive" } },
          { omieCode: { contains: q, mode: "insensitive" } },

          // ✅ Busca direta pelo nome do cliente (denormalizado)
          { clientLegalName: { contains: q, mode: "insensitive" } },
          { clientTradeName: { contains: q, mode: "insensitive" } },
        ];
      }

      const [total, orders] = await Promise.all([
        prisma.omieOrder.count({ where }),
        prisma.omieOrder.findMany({
          where,
          orderBy: { lastSyncAt: "desc" },
          skip,
          take: pageSize,
          include: {
            items: {
              select: {
                description: true,
                quantity: true,
              },
            },
          },
        }),
      ]);

      const data = orders.map((order) => ({
        id: order.id,
        omieCode: order.omieCode,
        numeroPedido: order.numeroPedido,
        codigoCliente: order.codigoCliente,

        etapa: order.etapa,
        cancelado: order.cancelado,
        encerrado: order.encerrado,

        dataPrevisao: order.dataPrevisao,
        lastSyncAt: order.lastSyncAt,

        // ✅ CAMPOS DENORMALIZADOS
        clientLegalName: (order as any).clientLegalName ?? null,
        clientTradeName: (order as any).clientTradeName ?? null,

        // ✅ CAMPO PRONTO PARA UX
        clientName:
          (order as any).clientTradeName ??
          (order as any).clientLegalName ??
          null,

        items: order.items.map((item) => ({
          description: item.description,
          quantity: String(item.quantity),
        })),

        // ⚠️ opcional: mantenha apenas se ainda precisar
        rawPayload: order.rawPayload,
      }));

      return {
        data,
        meta: {
          page,
          pageSize,
          total,
        },
      };
  return { data, meta: { page, pageSize, total } };
    },
  };
}