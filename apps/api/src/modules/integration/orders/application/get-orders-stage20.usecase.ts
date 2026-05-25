import { OmieOrdersStage20Gateway } from "../infrastructure/omie-orders-stage20.gateway";
import { OmieClientWithCircuitBreaker } from "@/shared/integrations/omie/omie-client-with-circuit-breaker";
import { env } from "@/config";

export class GetOrdersStage20UseCase {
  private gateway: OmieOrdersStage20Gateway;

  constructor() {
    const omieClient = new OmieClientWithCircuitBreaker({
      appKey: env.OMIE_APP_KEY,
      appSecret: env.OMIE_APP_SECRET,
      baseUrl: env.OMIE_BASE_URL ?? "https://app.omie.com.br",
    });

    this.gateway = new OmieOrdersStage20Gateway(omieClient);
  }

  async execute() {
    return this.gateway.listStage20();
  }
}