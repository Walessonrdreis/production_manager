import { ProductionControlStatus } from '@prisma/client';

export interface Product {
  id: string;
  snapshotId: string;
  description: string;
  totalQuantity: number;
  pendingQuantity: number;
  status: ProductionControlStatus;
  scheduledDate?: Date;
  actualDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function createProduct(params: {
  snapshotId: string;
  description: string;
  totalQuantity: number;
  scheduledDate?: Date;
  actualDate?: Date;
}): Product {
  const now = new Date();
  
  return {
    id: crypto.randomUUID(),
    snapshotId: params.snapshotId,
    description: params.description,
    totalQuantity: params.totalQuantity,
    pendingQuantity: params.totalQuantity,
    status: 'PENDING',
    scheduledDate: params.scheduledDate,
    actualDate: params.actualDate,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateProductPendingQuantity(
  product: Product,
  newPendingQuantity: number
): Product {
  return {
    ...product,
    pendingQuantity: newPendingQuantity,
    updatedAt: new Date(),
  };
}

export function updateProductStatus(
  product: Product,
  newStatus: ProductionControlStatus
): Product {
  return {
    ...product,
    status: newStatus,
    updatedAt: new Date(),
  };
}

export function updateProductDates(
  product: Product,
  scheduledDate?: Date,
  actualDate?: Date
): Product {
  return {
    ...product,
    scheduledDate,
    actualDate,
    updatedAt: new Date(),
  };
}