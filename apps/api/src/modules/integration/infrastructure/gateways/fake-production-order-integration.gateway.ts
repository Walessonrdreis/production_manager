import { ProductionOrderIntegrationGateway } from "../../application/ports/production-order-integration.gateway";
import { CreateProductionOrderRequest } from "../../presentation/http/schemas";

export class FakeProductionOrderIntegrationGateway
  implements ProductionOrderIntegrationGateway
{
  async createProductionOrder(
    command: CreateProductionOrderRequest
  ): Promise<{
    externalRequestId: string;
    status: "ACCEPTED";
  }> {
    // Simula uma integração fake que sempre retorna sucesso
    // Ecoa o externalRequestId recebido
    return {
      externalRequestId: command.externalRequestId,
      status: "ACCEPTED",
    };
  }
}