import { AddToQueueRequest, AddToQueueResponse } from "../dtos/production-queue.dto";
import { ProductionQueueRepositoryPort } from "../ports/production-queue.repository.port";
import { calculateEstimatedStartDate } from "../entities/production-queue.entity";

export interface AddToQueueDependencies {
  productionQueueRepository: ProductionQueueRepositoryPort;
  logger?: {
    info: (message: string, data?: any) => void;
    error: (message: string, error?: any) => void;
  };
}

export class AddToQueueUseCase {
  constructor(private readonly dependencies: AddToQueueDependencies) {}

  async execute(request: AddToQueueRequest): Promise<AddToQueueResponse> {
    const { productionQueueRepository, logger } = this.dependencies;
    
    try {
      logger?.info("Iniciando adição de ordem à fila de produção", { request });
      
      // Validar se a ordem existe
      const orderExists = await productionQueueRepository.validateOrderExists(request.orderId);
      if (!orderExists) {
        throw new Error(`Ordem com ID ${request.orderId} não encontrada`);
      }
      
      // Verificar se a ordem já está na fila
      const existingItem = await productionQueueRepository.findByOrderId(request.orderId);
      if (existingItem) {
        throw new Error(`Ordem ${request.orderId} já está na fila de produção`);
      }
      
      // Obter próxima posição disponível
      const nextPosition = await productionQueueRepository.getNextPosition();
      
      // Calcular data estimada de início
      const estimatedStartDate = calculateEstimatedStartDate(nextPosition);
      
      // Criar item da fila
      const queueItem = await productionQueueRepository.create({
        orderId: request.orderId,
        priority: request.priority,
        status: "pending",
        position: nextPosition,
        estimatedStartDate,
        scheduledDate: request.scheduledDate ? new Date(request.scheduledDate) : undefined,
        notes: request.notes,
      });
      
      logger?.info("Ordem adicionada à fila de produção com sucesso", { queueItem });
      
      return {
        success: true,
        data: {
          id: queueItem.id,
          orderId: queueItem.orderId,
          priority: queueItem.priority,
          status: queueItem.status,
          position: queueItem.position,
          estimatedStartDate: queueItem.estimatedStartDate?.toISOString(),
          scheduledDate: queueItem.scheduledDate?.toISOString(),
          createdAt: queueItem.createdAt.toISOString(),
          updatedAt: queueItem.updatedAt.toISOString(),
        },
        message: "Ordem adicionada à fila de produção com sucesso",
      };
      
    } catch (error) {
      logger?.error("Erro ao adicionar ordem à fila de produção", { error, request });
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error("Erro interno ao processar solicitação");
    }
  }
}

export function createAddToQueueUseCase(dependencies: AddToQueueDependencies): AddToQueueUseCase {
  return new AddToQueueUseCase(dependencies);
}