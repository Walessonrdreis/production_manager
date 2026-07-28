import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { OMIE_ENDPOINTS } from "@/shared/integrations/omie/omie.constants";
import {
  mapSalesOrder,
  isKeptSalesOrder,
  type OmieListarPedidosResponse,
  type MappedSalesOrder,
} from "@/shared/integrations/omie/OmieSalesOrderAdapter";
import type {
  SalesOrderFetchPageGateway,
  SalesOrderFetchPageInput,
  SalesOrderFetchPageItem,
  SalesOrderFetchPageResult,
} from "../../../application/ports/sales-order-fetch-page.gateway";
import {
  isOmieErrorResponse,
  isRedundantFault,
  buildOmieFaultError,
  buildOmieRedundantError,
  isOmieHttpErrorWithSample,
  mapHttpErrorToOmieError,
} from "@/shared/integration/strategies/omie-error.mapper";

export class RealSalesOrderFetchPageGateway implements SalesOrderFetchPageGateway {
  constructor(private readonly omieClient: OmieHttpClientPort) { }

  async fetchPage({
    page,
    pageSize,
    updatedSince,
  }: SalesOrderFetchPageInput): Promise<SalesOrderFetchPageResult> {
    let response: OmieListarPedidosResponse;
    try {
      response = await this.omieClient.post<OmieListarPedidosResponse>(
        OMIE_ENDPOINTS.SALES_ORDERS_PRODUCTS.path,
        {
          call: OMIE_ENDPOINTS.SALES_ORDERS_PRODUCTS.call,
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
    } catch (error: unknown) {
      // 🔥 Mapear OMIE_HTTP_ERROR com sample JSON para erros Omie
      if (isOmieHttpErrorWithSample(error)) {
        const mapped = mapHttpErrorToOmieError(error);
        if (mapped) throw mapped;
      }
      throw error;
    }

    // 🔥 Verificar erro semântico na resposta (faultstring / status = "error")
    if (isOmieErrorResponse(response)) {
      const faultstring = String((response as any).faultstring ?? "");
      if (isRedundantFault(faultstring)) {
        throw buildOmieRedundantError(faultstring, response);
      }
      throw buildOmieFaultError(faultstring || "Unknown Omie error", response);
    }

    const pedidos = Array.isArray(response.pedido_venda_produto)
      ? response.pedido_venda_produto
      : [];

    const mapped = pedidos
      .map((p) => mapSalesOrder(p))
      .filter((m): m is MappedSalesOrder => isKeptSalesOrder(m, updatedSince));

    const items: SalesOrderFetchPageItem[] = mapped;

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