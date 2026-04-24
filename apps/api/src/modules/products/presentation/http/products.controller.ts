// src/modules/products/presentation/http/products.controller.ts
import { z } from "zod";
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
import { ValidationError } from "@/shared/errors/domain-errors";
import { ok, paginated, markDeprecated, wantsLegacyResponse } from "@/shared/http/response";

export function createProductsController(useCases: any) {
  return {
    // -------------------------------------------------------------------------
    // PUBLIC
    // -------------------------------------------------------------------------
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

    async publicGetByOmieCode(request: any, reply: any) {
      const { omieCode } = publicGetByOmieCodeParamsSchema.parse(request.params);
      const product = await useCases.getPublicProductByOmieCode.execute({ omieCode });

      if (!product) throw new AppError("PRODUCT_NOT_FOUND", 404, "Product not found");
      return reply.send(ok(product, {}));
    },

    // -------------------------------------------------------------------------
    // MANAGED (ADMIN)
    // -------------------------------------------------------------------------
    async createManagedProduct(request: any, reply: any) {
      const parsed = createManagedProductBodySchema.safeParse(request.body);
      if (!parsed.success) throw new ValidationError("Corpo da requisição inválido", parsed.error.format());

      const product = await useCases.createManagedProduct.execute(parsed.data);
      return reply.status(201).send(product);
    },

    async createManagedProductsBulk(request: any, reply: any) {
      const parsed = createManagedProductsBulkBodySchema.safeParse(request.body);
      if (!parsed.success) throw new ValidationError("Corpo da requisição inválido", parsed.error.format());

      const result = await useCases.createManagedProductsBulk.execute(parsed.data);
      return reply.status(201).send(result);
    },

    async listManagedProducts(request: any, reply: any) {
      const products = await useCases.listManagedProducts.execute();

      if (wantsLegacyResponse(request)) return reply.send({ items: products });

      return reply.send(
        paginated(products, { page: 1, pageSize: products.length, total: products.length })
      );
    },

    async getManagedProduct(request: any, reply: any) {
      const { id } = managedProductIdParamsSchema.parse(request.params);

      const looksLikeUuid = managedProductIdUuidParamsSchema.safeParse({ id }).success;
      if (!looksLikeUuid) throw new AppError("PRODUCT_NOT_FOUND", 404, "Product not found");

      const product = await useCases.getManagedProduct.execute({ id });
      return reply.send(ok(product));
    },

    async patchManagedProduct(request: any, reply: any) {
      const { id } = managedProductIdUuidParamsSchema.parse(request.params);
      const { data } = patchManagedProductBodySchema.parse(request.body);

      const updated = await useCases.patchManagedProduct.execute({ id, data });
      return reply.send(ok(updated));
    },

    async deleteManagedProduct(request: any, reply: any) {
      const { id } = request.params as { id: string };
      const result = await useCases.deleteManagedProduct.execute({ id });
      return reply.send(result);
    },

    async getManagedProductStock(request: any, reply: any) {
      const { id } = managedProductIdUuidParamsSchema.parse(request.params);
      const result = await useCases.getManagedProductStock.execute({ id });
      return reply.send(ok(result));
    },

    async getManagedProductStockHistory(request: any, reply: any) {
      const { id } = managedProductIdUuidParamsSchema.parse(request.params);
      const { page, pageSize } = stockHistoryQuerySchema.parse(request.query);

      const result = await useCases.getManagedProductStockHistory.execute({ id, page, pageSize });
      return reply.send(paginated(result.items, result.meta));
    },

    // -------------------------------------------------------------------------
    // ADMIN / OMIE - SYNC PRODUCTS (status + execute)
    // -------------------------------------------------------------------------
    async syncOmieProducts(request: any, reply: any) {
      const query = (request.query ?? {}) as any;
      const force =
        String(query.force ?? "").trim().toLowerCase() === "true" ||
        String(query.force ?? "").trim() === "1";

      const requestId = request.requestId ?? `http-${Date.now()}`;
      const result = await useCases.syncOmieProducts.execute({ requestId, force });

      return reply.send({ data: result });
    },

    async syncOmieProductsInfo(_request: any, reply: any) {
      return reply.send(
        ok({
          ok: true,
          module: "products",
          operation: "omie-products-sync",
          description: "Sincronização do catálogo de produtos da Omie para o banco local.",
          howToRun: {
            method: "POST",
            endpoint: "/v1/admin/omie/sync/products",
            idempotent: true,
            lockStrategy: "exclusive",
            queryParams: {
              force: {
                type: "boolean",
                optional: true,
                description: "Força a sincronização mesmo dentro da janela de throttle.",
              },
            },
          },
          status: { running: false, locked: false, lockedUntil: null },
          lastExecution: {
            supported: false,
            note: "Ainda não há persistência de histórico de execução (último sucesso/erro).",
          },
          behavior: {
            onSuccess: "Produtos Omie são criados ou atualizados no banco local.",
            onLocked: "Retorna reason=LOCKED sem executar nova sincronização.",
            onThrottle: "Retorna reason=SYNC_THROTTLED quando executado dentro da janela mínima.",
            onError: "Retorna AppError com código específico e status HTTP apropriado.",
          },
        })
      );
    },

    // -------------------------------------------------------------------------
    // ADMIN / OMIE - READ (compat legacy)
    // -------------------------------------------------------------------------

    // GET /v1/admin/omie/products
    async adminOmieProductsList(request: any, reply: any) {
      const querySchema = z.object({
        search: z.string().optional(),
        family: z.string().optional(),
        page: z.coerce.number().min(1).default(1),
        pageSize: z.coerce.number().min(1).max(5000).default(50),
      });

      const { search, family, page, pageSize } = querySchema.parse(request.query);

      const { items, stockUpdatedAt } = await useCases.getOmieProducts.execute();

      const normalizedSearch = search?.trim().toLowerCase();
      const normalizedFamily = family?.trim().toLowerCase();

      const filteredItems = items.filter((item: any) => {
        const matchesSearch = normalizedSearch
          ? [item.description, item.sku, item.code, item.omieId, item.familyDescription]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(normalizedSearch))
          : true;

        const matchesFamily = normalizedFamily
          ? String(item.familyDescription ?? "").toLowerCase().includes(normalizedFamily)
          : true;

        return matchesSearch && matchesFamily;
      });

    const familySet = new Set<string>();

for (const item of items) {
  const v = typeof item.familyDescription === "string" ? item.familyDescription.trim() : "";
  if (v) familySet.add(v);
}

const families = Array.from(familySet).sort((a, b) => a.localeCompare(b));

      const pagedItems = family
        ? filteredItems
        : filteredItems.slice((page - 1) * pageSize, page * pageSize);

      const pageUsed = family ? 1 : page;
      const pageSizeUsed = family ? pagedItems.length : pageSize;

      if (wantsLegacyResponse(request)) {
        return reply.send({
          items: pagedItems,
          total: filteredItems.length,
          families,
          stockCacheUpdatedAt: stockUpdatedAt,
        });
      }

      return reply.send(
        paginated(pagedItems, {
          page: pageUsed,
          pageSize: pageSizeUsed,
          total: filteredItems.length,
          families,
          stockCacheUpdatedAt: stockUpdatedAt,
        } as any)
      );
    },

    // GET /v1/admin/omie/categories
    async adminOmieCategories(request: any, reply: any) {
      const querySchema = z.object({ q: z.string().optional() });
      const { q } = querySchema.parse(request.query);

      const result = await useCases.listOmieCategories.execute({ q });
      return reply.send(ok(result.families, { total: result.families.length }));
    },

    // GET /v1/admin/omie/products/search
    async adminOmieProductsSearch(request: any, reply: any) {
      const querySchema = z.object({
        q: z.string().trim().min(1, "q is required"),
        page: z.coerce.number().min(1).default(1),
        pageSize: z.coerce.number().min(1).default(20),
      });

      const { q, page, pageSize } = querySchema.parse(request.query);
      const result = await useCases.searchOmieProducts.execute({ q, page, pageSize });

      return reply.send(
        paginated(result.items, { page: result.page, pageSize: result.pageSize, total: result.total })
      );
    },

    // GET /v1/admin/omie/products/:id
    async adminOmieProductById(request: any, reply: any) {
      const paramsSchema = z.object({ id: z.string().uuid() });
      const querySchema = z.object({ includeRaw: z.coerce.boolean().optional().default(false) });

      const { id } = paramsSchema.parse(request.params);
      const { includeRaw } = querySchema.parse(request.query);

      const result = await useCases.getOmieProductById.execute({ id, includeRaw });
      return reply.send(ok(result.data));
    },

    // GET /v1/admin/omie/products/by-code/:omieCode
    async adminOmieProductByCode(request: any, reply: any) {
      const paramsSchema = z.object({ omieCode: z.string().min(1) });
      const querySchema = z.object({ includeRaw: z.coerce.boolean().optional().default(false) });

      const { omieCode } = paramsSchema.parse(request.params);
      const { includeRaw } = querySchema.parse(request.query);

      const result = await useCases.getOmieProductByCode.execute({ omieCode, includeRaw });
      return reply.send(ok(result.data));
    },

    // GET /v1/admin/omie/products/:id/stock
    async adminOmieProductStockById(request: any, reply: any) {
      const paramsSchema = z.object({ id: z.string().uuid() });
      const { id } = paramsSchema.parse(request.params);

      const result = await useCases.getOmieProductStock.byOmieProductId({ id });
      return reply.send(ok(result));
    },

    // GET /v1/admin/omie/products/by-code/:omieCode/stock
    async adminOmieProductStockByCode(request: any, reply: any) {
      const paramsSchema = z.object({ omieCode: z.string().min(1) });
      const { omieCode } = paramsSchema.parse(request.params);

      const result = await useCases.getOmieProductStock.byOmieCode({ omieCode });
      return reply.send(ok(result));
    },

    // GET /v1/admin/omie/stock
    async adminOmieStockInfo(_request: any, reply: any) {
      const data = await useCases.getOmieStockInfo.execute();
      return reply.send(ok(data));
    },

    // POST /v1/admin/omie/products/stock/refresh
    async adminOmieStockRefresh(request: any, reply: any) {
      const querySchema = z.object({ dryRun: z.string().optional() });
      const { dryRun } = querySchema.parse(request.query);

      const isDryRun = dryRun?.trim() === "1" || dryRun?.trim().toLowerCase() === "true";
      const capturedAt = new Date().toISOString();

      const result = await useCases.refreshStock.execute({ dryRun: isDryRun });
      return reply.send(ok({ insertedCount: result.insertedCount, capturedAt }, result.meta));
    },

    // -------------------------------------------------------------------------
    // wrappers deprecated
    // -------------------------------------------------------------------------
    async deprecatedPublicStock(request: any, reply: any) {
      markDeprecated(request, reply, "/v1/products/stock", "/v1/products");
      return this.publicList(request, reply);
    },
  };
}