import { SnapshotRepository } from '../ports/snapshot.repository.port';
import { ProductRepository } from '../ports/product.repository.port';
import { OrderRepository } from '../ports/order.repository.port';
import { Stage20Fetcher } from '../ports/stage20-fetcher.port';
import { SnapshotService } from '../services/snapshot.service';
import { ReconciliationService } from '../services/reconciliation.service';
import { HistoryService } from '../services/history.service';
import { createSnapshot } from '../entities/snapshot.entity';
import { createProduct } from '../entities/product.entity';
import { createOrder } from '../entities/order.entity';

export class CreateSnapshotUseCase {
  constructor(
    private readonly snapshotRepository: SnapshotRepository,
    private readonly productRepository: ProductRepository,
    private readonly orderRepository: OrderRepository,
    private readonly stage20Fetcher: Stage20Fetcher,
    private readonly snapshotService: SnapshotService,
    private readonly reconciliationService: ReconciliationService,
    private readonly historyService: HistoryService
  ) {}

  async execute(): Promise<{
    snapshotId: string;
    newProducts: number;
    updatedProducts: number;
    completedProducts: number;
  }> {
    // 1. Fetch current data from stage20 endpoint
    const currentStage20Products = await this.stage20Fetcher.fetchStage20Products();

    // 2. Get previous snapshot (if exists)
    const previousSnapshot = await this.getLatestSnapshot();
    const previousProducts = previousSnapshot
      ? await this.productRepository.listProductsBySnapshot(previousSnapshot.id)
      : [];

    // 3. Generate unique snapshot ID
    const snapshotId = this.generateSnapshotId();
    const snapshot = createSnapshot({
      snapshotId,
      description: `Snapshot ${new Date().toISOString()}`,
    });

    // 4. Convert stage20 data to our entities
    const { products, orders } = this.convertStage20ToEntities(
      currentStage20Products,
      snapshot.id
    );

    // 5. Reconcile with previous snapshot
    const reconciliationResult = await this.reconciliationService.reconcileProducts(
      products,
      previousProducts
    );

    // 6. Create snapshot with products and orders
    await this.snapshotService.createSnapshotWithProducts(
      snapshot,
      reconciliationResult.newProducts,
      orders
    );

    // 7. Record history
    await this.historyService.recordSnapshotCreated(snapshot.id);

    // 8. Update completed products
    for (const completedProduct of reconciliationResult.completedProducts) {
      await this.productRepository.updateProduct(completedProduct);
      await this.historyService.recordAutoCompletion(completedProduct.id);
    }

    return {
      snapshotId,
      newProducts: reconciliationResult.newProducts.length,
      updatedProducts: reconciliationResult.updatedProducts.length,
      completedProducts: reconciliationResult.completedProducts.length,
    };
  }

  private async getLatestSnapshot() {
    return await this.snapshotRepository.findLatestSnapshot();
  }

  private generateSnapshotId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `snapshot-${timestamp}-${random}`;
  }

  private convertStage20ToEntities(
    stage20Products: any[],
    snapshotId: string
  ): { products: any[]; orders: any[] } {
    const products: any[] = [];
    const orders: any[] = [];

    for (const stage20Product of stage20Products) {
      const product = createProduct({
        snapshotId,
        description: stage20Product.description,
        totalQuantity: stage20Product.totalQuantity,
      });

      products.push(product);

      for (const stage20Order of stage20Product.orders) {
        const order = createOrder({
          productId: product.id,
          orderNumber: stage20Order.orderNumber,
          clientName: stage20Order.clientName,
          quantity: stage20Order.quantity,
        });

        orders.push(order);
      }
    }

    return { products, orders };
  }
}