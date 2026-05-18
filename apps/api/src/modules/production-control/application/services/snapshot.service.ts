import { SnapshotRepository } from '../ports/snapshot.repository.port';
import { ProductRepository } from '../ports/product.repository.port';
import { OrderRepository } from '../ports/order.repository.port';
import { Snapshot } from '../entities/snapshot.entity';
import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';

export class SnapshotService {
  constructor(
    private readonly snapshotRepository: SnapshotRepository,
    private readonly productRepository: ProductRepository,
    private readonly orderRepository: OrderRepository
  ) {}

  async createSnapshotWithProducts(
    snapshot: Snapshot,
    products: Product[],
    orders: Order[]
  ): Promise<Snapshot> {
    // Create snapshot
    const createdSnapshot = await this.snapshotRepository.createSnapshot(snapshot);

    // Create products
    for (const product of products) {
      const createdProduct = await this.productRepository.createProduct({
        ...product,
        snapshotId: createdSnapshot.id,
      });

      // Create orders for this product
      const productOrders = orders.filter(order => 
        order.productId === product.id
      );
      
      for (const order of productOrders) {
        await this.orderRepository.createOrder({
          ...order,
          productId: createdProduct.id,
        });
      }
    }

    return createdSnapshot;
  }

  async getSnapshotWithDetails(snapshotId: string): Promise<{
    snapshot: Snapshot;
    products: Product[];
    orders: Order[];
  }> {
    const snapshot = await this.snapshotRepository.findSnapshotBySnapshotId(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    const products = await this.productRepository.listProductsBySnapshot(snapshot.id);
    
    const orders: Order[] = [];
    for (const product of products) {
      const productOrders = await this.orderRepository.listOrdersByProduct(product.id);
      orders.push(...productOrders);
    }

    return { snapshot, products, orders };
  }

  async listSnapshotsWithSummary(
    limit?: number,
    offset?: number
  ): Promise<{
    snapshots: Snapshot[];
    productCounts: Record<string, number>;
  }> {
    const snapshots = await this.snapshotRepository.listSnapshots(limit);
    
    const productCounts: Record<string, number> = {};
    for (const snapshot of snapshots) {
      const count = await this.productRepository.countProductsBySnapshot(snapshot.id);
      productCounts[snapshot.id] = count;
    }

    return { snapshots, productCounts };
  }
}