// src/modules/omie-orders/infrastructure/db/omie-production-orders.repo.prisma.ts
import type { Prisma } from "@prisma/client";

export function createOmieProductionOrdersRepoPrisma(prisma: any) {
  return {
    async upsertOrderWithItems(order: any, items: any[]) {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const savedOrder = await tx.omieProductionOrder.upsert({
          where: { omieCode: order.omieCode },
          create: order as any,
          update: order as any,
          select: { id: true },
        });

        for (const it of items) {
          await tx.omieProductionOrderItem.upsert({
            where: { omieItemCode: it.omieItemCode },
            create: { ...it, omieProductionOrderId: savedOrder.id } as any,
            update: { ...it, omieProductionOrderId: savedOrder.id } as any,
          });
        }
      });
    },

    async reconcileMissingOrders(activeOmieCodes: string[]) {
      const normalizedCodes = Array.from(
        new Set((activeOmieCodes ?? []).map((c) => String(c ?? "").trim()).filter(Boolean))
      );

      const where =
        normalizedCodes.length > 0
          ? {
              omieCode: { notIn: normalizedCodes },
            }
          : {};

      const result = await prisma.omieProductionOrder.updateMany({
        where,
        data: {
          // Marca como inativo no espelho local quando não aparece mais no snapshot atual
          active: false,
          lastSyncAt: new Date(),
        },
      });

      return result.count ?? 0;
    },

    async listOrders(options?: {
      page?: number;
      pageSize?: number;
      filterCompleted?: boolean;
      filterCompletionDateStart?: string;
      filterCompletionDateEnd?: string;
    }) {
      const page = options?.page ?? 1;
      const pageSize = options?.pageSize ?? 50;
      const skip = (page - 1) * pageSize;

      const where: any = {};

      if (options?.filterCompleted !== undefined) {
        where.completed = options.filterCompleted;
      }

      if (options?.filterCompletionDateStart || options?.filterCompletionDateEnd) {
        where.completionDate = {};
        
        if (options.filterCompletionDateStart) {
          where.completionDate.gte = new Date(options.filterCompletionDateStart);
        }
        
        if (options.filterCompletionDateEnd) {
          where.completionDate.lte = new Date(options.filterCompletionDateEnd);
        }
      }

      const [orders, total] = await Promise.all([
        prisma.omieProductionOrder.findMany({
          where,
          include: {
            items: true,
          },
          orderBy: {
            forecastDate: 'desc',
          },
          skip,
          take: pageSize,
        }),
        prisma.omieProductionOrder.count({ where }),
      ]);

      return {
        data: orders,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    },

    async getOrderByCode(omieCode: string) {
      return prisma.omieProductionOrder.findUnique({
        where: { omieCode },
        include: {
          items: true,
        },
      });
    },

    async getOrdersByProductCode(productCode: string) {
      return prisma.omieProductionOrder.findMany({
        where: { productCode },
        include: {
          items: true,
        },
        orderBy: {
          forecastDate: 'desc',
        },
      });
    },

    async getOrdersByProductIntegrationCode(integrationCode: string) {
      return prisma.omieProductionOrder.findMany({
        where: { productIntegrationCode: integrationCode },
        include: {
          items: true,
        },
        orderBy: {
          forecastDate: 'desc',
        },
      });
    },

    async getActiveOrdersCount() {
      return prisma.omieProductionOrder.count({
        where: { completed: false, active: true },
      });
    },

    async getCompletedOrdersCount(startDate?: string, endDate?: string) {
      const where: any = { completed: true, active: true };
      
      if (startDate || endDate) {
        where.completionDate = {};
        
        if (startDate) {
          where.completionDate.gte = new Date(startDate);
        }
        
        if (endDate) {
          where.completionDate.lte = new Date(endDate);
        }
      }

      return prisma.omieProductionOrder.count({ where });
    },
  };
}