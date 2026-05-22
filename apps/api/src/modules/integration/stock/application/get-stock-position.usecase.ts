import { OmieStockPositionGateway } from "../infrastructure/omie-stock-position.gateway";
import type { OmieClientWithCircuitBreaker } from "@/shared/integrations/omie/omie-client-with-circuit-breaker";

export class GetStockPositionUseCase {
  constructor(
    private readonly gateway: OmieStockPositionGateway
  ) {}

  static build(omieClient: OmieClientWithCircuitBreaker) {
    return new GetStockPositionUseCase(new OmieStockPositionGateway(omieClient));
  }

  async execute(input: { productId: string; positionDateISO?: string }) {
    // Omie geralmente usa DD/MM/YYYY nos filtros de data (exemplos usam dd/mm/yyyy). [2](https://github.com/mendezabal/calixto/blob/master/posicao_estoque.py)
    const date = input.positionDateISO ? new Date(input.positionDateISO) : new Date();
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = String(date.getFullYear());
    const positionDate = `${dd}/${mm}/${yyyy}`;

    const result = await this.gateway.getPositionByProduct({
      productId: input.productId,
      positionDate,
      includeAll: true
    });

    return {
      success: true,
      data: {
        productId: input.productId,
        positionDate,
        total: result.total,
        breakdown: result.breakdown.map((b) => ({
          stockLocationCode: b.stockLocationCode,
          quantity: b.quantity
        }))
      }
    };
  }
}