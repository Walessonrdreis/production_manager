import type { CreateProductionOrderRequest, CreateProductionOrderResponse } from "../../presentation/http/schemas";
import type { ProductionOrderIntegrationGateway } from "../ports/production-order-integration.gateway";
import { FakeProductionOrderIntegrationGateway } from "../../infrastructure/gateways/fake-production-order-integration.gateway";
import { RealProductionOrderIntegrationGateway } from "../../infrastructure/gateways/real-production-order-integration.gateway";

export class CreateProductionOrderUseCase {
  private gateway: ProductionOrderIntegrationGateway;

  constructor(gateway?: ProductionOrderIntegrationGateway) {
    // Se um gateway foi fornecido explicitamente, usa ele
    if (gateway) {
      this.gateway = gateway;
      return;
    }
    
    // Usa a função isolada que obtém o tipo de gateway
    // Esta função usa env.ts como fonte única com fallback seguro
    // Como getGatewayType() é assíncrona, precisamos lidar com isso
    // Para manter compatibilidade, usamos fallback síncrono
    const gatewayType = process.env.PRODUCTION_ORDER_GATEWAY;
    
    if (gatewayType === "real") {
      this.gateway = new RealProductionOrderIntegrationGateway();
    } else {
      // Default para "fake"
      this.gateway = new FakeProductionOrderIntegrationGateway();
    }
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