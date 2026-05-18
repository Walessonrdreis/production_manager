import { SnapshotRepository } from '../ports/snapshot.repository.port';
import { ReconciliationService } from '../services/reconciliation.service';
import { HistoryService } from '../services/history.service';
import { Order, toggleOrderCheck } from '../entities/order.entity';
import { Product } from '../entities/product.entity';

export interface ToggleCheckParams {
  orderId: string;
  checkAll?: boolean;
}

export class ToggleCheckUseCase {
  constructor(
    private readonly repository: SnapshotRepository,
    private readonly reconciliationService: ReconciliationService,
    private readonly historyService: HistoryService
  ) {}

  async execute(params: ToggleCheckParams): Promise<{
    order: Order;
    product: Product;
    updatedPendingQuantity: number;
  }> {
    const { orderId, checkAll = false } = params;

    // 1. Get the order
    const order = await this.repository.findOrderById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // 2. Get the product
    const product = await this.repository.findProductById(order.productId);
    if (!product) {
      throw new Error(`Product not found for order: ${orderId}`);
    }

    // 3. Toggle order check or check all orders
    let updatedOrder: Order;
    if (checkAll) {
      // Check all orders for this product
      const allOrders = await this.repository.findOrdersByProductId(product.id);
      const allChecked = allOrders.every(o => o.checked);
      
      // Toggle all orders
      for (const o of allOrders) {
        const toggledOrder = {
          ...o,
          checked: !allChecked,
          updatedAt: new Date(),
        };
        await this.repository.updateOrder(toggledOrder);
        
        // Record history for each order
        await this.historyService.recordOrderCheck(
          o.id,
          !allChecked,
          product.id
        );
      }
      
      updatedOrder = {
        ...order,
        checked: !allChecked,
        updatedAt: new Date(),
      };
    } else {
      // Toggle single order
      updatedOrder = toggleOrderCheck(order);
      await this.repository.updateOrder(updatedOrder);
      
      // Record history
      await this.historyService.recordOrderCheck(
        orderId,
        updatedOrder.checked,
        product.id
      );
    }

    // 4. Get all orders for the product to recalculate pending quantity
    const allOrders = await this.repository.findOrdersByProductId(product.id);
    const pendingQuantity = this.reconciliationService.calculatePendingQuantity(
      product,
      allOrders
    );

    // 5. Update product pending quantity
    const updatedProduct = {
      ...product,
      pendingQuantity,
      updatedAt: new Date(),
    };

    // 6. Update product status based on pending quantity
    const finalProduct = this.reconciliationService.updateProductStatusBasedOnQuantity(
      updatedProduct
    );

    await this.repository.updateProduct(finalProduct);

    return {
      order: updatedOrder,
      product: finalProduct,
      updatedPendingQuantity: pendingQuantity,
    };
  }
}