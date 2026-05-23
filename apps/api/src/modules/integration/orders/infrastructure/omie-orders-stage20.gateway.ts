import { env } from "@/config";
import type { OmieClientWithCircuitBreaker } from "@/shared/integrations/omie/omie-client-with-circuit-breaker";

export class OmieOrdersStage20Gateway {
  constructor(private readonly omieClient: OmieClientWithCircuitBreaker) {}

  async listStage20() {
    if (!this.omieClient) {
      throw new Error("OMIE_CLIENT_NOT_CONFIGURED");
    }

    const allOrders: any[] = [];
    let page = 1;
    const maxPagesSafety = 50;

    while (page <= maxPagesSafety) {
      const payload = {
        call: "ListarPedidos",
        app_key: env.OMIE_APP_KEY,
        app_secret: env.OMIE_APP_SECRET,
        param: [
          {
            pagina: page,
            registros_por_pagina: 50,
            apenas_importado_api: "N",
          },
        ],
      };

      const apiResponse = await this.omieClient.post<any>(
        "/api/v1/produtos/pedido/",
        payload
      );

      const response =
        apiResponse && typeof apiResponse === "object" && "data" in apiResponse
          ? (apiResponse as any).data
          : apiResponse;

      if (response?.faultstring || response?.error) {
        throw new Error(response.faultstring || response.error);
      }

      const pedidos = Array.isArray(response?.pedido_venda_produto)
        ? response.pedido_venda_produto
        : [];

      allOrders.push(...pedidos);

      const totalPages =
        Number(response?.total_de_paginas) ||
        Number(response?.nTotPaginas) ||
        1;

      if (page >= totalPages || pedidos.length === 0) break;
      page += 1;
    }

    // Stage 20
    const stage20 = allOrders.filter(
      (o) => String(o?.cEtapa) === "20"
    );

    // Normalização (anti‑corruption)
    const normalized = stage20.map((o) => ({
      omieOrderCode: String(o?.codigo_pedido ?? o?.cCodigo ?? ""),
      clientCode: String(o?.codigo_cliente ?? o?.cCodCliente ?? ""),
      clientName: String(o?.razao_social ?? o?.nome_cliente ?? ""),
      items: Array.isArray(o?.itens)
        ? o.itens.map((i: any) => ({
            productCode: String(
              i?.codigo_produto ?? i?.nCodProduto ?? i?.codigo ?? ""
            ),
            quantity: Number(i?.quantidade ?? i?.nQtde ?? 0),
          }))
        : [],
    }));

    return {
      success: true,
      data: {
        orders: normalized,
      },
    };
  }
}