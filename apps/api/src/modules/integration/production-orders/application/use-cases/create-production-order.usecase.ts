import type {
  CreateProductionOrderRequest,
  CreateProductionOrderResponse,
} from "../../presentation/http/schemas";

import { env } from "@/config";
import {
  createOmieClientWithCircuitBreaker,
  type OmieClientWithCircuitBreaker,
} from "@/shared/integrations/omie/omie-client-with-circuit-breaker";

import type { ProductionOrderCreationGateway } from "../../infrastructure/gateways/creation/production-order-creation.gateway";
import { FakeProductionOrderCreationGateway } from "../../infrastructure/gateways/creation/fake-production-order-creation.gateway";
import { RealProductionOrderCreationGateway } from "../../infrastructure/gateways/creation/real-production-order-creation.gateway";

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
  private gateway: ProductionOrderCreationGateway;

  constructor(gateway?: ProductionOrderCreationGateway) {
    if (gateway) {
      this.gateway = gateway;
      return;
    }

    const gatewayType = process.env.PRODUCTION_ORDER_GATEWAY;

    if (gatewayType === "real") {
      this.gateway = new RealProductionOrderCreationGateway(getOmieClient());
    } else {
      this.gateway = new FakeProductionOrderCreationGateway();
    }
  }

  async execute(
    request: CreateProductionOrderRequest
  ): Promise<CreateProductionOrderResponse> {
    console.log("[OP][USECASE] execute", {
      externalRequestId: request.externalRequestId,
      gateway: process.env.PRODUCTION_ORDER_GATEWAY ?? "fake",
    });

    // ✅ Opção A pode existir no gateway (ele pode devolver ACCEPTED|CONFIRMED|FAILED)
    // Mas o contrato do POST continua sendo ACCEPTED (ack do comando).
    const integrationResult = await this.gateway.createProductionOrder(request);

    return {
      success: true,
      data: {
        externalRequestId: integrationResult.externalRequestId,
        status: "ACCEPTED", // ✅ NORMALIZAÇÃO DO CONTRATO DO POST
      },
    };
  }
}