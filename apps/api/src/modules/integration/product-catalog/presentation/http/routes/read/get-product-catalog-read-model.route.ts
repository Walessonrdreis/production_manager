import type { FastifyInstance } from "fastify";
import { ProductCatalogIntegrationStore } from "../../../../infrastructure/db/product-catalog-integration.store";
import { GetProductCatalogReadModelUseCase } from "../../../../application/use-cases/get-product-catalog-read-model.usecase";
import { parseBoolean, parseNumber } from "../../../../application/utils/query.utils";

export async function registerGetProductCatalogReadModelRoute(app: FastifyInstance) {
  const useCase = new GetProductCatalogReadModelUseCase(
    new ProductCatalogIntegrationStore()
  );

  app.get("/v1/admin/read/products/catalog", async (request, reply) => {
    const query = request.query as Record<string, unknown>;

    const params = {
      view: query.view as "summary" | "data" | undefined,
      q: query.q ? String(query.q) : null,
      activeOnly: parseBoolean(query.activeOnly, false),
      productCodes: query.productCodes
        ? String(query.productCodes).split(",")
        : null,
      sku: query.sku ? String(query.sku) : null,
      limit: parseNumber(query.limit, 50),
      offset: parseNumber(query.offset, 0),
      sort: (query.sort as any) ?? "description",
      order: (query.order as any) ?? "asc",
      since: query.since ? String(query.since) : null,
      fields: query.fields
        ? String(query.fields).split(",")
        : null,
      includeRaw: parseBoolean(query.includeRaw, false),
    };

    const result = await useCase.execute(params);

    return reply.send({
      success: true,
      ...result,
    });
  });

  app.get("/v1/admin/read/products/catalog/:productCode", async (request, reply) => {
    const { productCode } = request.params as { productCode: string };
    const query = request.query as Record<string, unknown>;

    const data = await useCase.executeByProductCode(productCode, {
      includeRaw: parseBoolean(query.includeRaw, false),
    });

    if (!data) {
      return reply.code(404).send({
        success: false,
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: "Produto n��o encontrado",
          details: { productCode },
        },
      });
    }

    return reply.send({
      success: true,
      data,
    });
  });
}