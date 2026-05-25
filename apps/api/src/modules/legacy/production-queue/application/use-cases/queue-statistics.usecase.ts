import { QueueStatisticsRequest, QueueStatisticsResponse } from "../dtos/production-queue.dto";
import { ProductionQueueRepositoryPort } from "../ports/production-queue.repository.port";

export interface QueueStatisticsDependencies {
  productionQueueRepository: ProductionQueueRepositoryPort;
  logger?: {
    info: (message: string, data?: any) => void;
    error: (message: string, error?: any) => void;
  };
}

export class QueueStatisticsUseCase {
  constructor(private readonly dependencies: QueueStatisticsDependencies) {}

  async execute(request: QueueStatisticsRequest): Promise<QueueStatisticsResponse> {
    const { productionQueueRepository, logger } = this.dependencies;
    
    try {
      logger?.info("Iniciando obtenção de estatísticas da fila de produção", { request });
      
      // Obter estatísticas do repositório
      const statistics = await productionQueueRepository.getStatistics(request);
      
      logger?.info("Estatísticas da fila obtidas com sucesso", { statistics });
      
      return {
        success: true,
        data: {
          totalOrders: statistics.totalOrders,
          pendingOrders: statistics.pendingOrders,
          inProgressOrders: statistics.inProgressOrders,
          completedOrders: statistics.completedOrders,
          cancelledOrders: statistics.cancelledOrders,
          averageCompletionTime: statistics.averageCompletionTime,
          priorityDistribution: statistics.priorityDistribution,
          dailyThroughput: statistics.dailyThroughput,
        },
        message: "Estatísticas da fila obtidas com sucesso",
      };
      
    } catch (error) {
      logger?.error("Erro ao obter estatísticas da fila", { error, request });
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error("Erro interno ao processar solicitação");
    }
  }
}

export function createQueueStatisticsUseCase(dependencies: QueueStatisticsDependencies): QueueStatisticsUseCase {
  return new QueueStatisticsUseCase(dependencies);
}