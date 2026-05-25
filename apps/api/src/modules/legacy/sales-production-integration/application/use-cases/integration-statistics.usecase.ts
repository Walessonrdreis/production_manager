import type { ProductionQueueRepositoryPort } from "@/modules/legacy/production-queue/application/ports/production-queue.repository.port";
import type { Logger } from "@/shared/logger";
import type { IntegrationStatisticsResponse } from "../dtos/sales-production-integration.dto";

export interface IntegrationStatisticsDependencies {
  productionQueueRepository: ProductionQueueRepositoryPort;
  logger: Logger;
}

export class IntegrationStatisticsUseCase {
  constructor(private readonly dependencies: IntegrationStatisticsDependencies) {}

  async execute(): Promise<IntegrationStatisticsResponse> {
    const { productionQueueRepository, logger } = this.dependencies;
    
    try {
      logger.info("Calculando estatísticas de integração vendas→produção");
      
      // 1. Obter todos os itens da fila
      const allItems = await productionQueueRepository.findAll({
        page: 1,
        pageSize: 1000, // Número grande para pegar todos
      });
      
      // 2. Filtrar itens integrados (com metadata.integratedAt)
      const integratedItems = allItems.filter(item => 
        item.metadata && item.metadata.integratedAt
      );
      
      // 3. Calcular estatísticas
      const statistics = {
        totalIntegrated: integratedItems.length,
        byPriority: {
          high: integratedItems.filter(item => item.priority === "high").length,
          medium: integratedItems.filter(item => item.priority === "medium").length,
          low: integratedItems.filter(item => item.priority === "low").length,
        },
        byCustomerType: {
          regular: integratedItems.filter(item => 
            item.metadata && item.metadata.customerType === "regular"
          ).length,
          vip: integratedItems.filter(item => 
            item.metadata && item.metadata.customerType === "vip"
          ).length,
          corporate: integratedItems.filter(item => 
            item.metadata && item.metadata.customerType === "corporate"
          ).length,
        },
        averageIntegrationTime: this.calculateAverageIntegrationTime(integratedItems),
        lastIntegrationAt: this.getLastIntegrationTime(integratedItems),
      };
      
      logger.info(`Estatísticas calculadas: ${statistics.totalIntegrated} ordens integradas`);
      
      return {
        success: true,
        data: statistics,
        message: "Estatísticas de integração calculadas com sucesso",
      };
      
    } catch (error) {
      logger.error("Erro ao calcular estatísticas de integração:", error);
      throw error;
    }
  }
  
  private calculateAverageIntegrationTime(items: any[]): number {
    if (items.length === 0) return 0;
    
    const totalTime = items.reduce((sum, item) => {
      if (item.metadata && item.metadata.integratedAt) {
        const integratedAt = new Date(item.metadata.integratedAt);
        const createdAt = new Date(item.createdAt);
        const integrationTime = integratedAt.getTime() - createdAt.getTime();
        return sum + integrationTime;
      }
      return sum;
    }, 0);
    
    return totalTime / items.length;
  }
  
  private getLastIntegrationTime(items: any[]): string | undefined {
    if (items.length === 0) return undefined;
    
    const integratedItems = items.filter(item => 
      item.metadata && item.metadata.integratedAt
    );
    
    if (integratedItems.length === 0) return undefined;
    
    // Encontrar o item com integratedAt mais recente
    const lastItem = integratedItems.reduce((latest, item) => {
      const itemTime = new Date(item.metadata.integratedAt).getTime();
      const latestTime = latest ? new Date(latest.metadata.integratedAt).getTime() : 0;
      return itemTime > latestTime ? item : latest;
    }, null);
    
    return lastItem.metadata.integratedAt;
  }
}