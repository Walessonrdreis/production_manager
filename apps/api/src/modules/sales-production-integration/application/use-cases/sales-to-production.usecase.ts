import type { ProductionQueueRepositoryPort } from "@/modules/production-queue/application/ports/production-queue.repository.port";
import type { Logger } from "@/shared/logger";
import type { SalesToProductionRequest, SalesToProductionResponse } from "../dtos/sales-production-integration.dto";

export interface SalesToProductionDependencies {
  productionQueueRepository: ProductionQueueRepositoryPort;
  logger: Logger;
}

export class SalesToProductionUseCase {
  constructor(private readonly dependencies: SalesToProductionDependencies) {}

  async execute(request: SalesToProductionRequest): Promise<SalesToProductionResponse> {
    const { productionQueueRepository, logger } = this.dependencies;
    
    try {
      logger.info(`Iniciando integração vendas→produção para ordem ${request.orderId}`);
      
      // 1. Validar se a ordem já está na fila
      const existingItem = await productionQueueRepository.findByOrderId(request.orderId);
      if (existingItem) {
        logger.warn(`Ordem ${request.orderId} já está na fila de produção`);
        return {
          success: false,
          data: existingItem,
          message: "Ordem já está na fila de produção",
        };
      }
      
      // 2. Calcular prioridade baseada nas regras de negócio
      const priority = this.calculatePriority(request);
      
      // 3. Obter próxima posição na fila
      const nextPosition = await productionQueueRepository.getNextPosition();
      
      // 4. Calcular data estimada de início
      const estimatedStartDate = this.calculateEstimatedStartDate(priority);
      
      // 5. Criar item na fila de produção
      const createdItem = await productionQueueRepository.create({
        orderId: request.orderId,
        priority,
        status: "pending",
        position: nextPosition,
        estimatedStartDate,
        scheduledDate: request.deliveryDeadline ? new Date(request.deliveryDeadline) : undefined,
        notes: request.notes,
        metadata: {
          customerType: request.customerType,
          orderValue: request.orderValue,
          integratedAt: new Date(),
        },
      });
      
      logger.info(`Ordem ${request.orderId} integrada à fila de produção com prioridade ${priority}`);
      
      return {
        success: true,
        data: createdItem,
        message: "Ordem integrada à fila de produção com sucesso",
      };
      
    } catch (error) {
      logger.error(`Erro na integração vendas→produção para ordem ${request.orderId}:`, error);
      throw error;
    }
  }
  
  private calculatePriority(request: SalesToProductionRequest): "high" | "medium" | "low" {
    const { customerType, orderValue, deliveryDeadline } = request;
    
    // Regra 1: Clientes VIP sempre têm alta prioridade
    if (customerType === "vip") {
      return "high";
    }
    
    // Regra 2: Pedidos com valor > R$ 10.000 têm alta prioridade
    if (orderValue > 10000) {
      return "high";
    }
    
    // Regra 3: Pedidos com prazo de entrega < 48h têm alta prioridade
    if (deliveryDeadline) {
      const deadline = new Date(deliveryDeadline);
      const now = new Date();
      const hoursToDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursToDeadline < 48) {
        return "high";
      }
    }
    
    // Regra 4: Clientes corporativos têm média prioridade
    if (customerType === "corporate") {
      return "medium";
    }
    
    // Regra 5: Pedidos com valor entre R$ 1.000 e R$ 10.000 têm média prioridade
    if (orderValue >= 1000 && orderValue <= 10000) {
      return "medium";
    }
    
    // Regra 6: Pedidos com prazo de entrega entre 48h e 7 dias têm média prioridade
    if (deliveryDeadline) {
      const deadline = new Date(deliveryDeadline);
      const now = new Date();
      const hoursToDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursToDeadline >= 48 && hoursToDeadline <= 168) { // 7 dias = 168 horas
        return "medium";
      }
    }
    
    // Regra 7: Todos os outros casos têm baixa prioridade
    return "low";
  }
  
  private calculateEstimatedStartDate(priority: "high" | "medium" | "low"): Date {
    const now = new Date();
    
    switch (priority) {
      case "high":
        // Alta prioridade: início em até 2 horas
        return new Date(now.getTime() + 2 * 60 * 60 * 1000);
      
      case "medium":
        // Média prioridade: início em até 24 horas
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      case "low":
        // Baixa prioridade: início em até 72 horas
        return new Date(now.getTime() + 72 * 60 * 60 * 1000);
      
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }
}