import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import type {
  SalesOrderFetchPageGateway,
  SalesOrderFetchPageInput,
  SalesOrderFetchPageItem,
  SalesOrderFetchPageResult,
} from "../../../application/ports/sales-order-fetch-page.gateway";

type OmieYesNo = "S" | "N" | "";

type OmieCabecalho = {
  bloqueado?: OmieYesNo;
  codigo_cliente?: number | string;
  codigo_empresa?: number | string;
  codigo_pedido?: number | string;
  data_previsao?: string;
  encerrado?: OmieYesNo;
  etapa?: string;
  numero_pedido?: number | string;
};

type OmieInfoCadastro = {
  cancelado?: OmieYesNo;
  dAlt?: string;
  hAlt?: string;
  faturado?: OmieYesNo;
};

type OmieTotalPedido = {
  valor_total_pedido?: number | string;
};

type OmieDetIde = {
  codigo_item?: number | string;
};

type OmieDetProduto = {
  codigo?: string;
  codigo_produto?: number | string;
  descricao?: string;
  unidade?: string;
  quantidade?: number | string;
  valor_unitario?: number | string;
  valor_total?: number | string;
};

type OmieDet = {
  ide?: OmieDetIde;
  produto?: OmieDetProduto;
};

type OmiePedidoVendaProduto = {
  cabecalho?: OmieCabecalho;
  infoCadastro?: OmieInfoCadastro;
  total_pedido?: OmieTotalPedido;
  det?: OmieDet[];
};

type OmieListarPedidosResponse = {
  pagina?: number | string;
  total_de_paginas?: number | string;
  pedido_venda_produto?: OmiePedidoVendaProduto[];
};

function parseOmieDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;

  const parts = String(dateStr).split("/");
  if (parts.length !== 3) return null;

  const [day, month, year] = parts;
  const date = new Date(`${year}-${month}-${day}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function parseOmieDateTime(dateStr?: string | null, timeStr?: string | null): Date | null {
  if (!dateStr || !timeStr) return null;

  const parts = String(dateStr).split("/");
  if (parts.length !== 3) return null;

  const [day, month, year] = parts;
  const date = new Date(`${year}-${month}-${day}T${timeStr}`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function toNullableString(value: unknown): string | null {
  if (value == null) return null;

  const result = String(value).trim();
  return result.length > 0 ? result : null;
}

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;

  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

function isKeptOrder(
  item: SalesOrderFetchPageItem | null
): item is SalesOrderFetchPageItem {
  return item !== null;
}

export class RealSalesOrderFetchPageGateway implements SalesOrderFetchPageGateway {
  constructor(private readonly omieClient: OmieHttpClientPort) {}

  async fetchPage({
    page,
    pageSize,
    updatedSince,
  }: SalesOrderFetchPageInput): Promise<SalesOrderFetchPageResult> {
    const response = await this.omieClient.post<OmieListarPedidosResponse>(
      "produtos/pedido/",
      {
        call: "ListarPedidos",
        param: [
          {
            pagina: page,
            registros_por_pagina: pageSize,

            // 🔥 filtro principal do processo produtivo
            etapa: "20",
          },
        ],
      }
    );

    const pedidos = Array.isArray(response.pedido_venda_produto)
      ? response.pedido_venda_produto
      : [];

    const items = pedidos
      .map((pedido): SalesOrderFetchPageItem | null => {
        const cabecalho = pedido.cabecalho;
        const infoCadastro = pedido.infoCadastro;
        const totalPedido = pedido.total_pedido;

        if (!cabecalho) {
          return null;
        }

        const isCanceled = infoCadastro?.cancelado === "S";
        const isClosed =
          infoCadastro?.faturado === "S" ||
          cabecalho.encerrado === "S";

        const updatedAt = parseOmieDateTime(infoCadastro?.dAlt, infoCadastro?.hAlt);

        // ✅ filtro incremental real usando última alteração do Omie
        if (updatedSince && updatedAt && updatedAt <= updatedSince) {
          return null;
        }

        // ✅ filtro final no código
        if (isCanceled || isClosed) {
          return null;
        }

        const detalhes = Array.isArray(pedido.det) ? pedido.det : [];

        return {
          omieId: String(cabecalho.codigo_pedido ?? ""),
          orderNumber: toNullableString(cabecalho.numero_pedido),
          stage: String(cabecalho.etapa ?? ""),

          isCanceled,
          isClosed,

          customerOmieId: toNullableString(cabecalho.codigo_cliente),
          companyOmieId: toNullableString(cabecalho.codigo_empresa),

          forecastDate: parseOmieDate(cabecalho.data_previsao),

          totalAmount: toNullableNumber(totalPedido?.valor_total_pedido),

          rawPayload: pedido,

          items: detalhes.map((item) => {
            const ide = item.ide;
            const produto = item.produto;

            return {
              omieItemId: String(ide?.codigo_item ?? ""),
              productCode: String(produto?.codigo ?? ""),
              productOmieId: String(produto?.codigo_produto ?? ""),
              description: String(produto?.descricao ?? ""),
              unit: toNullableString(produto?.unidade),
              quantity: Number(produto?.quantidade ?? 0),
              unitPrice: toNullableNumber(produto?.valor_unitario),
              totalPrice: toNullableNumber(produto?.valor_total),
              rawPayload: item,
            };
          }),
        };
      })
      .filter(isKeptOrder);

    const totalPages = Number(response.total_de_paginas ?? page);
    const currentPage = Number(response.pagina ?? page);

    return {
      items,
      currentPage,
      totalPages: Number.isFinite(totalPages) ? totalPages : null,
      hasNextPage:
        Number.isFinite(currentPage) &&
        Number.isFinite(totalPages) &&
        currentPage < totalPages,
    };
  }
}