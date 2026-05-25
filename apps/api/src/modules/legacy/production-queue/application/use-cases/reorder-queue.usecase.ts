import { ReorderQueueRequest, ReorderQueueResponse } from "../dtos/production-queue.dto";
import { ProductionQueueRepositoryPort } from "../ports/production-queue.repository.port";

export interface ReorderQueueDependencies {
  productionQueueRepository: ProductionQueueRepositoryPort;
  logger?: {
    info: (message: string, data?: any) => void;
    error: (message: string, error?: any) => void;
  };
}

export class ReorderQueueUseCase {
  constructor(private readonly dependencies: ReorderQueueDependencies) {}

  async execute(request: ReorderQueueRequest): Promise<ReorderQueueResponse> {
    const { productionQueueRepository, logger } = this.dependencies;
    
    try {
      logger?.info("Iniciando reordenação da fila de produção", { request });
      
      // Validar itens da requisição
      this.validateReorderRequest(request);
      
      // Reordenar itens
      const updatedItems = await productionQueueRepository.reorderItems(request.items);
      
      logger?.info("Fila reordenada com sucesso", { updatedItems });
      
      return {
        success: true,
        data: {
          updatedItems,
        },
        message: "Fila reordenada com sucesso",
      };
      
    } catch (error) {
      logger?.error("Erro ao reordenar fila", { error, request });
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error("Erro interno ao processar solicitação");
    }
  }
  
  private validateReorderRequest(request: ReorderQueueRequest): void {
    if (!request.items || request.items.length === 0) {
      throw new Error("Nenhum item fornecido para reordenação");
    }
    
    // Verificar se há IDs duplicados
    const ids = request.items.map(item => item.id);
    const uniqueIds = new Set(ids);
    
    if (ids.length !== uniqueIds.size) {
      throw new Error("IDs duplicados na requisição de reordenação");
    }
    
    // Verificar se as posições são válidas (positivas e únicas)
    const positions = request.items.map(item => item.newPosition);
    const uniquePositions = new Set(positions);
    
    if (positions.length !== uniquePositions.size) {
      throw new Error("Posições duplicadas na requisição de reordenação");
    }
    
    // Verificar se todas as posições são positivas
    const invalidPositions = positions.filter(pos => pos <= 0);
    if (invalidPositions.length > 0) {
      throw new Error(`Posições inválidas: ${invalidPositions.join(", ")}. Todas as posições devem ser positivas.`);
    }
    
    // Verificar se as posições são sequenciais (opcional, mas recomendado)
    const sortedPositions = [...positions].sort((a, b) => a - b);
    const isSequential = sortedPositions.every((pos, index) => pos === index + 1);
    
    if (!isSequential) {
      logger?.warn("Posições não são sequenciais na reordenação", { positions: sortedPositions });
      // Não lançamos erro, apenas registramos warning, pois posições não sequenciais podem ser intencionais
    }
  }
}

export function createReorderQueueUseCase(dependencies: ReorderQueueDependencies): ReorderQueueUseCase {
  return new ReorderQueueUseCase(dependencies);
}