import {
  ProductionQueueItem,
  ProductionQueueStatistics,
  QueueReorderItem,
} from "../entities/production-queue.entity";
import {
  ListQueueRequest,
  UpdateQueueStatusRequest,
  QueueStatisticsRequest,
  ReorderQueueRequest,
} from "../dtos/production-queue.dto";

export interface ProductionQueueRepositoryPort {
  // Operações CRUD básicas
  create(item: Omit<ProductionQueueItem, "id" | "createdAt" | "updatedAt">): Promise<ProductionQueueItem>;
  update(id: string, updates: Partial<ProductionQueueItem>): Promise<ProductionQueueItem>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<ProductionQueueItem | null>;
  findByOrderId(orderId: string): Promise<ProductionQueueItem | null>;
  
  // Listagem e filtros
  list(params: ListQueueRequest): Promise<{
    items: ProductionQueueItem[];
    total: number;
  }>;
  
  // Operações de fila
  getNextPosition(): Promise<number>;
  reorderItems(items: QueueReorderItem[]): Promise<number>;
  updatePositionsAfterDeletion(deletedPosition: number): Promise<void>;
  
  // Estatísticas
  getStatistics(params: QueueStatisticsRequest): Promise<ProductionQueueStatistics>;
  
  // Operações em lote
  updateStatus(id: string, statusUpdate: UpdateQueueStatusRequest): Promise<ProductionQueueItem>;
  
  // Consultas específicas
  countByStatus(status: ProductionQueueItem["status"]): Promise<number>;
  countByPriority(priority: ProductionQueueItem["priority"]): Promise<number>;
  getItemsByPriority(priority: ProductionQueueItem["priority"]): Promise<ProductionQueueItem[]>;
  getPendingItems(): Promise<ProductionQueueItem[]>;
  getInProgressItems(): Promise<ProductionQueueItem[]>;
  
  // Operações de limpeza
  cleanupOldItems(days: number): Promise<number>;
  
  // Validações
  validateOrderExists(orderId: string): Promise<boolean>;
  validatePositionAvailable(position: number): Promise<boolean>;
}