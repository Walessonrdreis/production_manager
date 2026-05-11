import { ListQueueRequest, ListQueueResponse } from "../dtos/production-queue.dto";
import { ProductionQueueRepositoryPort } from "../ports/production-queue.repository.port";
import { calculateQueueStatistics } from "../entities/production-queue.entity";

export interface ListQueueDependencies {
  productionQueueRepository: ProductionQueueRepositoryPort;
  logger?: {
    info: (message: string, data?: any) => void;
    error: (message: string, error?: any) => void;
  };
}

export class ListQueueUseCase {
  constructor(private readonly dependencies: ListQueueDependencies) {}

  async execute(request: ListQueueRequest): Promise<ListQueueResponse> {
    const { productionQueueRepository, logger } = this.dependencies;
    
    try {
      logger?.info("Iniciando listagem da fila de produção", { request });
      
      // Obter itens da fila
      const { items, total } = await productionQueueRepository.list(request);
      
      // Calcular estatísticas
      const statistics = calculateQueueStatistics(items);
      
      // Enriquecer itens com informações adicionais (se necessário)
      const enrichedItems = items.map(item => ({
        id: item.id,
        orderId: item.orderId,
        orderNumber: `ORD-${item.orderId.substring(0, 8).toUpperCase()}`, // Exemplo
        clientName: "Cliente Exemplo", // Seria obtido do repositório de ordens
        totalItems: 10, // Exemplo - seria calculado
        priority: item.priority,
        status: item.status,
        position: item.position,
        estimatedStartDate: item.estimatedStartDate?.toISOString(),
        scheduledDate: item.scheduledDate?.toISOString(),
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }));
      
      logger?.info("Fila de produção listada com sucesso", { 
        totalItems: total,
        page: request.page,
        pageSize: request.pageSize 
      });
      
      return {
        success: true,
        data: {
          items: enrichedItems,
          total,
          page: request.page || 1,
          pageSize: request.pageSize || 20,
          statistics,
        },
        message: "Fila de produção listada com sucesso",
      };
      
    } catch (error) {
      logger?.error("Erro ao listar fila de produção", { error, request });
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error("Erro interno ao processar solicitação");
    }
  }
}

export function createListQueueUseCase(dependencies: ListQueueDependencies): ListQueueUseCase {
  return new ListQueueUseCase(dependencies);
}