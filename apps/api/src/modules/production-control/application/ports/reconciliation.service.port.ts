import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';

export interface ReconciliationService {
  reconcileProducts(
    currentProducts: Product[],
    previousProducts: Product[]
  ): Promise<{
    newProducts: Product[];
    updatedProducts: Product[];
    completedProducts: Product[];
  }>;
  
  calculatePendingQuantity(product: Product, orders: Order[]): number;
  
  updateProductStatusBasedOnQuantity(product: Product): Product;
}