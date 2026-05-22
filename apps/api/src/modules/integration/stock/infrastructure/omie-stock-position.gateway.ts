import type { OmieClientWithCircuitBreaker } from "@/shared/integrations/omie/omie-client-with-circuit-breaker";
import { env } from "@/config";

/**
 * Gateway Omie (API 1) - Posição de Estoque (descentralizado por local).
 *
 * Usa endpoint /api/v1/estoque/consulta/ e call ListarPosEstoque. [1](https://app.omie.com.br/api/v1/estoque/consulta/)[2](https://github.com/mendezabal/calixto/blob/master/posicao_estoque.py)
 * Params observados em exemplos: nPagina, nRegPorPagina, dDataPosicao, cExibeTodos, codigo_local_estoque. [2](https://github.com/mendezabal/calixto/blob/master/posicao_estoque.py)
 */
export class OmieStockPositionGateway {
  constructor(private readonly omieClient: OmieClientWithCircuitBreaker) {}

  async getPositionByProduct(params: {
    productId: string;          // domínio: productId → Omie usa nCodProd/nCodProduto dependendo do retorno
    positionDate: string;       // "DD/MM/YYYY" (Omie costuma usar esse formato em filtros de data)
    includeAll?: boolean;       // cExibeTodos
  }): Promise<{
    total: number;
    breakdown: Array<{ stockLocationCode: number; quantity: number; raw: any }>;
    raw: any;
  }> {
    if (!this.omieClient) throw new Error("OMIE_CLIENT_NOT_CONFIGURED");

    const payload = {
      call: "ListarPosEstoque",
      app_key: env.OMIE_APP_KEY,
      app_secret: env.OMIE_APP_SECRET,
      param: [
        {
          nPagina: 1,
          nRegPorPagina: 200,
          dDataPosicao: params.positionDate,
          cExibeTodos: params.includeAll ? "S" : "N",
          codigo_local_estoque: 0
        }
      ]
    };

    // Endpoint de estoque conforme exemplos: /api/v1/estoque/consulta/ [1](https://app.omie.com.br/api/v1/estoque/consulta/)[2](https://github.com/mendezabal/calixto/blob/master/posicao_estoque.py)
    const apiResponse = await this.omieClient.post<any>("/api/v1/estoque/consulta/", payload);
    const response = (apiResponse && typeof apiResponse === "object" && "data" in apiResponse)
      ? (apiResponse as any).data
      : apiResponse;

    if (response?.faultstring || response?.error || (response?.codigo_status && response.codigo_status !== "0")) {
      throw new Error(response.faultstring || response.error || "Omie stock API error");
    }

    // Em exemplos públicos, a lista aparece como "produtos". [2](https://github.com/mendezabal/calixto/blob/master/posicao_estoque.py)
    const items: any[] = Array.isArray(response?.produtos) ? response.produtos : [];

    // Filtra pelo produto. Exemplo público menciona nCodProd no item. [2](https://github.com/mendezabal/calixto/blob/master/posicao_estoque.py)
    const matching = items.filter((it) => String(it?.nCodProd ?? it?.nCodProduto ?? it?.codigo_produto ?? "") === String(params.productId));

    const breakdown = matching.map((it) => {
      const stockLocationCode = Number(it?.codigo_local_estoque ?? it?.codigo_local ?? 0) || 0;
      const quantity = this.extractQuantity(it);
      return { stockLocationCode, quantity, raw: it };
    });

    const total = breakdown.reduce((acc, row) => acc + row.quantity, 0);

    return { total, breakdown, raw: response };
  }

  /**
   * Extração defensiva de quantidade porque o retorno pode variar por ambiente/conta.
   * Ajuste a chave exata após inspecionar 1 resposta real do Omie.
   */
  private extractQuantity(it: any): number {
    const candidates = [
      it?.nSaldo,
      it?.nQtde,
      it?.nQuantidade,
      it?.nQtd,
      it?.nQtdEstoque,
      it?.nEstoque,
      it?.quantidade,
      it?.saldo
    ];

    for (const c of candidates) {
      if (c === null || c === undefined) continue;
      const num = typeof c === "number" ? c : Number(String(c).replace(",", "."));
      if (!Number.isNaN(num)) return num;
    }
    return 0;
  }
}
