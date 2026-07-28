import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import type {
  ProductCatalogFetchPageGateway,
  ProductCatalogFetchPageInput,
  ProductCatalogFetchPageResult,
} from "../../../application/ports/product-catalog-fetch-page.gateway";
import {
  isOmieErrorResponse,
  isOmieHttpErrorWithSample,
  mapHttpErrorToOmieError,
} from "@/shared/integration/strategies/omie-error.mapper";
import { getLogger } from "@/shared/logger";

const logger = getLogger("RealProductCatalogFetchPageGateway");

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function extractFaultString(error: any): string {
  const sample = error?.details?.sample;

  if (typeof sample === "string" && sample.trim() !== "") {
    try {
      const parsed = JSON.parse(sample);
      if (typeof parsed?.faultstring === "string") {
        return parsed.faultstring;
      }
    } catch {
      return sample;
    }

    return sample;
  }

  if (typeof error?.message === "string") {
    return error.message;
  }

  return "";
}

export class RealProductCatalogFetchPageGateway
  implements ProductCatalogFetchPageGateway {
  constructor(private readonly omieClient: OmieHttpClientPort) { }

  async fetchPage(
    input: ProductCatalogFetchPageInput
  ): Promise<ProductCatalogFetchPageResult> {
    const { page, pageSize } = input;

    try {
      let response: any;

      try {
        response = await this.omieClient.post<any>("geral/produtos/", {
          call: "ListarProdutos",
          param: [
            {
              pagina: page,
              registros_por_pagina: pageSize,
              apenas_importado_api: "N",
              filtrar_apenas_omiepdv: "N",
            },
          ],
        });
      } catch (httpError) {
        if (isOmieHttpErrorWithSample(httpError)) {
          throw mapHttpErrorToOmieError(httpError);
        }
        throw httpError;
      }

      if (isOmieErrorResponse(response)) {
        throw new Error(
          response?.faultstring || response?.error || "Omie product catalog API error",
        );
      }

      const items = Array.isArray(response?.produto_servico_cadastro)
        ? response.produto_servico_cadastro
        : [];

      const totalPages =
        response?.total_de_paginas != null
          ? Number(response.total_de_paginas)
          : null;

      return {
        items: items.map((item: any) => ({
          productCode: String(item.codigo ?? ""),
          omieId:
            item.codigo_produto != null
              ? String(item.codigo_produto)
              : null,
          sku:
            item.codigo_produto_integracao != null &&
              String(item.codigo_produto_integracao).trim() !== ""
              ? String(item.codigo_produto_integracao)
              : null,
          description: String(item.descricao ?? ""),
          familyDescription:
            item.descricao_familia != null &&
              String(item.descricao_familia).trim() !== ""
              ? String(item.descricao_familia)
              : null,
          active: String(item.inativo ?? "N") !== "S",
          rawPayload: item,
        })),
        hasNextPage:
          totalPages != null
            ? page < totalPages
            : items.length > 0,
        totalPages,
        currentPage: page,
      };
    } catch (error: any) {
      const faultString = extractFaultString(error);
      const normalizedFault = normalizeText(faultString);

      if (normalizedFault.includes("nao existem registros para a pagina")) {
        logger.info("Page end of data", { page });
        return {
          items: [],
          hasNextPage: false,
        };
      }

      throw error;
    }
  }
}