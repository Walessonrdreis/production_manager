import type { FastifyInstance } from "fastify";

import { GetProductCatalogProductionReadyUseCase } from "../../../../application/use-cases/get-product-catalog-production-ready.usecase";
import {
  parseBoolean,
  parseNumber,
} from "../../../../application/utils/query.utils";

export async function registerGetProductCatalogProductionReadyRoute(
  app: FastifyInstance
) {
  const useCase = new GetProductCatalogProductionReadyUseCase();

  app.get("/v1/integration/product-catalog/read/production-ready", async (request, reply) => {
    const query = request.query as Record<string, unknown>;

    const params = {
      q: query.q ? String(query.q) : null,

      // ✅ DEFAULT AJUSTADO (ANTES ERA TRUE)
      onlyActive: parseBoolean(query.onlyActive, false),

      onlyInStock: parseBoolean(query.onlyInStock, false),

      minStock: parseNumber(query.minStock, 0),

      limit: parseNumber(query.limit, 100),
      offset: parseNumber(query.offset, 0),

      sort:
        (query.sort as
          | "description"
          | "productCode"
          | "stock"
          | "lastSyncAt"
          | undefined) ?? "description",

      order: (query.order as "asc" | "desc" | undefined) ?? "asc",

      // ✅ DEFAULT AJUSTADO (ANTES ERA TRUE)
      withAvailability: parseBoolean(query.withAvailability, false),
      onlyWithOpenOrders: parseBoolean(query.onlyWithOpenOrders, false),
    };

    const result = await useCase.execute(params);

    return reply.send({
      success: true,

      // ✅ mantém retorno padrão
      summary: result.summary,
      meta: result.meta,

      // ✅ melhora observabilidade (opcional mas recomendado)
      isDataFullyReady: result.summary.available > 0,

      data: result.data,
    });
  });
}