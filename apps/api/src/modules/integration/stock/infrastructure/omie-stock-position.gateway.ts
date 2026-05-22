import { env } from "@/config";
import type { OmieClientWithCircuitBreaker } from "@/shared/integrations/omie/omie-client-with-circuit-breaker";

/**
 * OmieStockPositionGateway
 *
 * Consulta posição de estoque (descentralizada por local) e consolida total.
 *
 * Endpoint Omie (estoque/consulta) e call ListarPosEstoque são os usados em exemplos públicos. 【1-4a95da】【2-07184a】
 *
 * Observação:
 * - O Omie pode variar a estrutura do retorno por conta/empresa.
 * - Por isso a extração de quantidade e o filtro do produto são defensivos.
 */
export class OmieStockPositionGateway {
  constructor(private readonly omieClient: OmieClientWithCircuitBreaker) {}

  async getPosition(productId: string): Promise<{
    success: true;
    data: {
      productId: string;
      positionDate: string;
      total: number;
      breakdown: Array<{ stockLocationCode: number; quantity: number }>;
    };
  }> {
    if (!this.omieClient) {
      throw new Error("OMIE_CLIENT_NOT_CONFIGURED");
    }

    const positionDate = this.getTodayBr();

    // Vamos paginar para não depender de o produto estar na página 1
    const allItems: any[] = [];

    let page = 1;
    const maxPagesSafety = 50;

    while (page <= maxPagesSafety) {
      const payload = {
        call: "ListarPosEstoque",
        app_key: env.OMIE_APP_KEY,
        app_secret: env.OMIE_APP_SECRET,
        param: [
          {
            // parâmetros vistos em uso comum: nPagina/nRegPorPagina/dDataPosicao/cExibeTodos/codigo_local_estoque 【2-07184a】
            nPagina: page,
            nRegPorPagina: 200,
            dDataPosicao: positionDate,
            cExibeTodos: "S",
            codigo_local_estoque: 0,
          },
        ],
      };

      const apiResponse = await this.omieClient.post<any>(
        "/api/v1/estoque/consulta/",
        payload
      ); // endpoint de consulta de estoque 【1-4a95da】

      const response =
        apiResponse && typeof apiResponse === "object" && "data" in apiResponse
          ? (apiResponse as any).data
          : apiResponse;

      if (
        response?.faultstring ||
        response?.error ||
        (response?.codigo_status && response.codigo_status !== "0")
      ) {
        throw new Error(
          response?.faultstring ||
            response?.error ||
            "Omie stock API error"
        );
      }

      // Lista costuma vir em "produtos" em exemplos públicos 【2-07184a】
      const items =
        (Array.isArray(response?.produtos) && response.produtos) ||
        (Array.isArray(response?.estoques) && response.estoques) ||
        (Array.isArray(response?.itens) && response.itens) ||
        [];

      this.debugOnce(response, items);

      allItems.push(...items);

      // descobrir total de páginas de forma defensiva
      const totalPages =
        Number(response?.total_de_paginas) ||
        Number(response?.nTotPaginas) ||
        Number(response?.totalPaginas) ||
        1;

      if (page >= totalPages) break;
      if (items.length === 0) break; // sem itens, para não loopar à toa

      page += 1;
    }

    // Filtra o produto de forma defensiva (Omie varia o nome do campo)
    const matching = allItems.filter((it) => {
      const candidate =
        it?.nCodProd ??
        it?.nCodProduto ??
        it?.codigo_produto ??
        it?.codigo ??
        it?.cCodigo ??
        "";
      return String(candidate) === String(productId);
    });

    const breakdown = matching.map((it) => {
      const stockLocationCode = Number(
        it?.codigo_local_estoque ?? it?.codigo_local ?? it?.nCodLocal ?? 0
      );

      const quantity = this.extractQuantity(it);

      return {
        stockLocationCode: Number.isNaN(stockLocationCode)
          ? 0
          : stockLocationCode,
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
        positionDate,
        total,
        breakdown,
      },
    };
  }

  /**
   * Extrai quantidade do item de estoque de forma defensiva
   * (Omie pode usar chaves diferentes por conta/ambiente).
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
      it?.saldo,
    ];

    for (const c of candidates) {
      if (c === null || c === undefined) continue;

      const num =
        typeof c === "number" ? c : Number(String(c).replace(",", "."));

      if (!Number.isNaN(num)) return num;
    }

    return 0;
  }

  /** Data de hoje no formato DD/MM/YYYY (comum em filtros do Omie). 【2-07184a】 */
  private getTodayBr(): string {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Debug controlado:
   * - Não imprime credenciais.
   * - Só loga se process.env.STOCK_DEBUG === "true".
   * - Loga apenas chaves e um exemplo de item.
   */
  private debugOnce(response: any, items: any[]) {
    if (process.env.STOCK_DEBUG !== "true") return;

    // log leve, sem payload completo
    const keys = response && typeof response === "object" ? Object.keys(response) : [];
    const sample = items && items.length > 0 ? items[0] : null;

    // eslint-disable-next-line no-console
    console.log("[OMIE STOCK DEBUG] responseKeys=", keys);

    if (sample) {
      // eslint-disable-next-line no-console
      console.log("[OMIE STOCK DEBUG] sampleItem=", JSON.stringify(sample, null, 2));
    }
  }
}