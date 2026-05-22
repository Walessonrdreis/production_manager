import { ProductionOrderIntegrationGateway } from "../../application/ports/production-order-integration.gateway";
import { CreateProductionOrderRequest } from "../../presentation/http/schemas";

export class RealProductionOrderIntegrationGateway
  implements ProductionOrderIntegrationGateway
{
  async createProductionOrder(
    command: CreateProductionOrderRequest
  ): Promise<{
    externalRequestId: string;
    status: "ACCEPTED";
  }> {
    // TODO: Implementar integração real com Omie
    // Por enquanto, retorna um stub que simula sucesso
    // Mantém o mesmo comportamento do fake para não quebrar contratos
    
    console.log(`[RealGateway] Simulando criação de ordem de produção para produto: ${command.productId}, quantidade: ${command.quantity}`);
    
    return {
      externalRequestId: command.externalRequestId,
      status: "ACCEPTED",
    };
  }
}