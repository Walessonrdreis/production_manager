import { UpdateQueueStatusRequest, UpdateQueueStatusResponse } from "../dtos/production-queue.dto";
import { ProductionQueueRepositoryPort } from "../ports/production-queue.repository.port";

export interface UpdateQueueStatusDependencies {
  productionQueueRepository: ProductionQueueRepositoryPort;
  logger?: {
    info: (message: string, data?: any) => void;
    error: (message: string, error?: any) => void;
  };
}

export class UpdateQueueStatusUseCase {
  constructor(private readonly dependencies: UpdateQueueStatusDependencies) {}

  async execute(id: string, request: UpdateQueueStatusRequest): Promise<UpdateQueueStatusResponse> {
    const { productionQueueRepository, logger } = this.dependencies;
    
    try {
      logger?.info("Iniciando atualização de status da fila de produção", { id, request });
      
      // Verificar se o item existe
      const existingItem = await productionQueueRepository.findById(id);
      if (!existingItem) {
        throw new Error(`Item da fila com ID ${id} não encontrado`);
      }
      
      // Validar transição de status
      this.validateStatusTransition(existingItem.status, request.status);
      
      // Preparar atualizações
      const updates: any = {
        status: request.status,
      };
      
      // Se estiver marcando como concluído, registrar data de conclusão
      if (request.status === "completed") {
        updates.completedAt = request.completedAt ? new Date(request.completedAt) : new Date();
      }
      
      // Atualizar item
      const updatedItem = await productionQueueRepository.updateStatus(id, request);
      
      logger?.info("Status da fila atualizado com sucesso", { updatedItem });
      
      return {
        success: true,
        data: {
          id: updatedItem.id,
          status: updatedItem.status,
          updatedAt: updatedItem.updatedAt.toISOString(),
          completedAt: updatedItem.completedAt?.toISOString(),
        },
        message: "Status da fila atualizado com sucesso",
      };
      
    } catch (error) {
      logger?.error("Erro ao atualizar status da fila", { error, id, request });
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error("Erro interno ao processar solicitação");
    }
  }
  
  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      pending: ["in_progress", "cancelled"],
      in_progress: ["completed", "cancelled"],
      completed: [], // Não pode mudar de completed
      cancelled: [], // Não pode mudar de cancelled
    };
    
    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(
        `Transição de status inválida: ${currentStatus} -> ${newStatus}. ` +
        `Transições permitidas: ${validTransitions[currentStatus]?.join(", ") || "nenhuma"}`
      );
    }
  }
}

export function createUpdateQueueStatusUseCase(dependencies: UpdateQueueStatusDependencies): UpdateQueueStatusUseCase {
  return new UpdateQueueStatusUseCase(dependencies);
}