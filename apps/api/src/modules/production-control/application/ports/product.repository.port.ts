import { Product } from '../entities/product.entity';
import { ProductionControlStatus } from '../entities/production-control-status.enum';

export interface ProductRepository {
  createProduct(product: Product): Promise<Product>;
  findProductById(id: string): Promise<Product | null>;
  findProductBySnapshotAndDescription(
    snapshotId: string,
    description: string
  ): Promise<Product | null>;
  listProductsBySnapshot(snapshotId: string): Promise<Product[]>;
  updateProduct(product: Product): Promise<Product>;
  updateProductStatus(
    id: string,
    status: ProductionControlStatus
  ): Promise<Product>;
  updateProductPendingQuantity(
    id: string,
    pendingQuantity: number
  ): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  countProductsBySnapshot(snapshotId: string): Promise<number>;
}