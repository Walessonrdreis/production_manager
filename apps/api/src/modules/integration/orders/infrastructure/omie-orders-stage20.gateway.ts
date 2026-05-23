import { env } from "@/config";
import type { OmieClientWithCircuitBreaker } from "@/shared/integrations/omie/omie-client-with-circuit-breaker";

/**
 * Gateway Omie - Pedidos (Stage 20)
 *
 * Importante:
 * - O Omie pode responder erro em nível HTTP (4xx/5xx) e o client encapsula isso.
 * - Este gateway expõe a mensagem real do erro para não ficar preso em "Omie retornou erro HTTP".
 * - Não vaza payload Omie para fora: normaliza para um formato mínimo consumível.
 */
export class OmieOrdersStage20Gateway {
  constructor(private readonly omieClient: OmieClientWithCircuitBreaker) {}

  async listStage20(): Promise<{
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
  }> {
    if (!this.omieClient) {
      throw new Error("OMIE_CLIENT_NOT_CONFIGURED");
    }

    try {
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
              // ⚠️ não forçamos etapa aqui para não arriscar "campo inválido" se o Omie do cliente variar.
              // Se você confirmar no retorno do Omie que existe filtro por etapa, a gente coloca depois.
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

        // Erro lógico retornado pelo Omie no body
        if (
          response?.faultstring ||
          response?.error ||
          (response?.codigo_status && response.codigo_status !== "0")
        ) {
          console.error("[OMIE ORDERS ERROR BODY]", response);
          throw new Error(
            response?.faultstring || response?.error || "Omie orders body error"
          );
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

      // Stage 20 (pedido liberado para produção – não “fechado”)
      const stage20 = allOrders.filter((o) => String(o?.etapa ?? o?.cEtapa ?? "") === "20");

      const normalized = stage20.map((o) => {
        const cab = o?.cabecalho ?? o?.cabecalho_pedido ?? o?.cabecalhoPedido ?? o;

        const omieOrderCode = String(
          cab?.codigo_pedido ??
            cab?.cCodigo ??
            o?.codigo_pedido ??
            o?.cCodigo ??
            ""
        );

        const stage = String(
          cab?.etapa ?? cab?.cEtapa ?? o?.etapa ?? o?.cEtapa ?? "20"
        );

        const clientCode = String(
          cab?.codigo_cliente ?? cab?.cCodCliente ?? o?.codigo_cliente ?? o?.cCodCliente ?? ""
        );

        const clientName = String(
          cab?.razao_social ??
            cab?.nome_cliente ??
            o?.razao_social ??
            o?.nome_cliente ??
            ""
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
            prod?.codigo_produto ?? prod?.nCodProduto ?? prod?.codigo ?? prod?.cCodigo ?? ""
          );

          const description = prod?.descricao ?? prod?.cDescricao ?? prod?.descricao_produto ?? null;

          const unit = prod?.unidade ?? prod?.cUnidade ?? null;

          const quantity = Number(
            i?.quantidade ?? i?.nQtde ?? prod?.quantidade ?? prod?.nQtde ?? 0
          );

          return {
            productCode,
            description,
            quantity: Number.isNaN(quantity) ? 0 : quantity,
            unit,
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

      return {
        success: true,
        data: {
          orders: normalized,
        },
      };
    } catch (error: unknown) {
      // 🔥 Aqui é onde a gente desmascara "Omie retornou erro HTTP"
      console.error("[OMIE ORDERS ERROR FULL]", error);

      let message = "Omie orders unknown error";

      if (typeof error === "object" && error !== null) {
        const anyErr = error as any;

        // Muitos clients HTTP guardam status e body aqui
        const status = anyErr?.response?.status ?? anyErr?.status;
        const data = anyErr?.response?.data ?? anyErr?.data;

        if (data?.faultstring) message = data.faultstring;
        else if (data?.error) message = data.error;
        else if (anyErr?.message) message = anyErr.message;

        if (status) {
          console.error("[OMIE ORDERS HTTP STATUS]", status);
        }
        if (data) {
          console.error("[OMIE ORDERS HTTP DATA]", JSON.stringify(data, null, 2));
        }
      }

      throw new Error(message);
    }
  }
}