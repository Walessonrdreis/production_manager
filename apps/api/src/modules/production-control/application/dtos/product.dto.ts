import { Product } from '../entities/product.entity';
import { ProductionControlStatus } from '../entities/production-control-status.enum';

export class ProductDTO {
  static toDomain(data: any): Product {
    return {
      id: data.id,
      snapshotId: data.snapshotId,
      description: data.description,
      totalQuantity: Number(data.totalQuantity),
      pendingQuantity: Number(data.pendingQuantity),
      status: data.status as ProductionControlStatus,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
      actualDate: data.actualDate ? new Date(data.actualDate) : undefined,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      orders: data.orders || [],
    };
  }

  static fromDomain(product: Product): {
    id: string;
    snapshotId: string;
    description: string;
    totalQuantity: number;
    pendingQuantity: number;
    status: string;
    scheduledDate?: string;
    actualDate?: string;
    createdAt: string;
    updatedAt: string;
  } {
    return {
      id: product.id,
      snapshotId: product.snapshotId,
      description: product.description,
      totalQuantity: product.totalQuantity,
      pendingQuantity: product.pendingQuantity,
      status: product.status,
      scheduledDate: product.scheduledDate?.toISOString(),
      actualDate: product.actualDate?.toISOString(),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}