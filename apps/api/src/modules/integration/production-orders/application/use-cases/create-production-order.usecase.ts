import type {
  CreateProductionOrderRequest,
  CreateProductionOrderResponse,
} from "../../presentation/http/schemas";

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
  if (omieClientSingleton) return omieClientSingleton;

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
    if (gateway) {
      this.gateway = gateway;
      return;
    }

    const gatewayType = process.env.PRODUCTION_ORDER_GATEWAY;

    if (gatewayType === "real") {
      this.gateway = new RealProductionOrderIntegrationGateway(getOmieClient());
    } else {
      this.gateway = new FakeProductionOrderIntegrationGateway();
    }
  }

  async execute(
    request: CreateProductionOrderRequest
  ): Promise<CreateProductionOrderResponse> {
    const result = await this.gateway.createProductionOrder(request);

    return {
      success: true,
      data: {
        externalRequestId: result.externalRequestId,
        status: result.status,
      },
    };
  }
}