import { env } from "@/config";
import type { OmieClientWithCircuitBreaker } from "@/shared/integrations/omie/omie-client-with-circuit-breaker";

export class OmieStockPositionGateway {
  constructor(
    private readonly omieClient: OmieClientWithCircuitBreaker
  ) {}

  async getPosition(productId: string) {
    if (!this.omieClient) {
      throw new Error("OMIE_CLIENT_NOT_CONFIGURED");
    }

    const payload = {
      call: "ListarPosEstoque",
      app_key: env.OMIE_APP_KEY,
      app_secret: env.OMIE_APP_SECRET,
      param: [
        {
          nPagina: 1,
          nRegPorPagina: 200,
          cExibeTodos: "S",
          codigo_local_estoque: 0,
        },
      ],
    };

    const apiResponse = await this.omieClient.post<any>(
      "/api/v1/estoque/consulta/",
      payload
    );

    const response =
      apiResponse && typeof apiResponse === "object" && "data" in apiResponse
        ? (apiResponse as any).data
        : apiResponse;

    if (response.faultstring || response.error) {
      throw new Error(response.faultstring || response.error);
    }

    const produtos = Array.isArray(response?.produtos)
      ? response.produtos
      : [];

    const linhasProduto = produtos.filter(
      (p: any) => String(p.nCodProd) === String(productId)
    );

    const breakdown = linhasProduto.map((item: any) => {
      const quantity =
        Number(item.nSaldo ?? item.nQtde ?? item.nQuantidade ?? 0) || 0;

      return {
        stockLocationCode: item.codigo_local_estoque,
        quantity,
      };
    });

    const total = breakdown.reduce(
  (sum: number, r: { quantity: number }) => sum + r.quantity,
  0
);
    return {
      success: true,
      data: {
        productId,
        total,
        breakdown,
      },
    };
  }
}