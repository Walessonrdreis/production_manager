import type { CreateProductionOrderRequest, CreateProductionOrderResponse } from "../../presentation/http/schemas";
import type { ProductionOrderIntegrationGateway } from "../ports/production-order-integration.gateway";
import { FakeProductionOrderIntegrationGateway } from "../../infrastructure/gateways/fake-production-order-integration.gateway";

export class CreateProductionOrderUseCase {
  private gateway: ProductionOrderIntegrationGateway;

  constructor(gateway?: ProductionOrderIntegrationGateway) {
    // Usa o gateway fornecido ou cria um fake por padrão
    this.gateway = gateway || new FakeProductionOrderIntegrationGateway();
  }

  async execute(request: CreateProductionOrderRequest): Promise<CreateProductionOrderResponse> {
    // Chama o gateway para criar a ordem de produção
    const integrationResult = await this.gateway.createProductionOrder(request);

    // Retorna resposta conforme contrato do STEP 2
    const response: CreateProductionOrderResponse = {
      success: true,
      data: {
        externalRequestId: integrationResult.externalRequestId,
        status: integrationResult.status,
      },
    };

    return response;
  }
}