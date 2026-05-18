import { PrismaClient } from "@prisma/client";
import { OrderRepository } from "@/modules/production-control/application/ports/order.repository.port";
import { Order } from "@/modules/production-control/application/entities/order.entity";
import { OrderDTO } from "@/modules/production-control/application/dtos/order.dto";

export class OrderRepositoryPrisma implements OrderRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createOrder(order: Order): Promise<Order> {
    const created = await this.prisma.productionControlOrder.create({
      data: {
        productId: order.productId,
        orderNumber: order.orderNumber,
        clientName: order.clientName,
        quantity: order.quantity,
        checked: order.checked,
      },
    });

    return OrderDTO.fromPrisma(created);
  }

  async createOrders(orders: Order[]): Promise<Order[]> {
    const created = await this.prisma.productionControlOrder.createManyAndReturn({
      data: orders.map(order => ({
        productId: order.productId,
        orderNumber: order.orderNumber,
        clientName: order.clientName,
        quantity: order.quantity,
        checked: order.checked,
      })),
    });

    return created.map(OrderDTO.fromPrisma);
  }

  async findOrderById(id: string): Promise<Order | null> {
    const order = await this.prisma.productionControlOrder.findUnique({
      where: { id },
    });

    if (!order) {
      return null;
    }

    return OrderDTO.fromPrisma(order);
  }

  async findOrdersByProductId(productId: string): Promise<Order[]> {
    const orders = await this.prisma.productionControlOrder.findMany({
      where: { productId },
      orderBy: {
        orderNumber: "asc",
      },
    });

    return orders.map(OrderDTO.fromPrisma);
  }

  async findOrderByProductAndOrderNumber(
    productId: string,
    orderNumber: string
  ): Promise<Order | null> {
    const order = await this.prisma.productionControlOrder.findFirst({
      where: {
        productId,
        orderNumber,
      },
    });

    if (!order) {
      return null;
    }

    return OrderDTO.fromPrisma(order);
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    try {
      const updated = await this.prisma.productionControlOrder.update({
        where: { id },
        data: {
          ...(updates.checked !== undefined && { checked: updates.checked }),
          ...(updates.orderNumber !== undefined && { orderNumber: updates.orderNumber }),
          ...(updates.clientName !== undefined && { clientName: updates.clientName }),
          ...(updates.quantity !== undefined && { quantity: updates.quantity }),
          updatedAt: new Date(),
        },
      });

      return OrderDTO.fromPrisma(updated);
    } catch (error) {
      return null;
    }
  }

  async toggleOrderCheck(id: string): Promise<Order | null> {
    const order = await this.findOrderById(id);
    if (!order) {
      return null;
    }

    return this.updateOrder(id, { checked: !order.checked });
  }

  async markOrderAsChecked(id: string): Promise<Order | null> {
    return this.updateOrder(id, { checked: true });
  }

  async markOrderAsUnchecked(id: string): Promise<Order | null> {
    return this.updateOrder(id, { checked: false });
  }

  async deleteOrder(id: string): Promise<boolean> {
    try {
      await this.prisma.productionControlOrder.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteOrdersByProductId(productId: string): Promise<number> {
    const result = await this.prisma.productionControlOrder.deleteMany({
      where: { productId },
    });

    return result.count;
  }

  async countOrdersByProductId(productId: string): Promise<number> {
    return await this.prisma.productionControlOrder.count({
      where: { productId },
    });
  }

  async countCheckedOrdersByProductId(productId: string): Promise<number> {
    return await this.prisma.productionControlOrder.count({
      where: {
        productId,
        checked: true,
      },
    });
  }

  async getTotalQuantityByProductId(productId: string): Promise<number> {
    const result = await this.prisma.productionControlOrder.aggregate({
      where: { productId },
      _sum: {
        quantity: true,
      },
    });

    return result._sum.quantity?.toNumber() || 0;
  }

  async getCheckedQuantityByProductId(productId: string): Promise<number> {
    const result = await this.prisma.productionControlOrder.aggregate({
      where: {
        productId,
        checked: true,
      },
      _sum: {
        quantity: true,
      },
    });

    return result._sum.quantity?.toNumber() || 0;
  }

  async listOrdersByCheckedStatus(
    checked: boolean,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<Order[]> {
    const { limit = 100, offset = 0 } = options || {};

    const orders = await this.prisma.productionControlOrder.findMany({
      where: { checked },
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: "desc",
      },
    });

    return orders.map(OrderDTO.fromPrisma);
  }

  async searchOrders(
    query: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<Order[]> {
    const { limit = 50, offset = 0 } = options || {};

    const orders = await this.prisma.productionControlOrder.findMany({
      where: {
        OR: [
          {
            orderNumber: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            clientName: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      take: limit,
      skip: offset,
      orderBy: {
        orderNumber: "asc",
      },
    });

    return orders.map(OrderDTO.fromPrisma);
  }

  async batchUpdateOrders(
    orderIds: string[],
    updates: Partial<Order>
  ): Promise<number> {
    const result = await this.prisma.productionControlOrder.updateMany({
      where: {
        id: {
          in: orderIds,
        },
      },
      data: {
        ...(updates.checked !== undefined && { checked: updates.checked }),
        updatedAt: new Date(),
      },
    });

    return result.count;
  }
}