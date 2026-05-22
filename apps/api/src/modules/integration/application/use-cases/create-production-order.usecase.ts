import type { CreateProductionOrderRequest, CreateProductionOrderResponse } from "../../presentation/http/schemas";
import type { ProductionOrderIntegrationGateway } from "../ports/production-order-integration.gateway";
import { FakeProductionOrderIntegrationGateway } from "../../infrastructure/gateways/fake-production-order-integration.gateway";
import { RealProductionOrderIntegrationGateway } from "../../infrastructure/gateways/real-production-order-integration.gateway";
import { env } from "@/config";
import {
  createOmieClientWithCircuitBreaker,
  type OmieClientWithCircuitBreaker,
} from "@/shared/integrations/omie/omie-client-with-circuit-breaker";

let omieClientSingleton: OmieClientWithCircuitBreaker | null = null;

function getOmieClient(): OmieClientWithCircuitBreaker {
  if (omieClientSingleton) {
    return omieClientSingleton;
  }

  omieClientSingleton = createOmieClientWithCircuitBreaker({
    baseUrl: env.OMIE_BASE_URL,
    appKey: env.OMIE_APP_KEY,
    appSecret: env.OMIE_APP_SECRET,
    timeoutMs: 10000,
    retry: { attempts: 2, baseDelayMs: 1000, maxDelayMs: 3000 },
    debug: process.env.NODE_ENV !== "production",
    circuitBreaker: {
      failureThreshold: 3,
      resetTimeoutMs: 30000,
      successThreshold: 2,
    },
  });

  return omieClientSingleton;
}

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
      const omieClient = getOmieClient();
      this.gateway = new RealProductionOrderIntegrationGateway(omieClient);
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
