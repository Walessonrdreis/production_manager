import { prisma } from '../db';
import { Prisma } from '@prisma/client';

export class PlanRepository {
  async findById(id: string) {
    return prisma.productionPlan.findUnique({
      where: { id },
    });
  }

  async findByIdWithDetails(id: string) {
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
  }

  async findAll() {
    return prisma.productionPlan.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.ProductionPlanCreateInput) {
    return prisma.productionPlan.create({
      data,
    });
  }

  // --- Itens do Plano ---

  async createItem(data: Prisma.ProductionPlanItemUncheckedCreateInput) {
    return prisma.productionPlanItem.create({
      data,
    });
  }
}
