import { SnapshotRepository } from '../ports/snapshot.repository.port';
import { ProductRepository } from '../ports/product.repository.port';
import { OrderRepository } from '../ports/order.repository.port';
import { ReconciliationService as ReconciliationServicePort } from '../ports/reconciliation.service.port';
import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';
import { ProductionControlStatus } from '../entities/production-control-status.enum';

export class ReconciliationService implements ReconciliationServicePort {
  constructor(
    private readonly snapshotRepository: SnapshotRepository,
    private readonly productRepository: ProductRepository,
    private readonly orderRepository: OrderRepository
  ) {}

  async reconcileProducts(
    currentProducts: Product[],
    previousProducts: Product[]
  ): Promise<{
    newProducts: Product[];
    updatedProducts: Product[];
    completedProducts: Product[];
  }> {
    const newProducts: Product[] = [];
    const updatedProducts: Product[] = [];
    const completedProducts: Product[] = [];

    // Create a map of previous products by description + snapshotId
    const previousProductMap = new Map<string, Product>();
    for (const product of previousProducts) {
      const key = `${product.description}-${product.snapshotId}`;
      previousProductMap.set(key, product);
    }

    // Process current products
    for (const currentProduct of currentProducts) {
      const key = `${currentProduct.description}-${currentProduct.snapshotId}`;
      const previousProduct = previousProductMap.get(key);

      if (!previousProduct) {
        // New product
        newProducts.push(currentProduct);
      } else {
        // Check if product has changed
        if (
          currentProduct.totalQuantity !== previousProduct.totalQuantity ||
          currentProduct.pendingQuantity !== previousProduct.pendingQuantity ||
          currentProduct.status !== previousProduct.status
        ) {
          updatedProducts.push(currentProduct);
        }
      }
    }

    // Find completed products (in previous but not in current)
    for (const previousProduct of previousProducts) {
      const key = `${previousProduct.description}-${previousProduct.snapshotId}`;
      const existsInCurrent = currentProducts.some(
        p => `${p.description}-${p.snapshotId}` === key
      );

      if (!existsInCurrent) {
        // Product completed (disappeared from endpoint)
        const completedProduct: Product = {
          ...previousProduct,
          status: 'COMPLETED' as ProductionControlStatus,
          updatedAt: new Date(),
        };
        completedProducts.push(completedProduct);
      }
    }

    return { newProducts, updatedProducts, completedProducts };
  }

  calculatePendingQuantity(product: Product, orders: Order[]): number {
    const checkedOrdersQuantity = orders
      .filter(order => order.checked)
      .reduce((sum, order) => sum + order.quantity, 0);

    return Math.max(0, product.totalQuantity - checkedOrdersQuantity);
  }

  updateProductStatusBasedOnQuantity(product: Product): Product {
    let newStatus = product.status;

    if (product.pendingQuantity === 0) {
      newStatus = 'COMPLETED';
    } else if (product.pendingQuantity < product.totalQuantity) {
      newStatus = 'IN_PROGRESS';
    } else {
      newStatus = 'PENDING';
    }

    return {
      ...product,
      status: newStatus as ProductionControlStatus,
      updatedAt: new Date(),
    };
  }
}