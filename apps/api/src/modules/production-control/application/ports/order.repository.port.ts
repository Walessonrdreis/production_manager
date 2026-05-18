import { Order } from '../entities/order.entity';

export interface OrderRepository {
  createOrder(order: Order): Promise<Order>;
  createOrders(orders: Order[]): Promise<Order[]>;
  findOrderById(id: string): Promise<Order | null>;
  findOrderByProductAndOrderNumber(
    productId: string,
    orderNumber: string
  ): Promise<Order | null>;
  listOrdersByProduct(productId: string): Promise<Order[]>;
  updateOrder(order: Order): Promise<Order>;
  toggleOrderCheck(id: string): Promise<Order>;
  deleteOrder(id: string): Promise<void>;
  countCheckedOrdersByProduct(productId: string): Promise<number>;
  countTotalOrdersByProduct(productId: string): Promise<number>;
}