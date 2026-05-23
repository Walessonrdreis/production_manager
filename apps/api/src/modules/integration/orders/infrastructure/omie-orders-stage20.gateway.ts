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

  // cache continua sendo bom e reduz chance de REDUNDANT
  private static cache: { expiresAt: number; value: OrdersStage20Result } | null = null;
  private static readonly CACHE_TTL_MS = 60_000;

  async listStage20(): Promise<OrdersStage20Result> {
    if (!this.omieClient) throw new Error("OMIE_CLIENT_NOT_CONFIGURED");

    const cached = OmieOrdersStage20Gateway.cache;
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value;
    }

    const result = await this.fetchStage20();

    OmieOrdersStage20Gateway.cache = {
      value: result,
      expiresAt: Date.now() + OmieOrdersStage20Gateway.CACHE_TTL_MS,
    };

    return result;
  }

  private async fetchStage20(): Promise<OrdersStage20Result> {
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

        if (
          response?.faultstring ||
          response?.error ||
          (response?.codigo_status && response.codigo_status !== "0")
        ) {
          // Se vier faultstring do Omie, propaga como erro
          throw new Error(response?.faultstring || response?.error || "Omie orders error");
        }

        const pedidos = Array.isArray(response?.pedido_venda_produto)
          ? response.pedido_venda_produto
          : [];

        allOrders.push(...pedidos);

        const totalPages =
          Number(response?.total_de_paginas) ||
          Number(response?.nTotPaginas) ||
          Number(response?.totalPaginas) ||
          1;

        if (page >= totalPages || pedidos.length === 0) break;
        page += 1;
      } catch (error: any) {
        // Detecta REDUNDANT vindo do AppError do seu OmieClient
        const sample: string | undefined = error?.details?.sample;
        const msgFromSample = sample ? this.safeExtractFaultstring(sample) : undefined;
        const msg = String(msgFromSample || error?.message || "");

        if (msg.includes("REDUNDANT") || msg.includes("Consumo redundante detectado")) {
          const retryAfter = this.extractRetryAfterSeconds(msg);
          const e: any = new Error(msg);
          e.code = "OMIE_REDUNDANT";
          e.retryAfterSeconds = retryAfter;
          throw e;
        }

        // Propaga o erro original
        throw error;
      }
    }

    const stage20 = allOrders.filter(
      (o) => String(o?.etapa ?? o?.cEtapa ?? "") === "20"
    );

    const normalized = stage20.map((o) => {
      const cab = o?.cabecalho ?? o;

      const omieOrderCode = String(
        cab?.codigo_pedido ??
          o?.codigo_pedido ??
          cab?.cCodigo ??
          o?.cCodigo ??
          ""
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

      const stage = String(
        cab?.etapa ?? cab?.cEtapa ?? o?.etapa ?? o?.cEtapa ?? "20"
      );

      const forecastDate =
        cab?.data_previsao ??
        cab?.dDtPrevisao ??
        o?.data_previsao ??
        o?.dDtPrevisao ??
        null;

      const itens = Array.isArray(o?.det) ? o.det : Array.isArray(o?.itens) ? o.itens : [];

      const items = itens.map((i: any) => {
        const prod = i?.produto ?? i;

        const productCode = String(
          prod?.codigo_produto ?? prod?.nCodProduto ?? prod?.codigo ?? ""
        );

        const description =
          prod?.descricao ?? prod?.cDescricao ?? prod?.descricao_produto ?? null;

        const unit = prod?.unidade ?? prod?.cUnidade ?? null;

        const quantity = Number(i?.quantidade ?? i?.nQtde ?? prod?.quantidade ?? 0);

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

  private safeExtractFaultstring(sample: string): string | undefined {
    try {
      const j = JSON.parse(sample);
      return j?.faultstring;
    } catch {
      return undefined;
    }
  }

  private extractRetryAfterSeconds(msg: string): number {
    const m = msg.match(/Aguarde\s+(\d+)\s+segundos/i);
    const seconds = m ? Number(m[1]) : 60;
    return Number.isNaN(seconds) ? 60 : seconds;
  }
}