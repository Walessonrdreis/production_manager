import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import type {
  SalesOrderFetchPageGateway,
  SalesOrderFetchPageResult,
} from "../../../application/ports/sales-order-fetch-page.gateway";

function parseDateBR(value?: string | null): Date | null {
  if (!value || typeof value !== "string") return null;

  const [day, month, year] = value.split("/");
  if (!day || !month || !year) return null;

  const date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseFlag(value?: string | null): boolean {
  return String(value ?? "").toUpperCase() === "S";
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export class RealSalesOrderFetchPageGateway
  implements SalesOrderFetchPageGateway
{
  constructor(private readonly omieClient: OmieHttpClientPort) {}

  async fetchPage(
    page: number,
    pageSize: number
  ): Promise<SalesOrderFetchPageResult> {
    const response = await this.omieClient.post<any>("produtos/pedido/", {
      call: "ListarPedidos",
      param: [
        {
          pagina: page,
          registros_por_pagina: pageSize,
        },
      ],
    });

    const pedidos = Array.isArray(response?.pedido_venda_produto)
      ? response.pedido_venda_produto
      : [];

    // ✅ ✅ ✅ ESSA LINHA É O MAIS IMPORTANTE
    const totalPages =
      response?.total_de_paginas != null
        ? Number(response.total_de_paginas)
        : null;

    const mapped = pedidos.map((pedido: any) => {
      const cabecalho = pedido?.cabecalho ?? {};
      const infoCadastro = pedido?.infoCadastro ?? {};
      const totalPedido = pedido?.total_pedido ?? {};
      const det = Array.isArray(pedido?.det) ? pedido.det : [];

      return {
        omieId: String(cabecalho.codigo_pedido),
        orderNumber:
          cabecalho.numero_pedido != null
            ? String(cabecalho.numero_pedido)
            : null,
        stage: String(cabecalho.etapa ?? ""),
        isCanceled: parseFlag(infoCadastro.cancelado),
        isClosed:
          parseFlag(cabecalho.encerrado) ||
          parseFlag(infoCadastro.faturado),

        customerOmieId:
          cabecalho.codigo_cliente != null
            ? String(cabecalho.codigo_cliente)
            : null,

        companyOmieId:
          cabecalho.codigo_empresa != null
            ? String(cabecalho.codigo_empresa)
            : null,

        forecastDate: parseDateBR(cabecalho.data_previsao),
        totalAmount: toNumber(totalPedido.valor_total_pedido),
        rawPayload: pedido,

        items: det
          .map((item: any) => {
            const ide = item?.ide ?? {};
            const produto = item?.produto ?? {};

            if (
              !produto.codigo ||
              !produto.codigo_produto ||
              !ide.codigo_item
            ) {
              return null;
            }

            return {
              omieItemId: String(ide.codigo_item),
              productCode: String(produto.codigo),
              productOmieId: String(produto.codigo_produto),
              description: String(produto.descricao ?? ""),
              unit: produto.unidade ?? null,
              quantity: toNumber(produto.quantidade) ?? 0,
              unitPrice: toNumber(produto.valor_unitario),
              totalPrice: toNumber(produto.valor_total),
              rawPayload: item,
            };
          })
          .filter(Boolean),
      };
    });

    return {
      items: mapped,

      // ✅ LÓGICA DE PAGINAÇÃO IGUAL CATALOGO
      hasNextPage:
        totalPages != null ? page < totalPages : mapped.length > 0,

      // ✅ PROGRESSO REAL
      totalPages,
      currentPage: page,
    };
  }
}