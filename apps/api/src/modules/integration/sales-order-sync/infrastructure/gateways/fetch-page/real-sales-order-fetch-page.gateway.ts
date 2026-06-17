import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import type {
  SalesOrderFetchPageGateway,
  SalesOrderFetchPageResult,
} from "../../../application/ports/sales-order-fetch-page.gateway";

export class RealSalesOrderFetchPageGateway
  implements SalesOrderFetchPageGateway
{
  constructor(private readonly omieClient: OmieHttpClientPort) {}

  async fetchPage(
    page: number,
    pageSize: number
  ): Promise<SalesOrderFetchPageResult> {
    const response = await this.omieClient.post<any>(
      "produtos/pedido/",
      {
        call: "ListarPedidos",
        param: [
          {
            pagina: page,
            registros_por_pagina: pageSize,

            // 🔥 FILTRO PRINCIPAL (KANBAN)
            etapa: "20",
          },
        ],
      }
    );

    const pedidos = Array.isArray(response?.pedido_venda_produto)
      ? response.pedido_venda_produto
      : [];

    const items = pedidos
      .map((pedido: any) => {
        const isCanceled = pedido?.cancelado === "S";
        const isClosed = pedido?.bloqueado === "S";

        // ✅ FILTRO FINAL NO CÓDIGO
        if (isCanceled || isClosed) {
          return null;
        }

        return {
          omieId: String(pedido?.id_pedido ?? ""),
          orderNumber: pedido?.numero_pedido ?? null,
          stage: String(pedido?.etapa ?? ""),

          isCanceled,
          isClosed,

          customerOmieId: pedido?.codigo_cliente ?? null,
          companyOmieId: pedido?.codigo_empresa ?? null,

          forecastDate: pedido?.previsao_entrega
            ? new Date(pedido.previsao_entrega)
            : null,

          totalAmount: pedido?.valor_total ?? 0,

          rawPayload: pedido,

          items: (pedido?.detalhes ?? []).map((item: any) => ({
            omieItemId: String(item?.id_item ?? ""),
            productCode: item?.codigo_produto ?? "",
            productOmieId: String(item?.codigo_produto ?? ""),
            description: item?.descricao ?? "",
            unit: item?.unidade ?? null,
            quantity: item?.quantidade ?? 0,
            unitPrice: item?.valor_unitario ?? null,
            totalPrice: item?.valor_total ?? null,
            rawPayload: item,
          })),
        };
      })
      .filter(Boolean);

    const totalPages = Number(response?.total_de_paginas ?? page);
    const currentPage = Number(response?.pagina ?? page);

    return {
      items,
      currentPage,
      totalPages,
      hasNextPage: currentPage < totalPages,
    };
  }
}