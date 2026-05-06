import { PrismaClient } from "@prisma/client";

export class OrdersViewRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listStage20(params: { page: number; pageSize: number }) {
    const { page, pageSize } = params;

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.omieOrder.findMany({
        where: { etapa: "20" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { dataPrevisao: "desc" },
        include: { items: true },
      }),
      this.prisma.omieOrder.count({
        where: { etapa: "20" },
      }),
    ]);

    return { orders, total };
  }

  async findClientsByCodes(codes: string[]) {
    if (codes.length === 0) return [];

    return this.prisma.client.findMany({
      where: {
        omieClientCode: {
          in: codes.map((c) => BigInt(c)),
        },
      },
      select: {
        omieClientCode: true,
        legalName: true,
        tradeName: true,
        document: true,
      },
    });
  }
}
