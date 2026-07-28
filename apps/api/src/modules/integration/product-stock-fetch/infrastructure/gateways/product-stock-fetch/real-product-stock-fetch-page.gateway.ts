// ---------------------------------------------------------------------------
// Real Gateway: RealProductStockFetchPageGateway
// Consulta a posição de estoque no Omie via API de estoque/consulta,
// retornando todos os itens da página sem filtrar.
// ---------------------------------------------------------------------------

import { env } from "@/config";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import type {
  ProductStockFetchPageGateway,
  ProductStockFetchPageInput,
  ProductStockFetchPageResult,
} from "../../../application/ports/product-stock-fetch-page.gateway";
import {
  extractQuantity,
  extractProductCode,
  extractStockLocationCode,
} from "../../../application/mappers/map-omie-stock-to-domain";
import {
  isOmieErrorResponse,
  isOmieHttpErrorWithSample,
  mapHttpErrorToOmieError,
} from "@/shared/integration/strategies/omie-error.mapper";

/**
 * Data de hoje no formato DD/MM/YYYY (comum em filtros do Omie).
 */
function getTodayBr(): string {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  return `${day}/${month}/${year}`;
}

export class RealProductStockFetchPageGateway implements ProductStockFetchPageGateway {
  constructor(private readonly omieClient: OmieHttpClientPort) { }

  async fetchPage({ page, pageSize }: ProductStockFetchPageInput): Promise<ProductStockFetchPageResult> {
    const positionDate = getTodayBr();

    const payload = {
      call: "ListarPosEstoque",
      app_key: env.OMIE_APP_KEY,
      app_secret: env.OMIE_APP_SECRET,
      param: [
        {
          nPagina: page,
          nRegPorPagina: pageSize,
          dDataPosicao: positionDate,
          cExibeTodos: "S",
          codigo_local_estoque: 0,
        },
      ],
    };

    let response: any;

    try {
      const apiResponse = await this.omieClient.post<any>(
        "/api/v1/estoque/consulta/",
        payload,
      );

      response =
        apiResponse && typeof apiResponse === "object" && "data" in apiResponse
          ? (apiResponse as any).data
          : apiResponse;
    } catch (httpError) {
      if (isOmieHttpErrorWithSample(httpError)) {
        throw mapHttpErrorToOmieError(httpError);
      }
      throw httpError;
    }

    if (isOmieErrorResponse(response)) {
      throw new Error(
        response?.faultstring || response?.error || "Omie stock API error",
      );
    }

    const items =
      (Array.isArray(response?.produtos) && response.produtos) ||
      (Array.isArray(response?.estoques) && response.estoques) ||
      (Array.isArray(response?.itens) && response.itens) ||
      [];

    const totalPages =
      Number(response?.total_de_paginas) ||
      Number(response?.nTotPaginas) ||
      Number(response?.totalPaginas) ||
      1;

    const mappedItems = items.map((it: any) => {
      const productId = String(extractProductCode(it) ?? "");
      const quantity = extractQuantity(it);
      const breakdown = [
        {
          stockLocationCode: extractStockLocationCode(it),
          quantity,
        },
      ];

      return {
        productId,
        stockQuantity: quantity,
        minimumStock: 0,
        breakdown,
      };
    }).filter((item: any) => item.productId !== "");

    return {
      items: mappedItems,
      hasNext: page < totalPages,
      totalPages,
      currentPage: page,
    };
  }
}
