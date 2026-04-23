// src/modules/products/presentation/http/products.controller.ts
import {
  publicListQuerySchema,
  publicGetByOmieCodeParamsSchema,
  createManagedProductBodySchema,
  createManagedProductsBulkBodySchema,
  managedProductIdParamsSchema,
  managedProductIdUuidParamsSchema,
  patchManagedProductBodySchema,
  stockHistoryQuerySchema,
} from "./products.schemas";

import { AppError } from "@/shared/errors/AppError";
import { ValidationError } from "@/shared/errors/domain-errors"; // ajuste conforme seu arquivo real
import { ok, paginated, markDeprecated, wantsLegacyResponse } from "@/shared/http/response";

export function createProductsController(useCases: {
  listPublicProducts: { execute: (input: any) => Promise<any> };
  getPublicProductByOmieCode: { execute: (input: any) => Promise<any> };

  createManagedProduct: { execute: (input: any) => Promise<any> };
  createManagedProductsBulk: { execute: (input: any) => Promise<any> };
  listManagedProducts: { execute: () => Promise<any[]> };
  getManagedProduct: { execute: (input: any) => Promise<any> };
  patchManagedProduct: { execute: (input: any) => Promise<any> };
  deleteManagedProduct: { execute: (input: any) => Promise<any> };

  getManagedProductStock: { execute: (input: any) => Promise<any> };
  getManagedProductStockHistory: { execute: (input: any) => Promise<any> };
}) {
  return {
    // GET /v1/products
    async publicList(request: any, reply: any) {
      const { q, page, pageSize } = publicListQuerySchema.parse(request.query);
      const { data, meta } = await useCases.listPublicProducts.execute({
        q,
        page,
        pageSize,
        activeOnly: true,
      });

      return reply.send(paginated(data, meta));
    },

    // GET /v1/products/:omieCode
    async publicGetByOmieCode(request: any, reply: any) {
      const { omieCode } = publicGetByOmieCodeParamsSchema.parse(request.params);
      const product = await useCases.getPublicProductByOmieCode.execute({ omieCode });

      if (!product) {
        throw new AppError("PRODUCT_NOT_FOUND", 404, "Product not found");
      }

      return reply.send(ok(product, {}));
    },

    // POST /v1/admin/managed-products
    async createManagedProduct(request: any, reply: any) {
      const parsed = createManagedProductBodySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ValidationError("Corpo da requisição inválido", parsed.error.format());
      }

      const product = await useCases.createManagedProduct.execute(parsed.data);
      return reply.status(201).send(product);
    },

    // POST /v1/admin/managed-products/bulk
    async createManagedProductsBulk(request: any, reply: any) {
      const parsed = createManagedProductsBulkBodySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ValidationError("Corpo da requisição inválido", parsed.error.format());
      }

      const result = await useCases.createManagedProductsBulk.execute(parsed.data);
      return reply.status(201).send(result);
    },

    // GET /v1/admin/managed-products
    async listManagedProducts(request: any, reply: any) {
      const products = await useCases.listManagedProducts.execute();

      if (wantsLegacyResponse(request)) {
        return reply.send({ items: products });
      }

      return reply.send(
        paginated(products, {
          page: 1,
          pageSize: products.length,
          total: products.length,
        })
      );
    },

    // GET /v1/admin/managed-products/:id
    async getManagedProduct(request: any, reply: any) {
      const { id } = managedProductIdParamsSchema.parse(request.params);

      // mantém compatibilidade: se não parece UUID -> 404
      const looksLikeUuid = managedProductIdUuidParamsSchema.safeParse({ id }).success;
      if (!looksLikeUuid) throw new AppError("PRODUCT_NOT_FOUND", 404, "Product not found");

      const product = await useCases.getManagedProduct.execute({ id });
      return reply.send(ok(product));
    },

    // PATCH /v1/admin/managed-products/:id
    async patchManagedProduct(request: any, reply: any) {
      const { id } = managedProductIdUuidParamsSchema.parse(request.params);
      const { data } = patchManagedProductBodySchema.parse(request.body);

      const updated = await useCases.patchManagedProduct.execute({ id, data });
      return reply.send(ok(updated));
    },

    // DELETE /v1/admin/managed-products/:id
    async deleteManagedProduct(request: any, reply: any) {
      const { id } = request.params as { id: string };
      const result = await useCases.deleteManagedProduct.execute({ id });
      return reply.send(result);
    },

    // GET /v1/admin/managed-products/:id/stock
    async getManagedProductStock(request: any, reply: any) {
      const { id } = managedProductIdUuidParamsSchema.parse(request.params);
      const result = await useCases.getManagedProductStock.execute({ id });
      return reply.send(ok(result));
    },

    // GET /v1/admin/managed-products/:id/stock/history
    async getManagedProductStockHistory(request: any, reply: any) {
      const { id } = managedProductIdUuidParamsSchema.parse(request.params);
      const { page, pageSize } = stockHistoryQuerySchema.parse(request.query);

      const result = await useCases.getManagedProductStockHistory.execute({ id, page, pageSize });
      return reply.send(paginated(result.items, result.meta));
    },

    // wrappers deprecated (controlador chama os handlers principais)
    async deprecatedPublicStock(request: any, reply: any) {
      markDeprecated(request, reply, "/v1/products/stock", "/v1/products");
      return this.publicList(request, reply);
    },
  };
}