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

  // ✅ cache in-memory (evita REDUNDANT e melhora performance)
  private static cache: { expiresAt: number; value: OrdersStage20Result } | null = null;
  private static readonly CACHE_TTL_MS = 60_000; // 60s (combina com "aguarde 59s")

  async listStage20(): Promise<OrdersStage20Result> {
    if (!this.omieClient) throw new Error("OMIE_CLIENT_NOT_CONFIGURED");

    // ✅ serve cache se estiver válido
    const cached = OmieOrdersStage20Gateway.cache;
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value;
    }

    // tenta 1 vez, e se der REDUNDANT aguarda e tenta mais 1 vez
    const result = await this.tryOnceOrRetryRedundant();

    // grava cache
    OmieOrdersStage20Gateway.cache = {
      value: result,
      expiresAt: Date.now() + OmieOrdersStage20Gateway.CACHE_TTL_MS,
    };

    return result;
  }

  private async tryOnceOrRetryRedundant(): Promise<OrdersStage20Result> {
    try {
      return await this.fetchStage20();
    } catch (err: any) {
      const parsed = this.parseRedundant(err);
      if (parsed.isRedundant) {
        const waitMs = (parsed.retryAfterSeconds + 1) * 1000; // +1s margem
        console.warn("[OMIE ORDERS] REDUNDANT detected, waiting", { waitMs });
        await this.sleep(waitMs);

        // retry único
        return await this.fetchStage20();
      }

      // não é redundante → rethrow
      throw err;
    }
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
        // Se veio um faultstring, jogamos para o catch geral tratar (inclui REDUNDANT)
        const e = new Error(response?.faultstring || response?.error || "Omie orders error");
        (e as any).omie = { response };
        throw e;
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

  private parseRedundant(err: any): { isRedundant: boolean; retryAfterSeconds: number } {
    // Caso 1: erro vindo do seu OmieClient com details.sample (como no log que você colou)
    const sample: string | undefined = err?.details?.sample;
    const msgFromSample = sample ? this.safeExtractFaultstring(sample) : undefined;

    // Caso 2: erro encapsulado manualmente com (e as any).omie.response
    const msgFromOmie = err?.omie?.response?.faultstring;

    // Caso 3: message direto
    const msg = String(msgFromSample || msgFromOmie || err?.message || "");

    const isRedundant = msg.includes("REDUNDANT") || msg.includes("Consumo redundante detectado");
    if (!isRedundant) return { isRedundant: false, retryAfterSeconds: 0 };

    // extrai "Aguarde 59 segundos"
    const m = msg.match(/Aguarde\s+(\d+)\s+segundos/i);
    const seconds = m ? Number(m[1]) : 60;

    return {
      isRedundant: true,
      retryAfterSeconds: Number.isNaN(seconds) ? 60 : seconds,
    };
  }

  private safeExtractFaultstring(sample: string): string | undefined {
    try {
      const j = JSON.parse(sample);
      return j?.faultstring;
    } catch {
      return undefined;
    }
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}