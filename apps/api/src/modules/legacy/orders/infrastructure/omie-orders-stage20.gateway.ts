import { env } from "@/config";
import type { OmieClientWithCircuitBreaker } from "@/shared/integrations/omie/omie-client-with-circuit-breaker";

type OrdersStage20Result = {
  success: true;
  data: {
    orders: Array<{
      omieOrderCode: string;
      stage: string;
      clientCode: string;
      clientName: string;
      forecastDate?: string | null;
      items: Array<{
        productCode: string;
        description?: string | null;
        quantity: number;
        unit?: string | null;
      }>;
    }>;
  };
};

export class OmieOrdersStage20Gateway {
  constructor(private readonly omieClient: OmieClientWithCircuitBreaker) {}

  // Cache para reduzir REDUNDANT
  private static cache: { expiresAt: number; value: OrdersStage20Result } | null = null;
  private static readonly CACHE_TTL_MS = 60_000;

  async listStage20(): Promise<OrdersStage20Result> {
    if (!this.omieClient) throw new Error("OMIE_CLIENT_NOT_CONFIGURED");

    const cached = OmieOrdersStage20Gateway.cache;
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value;
    }

    const result = await this.fetchStage20Paged();

    OmieOrdersStage20Gateway.cache = {
      value: result,
      expiresAt: Date.now() + OmieOrdersStage20Gateway.CACHE_TTL_MS,
    };

    return result;
  }

  private async fetchStage20Paged(): Promise<OrdersStage20Result> {
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

      try {
        const apiResponse = await this.omieClient.post<any>(
          "/api/v1/produtos/pedido/",
          payload
        );

        const response =
          apiResponse && typeof apiResponse === "object" && "data" in apiResponse
            ? (apiResponse as any).data
            : apiResponse;

        // erro lógico no body
        if (
          response?.faultstring ||
          response?.error ||
          (response?.codigo_status && response.codigo_status !== "0")
        ) {
          throw new Error(response?.faultstring || response?.error || "Omie orders body error");
        }

        const pedidos = Array.isArray(response?.pedido_venda_produto)
          ? response.pedido_venda_produto
          : [];

        allOrders.push(...pedidos);

        // total de páginas (defensivo)
        const totalPages =
          Number(response?.total_de_paginas) ||
          Number(response?.nTotPaginas) ||
          Number(response?.totalPaginas) ||
          1;

        if (page >= totalPages || pedidos.length === 0) break;
        page += 1;
      } catch (error: any) {
        // Detecta REDUNDANT no sample do AppError do client (se existir)
        const sample: string | undefined = error?.details?.sample;
        const fault = sample ? safeExtractFaultstring(sample) : undefined;
        const msg = String(fault || error?.message || "");

        if (msg.includes("REDUNDANT") || msg.includes("Consumo redundante detectado")) {
          const retryAfterSeconds = extractRetryAfterSeconds(msg) ?? 60;
          const e: any = new Error(msg);
          e.code = "OMIE_REDUNDANT";
          e.retryAfterSeconds = retryAfterSeconds;
          throw e;
        }

        throw error;
      }
    }

    // ✅ Filtro robusto: etapa pode estar em lugares diferentes no payload
    const stage20 = allOrders.filter((o: any) => {
      const etapa =
        o?.etapa ??
        o?.cEtapa ??
        o?.cabecalho?.etapa ??
        o?.cabecalho?.cEtapa ??
        o?.cabecalho_pedido?.etapa ??
        o?.cabecalho_pedido?.cEtapa ??
        o?.cabecalhoPedido?.etapa ??
        o?.cabecalhoPedido?.cEtapa ??
        null;

      return String(etapa) === "20";
    });

    const normalized = stage20.map((o: any) => {
      const cab =
        o?.cabecalho ??
        o?.cabecalho_pedido ??
        o?.cabecalhoPedido ??
        o;

      const omieOrderCode = String(
        cab?.codigo_pedido ??
          o?.codigo_pedido ??
          cab?.cCodigo ??
          o?.cCodigo ??
          ""
      );

      const stage = String(
        cab?.etapa ??
          cab?.cEtapa ??
          o?.etapa ??
          o?.cEtapa ??
          "20"
      );

      const clientCode = String(
        cab?.codigo_cliente ??
          o?.codigo_cliente ??
          cab?.cCodCliente ??
          o?.cCodCliente ??
          ""
      );

      const clientName = String(
        cab?.razao_social ??
          o?.razao_social ??
          cab?.nome_cliente ??
          o?.nome_cliente ??
          ""
      );

      const forecastDate =
        cab?.data_previsao ??
        cab?.dDtPrevisao ??
        o?.data_previsao ??
        o?.dDtPrevisao ??
        null;

      // itens podem estar em diferentes chaves
      const itens = Array.isArray(o?.det)
        ? o.det
        : Array.isArray(o?.itens)
          ? o.itens
          : Array.isArray(cab?.itens)
            ? cab.itens
            : [];

      const items = itens.map((i: any) => {
        const prod = i?.produto ?? i;

        const productCode = String(
          prod?.codigo_produto ??
            prod?.nCodProduto ??
            prod?.codigo ??
            prod?.cCodigo ??
            ""
        );

        const description =
          prod?.descricao ??
          prod?.cDescricao ??
          prod?.descricao_produto ??
          null;

        const unit = prod?.unidade ?? prod?.cUnidade ?? null;

        const quantity = Number(
          i?.quantidade ??
            i?.nQtde ??
            prod?.quantidade ??
            prod?.nQtde ??
            0
        );

        return {
          productCode,
          description,
          unit,
          quantity: Number.isNaN(quantity) ? 0 : quantity,
        };
      });

      return {
        omieOrderCode,
        stage,
        clientCode,
        clientName,
        forecastDate,
        items,
      };
    });

    return { success: true, data: { orders: normalized } };
  }
}

function safeExtractFaultstring(sample: string): string | undefined {
  try {
    const j = JSON.parse(sample);
    return j?.faultstring;
  } catch {
    return undefined;
  }
}

function extractRetryAfterSeconds(msg: string): number | null {
  const m = msg.match(/Aguarde\s+(\d+)\s+segundos/i);
  if (!m) return null;
  const s = Number(m[1]);
  return Number.isNaN(s) ? null : s;
}