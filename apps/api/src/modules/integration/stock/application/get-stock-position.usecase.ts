import { OmieStockPositionGateway } from "../infrastructure/omie-stock-position.gateway";
import { OmieClientWithCircuitBreaker } from "@/shared/integrations/omie/omie-client-with-circuit-breaker";
import { env } from "@/config";

export class GetStockPositionUseCase {
  private gateway: OmieStockPositionGateway;

  constructor() {
    const omieClient = new OmieClientWithCircuitBreaker({
      appKey: env.OMIE_APP_KEY,
      appSecret: env.OMIE_APP_SECRET,
      baseUrl: env.OMIE_BASE_URL ?? "https://app.omie.com.br",
    });

    this.gateway = new OmieStockPositionGateway(omieClient);
  }

  async execute(command: { productId: string }) {
    return this.gateway.getPosition(command.productId);
  }
}