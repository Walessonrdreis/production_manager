import { Order } from '../entities/order.entity';

export class OrderDTO {
  static toDomain(data: any): Order {
    return {
      id: data.id,
      productId: data.productId,
      orderNumber: data.orderNumber,
      clientName: data.clientName,
      quantity: Number(data.quantity),
      checked: data.checked,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  }

  static fromDomain(order: Order): {
    id: string;
    productId: string;
    orderNumber?: string;
    clientName?: string;
    quantity: number;
    checked: boolean;
    createdAt: string;
    updatedAt: string;
  } {
    return {
      id: order.id,
      productId: order.productId,
      orderNumber: order.orderNumber,
      clientName: order.clientName,
      quantity: order.quantity,
      checked: order.checked,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}