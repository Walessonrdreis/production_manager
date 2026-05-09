'use strict';

require('dotenv/config');
var Fastify = require('fastify');
var cors = require('@fastify/cors');
var crypto = require('crypto');
var zod = require('zod');
var contracts = require('@shared/contracts');
var client = require('@prisma/client');
var cron = require('node-cron');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var Fastify__default = /*#__PURE__*/_interopDefault(Fastify);
var cors__default = /*#__PURE__*/_interopDefault(cors);
var crypto__default = /*#__PURE__*/_interopDefault(crypto);
var cron__default = /*#__PURE__*/_interopDefault(cron);

// src/server.ts
var envSchema = zod.z.object({
  // Core
  DATABASE_URL: zod.z.string().min(1),
  PORT: zod.z.coerce.number().default(3333),
  CORS_ORIGIN: zod.z.string().default(""),
  // Omie
  OMIE_APP_KEY: zod.z.string().min(1),
  OMIE_APP_SECRET: zod.z.string().min(1),
  OMIE_BASE_URL: zod.z.string().url(),
  // Jobs
  ENABLE_STOCK_REFRESH_JOB: zod.z.coerce.boolean().default(false),
  STOCK_REFRESH_CRON: zod.z.string().default("*/5 * * * *"),
  ENABLE_OMIE_PRODUCT_SYNC_JOB: zod.z.coerce.boolean().default(false),
  OMIE_PRODUCT_SYNC_CRON: zod.z.string().default("*/30 * * * *"),
  OMIE_ORDERS_STAGE_SYNC: zod.z.coerce.boolean().default(false),
  OMIE_ORDERS_STAGE20_CRON: zod.z.string().default("*/10 * * * *"),
  ENABLE_OMIE_CLIENT_SYNC_JOB: zod.z.coerce.boolean().default(false),
  OMIE_CLIENT_SYNC_CRON: zod.z.string().default("*/10 * * * *")
});
var parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("\u274C Invalid environment variables:");
  console.error(parsed.error.format());
  throw new Error("Invalid environment configuration");
}
var env = parsed.data;

// src/shared/http/response.ts
function ok(data, meta, links) {
  const response = { data };
  if (meta !== void 0) response.meta = meta;
  return response;
}
function paginated(data, meta, links) {
  const response = { data, meta };
  if (links && Object.keys(links).length > 0) {
    response.links = links;
  }
  return response;
}
function wantsLegacyResponse(request) {
  const headerValue = request.headers["x-response-format"];
  const normalized = typeof headerValue === "string" ? headerValue : Array.isArray(headerValue) ? headerValue[0] : void 0;
  return normalized?.trim().toLowerCase() === "legacy";
}
function wantsPrettyResponse(request) {
  const q = request.query?.pretty;
  if (String(q ?? "").trim().toLowerCase() === "true") return true;
  const headerValue = request.headers["x-pretty"];
  const normalized = typeof headerValue === "string" ? headerValue : Array.isArray(headerValue) ? headerValue[0] : void 0;
  return normalized?.trim().toLowerCase() === "true";
}
function sendOk(request, reply, data, meta, links) {
  const payload = ok(data, meta);
  if (wantsPrettyResponse(request)) {
    reply.type("application/json; charset=utf-8");
    return reply.send(JSON.stringify(payload, null, 2));
  }
  return reply.send(payload);
}
function markDeprecated(request, reply, legacyPath, replacementPath, sunsetIso) {
  reply.header("Deprecation", "true");
  const resolvedSunset = process.env.DEPRECATION_SUNSET ?? "2026-12-31T00:00:00.000Z";
  reply.header("Sunset", resolvedSunset);
  if (process.env.NODE_ENV === "test") return;
  request.log?.warn?.(
    {
      legacyPath,
      replacementPath,
      requestId: request.requestId
    },
    `deprecated endpoint used: ${legacyPath}`
  );
}

// src/modules/products/presentation/http/products.routes.ts
async function registerProductsRoutes(app, controller) {
  app.get("/v1/products", controller.publicList);
  app.get("/v1/products/:omieCode([A-Za-z0-9]{1,64})", controller.publicGetByOmieCode);
  app.get("/v1/products/stock", async (request, reply) => {
    markDeprecated(request, reply, "/v1/products/stock", "/v1/products");
    return controller.publicList(request, reply);
  });
  app.post("/v1/admin/managed-products", controller.createManagedProduct);
  app.post("/v1/admin/products", async (request, reply) => {
    markDeprecated(request, reply, "/v1/admin/products (POST)", "/v1/admin/managed-products (POST)");
    return controller.createManagedProduct(request, reply);
  });
  app.post("/v1/products", async (request, reply) => {
    markDeprecated(request, reply, "/v1/products (POST)", "/v1/admin/managed-products (POST)");
    return controller.createManagedProduct(request, reply);
  });
  app.post("/v1/admin/managed-products/bulk", controller.createManagedProductsBulk);
  app.post("/v1/admin/products/bulk", async (request, reply) => {
    markDeprecated(request, reply, "/v1/admin/products/bulk (POST)", "/v1/admin/managed-products/bulk (POST)");
    return controller.createManagedProductsBulk(request, reply);
  });
  app.post("/v1/products/bulk", async (request, reply) => {
    markDeprecated(request, reply, "/v1/products/bulk (POST)", "/v1/admin/managed-products/bulk (POST)");
    return controller.createManagedProductsBulk(request, reply);
  });
  app.get("/v1/admin/managed-products", controller.listManagedProducts);
  app.get("/v1/admin/products", async (request, reply) => {
    markDeprecated(request, reply, "/v1/admin/products (GET)", "/v1/admin/managed-products (GET)");
    return controller.listManagedProducts(request, reply);
  });
  app.get("/v1/products/managed", async (request, reply) => {
    markDeprecated(request, reply, "/v1/products/managed", "/v1/admin/managed-products");
    return controller.listManagedProducts(request, reply);
  });
  app.get("/v1/admin/managed-products/:id", controller.getManagedProduct);
  app.get("/v1/admin/products/:id", async (request, reply) => {
    markDeprecated(request, reply, "/v1/admin/products/:id (GET)", "/v1/admin/managed-products/:id (GET)");
    return controller.getManagedProduct(request, reply);
  });
  app.get("/v1/products/:id", async (request, reply) => {
    markDeprecated(request, reply, "/v1/products/:id", "/v1/admin/managed-products/:id");
    return controller.getManagedProduct(request, reply);
  });
  app.patch("/v1/admin/managed-products/:id", controller.patchManagedProduct);
  app.patch("/v1/admin/products/:id", async (request, reply) => {
    markDeprecated(request, reply, "/v1/admin/products/:id (PATCH)", "/v1/admin/managed-products/:id (PATCH)");
    return controller.patchManagedProduct(request, reply);
  });
  app.patch("/v1/products/:id", async (request, reply) => {
    markDeprecated(request, reply, "/v1/products/:id (PATCH)", "/v1/admin/managed-products/:id (PATCH)");
    return controller.patchManagedProduct(request, reply);
  });
  app.delete("/v1/admin/managed-products/:id", controller.deleteManagedProduct);
  app.delete("/v1/admin/products/:id", async (request, reply) => {
    markDeprecated(request, reply, "/v1/admin/products/:id (DELETE)", "/v1/admin/managed-products/:id (DELETE)");
    return controller.deleteManagedProduct(request, reply);
  });
  app.delete("/v1/products/:id", async (request, reply) => {
    markDeprecated(request, reply, "/v1/products/:id (DELETE)", "/v1/admin/managed-products/:id (DELETE)");
    return controller.deleteManagedProduct(request, reply);
  });
  app.get("/v1/admin/managed-products/:id/stock", controller.getManagedProductStock);
  app.get("/v1/admin/products/:id/stock", async (request, reply) => {
    markDeprecated(request, reply, "/v1/admin/products/:id/stock (GET)", "/v1/admin/managed-products/:id/stock (GET)");
    return controller.getManagedProductStock(request, reply);
  });
  app.get("/v1/products/:id/stock", async (request, reply) => {
    markDeprecated(request, reply, "/v1/products/:id/stock", "/v1/admin/managed-products/:id/stock");
    return controller.getManagedProductStock(request, reply);
  });
  app.get("/v1/admin/managed-products/:id/stock/history", controller.getManagedProductStockHistory);
  app.get("/v1/admin/products/:id/stock/history", async (request, reply) => {
    markDeprecated(
      request,
      reply,
      "/v1/admin/products/:id/stock/history (GET)",
      "/v1/admin/managed-products/:id/stock/history (GET)"
    );
    return controller.getManagedProductStockHistory(request, reply);
  });
  app.get("/v1/products/:id/stock/history", async (request, reply) => {
    markDeprecated(
      request,
      reply,
      "/v1/products/:id/stock/history",
      "/v1/admin/managed-products/:id/stock/history"
    );
    return controller.getManagedProductStockHistory(request, reply);
  });
  app.get("/v1/admin/omie/sync/products", controller.syncOmieProductsInfo);
  app.post("/v1/admin/omie/sync/products", controller.syncOmieProducts);
  app.get("/v1/admin/omie/products", controller.adminOmieProductsList);
  app.get("/v1/admin/omie/categories", controller.adminOmieCategories);
  app.get("/v1/admin/omie/products/search", controller.adminOmieProductsSearch);
  app.get("/v1/admin/omie/products/:id", controller.adminOmieProductById);
  app.get("/v1/admin/omie/products/by-code/:omieCode", controller.adminOmieProductByCode);
  app.get("/v1/admin/omie/products/:id/stock", controller.adminOmieProductStockById);
  app.get("/v1/admin/omie/products/by-code/:omieCode/stock", controller.adminOmieProductStockByCode);
  app.get("/v1/admin/omie/stock", controller.adminOmieStockInfo);
  app.post("/v1/admin/omie/products/stock/refresh", controller.adminOmieStockRefresh);
  app.get("/v1/omie/products", async (req, rep) => {
    markDeprecated(req, rep, "/v1/omie/products", "/v1/admin/omie/products");
    return controller.adminOmieProductsList(req, rep);
  });
  app.get("/v1/omie/categories", async (req, rep) => {
    markDeprecated(req, rep, "/v1/omie/categories", "/v1/admin/omie/categories");
    return controller.adminOmieCategories(req, rep);
  });
  app.get("/v1/omie/products/search", async (req, rep) => {
    markDeprecated(req, rep, "/v1/omie/products/search", "/v1/admin/omie/products/search");
    return controller.adminOmieProductsSearch(req, rep);
  });
  app.get("/v1/omie/stock", async (req, rep) => {
    markDeprecated(req, rep, "/v1/omie/stock", "/v1/admin/omie/stock");
    return controller.adminOmieStockInfo(req, rep);
  });
  app.post("/v1/omie/products/stock/refresh", async (req, rep) => {
    markDeprecated(req, rep, "/v1/omie/products/stock/refresh", "/v1/admin/omie/products/stock/refresh");
    return controller.adminOmieStockRefresh(req, rep);
  });
  app.get("/v1/omie/products/:id", async (req, rep) => {
    markDeprecated(req, rep, "/v1/omie/products/:id", "/v1/admin/omie/products/:id");
    return controller.adminOmieProductById(req, rep);
  });
  app.get("/v1/omie/products/by-code/:omieCode", async (req, rep) => {
    markDeprecated(req, rep, "/v1/omie/products/by-code/:omieCode", "/v1/admin/omie/products/by-code/:omieCode");
    return controller.adminOmieProductByCode(req, rep);
  });
  app.get("/v1/omie/products/:id/stock", async (req, rep) => {
    markDeprecated(req, rep, "/v1/omie/products/:id/stock", "/v1/admin/omie/products/:id/stock");
    return controller.adminOmieProductStockById(req, rep);
  });
  app.get("/v1/omie/products/by-code/:omieCode/stock", async (req, rep) => {
    markDeprecated(req, rep, "/v1/omie/products/by-code/:omieCode/stock", "/v1/admin/omie/products/by-code/:omieCode/stock");
    return controller.adminOmieProductStockByCode(req, rep);
  });
}
var publicListQuerySchema = zod.z.object({
  q: zod.z.string().optional(),
  page: zod.z.coerce.number().min(1).default(1),
  pageSize: zod.z.coerce.number().min(1).max(200).default(50)
});
var publicGetByOmieCodeParamsSchema = zod.z.object({
  omieCode: zod.z.string().trim().min(1)
});
var managedProductIdParamsSchema = zod.z.object({
  id: zod.z.string()
});
var managedProductIdUuidParamsSchema = zod.z.object({
  id: zod.z.string().uuid()
});
var createManagedProductBodySchema = contracts.CreateProductInputSchema;
var createManagedProductsBulkBodySchema = zod.z.object({
  omieProductIds: zod.z.array(zod.z.string().uuid()).min(1).max(5e3)
});
var patchManagedProductBodySchema = zod.z.object({
  data: zod.z.object({
    nickname: zod.z.string().trim().min(1).optional(),
    active: zod.z.boolean().optional()
  }).refine((value) => value.nickname !== void 0 || value.active !== void 0, {
    message: "At least one field is required"
  })
});
var stockHistoryQuerySchema = zod.z.object({
  page: zod.z.coerce.number().min(1).default(1),
  pageSize: zod.z.coerce.number().min(1).default(50)
});

// src/shared/errors/AppError.ts
var AppError = class extends Error {
  code;
  statusCode;
  details;
  constructor(code, statusCode, message, details) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
};

// src/shared/errors/http-errors.ts
var ErrorCodes = {
  MISSING_DEFAULT_SECTOR: "MISSING_DEFAULT_SECTOR",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT"};

// src/shared/errors/domain-errors.ts
var AppError2 = class extends Error {
  code;
  statusCode;
  details;
  constructor(code, statusCode, message, details) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
};
var NotFoundError = class extends AppError2 {
  constructor(resource) {
    super(ErrorCodes.NOT_FOUND, 404, `${resource} n\xE3o encontrado(a).`);
  }
};
var ConflictError = class extends AppError2 {
  constructor(message) {
    super(ErrorCodes.CONFLICT, 409, message);
  }
};
var ValidationError = class extends AppError2 {
  constructor(message, details) {
    super(ErrorCodes.VALIDATION_ERROR, 400, message, details);
  }
};
var MissingDefaultSectorError = class extends AppError2 {
  constructor() {
    super(
      ErrorCodes.MISSING_DEFAULT_SECTOR,
      400,
      "Produto n\xE3o possui setor padr\xE3o. Informe o sectorId."
    );
  }
};

// src/modules/products/presentation/http/products.controller.ts
function createProductsController(useCases) {
  return {
    // -------------------------------------------------------------------------
    // PUBLIC
    // -------------------------------------------------------------------------
    async publicList(request, reply) {
      const { q, page, pageSize } = publicListQuerySchema.parse(request.query);
      const { data, meta } = await useCases.listPublicProducts.execute({
        q,
        page,
        pageSize,
        activeOnly: true
      });
      return reply.send(paginated(data, meta));
    },
    async publicGetByOmieCode(request, reply) {
      const { omieCode } = publicGetByOmieCodeParamsSchema.parse(request.params);
      const product = await useCases.getPublicProductByOmieCode.execute({ omieCode });
      if (!product) throw new AppError("PRODUCT_NOT_FOUND", 404, "Product not found");
      return reply.send(ok(product, {}));
    },
    // -------------------------------------------------------------------------
    // MANAGED (ADMIN)
    // -------------------------------------------------------------------------
    async createManagedProduct(request, reply) {
      const parsed2 = createManagedProductBodySchema.safeParse(request.body);
      if (!parsed2.success) throw new ValidationError("Corpo da requisi\xE7\xE3o inv\xE1lido", parsed2.error.format());
      const product = await useCases.createManagedProduct.execute(parsed2.data);
      return reply.status(201).send(product);
    },
    async createManagedProductsBulk(request, reply) {
      const parsed2 = createManagedProductsBulkBodySchema.safeParse(request.body);
      if (!parsed2.success) throw new ValidationError("Corpo da requisi\xE7\xE3o inv\xE1lido", parsed2.error.format());
      const result = await useCases.createManagedProductsBulk.execute(parsed2.data);
      return reply.status(201).send(result);
    },
    async listManagedProducts(request, reply) {
      const products = await useCases.listManagedProducts.execute();
      if (wantsLegacyResponse(request)) return reply.send({ items: products });
      return reply.send(
        paginated(products, { page: 1, pageSize: products.length, total: products.length })
      );
    },
    async getManagedProduct(request, reply) {
      const { id } = managedProductIdParamsSchema.parse(request.params);
      const looksLikeUuid = managedProductIdUuidParamsSchema.safeParse({ id }).success;
      if (!looksLikeUuid) throw new AppError("PRODUCT_NOT_FOUND", 404, "Product not found");
      const product = await useCases.getManagedProduct.execute({ id });
      return reply.send(ok(product));
    },
    async patchManagedProduct(request, reply) {
      const { id } = managedProductIdUuidParamsSchema.parse(request.params);
      const { data } = patchManagedProductBodySchema.parse(request.body);
      const updated = await useCases.patchManagedProduct.execute({ id, data });
      return reply.send(ok(updated));
    },
    async deleteManagedProduct(request, reply) {
      const { id } = request.params;
      const result = await useCases.deleteManagedProduct.execute({ id });
      return reply.send(result);
    },
    async getManagedProductStock(request, reply) {
      const { id } = managedProductIdUuidParamsSchema.parse(request.params);
      const result = await useCases.getManagedProductStock.execute({ id });
      return reply.send(ok(result));
    },
    async getManagedProductStockHistory(request, reply) {
      const { id } = managedProductIdUuidParamsSchema.parse(request.params);
      const { page, pageSize } = stockHistoryQuerySchema.parse(request.query);
      const result = await useCases.getManagedProductStockHistory.execute({ id, page, pageSize });
      return reply.send(paginated(result.items, result.meta));
    },
    // -------------------------------------------------------------------------
    // ADMIN / OMIE - SYNC PRODUCTS (status + execute)
    // -------------------------------------------------------------------------
    async syncOmieProducts(request, reply) {
      const query = request.query ?? {};
      const force = String(query.force ?? "").trim().toLowerCase() === "true" || String(query.force ?? "").trim() === "1";
      const requestId = request.requestId ?? `http-${Date.now()}`;
      request.log?.info?.(
        { requestId, force, route: "/v1/admin/omie/sync/products" },
        "omie products sync triggered"
      );
      const startedAt = Date.now();
      const result = await useCases.syncOmieProducts.execute({ requestId, force });
      const durationMs = Date.now() - startedAt;
      const skipped = result?.skipped === true;
      if (skipped) {
        request.log?.warn?.(
          { requestId, durationMs, result },
          "omie products sync finished (skipped)"
        );
      } else {
        request.log?.info?.(
          { requestId, durationMs, result },
          "omie products sync finished"
        );
      }
      return reply.send({ data: result });
    },
    async syncOmieProductsInfo(_request, reply) {
      return reply.send(
        ok({
          ok: true,
          module: "products",
          operation: "omie-products-sync",
          description: "Sincroniza\xE7\xE3o do cat\xE1logo de produtos da Omie para o banco local.",
          howToRun: {
            method: "POST",
            endpoint: "/v1/admin/omie/sync/products",
            idempotent: true,
            lockStrategy: "exclusive",
            queryParams: {
              force: {
                type: "boolean",
                optional: true,
                description: "For\xE7a a sincroniza\xE7\xE3o mesmo dentro da janela de throttle."
              }
            }
          },
          status: { running: false, locked: false, lockedUntil: null },
          lastExecution: {
            supported: false,
            note: "Ainda n\xE3o h\xE1 persist\xEAncia de hist\xF3rico de execu\xE7\xE3o (\xFAltimo sucesso/erro)."
          },
          behavior: {
            onSuccess: "Produtos Omie s\xE3o criados ou atualizados no banco local.",
            onLocked: "Retorna reason=LOCKED sem executar nova sincroniza\xE7\xE3o.",
            onThrottle: "Retorna reason=SYNC_THROTTLED quando executado dentro da janela m\xEDnima.",
            onError: "Retorna AppError com c\xF3digo espec\xEDfico e status HTTP apropriado."
          }
        })
      );
    },
    // -------------------------------------------------------------------------
    // ADMIN / OMIE - READ (compat legacy)
    // -------------------------------------------------------------------------
    // GET /v1/admin/omie/products
    async adminOmieProductsList(request, reply) {
      const querySchema = zod.z.object({
        search: zod.z.string().optional(),
        family: zod.z.string().optional(),
        page: zod.z.coerce.number().min(1).default(1),
        pageSize: zod.z.coerce.number().min(1).max(5e3).default(50)
      });
      const { search, family, page, pageSize } = querySchema.parse(request.query);
      const { items, stockUpdatedAt } = await useCases.getOmieProducts.execute();
      const normalizedSearch = search?.trim().toLowerCase();
      const normalizedFamily = family?.trim().toLowerCase();
      const filteredItems = items.filter((item) => {
        const matchesSearch = normalizedSearch ? [item.description, item.sku, item.code, item.omieId, item.familyDescription].filter(Boolean).some((v) => String(v).toLowerCase().includes(normalizedSearch)) : true;
        const matchesFamily = normalizedFamily ? String(item.familyDescription ?? "").toLowerCase().includes(normalizedFamily) : true;
        return matchesSearch && matchesFamily;
      });
      const familySet = /* @__PURE__ */ new Set();
      for (const item of items) {
        const v = typeof item.familyDescription === "string" ? item.familyDescription.trim() : "";
        if (v) familySet.add(v);
      }
      const families = Array.from(familySet).sort((a, b) => a.localeCompare(b));
      const pagedItems = family ? filteredItems : filteredItems.slice((page - 1) * pageSize, page * pageSize);
      const pageUsed = family ? 1 : page;
      const pageSizeUsed = family ? pagedItems.length : pageSize;
      if (wantsLegacyResponse(request)) {
        return reply.send({
          items: pagedItems,
          total: filteredItems.length,
          families,
          stockCacheUpdatedAt: stockUpdatedAt
        });
      }
      return reply.send(
        paginated(pagedItems, {
          page: pageUsed,
          pageSize: pageSizeUsed,
          total: filteredItems.length,
          families,
          stockCacheUpdatedAt: stockUpdatedAt
        })
      );
    },
    // GET /v1/admin/omie/categories
    async adminOmieCategories(request, reply) {
      const querySchema = zod.z.object({ q: zod.z.string().optional() });
      const { q } = querySchema.parse(request.query);
      const result = await useCases.listOmieCategories.execute({ q });
      return reply.send(ok(result.families, { total: result.families.length }));
    },
    // GET /v1/admin/omie/products/search
    async adminOmieProductsSearch(request, reply) {
      const querySchema = zod.z.object({
        q: zod.z.string().trim().min(1, "q is required"),
        page: zod.z.coerce.number().min(1).default(1),
        pageSize: zod.z.coerce.number().min(1).default(20)
      });
      const { q, page, pageSize } = querySchema.parse(request.query);
      const result = await useCases.searchOmieProducts.execute({ q, page, pageSize });
      return reply.send(
        paginated(result.items, { page: result.page, pageSize: result.pageSize, total: result.total })
      );
    },
    // GET /v1/admin/omie/products/:id
    async adminOmieProductById(request, reply) {
      const paramsSchema = zod.z.object({ id: zod.z.string().uuid() });
      const querySchema = zod.z.object({ includeRaw: zod.z.coerce.boolean().optional().default(false) });
      const { id } = paramsSchema.parse(request.params);
      const { includeRaw } = querySchema.parse(request.query);
      const result = await useCases.getOmieProductById.execute({ id, includeRaw });
      return reply.send(ok(result.data));
    },
    // GET /v1/admin/omie/products/by-code/:omieCode
    async adminOmieProductByCode(request, reply) {
      const paramsSchema = zod.z.object({ omieCode: zod.z.string().min(1) });
      const querySchema = zod.z.object({ includeRaw: zod.z.coerce.boolean().optional().default(false) });
      const { omieCode } = paramsSchema.parse(request.params);
      const { includeRaw } = querySchema.parse(request.query);
      const result = await useCases.getOmieProductByCode.execute({ omieCode, includeRaw });
      return reply.send(ok(result.data));
    },
    // GET /v1/admin/omie/products/:id/stock
    async adminOmieProductStockById(request, reply) {
      const paramsSchema = zod.z.object({ id: zod.z.string().uuid() });
      const { id } = paramsSchema.parse(request.params);
      const result = await useCases.getOmieProductStock.byOmieProductId({ id });
      return reply.send(ok(result));
    },
    // GET /v1/admin/omie/products/by-code/:omieCode/stock
    async adminOmieProductStockByCode(request, reply) {
      const paramsSchema = zod.z.object({ omieCode: zod.z.string().min(1) });
      const { omieCode } = paramsSchema.parse(request.params);
      const result = await useCases.getOmieProductStock.byOmieCode({ omieCode });
      return reply.send(ok(result));
    },
    // GET /v1/admin/omie/stock
    async adminOmieStockInfo(_request, reply) {
      const data = await useCases.getOmieStockInfo.execute();
      return reply.send(ok(data));
    },
    // POST /v1/admin/omie/products/stock/refresh
    async adminOmieStockRefresh(request, reply) {
      const querySchema = zod.z.object({ dryRun: zod.z.string().optional() });
      const { dryRun } = querySchema.parse(request.query);
      const isDryRun = dryRun?.trim() === "1" || dryRun?.trim().toLowerCase() === "true";
      const capturedAt = (/* @__PURE__ */ new Date()).toISOString();
      const result = await useCases.refreshStock.execute({ dryRun: isDryRun });
      return reply.send(ok({ insertedCount: result.insertedCount, capturedAt }, result.meta));
    },
    // -------------------------------------------------------------------------
    // wrappers deprecated
    // -------------------------------------------------------------------------
    async deprecatedPublicStock(request, reply) {
      markDeprecated(request, reply, "/v1/products/stock", "/v1/products");
      return this.publicList(request, reply);
    }
  };
}

// src/modules/products/infrastructure/db/product.repo.prisma.ts
function createProductRepoPrisma(prisma2) {
  return {
    // ✅ ADICIONADO: necessário para product-sector e plans (validação de existência)
    findById(id) {
      return prisma2.product.findUnique({ where: { id } });
    },
    findByOmieProductId(omieProductId) {
      return prisma2.product.findUnique({ where: { omieProductId } });
    },
    createManaged(omieProductId) {
      return prisma2.product.create({ data: { omieProductId } });
    },
    createManyManaged(omieProductIds) {
      return prisma2.product.createMany({
        data: omieProductIds.map((omieProductId) => ({ omieProductId })),
        skipDuplicates: true
      });
    },
    listManaged() {
      return prisma2.product.findMany({
        include: {
          omieProduct: true,
          productSector: { include: { sector: true } }
        },
        orderBy: { omieProduct: { description: "asc" } }
      });
    },
    findManagedById(id) {
      return prisma2.product.findUnique({
        where: { id },
        include: {
          omieProduct: true,
          productSector: { include: { sector: true } }
        }
      });
    },
    existsById(id) {
      return prisma2.product.findUnique({ where: { id }, select: { id: true } });
    },
    updateManaged(id, data) {
      return prisma2.product.update({
        where: { id },
        data,
        select: { id: true, nickname: true, active: true, omieProductId: true }
      });
    },
    deleteById(id) {
      return prisma2.product.delete({ where: { id } });
    },
    findForOmieResolution(id) {
      return prisma2.product.findUnique({
        where: { id },
        select: { id: true, omieProductId: true }
      });
    }
  };
}

// src/shared/integrations/omie/omie.adapter.ts
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function hasValue(value) {
  return value !== void 0 && value !== null && !(typeof value === "string" && value.trim() === "");
}
function stringifyScalar(value) {
  if (!hasValue(value)) return null;
  return String(value).trim();
}
function findNestedValue(raw, keys) {
  if (!isPlainObject(raw)) return null;
  for (const key of keys) {
    const directValue = stringifyScalar(raw[key]);
    if (directValue !== null) return directValue;
  }
  for (const value of Object.values(raw)) {
    if (isPlainObject(value)) {
      const nestedValue = findNestedValue(value, keys);
      if (nestedValue !== null) return nestedValue;
    }
  }
  return null;
}
var OmieAdapter = class {
  static extractProductCode(raw) {
    const obj = raw;
    const value = obj?.codigo ?? obj?.codigo_produto ?? obj?.id ?? obj?.codigo_item;
    return value != null ? String(value) : "";
  }
  static extractStockProductCode(raw) {
    return findNestedValue(raw, [
      "cCodigo",
      "codigo",
      "codigo_produto",
      "id_prod",
      "idProd",
      "codigo_item",
      "cod_int",
      "cCodInt"
    ]) ?? "";
  }
  static extractStockQuantity(raw) {
    return findNestedValue(raw, [
      "nSaldo",
      "nSaldoEstoque",
      "quantidade_disponivel",
      "estoque_disponivel",
      "saldo_disponivel",
      "quantidade_estoque",
      "qtde_estoque",
      "saldo_estoque",
      "estoque_atual",
      "saldo",
      "estoque",
      "quantidade"
    ]);
  }
  static extractMinimumStock(raw) {
    return findNestedValue(raw, [
      "nEstoqueMinimo",
      "estoque_minimo",
      "saldo_minimo",
      "quantidade_minima",
      "qtde_minima",
      "minimo",
      "estoqueMinimo"
    ]);
  }
  static extractFamilyDescription(raw) {
    return findNestedValue(raw, [
      "descricao_familia",
      "descricaoFamilia",
      "familia",
      "nome_familia",
      "desc_familia",
      "cDescricaoFamilia"
    ]);
  }
  static toProductDTO(raw) {
    const obj = raw;
    return {
      omieId: this.extractProductCode(raw),
      sku: obj?.sku ?? null,
      description: obj?.descricao ?? obj?.descricao_produto ?? "Sem descri\xE7\xE3o",
      active: obj?.ativo !== void 0 ? Boolean(obj.ativo) : true,
      rawPayload: raw
    };
  }
};

// src/shared/integrations/omie/omie.client.ts
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function withJitter(ms) {
  const jitter = ms * 0.2;
  const min = ms - jitter;
  const max = ms + jitter;
  return Math.max(0, Math.round(min + Math.random() * (max - min)));
}
function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
function isLikelyTransientNetworkError(err) {
  const name = String(err?.name ?? "");
  const msg = String(err?.message ?? "").toLowerCase();
  if (name === "AbortError") return true;
  if (msg.includes("fetch failed")) return true;
  if (msg.includes("timeout")) return true;
  if (msg.includes("timed out")) return true;
  if (msg.includes("network")) return true;
  if (msg.includes("econnreset")) return true;
  if (msg.includes("enotfound")) return true;
  if (msg.includes("eai_again")) return true;
  return false;
}
function isRetryableAppError(err) {
  if (!(err instanceof AppError)) return false;
  if (err.code === "OMIE_HTTP_ERROR") {
    const httpStatus = Number(err.details?.httpStatus ?? 0);
    const sample = String(err.details?.sample ?? "");
    const sampleLower = sample.toLowerCase();
    if (sampleLower.includes("redundant") || sampleLower.includes("consumo redundante")) {
      return false;
    }
    return httpStatus >= 500 || httpStatus === 429;
  }
  if (err.code === "OMIE_NETWORK_ERROR") return true;
  return false;
}
var OmieClient = class {
  constructor(config, logger = {}) {
    this.config = config;
    this.logger = logger;
    this.timeoutMs = Number.isFinite(config.timeoutMs) ? Number(config.timeoutMs) : 2e4;
    const retryCfg = config.retry ?? {};
    this.retryAttempts = Number.isFinite(retryCfg.attempts) ? Math.max(1, Number(retryCfg.attempts)) : 3;
    this.retryBaseDelayMs = Number.isFinite(retryCfg.baseDelayMs) ? Math.max(0, Number(retryCfg.baseDelayMs)) : 250;
    this.retryMaxDelayMs = Number.isFinite(retryCfg.maxDelayMs) ? Math.max(this.retryBaseDelayMs, Number(retryCfg.maxDelayMs)) : 2e3;
  }
  config;
  logger;
  timeoutMs;
  retryAttempts;
  retryBaseDelayMs;
  retryMaxDelayMs;
  async post(path, payload) {
    const url = new URL(path, this.config.baseUrl).toString();
    const body = {
      ...payload,
      app_key: this.config.appKey,
      app_secret: this.config.appSecret
    };
    const call = payload?.call ?? body?.call;
    if (this.config.debug && process.env.NODE_ENV !== "production") {
      this.logger.info?.({ scope: "omie", url, call }, "[OMIE] request");
    }
    let lastErr = null;
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const text = await response.text();
        if (!response.ok) {
          throw new AppError("OMIE_HTTP_ERROR", 502, "Omie retornou erro HTTP", {
            httpStatus: response.status,
            url,
            call,
            sample: text?.slice?.(0, 1500)
          });
        }
        try {
          return JSON.parse(text);
        } catch {
          throw new AppError("OMIE_PARSE_ERROR", 502, "Resposta do Omie n\xE3o \xE9 JSON v\xE1lido", {
            url,
            call,
            sample: text.slice(0, 500)
          });
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (!(err instanceof AppError)) {
          err = new AppError(
            "OMIE_NETWORK_ERROR",
            502,
            "Falha de rede/timeout ao chamar Omie",
            {
              url,
              call,
              message: err?.message,
              name: err?.name
            }
          );
        }
        lastErr = err;
        const retryable = isRetryableAppError(err) || isLikelyTransientNetworkError(err);
        const hasMoreAttempts = attempt < this.retryAttempts;
        if (retryable && hasMoreAttempts) {
          const backoff = clamp(
            this.retryBaseDelayMs * Math.pow(2, attempt - 1),
            this.retryBaseDelayMs,
            this.retryMaxDelayMs
          );
          const delay = withJitter(backoff);
          this.logger.warn?.(
            { scope: "omie", url, call, attempt, nextAttemptInMs: delay, code: err.code },
            "[OMIE] retrying request"
          );
          await sleep(delay);
          continue;
        }
        throw err;
      }
    }
    throw lastErr ?? new AppError("OMIE_NETWORK_ERROR", 502, "Falha ao chamar Omie", {
      url,
      call: payload?.call
    });
  }
};
function createOmieClient(config, logger) {
  return new OmieClient(config, logger);
}

// src/shared/integrations/omie/omie.utils.ts
function brDateToISO(d) {
  const raw = String(d ?? "").trim();
  if (!raw) return null;
  const [ddStr, mmStr, yyyyStr] = raw.split("/").map((p) => p.trim());
  if (!ddStr || !mmStr || !yyyyStr) return null;
  const dd = Number(ddStr);
  const mm = Number(mmStr);
  const yyyy = Number(yyyyStr);
  if (!Number.isInteger(dd) || !Number.isInteger(mm) || !Number.isInteger(yyyy)) return null;
  if (yyyy < 1e3 || yyyy > 9999) return null;
  if (mm < 1 || mm > 12) return null;
  if (dd < 1 || dd > 31) return null;
  const date = new Date(Date.UTC(yyyy, mm - 1, dd, 0, 0, 0, 0));
  if (date.getUTCFullYear() !== yyyy || date.getUTCMonth() !== mm - 1 || date.getUTCDate() !== dd) {
    return null;
  }
  return date;
}
function isSim(v) {
  const s = String(v ?? "").trim().toUpperCase();
  return s === "S" || s === "SIM";
}

// src/shared/integrations/omie/omie.constants.ts
var OMIE_ENDPOINTS = {
  SALES_ORDERS_PRODUCTS: {
    path: "produtos/pedido/",
    call: "ListarPedidos"
  },
  PRODUCTION_ORDERS: {
    path: "produtos/op/",
    call: "ListarOrdemProducao"
  }
};

// src/shared/integrations/omie/omie-stock-cache.ts
function formatOmieBrDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
function createOmieStockCache(omieClient, options = {}) {
  const {
    path = "estoque/consulta/",
    call = "ListarPosEstoque",
    refreshIntervalMs = 15 * 60 * 1e3,
    pageSize = 50,
    logger = {}
  } = options;
  let cache = /* @__PURE__ */ new Map();
  let lastCompletedAt = 0;
  let lastUpdatedAt = null;
  let refreshPromise = null;
  async function refresh() {
    const nextCache = /* @__PURE__ */ new Map();
    const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    let page = 1;
    let totalPages = 1;
    do {
      const response = await omieClient.post(path, {
        call,
        param: [
          {
            nPagina: page,
            nRegPorPagina: pageSize,
            dDataPosicao: formatOmieBrDate(/* @__PURE__ */ new Date()),
            cExibeTodos: "S",
            codigo_local_estoque: 0
          }
        ]
      });
      const items = response.produtos ?? response.lista ?? [];
      for (const item of items) {
        const code = OmieAdapter.extractStockProductCode(item);
        if (!code) continue;
        nextCache.set(code, {
          stockQuantity: OmieAdapter.extractStockQuantity(item),
          minimumStock: OmieAdapter.extractMinimumStock(item),
          updatedAt
        });
      }
      totalPages = Number(response.nTotPaginas ?? 1);
      page += 1;
    } while (page <= totalPages);
    if (nextCache.size > 0 || cache.size === 0) {
      cache = nextCache;
      lastCompletedAt = Date.now();
      lastUpdatedAt = updatedAt;
      logger.info?.(
        { scope: "omie-stock-cache", size: cache.size, updatedAt },
        "Cache de estoque Omie atualizado"
      );
    } else {
      logger.warn?.(
        { scope: "omie-stock-cache", size: cache.size },
        "Refresh de estoque Omie retornou vazio; mantendo cache anterior"
      );
    }
  }
  async function ensureRefreshingIfNeeded() {
    const isExpired = Date.now() - lastCompletedAt >= refreshIntervalMs;
    if ((cache.size === 0 || isExpired) && !refreshPromise) {
      refreshPromise = refresh().finally(() => {
        refreshPromise = null;
      });
    }
    if (cache.size === 0 && refreshPromise) {
      try {
        await refreshPromise;
      } catch (error) {
        logger.error?.(
          { scope: "omie-stock-cache", err: error?.message ?? error },
          "Falha ao aquecer cache de estoque Omie"
        );
      }
    }
  }
  return {
    /**
     * Retorna uma cópia do snapshot do cache.
     * - dispara refresh se expirado
     * - se cache vazio, tenta aguardar aquecimento
     */
    async getSnapshot() {
      await ensureRefreshingIfNeeded();
      return new Map(cache);
    },
    getLastUpdatedAt() {
      return lastUpdatedAt;
    },
    /**
     * Força refresh imediatamente (dedup por refreshPromise).
     */
    async refreshNow() {
      if (!refreshPromise) {
        refreshPromise = refresh().finally(() => {
          refreshPromise = null;
        });
      }
      await refreshPromise;
      return new Map(cache);
    }
  };
}

// src/shared/integrations/omie/omie-orders.adapter.ts
function isEligibleStage20(pedido) {
  const p = pedido ?? {};
  const cab = p?.cabecalho ?? {};
  const cad = p?.infoCadastro ?? {};
  if (String(cab.etapa ?? "").trim() !== "20") return false;
  if (isSim(cad.cancelado)) return false;
  if (isSim(cab.encerrado)) return false;
  if (String(cab.enc_data ?? "").trim()) return false;
  return true;
}
function mapOrder(pedido) {
  const p = pedido ?? {};
  const cab = p?.cabecalho ?? {};
  const cad = p?.infoCadastro ?? {};
  const now = /* @__PURE__ */ new Date();
  const order = {
    omieCode: String(cab.codigo_pedido),
    numeroPedido: cab.numero_pedido ? String(cab.numero_pedido) : null,
    codigoCliente: cab.codigo_cliente ? String(cab.codigo_cliente) : null,
    codigoEmpresa: cab.codigo_empresa ? String(cab.codigo_empresa) : null,
    etapa: String(cab.etapa ?? "").trim(),
    cancelado: String(cad.cancelado ?? "N").trim() || "N",
    encerrado: String(cab.encerrado ?? "N").trim() || "N",
    dataPrevisao: brDateToISO(cab.data_previsao),
    dCan: brDateToISO(cad.dCan),
    hCan: cad.hCan ?? null,
    dInc: brDateToISO(cad.dInc),
    hInc: cad.hInc ?? null,
    uInc: cad.uInc ?? null,
    dAlt: brDateToISO(cad.dAlt),
    hAlt: cad.hAlt ?? null,
    uAlt: cad.uAlt ?? null,
    quantidadeItens: cab.quantidade_itens ?? null,
    rawPayload: pedido,
    lastSyncAt: now
  };
  const items = (p?.det ?? []).map((d) => {
    const prod = d?.produto ?? {};
    const ide = d?.ide ?? {};
    return {
      omieItemCode: String(ide.codigo_item),
      omieProductCode: prod.codigo_produto ? String(prod.codigo_produto) : null,
      sku: prod.codigo ?? null,
      description: String(prod.descricao ?? "").trim(),
      unit: prod.unidade ?? null,
      // Prisma Decimal aceita string
      quantity: String(prod.quantidade ?? 0),
      unitPrice: prod.valor_unitario != null ? String(prod.valor_unitario) : null,
      totalPrice: prod.valor_total != null ? String(prod.valor_total) : null,
      rawPayload: d,
      lastSyncAt: now
    };
  });
  return { order, items };
}

// src/modules/products/infrastructure/db/omie-product.repo.prisma.ts
function createOmieProductRepoPrisma(prisma2) {
  return {
    findById(id) {
      return prisma2.omieProduct.findUnique({ where: { id } });
    },
    findManyIds(ids) {
      return prisma2.omieProduct.findMany({
        where: { id: { in: ids } },
        select: { id: true }
      });
    },
    findForCodeResolution(id) {
      return prisma2.omieProduct.findUnique({
        where: { id },
        select: { omieCode: true, omieId: true, rawPayload: true }
      });
    },
    // ✅ ADICIONADO: usado pelo sync-omie-products.usecase.ts
    async upsertFromOmieItem(item) {
      const dto = OmieAdapter.toProductDTO(item);
      const omieCode = String(
        item?.codigo ?? item?.cod_int ?? item?.codigo_item ?? dto?.omieId ?? ""
      ).trim();
      if (!omieCode) {
        throw new Error("OMIE_CODE_NOT_FOUND");
      }
      const rawOmieIdValue = item?.id ?? item?.codigo_produto;
      const omieId = rawOmieIdValue !== void 0 && rawOmieIdValue !== null ? String(rawOmieIdValue).trim() : null;
      const now = /* @__PURE__ */ new Date();
      const familyDescription = OmieAdapter.extractFamilyDescription(dto.rawPayload);
      return prisma2.omieProduct.upsert({
        where: { omieCode },
        create: {
          omieCode,
          omieId,
          sku: dto.sku,
          description: dto.description,
          familyDescription,
          active: dto.active,
          rawPayload: dto.rawPayload,
          lastSyncAt: now
        },
        update: {
          omieId,
          sku: dto.sku,
          description: dto.description,
          familyDescription,
          active: dto.active,
          rawPayload: dto.rawPayload,
          lastSyncAt: now
        }
      });
    }
  };
}

// src/modules/products/infrastructure/db/product-stock.repo.prisma.ts
function createProductStockRepoPrisma(prisma2) {
  const productStock = prisma2.productStock ?? prisma2.productStock;
  return {
    // ✅ leitura: usado por get-managed-product-stock
    async latestByOmieCode(omieCode) {
      const rows = await productStock.findMany({
        where: { omieCode },
        orderBy: { capturedAt: "desc" },
        take: 1,
        select: {
          stockQuantity: true,
          minimumStock: true,
          capturedAt: true,
          updatedAt: true
        }
      });
      return rows[0] ?? null;
    },
    // ✅ leitura: usado por get-managed-product-stock-history
    async countByOmieCode(omieCode) {
      return productStock.count({ where: { omieCode } });
    },
    // ✅ leitura: usado por get-managed-product-stock-history
    async listByOmieCode(omieCode, page, pageSize) {
      return productStock.findMany({
        where: { omieCode },
        orderBy: { capturedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          stockQuantity: true,
          minimumStock: true,
          capturedAt: true,
          updatedAt: true
        }
      });
    },
    // ✅ escrita em lote: usado por refresh-stock.usecase
    async upsertBatch(rows) {
      if (!rows.length) return;
      await prisma2.$transaction(
        rows.map(
          (row) => productStock.upsert({
            where: { omieCode: row.omieCode },
            create: {
              omieCode: row.omieCode,
              stockQuantity: row.stockQuantity,
              minimumStock: row.minimumStock,
              capturedAt: row.capturedAt
            },
            update: {
              stockQuantity: row.stockQuantity,
              minimumStock: row.minimumStock,
              capturedAt: row.capturedAt,
              updatedAt: row.capturedAt
            }
          })
        )
      );
    }
  };
}

// src/modules/products/infrastructure/db/public-products.repo.prisma.ts
function createPublicProductsRepoPrisma(prisma2) {
  return {
    async list(params) {
      const { normalizedQ, activeOnly, pageSize, offset } = params;
      const rows = await prisma2.$queryRaw`
        WITH latest_stock AS (
          SELECT DISTINCT ON ("omieCode")
            "omieCode",
            "stockQuantity",
            "minimumStock",
            "capturedAt"
          FROM "product_stock"
          ORDER BY "omieCode", "capturedAt" DESC
        )
        SELECT
          o."omieCode" AS "omieCode",
          o."description" AS "description",
          o."sku" AS "sku",
          o."familyDescription" AS "family",
          o."active" AS "active",
          COALESCE(to_char(latest_stock."stockQuantity", 'FM999999999999990.0000'), '0.0000') AS "stockQuantity",
          COALESCE(to_char(latest_stock."minimumStock", 'FM999999999999990.0000'), '0.0000') AS "minimumStock",
          latest_stock."capturedAt" AS "stockUpdatedAt"
        FROM "OmieProduct" o
        LEFT JOIN latest_stock
          ON latest_stock."omieCode" = o."omieCode"
        WHERE
          (${activeOnly}::boolean = false OR o."active" = true)
          AND (
            ${normalizedQ}::text IS NULL
            OR o."description" ILIKE ('%' || ${normalizedQ}::text || '%')
            OR COALESCE(o."sku", '') ILIKE ('%' || ${normalizedQ}::text || '%')
            OR o."omieCode" ILIKE ('%' || ${normalizedQ}::text || '%')
          )
        ORDER BY o."description" ASC
        LIMIT ${pageSize}
        OFFSET ${offset}
      `;
      const totalRows = await prisma2.$queryRaw`
        SELECT COUNT(*) AS "total"
        FROM "OmieProduct" o
        WHERE
          (${activeOnly}::boolean = false OR o."active" = true)
          AND (
            ${normalizedQ}::text IS NULL
            OR o."description" ILIKE ('%' || ${normalizedQ}::text || '%')
            OR COALESCE(o."sku", '') ILIKE ('%' || ${normalizedQ}::text || '%')
            OR o."omieCode" ILIKE ('%' || ${normalizedQ}::text || '%')
          )
      `;
      const totalRaw = totalRows?.[0]?.total ?? 0;
      const total = typeof totalRaw === "bigint" ? Number(totalRaw) : Number(totalRaw ?? 0);
      return { rows, total };
    },
    async getByOmieCode(normalizedCode) {
      const rows = await prisma2.$queryRaw`
        WITH latest_stock AS (
          SELECT DISTINCT ON ("omieCode")
            "omieCode",
            "stockQuantity",
            "minimumStock",
            "capturedAt"
          FROM "product_stock"
          ORDER BY "omieCode", "capturedAt" DESC
        )
        SELECT
          o."omieCode" AS "omieCode",
          o."description" AS "description",
          o."sku" AS "sku",
          o."familyDescription" AS "family",
          o."active" AS "active",
          COALESCE(to_char(latest_stock."stockQuantity", 'FM999999999999990.0000'), '0.0000') AS "stockQuantity",
          COALESCE(to_char(latest_stock."minimumStock", 'FM999999999999990.0000'), '0.0000') AS "minimumStock",
          latest_stock."capturedAt" AS "stockUpdatedAt"
        FROM "OmieProduct" o
        LEFT JOIN latest_stock
          ON latest_stock."omieCode" = o."omieCode"
        WHERE o."omieCode" = ${normalizedCode}::text
        LIMIT 1
      `;
      return rows?.[0] ?? null;
    },
    toPublicProduct(row) {
      return {
        omieCode: row.omieCode,
        description: row.description,
        sku: row.sku,
        family: row.family,
        active: row.active,
        stockQuantity: row.stockQuantity ?? "0.0000",
        minimumStock: row.minimumStock ?? "0.0000",
        stockUpdatedAt: row.stockUpdatedAt ? row.stockUpdatedAt.toISOString() : null
      };
    }
  };
}

// src/modules/products/infrastructure/db/sync-lock-lease.repo.prisma.ts
function createSyncLockLeaseRepoPrisma(prisma2) {
  const syncLock = prisma2.syncLock ?? prisma2.syncLock;
  return {
    /**
     * Tenta adquirir lock por TTL.
     * - create (se não existir)
     * - se já existe: tenta updateMany quando lockedUntil <= now (lock expirado)
     * Retorna true se lock adquirido, false se lock ativo.
     */
    async acquire(key, ttlMs) {
      const now = /* @__PURE__ */ new Date();
      const lockedUntil = new Date(now.getTime() + ttlMs);
      try {
        await syncLock.create({
          data: { key, lockedUntil }
        });
        return true;
      } catch (err) {
        if (err?.code !== "P2002") {
          throw err;
        }
        const updated = await syncLock.updateMany({
          where: {
            key,
            lockedUntil: { lte: now }
          },
          data: { lockedUntil }
        });
        return (updated?.count ?? 0) > 0;
      }
    },
    /**
     * Libera o lock colocando lockedUntil = now (mesma semântica original).
     */
    async release(key) {
      const now = /* @__PURE__ */ new Date();
      await syncLock.updateMany({
        where: { key },
        data: { lockedUntil: now }
      });
    },
    /**
     * Helper: se a tabela não existir/for inválida (caso raro), identifica.
     * Mantive por consistência com outros fluxos.
     */
    isTableUnavailableError(err) {
      return err?.code === "P2021" || err?.code === "P2022";
    }
  };
}

// src/modules/products/infrastructure/db/omie-product-read.repo.prisma.ts
function createOmieProductReadRepoPrisma(prisma2) {
  const productStock = prisma2.productStock ?? prisma2.productStock;
  return {
    async listProducts() {
      return prisma2.omieProduct.findMany({
        orderBy: { description: "asc" }
      });
    },
    async listStockByCodes(codes) {
      if (!codes.length) return [];
      return productStock.findMany({
        where: { omieCode: { in: codes } },
        select: {
          omieCode: true,
          stockQuantity: true,
          minimumStock: true,
          updatedAt: true,
          capturedAt: true
        }
      });
    },
    enrichProduct(item, stockByCode) {
      const code = String(item.omieCode).trim();
      const stock = stockByCode.get(code);
      const stockQuantity = toStringOrNull(stock?.stockQuantity) ?? "0";
      const minimumStock = toStringOrNull(stock?.minimumStock) ?? "0";
      return {
        ...item,
        code,
        familyDescription: item.familyDescription ?? OmieAdapter.extractFamilyDescription(item.rawPayload),
        stockQuantity,
        minimumStock
      };
    }
  };
}
function toStringOrNull(value) {
  if (value === void 0 || value === null) return null;
  const s = typeof value === "string" ? value : typeof value?.toString === "function" ? value.toString() : String(value);
  const trimmed = String(s).trim();
  return trimmed.length > 0 ? trimmed : null;
}

// src/modules/products/infrastructure/db/sync-lock.repo.prisma.ts
var SYNC_LOCK_KEY = "omie_products_sync";
function createSyncLockRepoPrisma(prisma2) {
  function isSyncLockTableUnavailable(error) {
    return error?.code === "P2021" || error?.code === "P2022";
  }
  return {
    isTableUnavailableError: isSyncLockTableUnavailable,
    async ensureRowExists() {
      let lock = await prisma2.syncLock.findUnique({ where: { key: SYNC_LOCK_KEY } });
      if (!lock) {
        try {
          lock = await prisma2.syncLock.create({
            data: { key: SYNC_LOCK_KEY, lockedUntil: /* @__PURE__ */ new Date(0) }
          });
        } catch (e) {
          if (e?.code === "P2002") {
            lock = await prisma2.syncLock.findUnique({ where: { key: SYNC_LOCK_KEY } });
          } else {
            throw e;
          }
        }
      }
      return lock;
    },
    async tryAcquire(nowMs, ttlMs) {
      const lock = await this.ensureRowExists();
      if (lock.lockedUntil.getTime() > nowMs) {
        throw new AppError("SYNC_IN_PROGRESS", 409, "Sincroniza\xE7\xE3o j\xE1 em andamento");
      }
      const updated = await prisma2.syncLock.updateMany({
        where: { key: SYNC_LOCK_KEY, lockedUntil: lock.lockedUntil },
        data: { lockedUntil: new Date(nowMs + ttlMs) }
      });
      if (updated.count === 0) {
        throw new AppError("SYNC_IN_PROGRESS", 409, "Sincroniza\xE7\xE3o j\xE1 em andamento");
      }
      return true;
    },
    async release() {
      await prisma2.syncLock.update({
        where: { key: SYNC_LOCK_KEY },
        data: { lockedUntil: /* @__PURE__ */ new Date(0) }
      });
    }
  };
}

// src/modules/products/application/use-cases/resolve-omie-code-from-product.usecase.ts
function createResolveOmieCodeFromProductUseCase(deps) {
  return {
    async execute(input) {
      const product = await deps.productRepo.findForOmieResolution(input.productId);
      if (!product) throw new AppError("PRODUCT_NOT_FOUND", 404, "Product not found");
      if (!product.omieProductId) {
        throw new AppError("OMIE_PRODUCT_LINK_MISSING", 409, "Product is not linked to an OmieProduct");
      }
      const omieProduct = await deps.omieProductRepo.findForCodeResolution(product.omieProductId);
      if (!omieProduct) throw new AppError("OMIE_PRODUCT_NOT_FOUND", 404, "Omie product not found");
      const extracted = deps.omieAdapter.extractProductCode(omieProduct.rawPayload)?.trim();
      const omieCode = extracted || omieProduct.omieCode || omieProduct.omieId;
      if (!omieCode) throw new AppError("OMIE_CODE_NOT_FOUND", 422, "Omie code not found");
      return { productId: product.id, omieCode };
    }
  };
}

// src/modules/products/utils/to-number.ts
function toNumber(value) {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed3 = Number(value.trim().replace(",", "."));
    return Number.isFinite(parsed3) ? parsed3 : null;
  }
  if (typeof value?.toNumber === "function") {
    const num = value.toNumber();
    return Number.isFinite(num) ? num : null;
  }
  const asString = typeof value?.toString === "function" ? value.toString() : String(value);
  const parsed2 = Number(String(asString).trim().replace(",", "."));
  return Number.isFinite(parsed2) ? parsed2 : null;
}

// src/modules/products/application/use-cases/get-managed-product-stock.usecase.ts
function createGetManagedProductStockUseCase(deps) {
  return {
    async execute(input) {
      const { productId, omieCode } = await deps.resolveOmieCodeFromProduct.execute({ productId: input.id });
      const latest = await deps.productStockRepo.latestByOmieCode(omieCode);
      if (!latest) throw new AppError("STOCK_NOT_FOUND", 404, "Stock not found");
      const rawQty = toNumber(latest.stockQuantity);
      const rawMin = toNumber(latest.minimumStock);
      const reported = rawQty != null || rawMin != null;
      const quantity = (rawQty ?? 0).toFixed(4);
      const minimum = (rawMin ?? 0).toFixed(4);
      return {
        productId,
        omieCode,
        quantity,
        reported,
        rawQuantity: rawQty == null ? null : rawQty.toFixed(4),
        minimum,
        rawMinimum: rawMin == null ? null : rawMin.toFixed(4),
        stockQuantity: quantity,
        minimumStock: minimum,
        capturedAt: latest.capturedAt
      };
    }
  };
}

// src/modules/products/application/utils/to-number.ts
function toNumber2(value) {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed3 = Number(value.trim().replace(",", "."));
    return Number.isFinite(parsed3) ? parsed3 : null;
  }
  if (typeof value?.toNumber === "function") {
    const num = value.toNumber();
    return Number.isFinite(num) ? num : null;
  }
  const asString = typeof value?.toString === "function" ? value.toString() : String(value);
  const parsed2 = Number(String(asString).trim().replace(",", "."));
  return Number.isFinite(parsed2) ? parsed2 : null;
}

// src/modules/products/application/use-cases/get-managed-product-stock-history.usecase.ts
function createGetManagedProductStockHistoryUseCase(deps) {
  return {
    async execute(input) {
      const { productId, omieCode } = await deps.resolveOmieCodeFromProduct.execute({ productId: input.id });
      const safePageSize = Math.min(input.pageSize, 100);
      const [total, rows] = await Promise.all([
        deps.productStockRepo.countByOmieCode(omieCode),
        deps.productStockRepo.listByOmieCode(omieCode, input.page, safePageSize)
      ]);
      const items = rows.map((row) => {
        const rawQty = toNumber2(row.stockQuantity);
        const rawMin = toNumber2(row.minimumStock);
        const reported = rawQty != null || rawMin != null;
        const quantity = (rawQty ?? 0).toFixed(4);
        const minimum = (rawMin ?? 0).toFixed(4);
        return {
          productId,
          omieCode,
          quantity,
          reported,
          rawQuantity: rawQty == null ? null : rawQty.toFixed(4),
          minimum,
          rawMinimum: rawMin == null ? null : rawMin.toFixed(4),
          stockQuantity: quantity,
          minimumStock: minimum,
          capturedAt: row.capturedAt
        };
      });
      return {
        items,
        meta: {
          page: input.page,
          pageSize: safePageSize,
          total
        }
      };
    }
  };
}

// src/modules/products/application/use-cases/create-managed-product.usecase.ts
function createCreateManagedProductUseCase(deps) {
  return {
    async execute(input) {
      const omieProduct = await deps.omieProductRepo.findById(input.omieProductId);
      if (!omieProduct) throw new NotFoundError("Produto Omie");
      const existing = await deps.productRepo.findByOmieProductId(input.omieProductId);
      if (existing) throw new ConflictError("Produto j\xE1 est\xE1 selecionado.");
      return deps.productRepo.createManaged(input.omieProductId);
    }
  };
}

// src/modules/products/application/use-cases/create-managed-products-bulk.usecase.ts
function createCreateManagedProductsBulkUseCase(deps) {
  return {
    async execute(input) {
      const uniqueIds = Array.from(new Set(input.omieProductIds));
      const omieProducts = await deps.omieProductRepo.findManyIds(uniqueIds);
      const omieProductIdSet = new Set(omieProducts.map((item) => item.id));
      const missingIds = uniqueIds.filter((id) => !omieProductIdSet.has(id));
      if (missingIds.length > 0) {
        throw new ValidationError("Alguns produtos Omie n\xE3o existem.", { missingIds });
      }
      const existingProducts = await deps.prisma.product.findMany({
        where: { omieProductId: { in: uniqueIds } },
        select: { omieProductId: true }
      });
      const existingIdSet = new Set(existingProducts.map((item) => item.omieProductId));
      const toCreate = uniqueIds.filter((omieProductId) => !existingIdSet.has(omieProductId));
      const createResult = await deps.productRepo.createManyManaged(toCreate);
      return {
        created: createResult.count,
        skippedExisting: existingIdSet.size,
        requested: uniqueIds.length
      };
    }
  };
}

// src/modules/products/application/use-cases/list-managed-products.usecase.ts
function createListManagedProductsUseCase(deps) {
  return {
    async execute() {
      return deps.productRepo.listManaged();
    }
  };
}

// src/modules/products/application/use-cases/get-managed-product.usecase.ts
function createGetManagedProductUseCase(deps) {
  return {
    async execute(input) {
      const product = await deps.productRepo.findManagedById(input.id);
      if (!product) throw new AppError("PRODUCT_NOT_FOUND", 404, "Product not found");
      return {
        id: product.id,
        nickname: product.nickname,
        active: product.active,
        omieProductId: product.omieProductId,
        omieProduct: {
          id: product.omieProduct.id,
          description: product.omieProduct.description,
          sku: product.omieProduct.sku,
          familyDescription: deps.omieAdapter.extractFamilyDescription(product.omieProduct.rawPayload),
          active: product.omieProduct.active
        },
        productSector: product.productSector ? {
          sectorId: product.productSector.sectorId,
          notes: product.productSector.notes,
          sector: {
            id: product.productSector.sector.id,
            name: product.productSector.sector.name,
            order: product.productSector.sector.order
          }
        } : null
      };
    }
  };
}

// src/modules/products/application/use-cases/patch-managed-product.usecase.ts
function createPatchManagedProductUseCase(deps) {
  return {
    async execute(input) {
      const existing = await deps.productRepo.existsById(input.id);
      if (!existing) throw new AppError("PRODUCT_NOT_FOUND", 404, "Product not found");
      const updated = await deps.productRepo.updateManaged(input.id, {
        ...input.data.nickname !== void 0 ? { nickname: input.data.nickname } : {},
        ...input.data.active !== void 0 ? { active: input.data.active } : {}
      });
      return updated;
    }
  };
}

// src/modules/products/application/use-cases/delete-managed-product.usecase.ts
function createDeleteManagedProductUseCase(deps) {
  return {
    async execute(input) {
      const product = await deps.prisma.product.findUnique({ where: { id: input.id } });
      if (!product) throw new NotFoundError("Produto");
      await deps.productRepo.deleteById(input.id);
      return { success: true };
    }
  };
}

// src/modules/products/application/use-cases/list-public-products.usecase.ts
function createListPublicProductsUseCase(deps) {
  return {
    async execute(params) {
      const page = Number.isFinite(params.page) ? Math.max(1, Number(params.page)) : 1;
      const pageSizeRaw = Number.isFinite(params.pageSize) ? Number(params.pageSize) : 50;
      const pageSize = Math.min(Math.max(1, pageSizeRaw), 200);
      const activeOnly = params.activeOnly === false ? false : true;
      const normalizedQ = params.q?.trim() ? params.q.trim() : null;
      const offset = (page - 1) * pageSize;
      const { rows, total } = await deps.publicProductsRepo.list({
        normalizedQ,
        activeOnly,
        page,
        pageSize,
        offset
      });
      const data = rows.map(deps.publicProductsRepo.toPublicProduct);
      return {
        data,
        meta: { page, pageSize, total }
      };
    }
  };
}

// src/modules/products/application/use-cases/get-public-product-by-omie-code.usecase.ts
function createGetPublicProductByOmieCodeUseCase(deps) {
  return {
    async execute(input) {
      const normalizedCode = String(input.omieCode ?? "").trim();
      if (!normalizedCode) return null;
      const row = await deps.publicProductsRepo.getByOmieCode(normalizedCode);
      if (!row) return null;
      return deps.publicProductsRepo.toPublicProduct(row);
    }
  };
}

// src/modules/products/application/use-cases/refresh-stock.usecase.ts
var STOCK_REFRESH_LOCK_KEY = "stock_refresh";
var STOCK_REFRESH_LOCK_TTL_MS = 10 * 60 * 1e3;
var EXPECTED_OMIE_CODE_LENGTH = 64;
var MAX_DECIMAL_INTEGER_DIGITS = 14;
var BATCH_SIZE = 200;
var MAX_WARN_LOGS = 10;
function toNumber3(value) {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed3 = Number(value.trim().replace(",", "."));
    return Number.isFinite(parsed3) ? parsed3 : null;
  }
  if (typeof value?.toNumber === "function") {
    const num = value.toNumber();
    return Number.isFinite(num) ? num : null;
  }
  const asString = typeof value?.toString === "function" ? value.toString() : String(value);
  const parsed2 = Number(String(asString).trim().replace(",", "."));
  return Number.isFinite(parsed2) ? parsed2 : null;
}
function normalizeNumberString(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "0";
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "0";
    const parsed2 = Number(trimmed.replace(",", "."));
    return Number.isFinite(parsed2) ? String(parsed2) : "0";
  }
  return "0";
}
function normalizeSnapshotToMap(snapshot) {
  const snapshotMap = /* @__PURE__ */ new Map();
  const items = snapshot?.items ?? snapshot;
  if (items instanceof Map) {
    for (const [k, v] of items.entries()) snapshotMap.set(String(k).trim(), v);
    return snapshotMap;
  }
  if (items && typeof items.entries === "function") {
    const entries = Array.from(items.entries());
    for (const [k, v] of entries) snapshotMap.set(String(k).trim(), v);
    return snapshotMap;
  }
  if (items && typeof items === "object") {
    for (const [k, v] of Object.entries(items)) snapshotMap.set(String(k).trim(), v);
  }
  return snapshotMap;
}
function createRefreshStockUseCase(deps) {
  const log = deps.logger ?? {};
  return {
    async execute(options) {
      const dryRun = Boolean(options?.dryRun);
      let lockAcquired = false;
      if (!dryRun) {
        try {
          lockAcquired = await deps.syncLockLeaseRepo.acquire(
            STOCK_REFRESH_LOCK_KEY,
            STOCK_REFRESH_LOCK_TTL_MS
          );
        } catch (err) {
          throw new AppError(
            "STOCK_REFRESH_LOCK_ERROR",
            503,
            "Falha ao adquirir lock de refresh de estoque",
            { message: err?.message, code: err?.code }
          );
        }
        if (!lockAcquired) {
          log.warn?.({}, "stock refresh skipped: lock is active");
          return { insertedCount: 0, meta: { skippedLocked: 1 } };
        }
      }
      try {
        await deps.omieStockCache.refreshNow();
        const capturedAt = /* @__PURE__ */ new Date();
        const snapshot = await deps.omieStockCache.getSnapshot();
        const snapshotMap = normalizeSnapshotToMap(snapshot);
        let outsideExpectedOmieCodeLength = 0;
        let skippedOutOfRangeDecimal = 0;
        const rows = Array.from(snapshotMap.entries()).map(([omieCode, entry]) => {
          const code = String(omieCode).trim();
          if (code.length > EXPECTED_OMIE_CODE_LENGTH) {
            outsideExpectedOmieCodeLength += 1;
            if (outsideExpectedOmieCodeLength <= MAX_WARN_LOGS) {
              log.warn?.({ omieCode: code, length: code.length }, "omieCode outside expected size");
            }
          }
          const stockQuantity = normalizeNumberString(entry?.stockQuantity);
          const minimumStock = normalizeNumberString(entry?.minimumStock);
          return {
            omieCode: code,
            stockQuantity,
            minimumStock,
            capturedAt
          };
        }).filter((row) => {
          if (!row.omieCode) return false;
          const qty = toNumber3(row.stockQuantity);
          const min = toNumber3(row.minimumStock);
          const qtyIntDigits = qty == null ? 0 : Math.trunc(Math.abs(qty)).toString().replace("-", "").length;
          const minIntDigits = min == null ? 0 : Math.trunc(Math.abs(min)).toString().replace("-", "").length;
          if (qtyIntDigits > MAX_DECIMAL_INTEGER_DIGITS || minIntDigits > MAX_DECIMAL_INTEGER_DIGITS) {
            skippedOutOfRangeDecimal += 1;
            return false;
          }
          return true;
        });
        if (dryRun) {
          const meta2 = {};
          if (outsideExpectedOmieCodeLength > 0) meta2.outsideExpectedOmieCodeLength = outsideExpectedOmieCodeLength;
          if (skippedOutOfRangeDecimal > 0) meta2.skippedOutOfRangeDecimal = skippedOutOfRangeDecimal;
          return {
            insertedCount: rows.length,
            meta: Object.keys(meta2).length ? meta2 : void 0
          };
        }
        let insertedCount = 0;
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const batch = rows.slice(i, i + BATCH_SIZE);
          await deps.productStockRepo.upsertBatch(batch);
          insertedCount += batch.length;
        }
        const meta = {};
        if (outsideExpectedOmieCodeLength > 0) meta.outsideExpectedOmieCodeLength = outsideExpectedOmieCodeLength;
        if (skippedOutOfRangeDecimal > 0) meta.skippedOutOfRangeDecimal = skippedOutOfRangeDecimal;
        return {
          insertedCount,
          meta: Object.keys(meta).length ? meta : void 0
        };
      } finally {
        if (lockAcquired) {
          try {
            await deps.syncLockLeaseRepo.release(STOCK_REFRESH_LOCK_KEY);
          } catch (err) {
            log.warn?.({ message: err?.message }, "stock refresh: failed to release lock");
          }
        }
      }
    }
  };
}

// src/modules/products/application/use-cases/list-omie-products-with-stock.usecase.ts
function createListOmieProductsWithStockUseCase(deps) {
  return {
    async execute() {
      const items = await deps.omieProductReadRepo.listProducts();
      const codes = Array.from(
        new Set(
          items.map((item) => String(item.omieCode).trim()).filter(Boolean)
        )
      );
      if (!codes.length) {
        return { items: [], stockUpdatedAt: null };
      }
      const stockRows = await deps.omieProductReadRepo.listStockByCodes(codes);
      const stockByCode = /* @__PURE__ */ new Map();
      let latestUpdatedAt = null;
      for (const row of stockRows) {
        const code = String(row.omieCode).trim();
        stockByCode.set(code, row);
        const candidate = row.updatedAt ?? row.capturedAt ?? null;
        if (candidate && (!latestUpdatedAt || candidate.getTime() > latestUpdatedAt.getTime())) {
          latestUpdatedAt = candidate;
        }
      }
      const enriched = items.map(
        (item) => deps.omieProductReadRepo.enrichProduct(item, stockByCode)
      );
      return {
        items: enriched,
        stockUpdatedAt: latestUpdatedAt ? latestUpdatedAt.toISOString() : null
      };
    }
  };
}

// src/modules/products/application/use-cases/get-stock-by-raw-payload.usecase.ts
function createGetStockByRawPayloadUseCase(deps) {
  return {
    async execute(rawPayload) {
      const omieCode = OmieAdapter.extractProductCode(rawPayload)?.trim();
      if (!omieCode) {
        throw new AppError("OMIE_CODE_NOT_FOUND", 422, "Omie code not found");
      }
      const snapshot = await deps.omieStockCache.getSnapshot();
      const stockCacheUpdatedAt = deps.omieStockCache.getLastUpdatedAt();
      if (!stockCacheUpdatedAt) {
        throw new AppError(
          "STOCK_NOT_AVAILABLE",
          503,
          "Stock snapshot not available"
        );
      }
      const entry = snapshot.get(omieCode);
      return {
        omieCode,
        stockQuantity: entry?.stockQuantity ?? "0",
        minimumStock: entry?.minimumStock ?? "0",
        stockCacheUpdatedAt
      };
    }
  };
}

// src/modules/products/application/use-cases/get-products.usecase.ts
function createGetOmieProductsUseCase(deps) {
  return {
    async execute() {
      const items = await deps.omieProductReadRepo.listProducts();
      const codes = Array.from(
        new Set(
          items.map((item) => String(item?.omieCode ?? "").trim()).filter(Boolean)
        )
      );
      if (codes.length === 0) {
        return { items: [], stockUpdatedAt: null };
      }
      const stockRows = await deps.omieProductReadRepo.listStockByCodes(codes);
      const stockByCode = /* @__PURE__ */ new Map();
      let latestUpdatedAt = null;
      for (const row of stockRows) {
        const code = String(row.omieCode ?? "").trim();
        if (!code) continue;
        stockByCode.set(code, row);
        const candidate = row.updatedAt ?? row.capturedAt ?? null;
        if (candidate && (!latestUpdatedAt || candidate.getTime() > latestUpdatedAt.getTime())) {
          latestUpdatedAt = candidate;
        }
      }
      const enriched = items.map(
        (item) => deps.omieProductReadRepo.enrichProduct(item, stockByCode)
      );
      return {
        items: enriched,
        stockUpdatedAt: latestUpdatedAt ? latestUpdatedAt.toISOString() : null
      };
    }
  };
}

// src/modules/products/application/use-cases/admin-omie/list-omie-categories.usecase.ts
function createListOmieCategoriesUseCase(deps) {
  return {
    async execute(input) {
      const normalizedQ = input.q?.trim();
      const items = await deps.prisma.omieProduct.findMany({
        select: { familyDescription: true },
        distinct: ["familyDescription"],
        orderBy: { familyDescription: "asc" },
        where: normalizedQ ? { familyDescription: { contains: normalizedQ, mode: "insensitive" } } : { familyDescription: { not: null } }
      });
      const families = items.map((i) => i.familyDescription?.trim()).filter((v) => Boolean(v));
      return { families };
    }
  };
}

// src/modules/products/application/use-cases/admin-omie/search-omie-products.usecase.ts
function createSearchOmieProductsUseCase(deps) {
  return {
    async execute(input) {
      const q = input.q.trim();
      const page = Math.max(Number(input.page ?? 1), 1);
      const pageSize = Math.min(Math.max(Number(input.pageSize ?? 20), 1), 100);
      const where = {
        OR: [
          { description: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { familyDescription: { contains: q, mode: "insensitive" } }
        ]
      };
      const [total, items] = await Promise.all([
        deps.prisma.omieProduct.count({ where }),
        deps.prisma.omieProduct.findMany({
          where,
          orderBy: { description: "asc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            description: true,
            sku: true,
            familyDescription: true,
            active: true,
            omieCode: true
          }
        })
      ]);
      return {
        page,
        pageSize,
        total,
        items: items.map((it) => ({
          id: it.id,
          description: it.description,
          sku: it.sku,
          familyDescription: it.familyDescription,
          active: it.active,
          ...it.omieCode ? { omieCode: it.omieCode } : {}
        }))
      };
    }
  };
}

// src/modules/products/application/use-cases/admin-omie/get-omie-product-by-id.usecase.ts
function createGetOmieProductByIdUseCase(deps) {
  return {
    async execute(input) {
      const omieProduct = await deps.prisma.omieProduct.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          omieId: true,
          omieCode: true,
          description: true,
          sku: true,
          familyDescription: true,
          active: true,
          rawPayload: true
        }
      });
      if (!omieProduct) {
        throw new AppError("OMIE_PRODUCT_NOT_FOUND", 404, "Omie product not found");
      }
      const data = {
        id: omieProduct.id,
        description: omieProduct.description,
        sku: omieProduct.sku,
        familyDescription: omieProduct.familyDescription ?? OmieAdapter.extractFamilyDescription(omieProduct.rawPayload),
        active: omieProduct.active,
        omieCode: omieProduct.omieCode
      };
      if (input.includeRaw) data.rawPayload = omieProduct.rawPayload;
      return { data };
    }
  };
}

// src/modules/products/application/use-cases/admin-omie/get-omie-product-by-code.usecase.ts
function createGetOmieProductByCodeUseCase(deps) {
  return {
    async execute(input) {
      const omieCode = input.omieCode;
      const omieProduct = await deps.prisma.omieProduct.findUnique({
        where: { omieCode },
        select: {
          id: true,
          omieId: true,
          omieCode: true,
          description: true,
          sku: true,
          familyDescription: true,
          active: true,
          rawPayload: true
        }
      }) ?? await deps.prisma.omieProduct.findFirst({
        where: { omieId: omieCode },
        select: {
          id: true,
          omieId: true,
          omieCode: true,
          description: true,
          sku: true,
          familyDescription: true,
          active: true,
          rawPayload: true
        }
      });
      if (!omieProduct) {
        throw new AppError("OMIE_PRODUCT_NOT_FOUND", 404, "Omie product not found");
      }
      const data = {
        id: omieProduct.id,
        description: omieProduct.description,
        sku: omieProduct.sku,
        familyDescription: omieProduct.familyDescription ?? OmieAdapter.extractFamilyDescription(omieProduct.rawPayload),
        active: omieProduct.active,
        omieCode: omieProduct.omieCode
      };
      if (input.includeRaw) data.rawPayload = omieProduct.rawPayload;
      return { data };
    }
  };
}

// src/modules/products/application/use-cases/admin-omie/get-omie-stock-info.usecase.ts
function createGetOmieStockInfoUseCase(deps) {
  return {
    async execute() {
      const rows = await deps.prisma.$queryRaw`
        SELECT
          MAX("capturedAt") AS "lastRefreshAt",
          COUNT(DISTINCT "omieCode") AS "totalItems"
        FROM "product_stock"
      `;
      const row = rows[0] ?? { lastRefreshAt: null, totalItems: 0 };
      const totalItems = typeof row.totalItems === "bigint" ? Number(row.totalItems) : row.totalItems ?? 0;
      return {
        lastRefreshAt: row.lastRefreshAt ? row.lastRefreshAt.toISOString() : null,
        totalItems,
        source: "database"
      };
    }
  };
}

// src/modules/products/application/use-cases/admin-omie/get-omie-product-stock.usecase.ts
function toNumber4(value) {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed3 = Number(value.trim().replace(",", "."));
    return Number.isFinite(parsed3) ? parsed3 : null;
  }
  const asString = typeof value?.toString === "function" ? value.toString() : String(value);
  const parsed2 = Number(String(asString).trim().replace(",", "."));
  return Number.isFinite(parsed2) ? parsed2 : null;
}
function createGetOmieProductStockUseCase(deps) {
  async function latestStockByCode(omieCode) {
    const rows = await deps.prisma.productStock.findMany({
      where: { omieCode },
      orderBy: { capturedAt: "desc" },
      take: 1,
      select: { stockQuantity: true, minimumStock: true, capturedAt: true }
    });
    const latest = rows?.[0];
    if (!latest) throw new AppError("STOCK_NOT_FOUND", 404, "Stock not found");
    const rawQty = toNumber4(latest.stockQuantity);
    const rawMin = toNumber4(latest.minimumStock);
    const reported = rawQty != null || rawMin != null;
    return {
      omieCode,
      quantity: (rawQty ?? 0).toFixed(4),
      minimum: (rawMin ?? 0).toFixed(4),
      reported,
      rawQuantity: rawQty == null ? null : rawQty.toFixed(4),
      rawMinimum: rawMin == null ? null : rawMin.toFixed(4),
      stockQuantity: (rawQty ?? 0).toFixed(4),
      minimumStock: (rawMin ?? 0).toFixed(4),
      capturedAt: latest.capturedAt,
      stockCacheUpdatedAt: latest.capturedAt.toISOString()
    };
  }
  return {
    async byOmieProductId(input) {
      const omieProduct = await deps.prisma.omieProduct.findUnique({
        where: { id: input.id },
        select: { id: true, omieCode: true, omieId: true, rawPayload: true }
      });
      if (!omieProduct) {
        throw new AppError("OMIE_PRODUCT_NOT_FOUND", 404, "Omie product not found");
      }
      const extracted = OmieAdapter.extractProductCode(omieProduct.rawPayload)?.trim();
      const omieCode = extracted || omieProduct.omieCode?.trim() || omieProduct.omieId?.trim();
      if (!omieCode) throw new AppError("OMIE_CODE_NOT_FOUND", 422, "Omie code not found");
      const data = await latestStockByCode(omieCode);
      return { omieProductId: omieProduct.id, ...data };
    },
    async byOmieCode(input) {
      const data = await latestStockByCode(input.omieCode);
      return data;
    }
  };
}

// src/modules/products/application/use-cases/fetch-omie-products-page.usecase.ts
var OMIE_PRODUCTS_PATH = "geral/produtos/";
var OMIE_PRODUCTS_PAGE_SIZE = 100;
function sleep2(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function createFetchOmieProductsPageUseCase(deps) {
  const log = deps.logger ?? {};
  function buildPayload(page) {
    return {
      call: "ListarProdutos",
      param: [
        {
          pagina: page,
          registros_por_pagina: OMIE_PRODUCTS_PAGE_SIZE,
          apenas_importado_api: "N",
          filtrar_apenas_omiepdv: "N"
        }
      ]
    };
  }
  function extractItems(data) {
    return data?.produto_servico_cadastro ?? data?.produtos ?? data?.lista ?? data?.produto_servico ?? [];
  }
  function extractTotalPages(data) {
    const value = data?.total_de_paginas ?? data?.nTotPaginas ?? data?.nTotalPaginas ?? data?.total_paginas;
    if (value === void 0 || value === null || value === "") return null;
    const totalPages = Number(value);
    return Number.isFinite(totalPages) && totalPages > 0 ? totalPages : null;
  }
  async function fetchWithRetry(page, requestId) {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await deps.omieClient.post(OMIE_PRODUCTS_PATH, buildPayload(page));
      } catch (error) {
        if (attempt >= maxAttempts) {
          if (error instanceof AppError) {
            throw new AppError(error.code, error.statusCode, error.message, {
              ...error.details || {},
              page,
              attempt,
              requestId
            });
          }
          throw error;
        }
        log.warn?.({ requestId, page, attempt }, "omie products page retry");
        await sleep2(250 * attempt);
      }
    }
    throw new AppError("OMIE_PAGINATION_ERROR", 502, "Falha ao paginar produtos no Omie", {
      page,
      requestId
    });
  }
  return {
    pageSize: OMIE_PRODUCTS_PAGE_SIZE,
    async execute(input) {
      const data = await fetchWithRetry(input.page, input.requestId);
      const items = extractItems(data);
      const totalPages = extractTotalPages(data);
      return { items, totalPages };
    }
  };
}

// src/modules/products/application/use-cases/sync-omie-products.usecase.ts
var OMIE_PRODUCTS_MAX_PAGES = 2e3;
function createSyncOmieProductsUseCase(deps) {
  const log = deps.logger ?? {};
  const THROTTLE_WINDOW_MS = deps.throttleWindowMs ?? 60 * 1e3;
  const LOCK_WINDOW_MS = deps.lockWindowMs ?? 2 * 60 * 1e3;
  function acquireInMemoryLock(now) {
    if (deps.state.inMemoryLockUntil > now) {
      throw new AppError("SYNC_IN_PROGRESS", 409, "Sincroniza\xE7\xE3o j\xE1 em andamento");
    }
    deps.state.inMemoryLockUntil = now + LOCK_WINDOW_MS;
  }
  function releaseInMemoryLock() {
    deps.state.inMemoryLockUntil = 0;
  }
  return {
    async execute(input) {
      const requestId = input.requestId;
      const force = input.force === true;
      const now = Date.now();
      const timeSinceLastSync = now - deps.state.lastGlobalSyncAt;
      if (!force && timeSinceLastSync < THROTTLE_WINDOW_MS) {
        const nextAllowedInSec = Math.ceil((THROTTLE_WINDOW_MS - timeSinceLastSync) / 1e3);
        log.info?.({ requestId, nextAllowedInSec }, "sync skipped (throttled)");
        return { skipped: true, reason: "SYNC_THROTTLED", nextAllowedInSec };
      }
      let lockAcquired = false;
      let usingInMemoryLock = false;
      try {
        await deps.syncLockRepo.tryAcquire(now, LOCK_WINDOW_MS);
        lockAcquired = true;
      } catch (dbError) {
        if (dbError instanceof AppError) throw dbError;
        if (deps.syncLockRepo.isTableUnavailableError(dbError)) {
          acquireInMemoryLock(now);
          usingInMemoryLock = true;
          lockAcquired = true;
          log.warn?.({ requestId, strategy: "in_memory", prismaCode: dbError?.code }, "sync lock fallback");
        } else {
          throw new AppError("SYNC_LOCK_DB_ERROR", 503, "Falha ao acessar o lock de sincroniza\xE7\xE3o no banco", {
            prismaCode: dbError?.code,
            message: dbError?.message
          });
        }
      }
      const startTime = Date.now();
      let upsertedCount = 0;
      let failedCount = 0;
      let pagesProcessed = 0;
      try {
        let page = 1;
        let totalPages = null;
        while (true) {
          if (page > OMIE_PRODUCTS_MAX_PAGES) {
            throw new AppError("OMIE_PAGINATION_OVERFLOW", 502, "Pagina\xE7\xE3o do Omie excedeu o limite de seguran\xE7a", {
              page,
              requestId
            });
          }
          const { items, totalPages: reportedTotalPages } = await deps.fetchOmieProductsPage.execute({ page, requestId });
          if (reportedTotalPages && totalPages === null) totalPages = reportedTotalPages;
          if (items.length === 0) break;
          for (const item of items) {
            try {
              await deps.omieProductRepo.upsertFromOmieItem(item);
              upsertedCount++;
            } catch (err) {
              failedCount++;
              log.error?.({ requestId, err: err?.message }, "sync item failed");
            }
          }
          pagesProcessed++;
          if (totalPages) {
            if (page >= totalPages) break;
          } else {
            if (items.length < deps.fetchOmieProductsPage.pageSize) break;
          }
          page++;
        }
        deps.state.lastGlobalSyncAt = Date.now();
        log.info?.(
          { requestId, upserted: upsertedCount, failed: failedCount, pages: pagesProcessed, durationMs: Date.now() - startTime },
          "omie products sync end"
        );
        return { upserted: upsertedCount, failed: failedCount };
      } finally {
        if (lockAcquired) {
          if (usingInMemoryLock) {
            releaseInMemoryLock();
          } else {
            try {
              await deps.syncLockRepo.release();
            } catch (releaseErr) {
              log.error?.({ requestId, err: releaseErr?.message }, "failed to release sync lock");
            }
          }
        }
      }
    }
  };
}

// src/modules/products/index.ts
var omieProductsSyncState = {
  lastGlobalSyncAt: 0,
  inMemoryLockUntil: 0
};
async function createProductsModule(app) {
  const prisma2 = app.prisma;
  const logger = app.log;
  const omieClient = app.omieClient;
  const productRepo = createProductRepoPrisma(prisma2);
  const omieProductRepo = createOmieProductRepoPrisma(prisma2);
  const productStockRepo = createProductStockRepoPrisma(prisma2);
  const publicProductsRepo = createPublicProductsRepoPrisma(prisma2);
  const syncLockLeaseRepo = createSyncLockLeaseRepoPrisma(prisma2);
  const omieProductReadRepo = createOmieProductReadRepoPrisma(prisma2);
  const syncLockRepo = createSyncLockRepoPrisma(prisma2);
  const omieStockCache = app.omieStockCache ?? createOmieStockCache(omieClient, { logger });
  const omieAdapter = OmieAdapter;
  const getOmieProducts = createGetOmieProductsUseCase({
    omieProductReadRepo
  });
  const refreshStock = createRefreshStockUseCase({
    omieStockCache,
    syncLockLeaseRepo,
    productStockRepo,
    logger
  });
  const resolveOmieCodeFromProduct = createResolveOmieCodeFromProductUseCase({
    productRepo,
    omieProductRepo,
    omieAdapter
  });
  const listOmieProductsWithStock = createListOmieProductsWithStockUseCase({
    omieProductReadRepo
  });
  const getStockByRawPayload = createGetStockByRawPayloadUseCase({
    omieStockCache
  });
  const fetchOmieProductsPage = createFetchOmieProductsPageUseCase({
    omieClient,
    logger
  });
  const syncOmieProducts = createSyncOmieProductsUseCase({
    prisma: prisma2,
    syncLockRepo,
    fetchOmieProductsPage,
    omieProductRepo,
    logger,
    state: omieProductsSyncState
  });
  const listOmieCategories = createListOmieCategoriesUseCase({ prisma: prisma2 });
  const searchOmieProducts = createSearchOmieProductsUseCase({ prisma: prisma2 });
  const getOmieProductById = createGetOmieProductByIdUseCase({ prisma: prisma2 });
  const getOmieProductByCode = createGetOmieProductByCodeUseCase({ prisma: prisma2 });
  const getOmieStockInfo = createGetOmieStockInfoUseCase({ prisma: prisma2 });
  const getOmieProductStock = createGetOmieProductStockUseCase({ prisma: prisma2 });
  const useCases = {
    // público
    listPublicProducts: createListPublicProductsUseCase({ publicProductsRepo }),
    getPublicProductByOmieCode: createGetPublicProductByOmieCodeUseCase({
      publicProductsRepo
    }),
    // managed/admin
    createManagedProduct: createCreateManagedProductUseCase({
      productRepo,
      omieProductRepo
    }),
    createManagedProductsBulk: createCreateManagedProductsBulkUseCase({
      productRepo,
      omieProductRepo,
      prisma: prisma2
    }),
    listManagedProducts: createListManagedProductsUseCase({ productRepo }),
    getManagedProduct: createGetManagedProductUseCase({
      productRepo,
      omieAdapter
    }),
    patchManagedProduct: createPatchManagedProductUseCase({ productRepo }),
    deleteManagedProduct: createDeleteManagedProductUseCase({
      productRepo,
      prisma: prisma2
    }),
    // stock
    refreshStock,
    listOmieProductsWithStock,
    getOmieProducts,
    getStockByRawPayload,
    getManagedProductStock: createGetManagedProductStockUseCase({
      resolveOmieCodeFromProduct,
      productStockRepo
    }),
    getManagedProductStockHistory: createGetManagedProductStockHistoryUseCase({
      resolveOmieCodeFromProduct,
      productStockRepo
    }),
    // admin / omie
    listOmieCategories,
    searchOmieProducts,
    getOmieProductById,
    getOmieProductByCode,
    getOmieStockInfo,
    getOmieProductStock,
    // sync
    syncOmieProducts
  };
  const controller = createProductsController(useCases);
  await registerProductsRoutes(app, controller);
  return { useCases };
}

// src/modules/sectors/presentation/http/sectors.routes.ts
async function registerSectorsRoutes(app, controller) {
  app.post("/v1/admin/sectors", controller.create);
  app.get("/v1/admin/sectors", controller.list);
  app.patch("/v1/admin/sectors/:id", controller.update);
  app.delete("/v1/admin/sectors/:id", controller.remove);
  app.post("/v1/sectors", async (req, rep) => {
    markDeprecated(req, rep, "/v1/sectors (POST)", "/v1/admin/sectors (POST)");
    return controller.create(req, rep);
  });
  app.get("/v1/sectors", async (req, rep) => {
    markDeprecated(req, rep, "/v1/sectors (GET)", "/v1/admin/sectors (GET)");
    return controller.list(req, rep);
  });
  app.patch("/v1/sectors/:id", async (req, rep) => {
    markDeprecated(req, rep, "/v1/sectors/:id (PATCH)", "/v1/admin/sectors/:id (PATCH)");
    return controller.update(req, rep);
  });
  app.delete("/v1/sectors/:id", async (req, rep) => {
    markDeprecated(req, rep, "/v1/sectors/:id (DELETE)", "/v1/admin/sectors/:id (DELETE)");
    return controller.remove(req, rep);
  });
}
var listSectorsQuerySchema = zod.z.object({
  includeInactive: zod.z.coerce.boolean().optional().default(false)
});
var sectorIdParamsSchema = zod.z.object({
  id: zod.z.string().uuid("ID inv\xE1lido")
});
var createSectorBodySchema = contracts.CreateSectorInputSchema;
var updateSectorBodySchema = contracts.UpdateSectorInputSchema;

// src/modules/sectors/presentation/http/sectors.controller.ts
function createSectorsController(useCases) {
  return {
    async create(request, reply) {
      const body = createSectorBodySchema.parse(request.body);
      const sector = await useCases.createSector.execute(body);
      return reply.status(201).send(sector);
    },
    async list(request, reply) {
      const { includeInactive } = listSectorsQuerySchema.parse(request.query);
      const sectors = await useCases.listSectors.execute({ includeInactive });
      if (wantsLegacyResponse(request)) {
        return reply.send({ items: sectors });
      }
      return reply.send(
        paginated(sectors, {
          page: 1,
          pageSize: sectors.length,
          total: sectors.length
        })
      );
    },
    async update(request, reply) {
      const { id } = sectorIdParamsSchema.parse(request.params);
      const data = updateSectorBodySchema.parse(request.body);
      const sector = await useCases.updateSector.execute({ id, data });
      return reply.send(sector);
    },
    async remove(request, reply) {
      const { id } = sectorIdParamsSchema.parse(request.params);
      const sector = await useCases.deleteSector.execute({ id });
      return reply.send(sector);
    }
  };
}

// src/modules/sectors/infrastructure/db/sector.repo.prisma.ts
function createSectorRepoPrisma(prisma2) {
  return {
    findById(id) {
      return prisma2.sector.findUnique({ where: { id } });
    },
    findByName(name) {
      return prisma2.sector.findUnique({ where: { name } });
    },
    list(includeInactive = false) {
      return prisma2.sector.findMany({
        where: includeInactive ? void 0 : { active: true },
        orderBy: [{ order: "asc" }, { name: "asc" }]
      });
    },
    create(data) {
      return prisma2.sector.create({ data });
    },
    update(id, data) {
      return prisma2.sector.update({ where: { id }, data });
    },
    softDelete(id) {
      return prisma2.sector.update({
        where: { id },
        data: { active: false }
      });
    }
  };
}

// src/modules/sectors/application/use-cases/create-sector.usecase.ts
function createCreateSectorUseCase(deps) {
  return {
    async execute(input) {
      const existing = await deps.sectorRepo.findByName(input.name);
      if (existing) {
        throw new ConflictError("Um setor com este nome j\xE1 existe.");
      }
      return deps.sectorRepo.create({
        name: input.name,
        order: input.order
      });
    }
  };
}

// src/modules/sectors/application/use-cases/list-sectors.usecase.ts
function createListSectorsUseCase(deps) {
  return {
    async execute(input) {
      return deps.sectorRepo.list(input.includeInactive);
    }
  };
}

// src/modules/sectors/application/use-cases/update-sector.usecase.ts
function createUpdateSectorUseCase(deps) {
  return {
    async execute(input) {
      const sector = await deps.sectorRepo.findById(input.id);
      if (!sector) throw new NotFoundError("Setor");
      if (input.data.name && input.data.name !== sector.name) {
        const collision = await deps.sectorRepo.findByName(input.data.name);
        if (collision) {
          throw new ConflictError("Um setor com este nome j\xE1 existe.");
        }
      }
      return deps.sectorRepo.update(input.id, input.data);
    }
  };
}

// src/modules/sectors/application/use-cases/delete-sector.usecase.ts
function createDeleteSectorUseCase(deps) {
  return {
    async execute(input) {
      const sector = await deps.sectorRepo.findById(input.id);
      if (!sector) throw new NotFoundError("Setor");
      return deps.sectorRepo.softDelete(input.id);
    }
  };
}

// src/modules/sectors/index.ts
async function registerSectorsModule(app) {
  const prisma2 = app.prisma;
  const sectorRepo = createSectorRepoPrisma(prisma2);
  const useCases = {
    createSector: createCreateSectorUseCase({ sectorRepo }),
    listSectors: createListSectorsUseCase({ sectorRepo }),
    updateSector: createUpdateSectorUseCase({ sectorRepo }),
    deleteSector: createDeleteSectorUseCase({ sectorRepo })
  };
  const controller = createSectorsController(useCases);
  await registerSectorsRoutes(app, controller);
}

// src/modules/product-sector/presentation/http/product-sector.routes.ts
async function registerProductSectorRoutes(app, controller) {
  app.put("/v1/admin/managed-products/:productId/sector", controller.setDefault);
  app.get("/v1/admin/managed-products/:productId/sector", controller.getDefault);
  app.put("/v1/admin/products/:productId/sector", async (req, rep) => {
    markDeprecated(
      req,
      rep,
      "/v1/admin/products/:productId/sector (PUT)",
      "/v1/admin/managed-products/:productId/sector (PUT)"
    );
    return controller.setDefault(req, rep);
  });
  app.get("/v1/admin/products/:productId/sector", async (req, rep) => {
    markDeprecated(
      req,
      rep,
      "/v1/admin/products/:productId/sector (GET)",
      "/v1/admin/managed-products/:productId/sector (GET)"
    );
    return controller.getDefault(req, rep);
  });
  app.put("/v1/products/:productId/sector", async (req, rep) => {
    markDeprecated(
      req,
      rep,
      "/v1/products/:productId/sector (PUT)",
      "/v1/admin/managed-products/:productId/sector (PUT)"
    );
    return controller.setDefault(req, rep);
  });
  app.get("/v1/products/:productId/sector", async (req, rep) => {
    markDeprecated(
      req,
      rep,
      "/v1/products/:productId/sector (GET)",
      "/v1/admin/managed-products/:productId/sector (GET)"
    );
    return controller.getDefault(req, rep);
  });
}
var productIdParamsSchema = zod.z.object({
  productId: zod.z.string().uuid("ID de produto inv\xE1lido")
});
var updateProductSectorBodySchema = contracts.UpdateProductSectorInputSchema;

// src/modules/product-sector/presentation/http/product-sector.controller.ts
function createProductSectorController(useCases) {
  return {
    async setDefault(request, reply) {
      const { productId } = productIdParamsSchema.parse(request.params);
      const { sectorId, notes } = updateProductSectorBodySchema.parse(request.body);
      const result = await useCases.setProductDefaultSector.execute({
        productId,
        sectorId,
        notes
      });
      return reply.status(200).send(result);
    },
    async getDefault(request, reply) {
      const { productId } = productIdParamsSchema.parse(request.params);
      const data = await useCases.getProductDefaultSector.execute({ productId });
      return reply.send({ data });
    }
  };
}

// src/modules/product-sector/infrastructure/db/product-sector.repo.prisma.ts
function createProductSectorRepoPrisma(prisma2) {
  return {
    findByProductId(productId) {
      return prisma2.productSector.findUnique({
        where: { productId },
        include: { sector: true }
      });
    },
    upsert(productId, sectorId, notes) {
      return prisma2.productSector.upsert({
        where: { productId },
        create: { productId, sectorId, notes },
        update: { sectorId, notes }
      });
    }
  };
}

// src/modules/product-sector/application/use-cases/set-product-default-sector.usecase.ts
function createSetProductDefaultSectorUseCase(deps) {
  return {
    async execute(input) {
      const product = await deps.productRepo.findById(input.productId);
      if (!product) throw new NotFoundError("Produto");
      const sector = await deps.sectorRepo.findById(input.sectorId);
      if (!sector || sector.active !== true) {
        throw new ValidationError("Setor n\xE3o encontrado ou inativo.");
      }
      return deps.productSectorRepo.upsert(input.productId, input.sectorId, input.notes);
    }
  };
}

// src/modules/product-sector/application/use-cases/get-product-default-sector.usecase.ts
function createGetProductDefaultSectorUseCase(deps) {
  return {
    async execute(input) {
      const product = await deps.productRepo.findById(input.productId);
      if (!product) throw new NotFoundError("Produto");
      const productSector = await deps.productSectorRepo.findByProductId(input.productId);
      return productSector || null;
    }
  };
}

// src/modules/product-sector/index.ts
async function registerProductSectorModule(app) {
  const prisma2 = app.prisma;
  const productRepo = createProductRepoPrisma(prisma2);
  const sectorRepo = createSectorRepoPrisma(prisma2);
  const productSectorRepo = createProductSectorRepoPrisma(prisma2);
  const useCases = {
    setProductDefaultSector: createSetProductDefaultSectorUseCase({
      productRepo,
      sectorRepo,
      productSectorRepo
    }),
    getProductDefaultSector: createGetProductDefaultSectorUseCase({
      productRepo,
      productSectorRepo
    })
  };
  const controller = createProductSectorController(useCases);
  await registerProductSectorRoutes(app, controller);
  return { useCases };
}

// src/modules/plans/presentation/http/plans.routes.ts
async function registerPlansRoutes(app, controller) {
  app.post("/v1/admin/plans", controller.create);
  app.get("/v1/admin/plans", controller.list);
  app.get("/v1/admin/plans/:id", controller.getById);
  app.post("/v1/admin/plans/:id/items", controller.addItem);
  app.get("/v1/admin/plans/:id/by-sector", controller.listBySector);
  app.get("/v1/admin/plans/:id/export.csv", controller.exportCsv);
  app.post("/v1/plans", (req, rep) => {
    markDeprecated(req, rep, "/v1/plans (POST)", "/v1/admin/plans (POST)");
    return controller.create(req, rep);
  });
  app.get("/v1/plans", (req, rep) => {
    markDeprecated(req, rep, "/v1/plans (GET)", "/v1/admin/plans (GET)");
    return controller.list(req, rep);
  });
  app.get("/v1/plans/:id", (req, rep) => {
    markDeprecated(req, rep, "/v1/plans/:id (GET)", "/v1/admin/plans/:id (GET)");
    return controller.getById(req, rep);
  });
  app.post("/v1/plans/:id/items", (req, rep) => {
    markDeprecated(req, rep, "/v1/plans/:id/items (POST)", "/v1/admin/plans/:id/items (POST)");
    return controller.addItem(req, rep);
  });
  app.get("/v1/plans/:id/by-sector", (req, rep) => {
    markDeprecated(req, rep, "/v1/plans/:id/by-sector (GET)", "/v1/admin/plans/:id/by-sector (GET)");
    return controller.listBySector(req, rep);
  });
  app.get("/v1/plans/:id/export.csv", (req, rep) => {
    markDeprecated(req, rep, "/v1/plans/:id/export.csv (GET)", "/v1/admin/plans/:id/export.csv (GET)");
    return controller.exportCsv(req, rep);
  });
}
var planIdParamsSchema = zod.z.object({
  id: zod.z.string().uuid("ID inv\xE1lido.")
});
var createPlanBodySchema = contracts.CreatePlanInputSchema;
var addPlanItemBodySchema = contracts.AddPlanItemInputSchema;

// src/modules/plans/presentation/http/plans.controller.ts
function createPlansController(useCases) {
  return {
    async create(request, reply) {
      const body = createPlanBodySchema.parse(request.body);
      const plan = await useCases.createPlan.execute(body);
      return reply.status(201).send(plan);
    },
    async list(request, reply) {
      const plans = await useCases.listPlans.execute();
      if (wantsLegacyResponse(request)) {
        return reply.send({ items: plans });
      }
      return reply.send(
        paginated(plans, {
          page: 1,
          pageSize: plans.length,
          total: plans.length
        })
      );
    },
    async getById(request, reply) {
      const { id } = planIdParamsSchema.parse(request.params);
      const plan = await useCases.getPlanById.execute({ id });
      return reply.send(plan);
    },
    async addItem(request, reply) {
      const { id } = planIdParamsSchema.parse(request.params);
      const body = addPlanItemBodySchema.parse(request.body);
      const item = await useCases.addPlanItem.execute({
        planId: id,
        ...body
      });
      return reply.status(201).send(item);
    },
    async listBySector(request, reply) {
      const { id } = planIdParamsSchema.parse(request.params);
      const result = await useCases.listPlanItemsBySector.execute({ planId: id });
      return reply.send(result);
    },
    async exportCsv(request, reply) {
      const { id } = planIdParamsSchema.parse(request.params);
      const csv = await useCases.exportPlanCsv.execute({ planId: id });
      reply.header("Content-Type", "text/csv");
      reply.header("Content-Disposition", `attachment; filename="plan-${id}.csv"`);
      return reply.send(csv);
    }
  };
}

// src/modules/plans/infrastructure/db/plan.repo.prisma.ts
function createPlanRepoPrisma(prisma2) {
  return {
    findById(id) {
      return prisma2.productionPlan.findUnique({
        where: { id }
      });
    },
    findByIdWithItems(id) {
      return prisma2.productionPlan.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: { include: { omieProduct: true } },
              sector: true
            }
          }
        }
      });
    },
    list() {
      return prisma2.productionPlan.findMany({
        orderBy: { createdAt: "desc" }
      });
    },
    create(data) {
      return prisma2.productionPlan.create({
        data
      });
    },
    createItem(data) {
      return prisma2.productionPlanItem.create({
        data
      });
    }
  };
}

// src/modules/plans/application/use-cases/create-plan.usecase.ts
function createCreatePlanUseCase(deps) {
  return {
    async execute(input) {
      const plan = await deps.planRepo.create({
        name: input.name,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate)
      });
      return plan;
    }
  };
}

// src/modules/plans/application/use-cases/list-plans.usecase.ts
function createListPlansUseCase(deps) {
  return {
    async execute() {
      return deps.planRepo.list();
    }
  };
}

// src/modules/plans/application/use-cases/get-plan-by-id.usecase.ts
function createGetPlanByIdUseCase(deps) {
  return {
    async execute(input) {
      const plan = await deps.planRepo.findByIdWithItems(input.id);
      if (!plan) throw new NotFoundError("Plano");
      return plan;
    }
  };
}

// src/modules/plans/application/use-cases/add-plan-item.usecase.ts
function createAddPlanItemUseCase(deps) {
  return {
    async execute(input) {
      const { planId, productId, quantity, sectorId, notes } = input;
      const plan = await deps.planRepo.findById(planId);
      if (!plan) {
        throw new NotFoundError("Plano");
      }
      const product = await deps.productRepo.findById(productId);
      if (!product) {
        throw new NotFoundError("Produto");
      }
      let finalSectorId = sectorId;
      if (!finalSectorId) {
        const productSector = await deps.productSectorRepo.findByProductId(productId);
        if (!productSector) {
          throw new MissingDefaultSectorError();
        }
        finalSectorId = productSector.sectorId;
      } else {
        const sector = await deps.sectorRepo.findById(finalSectorId);
        if (!sector || sector.active !== true) {
          throw new ValidationError("Setor inv\xE1lido ou inativo");
        }
      }
      return deps.planRepo.createItem({
        planId,
        productId,
        sectorId: finalSectorId,
        quantity,
        notes
      });
    }
  };
}

// src/modules/plans/application/use-cases/list-plan-items-by-sector.usecase.ts
function createListPlanItemsBySectorUseCase(deps) {
  return {
    async execute(input) {
      const plan = await deps.planRepo.findByIdWithItems(input.planId);
      if (!plan) throw new NotFoundError("Plano");
      const grouped = /* @__PURE__ */ new Map();
      for (const item of plan.items) {
        const sectorId = item.sector.id;
        if (!grouped.has(sectorId)) {
          grouped.set(sectorId, {
            sector: { id: item.sector.id, name: item.sector.name, order: item.sector.order },
            items: []
          });
        }
        grouped.get(sectorId).items.push({
          itemId: item.id,
          productId: item.productId,
          productDescription: item.product.omieProduct.description,
          quantity: item.quantity
        });
      }
      return Array.from(grouped.values()).sort((a, b) => a.sector.order - b.sector.order || a.sector.name.localeCompare(b.sector.name)).map((g) => ({
        sector: { id: g.sector.id, name: g.sector.name },
        items: g.items
      }));
    }
  };
}

// src/modules/plans/application/use-cases/export-plan-csv.usecase.ts
function createExportPlanCsvUseCase(deps) {
  return {
    async execute(input) {
      const plan = await deps.planRepo.findByIdWithItems(input.planId);
      if (!plan) throw new NotFoundError("Plano");
      const sortedItems = plan.items.sort(
        (a, b) => a.sector.order - b.sector.order || a.sector.name.localeCompare(b.sector.name) || a.product.omieProduct.description.localeCompare(b.product.omieProduct.description)
      );
      let csv = "Setor;Produto;Quantidade\n";
      for (const item of sortedItems) {
        const sector = item.sector.name.replace(/;/g, ",");
        const product = item.product.omieProduct.description.replace(/;/g, ",");
        csv += `${sector};${product};${item.quantity}
`;
      }
      return csv;
    }
  };
}

// src/modules/plans/index.ts
async function registerPlansModule(app) {
  const prisma2 = app.prisma;
  const planRepo = createPlanRepoPrisma(prisma2);
  const productRepo = createProductRepoPrisma(prisma2);
  const productSectorRepo = createProductSectorRepoPrisma(prisma2);
  const sectorRepo = createSectorRepoPrisma(prisma2);
  const useCases = {
    createPlan: createCreatePlanUseCase({ planRepo }),
    listPlans: createListPlansUseCase({ planRepo }),
    getPlanById: createGetPlanByIdUseCase({ planRepo }),
    listPlanItemsBySector: createListPlanItemsBySectorUseCase({ planRepo }),
    exportPlanCsv: createExportPlanCsvUseCase({ planRepo }),
    addPlanItem: createAddPlanItemUseCase({
      planRepo,
      productRepo,
      productSectorRepo,
      sectorRepo
    })
  };
  const controller = createPlansController(useCases);
  await registerPlansRoutes(app, controller);
  return { useCases };
}

// src/shared/utils/job-lock.ts
function createJobLock(prisma2) {
  return {
    async acquire(key, ttlMs) {
      const now = /* @__PURE__ */ new Date();
      const lockedUntil = new Date(now.getTime() + ttlMs);
      try {
        await prisma2.jobLock.create({ data: { key, lockedUntil } });
        return { acquired: true, lockedUntil };
      } catch {
        const existing = await prisma2.jobLock.findUnique({ where: { key } });
        if (!existing) return { acquired: false };
        if (existing.lockedUntil <= now) {
          await prisma2.jobLock.update({ where: { key }, data: { lockedUntil } });
          return { acquired: true, lockedUntil };
        }
        return { acquired: false, lockedUntil: existing.lockedUntil };
      }
    },
    async renew(key, ttlMs) {
      const lockedUntil = new Date(Date.now() + ttlMs);
      await prisma2.jobLock.updateMany({ where: { key }, data: { lockedUntil } });
      return lockedUntil;
    },
    async release(key) {
      await prisma2.jobLock.deleteMany({ where: { key } });
    },
    /**
     * Helper: roda função somente se conseguir lock.
     * Retorna {acquired:false} em vez de lançar.
     */
    async runExclusive(key, ttlMs, fn) {
      const lock = await this.acquire(key, ttlMs);
      if (!lock.acquired) return { acquired: false, lockedUntil: lock.lockedUntil };
      try {
        const result = await fn({
          renew: () => this.renew(key, ttlMs),
          release: () => this.release(key)
        });
        return { acquired: true, result };
      } finally {
        await this.release(key);
      }
    }
  };
}

// src/modules/omie-orders/application/use-cases/list-omie-orders-page.usecase.ts
function createListOmieOrdersPageUseCase(deps) {
  return {
    async execute(input) {
      const { page, pageSize } = input;
      try {
        const candidates = [
          {
            path: OMIE_ENDPOINTS.SALES_ORDERS_PRODUCTS.path,
            call: OMIE_ENDPOINTS.SALES_ORDERS_PRODUCTS.call
          },
          { path: "produtos/pedido/", call: "ListarPedidos" }
        ];
        for (const candidate of candidates) {
          const paramCandidates = [
            { pagina: page, registros_por_pagina: pageSize, etapa: "20" },
            { pagina: page, registros_por_pagina: pageSize }
          ];
          for (const param of paramCandidates) {
            const payload = { call: candidate.call, param: [param] };
            try {
              const resp = await deps.omieClient.post(candidate.path, payload);
              return { resp, resolvedOmieEndpoint: { path: candidate.path, call: candidate.call } };
            } catch (err) {
              const isHttpError = err instanceof AppError && err.code === "OMIE_HTTP_ERROR";
              const httpStatus = isHttpError ? err.details?.httpStatus : void 0;
              const body = isHttpError ? String(err.details?.sample ?? err.details?.body ?? "") : "";
              const bodyLower = body.toLowerCase();
              const methodNotExists = bodyLower.includes("not exists") || bodyLower.includes("n\xE3o existe");
              if (isHttpError && (httpStatus === 404 || methodNotExists)) {
                break;
              }
              if (isHttpError && httpStatus === 500 && bodyLower.includes("invalid")) {
                continue;
              }
              throw err;
            }
          }
        }
        throw new AppError("OMIE_LIST_ORDERS_FAILED", 502, "Falha ao listar pedidos do Omie", {
          attempts: candidates.map((c) => ({ path: c.path, call: c.call }))
        });
      } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("OMIE_LIST_ORDERS_FAILED", 502, "Falha ao listar pedidos do Omie", {
          message: err?.message
        });
      }
    }
  };
}

// src/modules/omie-orders/application/use-cases/sync-stage20-orders.usecase.ts
function createSyncStage20OrdersUseCase(deps) {
  const LOCK_KEY = "omie:orders:stage20:sync";
  const LOCK_TTL_MS = 5 * 60 * 1e3;
  const PAGE_SIZE = 50;
  return {
    async execute() {
      const lockRun = await deps.jobLock.runExclusive(LOCK_KEY, LOCK_TTL_MS, async ({ renew }) => {
        let page = 1;
        let totalPages = 1;
        let syncedOrders = 0;
        let skippedOrders = 0;
        let resolvedOmieEndpoint = null;
        const activeStage20OmieCodes = /* @__PURE__ */ new Set();
        try {
          do {
            const { resp, resolvedOmieEndpoint: resolved } = await deps.listOmieOrdersPage.execute({
              page,
              pageSize: PAGE_SIZE
            });
            if (!resolvedOmieEndpoint) resolvedOmieEndpoint = resolved;
            totalPages = Number(resp?.total_de_paginas ?? 1);
            const pedidos = resp?.pedido_venda_produto ?? [];
            for (const pedido of pedidos) {
              if (!isEligibleStage20(pedido)) {
                skippedOrders++;
                continue;
              }
              const { order, items } = mapOrder(pedido);
              activeStage20OmieCodes.add(String(order.omieCode));
              const validItems = items.filter(
                (i) => i?.omieItemCode && i?.description && String(i.description).trim().length > 0
              );
              await deps.omieOrdersRepo.upsertOrderWithItems(order, validItems);
              syncedOrders++;
            }
            await renew();
            page++;
          } while (page <= totalPages);
          await deps.omieOrdersRepo.reconcileMissingStage20Orders([...activeStage20OmieCodes]);
          return {
            ok: true,
            reason: "DONE",
            syncedOrders,
            skippedOrders,
            pages: totalPages,
            ...resolvedOmieEndpoint ? { omieEndpoint: resolvedOmieEndpoint } : {}
          };
        } catch (err) {
          if (err instanceof AppError) throw err;
          throw new AppError("OMIE_STAGE20_ORDERS_SYNC_FAILED", 500, "Falha ao sincronizar pedidos etapa 20", {
            message: err?.message
          });
        }
      });
      if (!lockRun.acquired) {
        return {
          ok: true,
          reason: "LOCKED",
          lockedUntil: lockRun.lockedUntil,
          syncedOrders: 0,
          skippedOrders: 0,
          pages: 0
        };
      }
      return lockRun.result;
    }
  };
}

// src/modules/omie-orders/infrastructure/db/omie-orders.repo.prisma.ts
function sanitizeOrderForPrisma(order) {
  return {
    omieCode: String(order?.omieCode),
    numeroPedido: order?.numeroPedido != null ? String(order.numeroPedido) : null,
    codigoCliente: order?.codigoCliente != null ? String(order.codigoCliente) : null,
    codigoEmpresa: order?.codigoEmpresa != null ? String(order.codigoEmpresa) : null,
    etapa: order?.etapa != null ? String(order.etapa) : "20",
    cancelado: order?.cancelado != null ? String(order.cancelado) : "N",
    encerrado: order?.encerrado != null ? String(order.encerrado) : "N",
    dataPrevisao: order?.dataPrevisao ?? null,
    // ✅ TODOS os dados Omie (incluindo quantidade_itens)
    // ficam APENAS no rawPayload
    rawPayload: order?.rawPayload ?? {},
    lastSyncAt: /* @__PURE__ */ new Date()
  };
}
function sanitizeItemForPrisma(it, omieOrderId) {
  return {
    omieItemCode: String(it?.omieItemCode),
    omieOrderId,
    omieProductCode: it?.omieProductCode != null ? String(it.omieProductCode) : null,
    sku: it?.sku != null ? String(it.sku) : null,
    description: String(it?.description ?? ""),
    unit: it?.unit != null ? String(it.unit) : null,
    // Decimal compatível com Prisma
    quantity: it?.quantity,
    unitPrice: it?.unitPrice ?? null,
    totalPrice: it?.totalPrice ?? null,
    rawPayload: it?.rawPayload ?? {},
    lastSyncAt: /* @__PURE__ */ new Date()
  };
}
function createOmieOrdersRepoPrisma(prisma2) {
  return {
    /**
     * Upsert de pedido + itens (idempotente)
     */
    async upsertOrderWithItems(order, items) {
      await prisma2.$transaction(async (tx) => {
        const safeOrder = sanitizeOrderForPrisma(order);
        const savedOrder = await tx.omieOrder.upsert({
          where: { omieCode: safeOrder.omieCode },
          create: safeOrder,
          update: {
            numeroPedido: safeOrder.numeroPedido,
            codigoCliente: safeOrder.codigoCliente,
            codigoEmpresa: safeOrder.codigoEmpresa,
            etapa: safeOrder.etapa,
            cancelado: safeOrder.cancelado,
            encerrado: safeOrder.encerrado,
            dataPrevisao: safeOrder.dataPrevisao,
            rawPayload: safeOrder.rawPayload,
            lastSyncAt: safeOrder.lastSyncAt
          },
          select: { id: true }
        });
        for (const it of items) {
          if (!it?.omieItemCode) continue;
          const safeItem = sanitizeItemForPrisma(it, savedOrder.id);
          await tx.omieOrderItem.upsert({
            where: { omieItemCode: safeItem.omieItemCode },
            create: safeItem,
            update: {
              omieOrderId: savedOrder.id,
              omieProductCode: safeItem.omieProductCode,
              sku: safeItem.sku,
              description: safeItem.description,
              unit: safeItem.unit,
              quantity: safeItem.quantity,
              unitPrice: safeItem.unitPrice,
              totalPrice: safeItem.totalPrice,
              rawPayload: safeItem.rawPayload,
              lastSyncAt: safeItem.lastSyncAt
            }
          });
        }
      });
    },
    /**
     * Remove pedidos que saíram da etapa 20 no snapshot atual
     */
    async reconcileMissingStage20Orders(activeOmieCodes) {
      const normalizedCodes = Array.from(
        new Set((activeOmieCodes ?? []).map((c) => String(c ?? "").trim()).filter(Boolean))
      );
      const whereBase = {
        etapa: "20",
        cancelado: "N",
        encerrado: "N"
      };
      const where = normalizedCodes.length > 0 ? { ...whereBase, omieCode: { notIn: normalizedCodes } } : whereBase;
      const result = await prisma2.omieOrder.updateMany({
        where,
        data: {
          etapa: "OUT20",
          lastSyncAt: /* @__PURE__ */ new Date()
        }
      });
      return result.count ?? 0;
    }
  };
}

// src/modules/omie-orders/application/use-cases/fetch-omie-products-page.usecase.ts
var OMIE_PRODUCTS_PATH2 = "geral/produtos/";
var OMIE_PRODUCTS_PAGE_SIZE2 = 100;
function sleep3(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function createFetchOmieProductsPageUseCase2(deps) {
  const log = deps.logger ?? {};
  function buildProductsPayload(page) {
    return {
      call: "ListarProdutos",
      param: [
        {
          pagina: page,
          registros_por_pagina: OMIE_PRODUCTS_PAGE_SIZE2,
          apenas_importado_api: "N",
          filtrar_apenas_omiepdv: "N"
        }
      ]
    };
  }
  function extractItems(data) {
    return data?.produto_servico_cadastro ?? data?.produtos ?? data?.lista ?? data?.produto_servico ?? [];
  }
  function extractTotalPages(data) {
    const value = data?.total_de_paginas ?? data?.nTotPaginas ?? data?.nTotalPaginas ?? data?.total_paginas;
    if (value === void 0 || value === null || value === "") return null;
    const totalPages = Number(value);
    return Number.isFinite(totalPages) && totalPages > 0 ? totalPages : null;
  }
  async function fetchWithRetry(page, requestId) {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const data = await deps.omieClient.post(OMIE_PRODUCTS_PATH2, buildProductsPayload(page));
        return data;
      } catch (error) {
        if (attempt >= maxAttempts) {
          if (error instanceof AppError) {
            throw new AppError(error.code, error.statusCode, error.message, {
              ...error.details || {},
              page,
              attempt,
              requestId
            });
          }
          throw error;
        }
        log.warn?.({ requestId, page, attempt }, "omie products page retry");
        await sleep3(250 * attempt);
      }
    }
    throw new AppError("OMIE_PAGINATION_ERROR", 502, "Falha ao paginar produtos no Omie", {
      page,
      requestId
    });
  }
  return {
    pageSize: OMIE_PRODUCTS_PAGE_SIZE2,
    async execute(input) {
      const data = await fetchWithRetry(input.page, input.requestId);
      const items = extractItems(data);
      const totalPages = extractTotalPages(data);
      return { data, items, totalPages };
    }
  };
}

// src/modules/omie-orders/application/use-cases/sync-omie-products.usecase.ts
var OMIE_PRODUCTS_MAX_PAGES2 = 2e3;
function createSyncOmieProductsUseCase2(deps) {
  const log = deps.logger ?? {};
  const THROTTLE_WINDOW_MS = deps.throttleWindowMs ?? 60 * 1e3;
  const LOCK_WINDOW_MS = deps.lockWindowMs ?? 2 * 60 * 1e3;
  function acquireInMemoryLock(now) {
    if (deps.state.inMemoryLockUntil > now) {
      throw new AppError("SYNC_IN_PROGRESS", 409, "Sincroniza\xE7\xE3o j\xE1 em andamento");
    }
    deps.state.inMemoryLockUntil = now + LOCK_WINDOW_MS;
  }
  function releaseInMemoryLock() {
    deps.state.inMemoryLockUntil = 0;
  }
  return {
    async execute(input) {
      const requestId = input.requestId;
      const force = input.force === true;
      const now = Date.now();
      const timeSinceLastSync = now - deps.state.lastGlobalSyncAt;
      if (!force && timeSinceLastSync < THROTTLE_WINDOW_MS) {
        const nextAllowedInSec = Math.ceil((THROTTLE_WINDOW_MS - timeSinceLastSync) / 1e3);
        log.info?.({ requestId, nextAllowedInSec }, "sync skipped (throttled)");
        return { skipped: true, reason: "SYNC_THROTTLED", nextAllowedInSec };
      }
      let lockAcquired = false;
      let usingInMemoryLock = false;
      try {
        await deps.syncLockRepo.tryAcquire(now, LOCK_WINDOW_MS);
        lockAcquired = true;
      } catch (dbError) {
        if (dbError instanceof AppError) {
          throw dbError;
        }
        if (deps.syncLockRepo.isTableUnavailableError(dbError)) {
          acquireInMemoryLock(now);
          usingInMemoryLock = true;
          lockAcquired = true;
          log.warn?.(
            { requestId, strategy: "in_memory", prismaCode: dbError?.code ?? "UNKNOWN" },
            "sync lock fallback"
          );
        } else {
          log.error?.({ requestId, prismaCode: dbError?.code, err: dbError }, "sync lock db error");
          throw new AppError("SYNC_LOCK_DB_ERROR", 503, "Falha ao acessar o lock de sincroniza\xE7\xE3o no banco", {
            prismaCode: dbError?.code,
            message: dbError?.message
          });
        }
      }
      const startTime = Date.now();
      log.info?.({ requestId }, "omie products sync start");
      let upsertedCount = 0;
      let failedCount = 0;
      let pagesProcessed = 0;
      try {
        let page = 1;
        let totalPages = null;
        while (true) {
          if (page > OMIE_PRODUCTS_MAX_PAGES2) {
            throw new AppError("OMIE_PAGINATION_OVERFLOW", 502, "Pagina\xE7\xE3o do Omie excedeu o limite de seguran\xE7a", {
              page,
              requestId
            });
          }
          const { items, totalPages: reportedTotalPages } = await deps.fetchOmieProductsPage.execute({ page, requestId });
          if (reportedTotalPages && totalPages === null) {
            totalPages = reportedTotalPages;
          }
          if (items.length === 0) break;
          for (const item of items) {
            let fallbackOmieId = "DESCONHECIDO";
            try {
              const result = await deps.omieProductRepo.upsertFromOmieItem(item);
              fallbackOmieId = result?.omieId ?? result?.omieCode ?? fallbackOmieId;
              upsertedCount++;
            } catch (err) {
              failedCount++;
              fallbackOmieId = fallbackOmieId || item?.codigo_produto || item?.codigo || item?.id || "DESCONHECIDO";
              log.error?.(
                {
                  event: "sync_item_failed",
                  requestId,
                  omieId: fallbackOmieId,
                  errorMessage: err?.message
                },
                "omie product sync item failed"
              );
              if (String(err?.message) === "OMIE_CODE_NOT_FOUND") {
              }
            }
          }
          pagesProcessed++;
          if (totalPages) {
            if (page >= totalPages) break;
          } else {
            if (items.length < deps.fetchOmieProductsPage.pageSize) break;
          }
          page++;
        }
        deps.state.lastGlobalSyncAt = Date.now();
        log.info?.(
          {
            requestId,
            upserted: upsertedCount,
            failed: failedCount,
            pages: pagesProcessed,
            durationMs: Date.now() - startTime
          },
          "omie products sync end"
        );
        return { upserted: upsertedCount, failed: failedCount };
      } finally {
        if (lockAcquired) {
          if (usingInMemoryLock) {
            releaseInMemoryLock();
          } else {
            try {
              await deps.syncLockRepo.release();
            } catch (releaseErr) {
              log.error?.({ requestId, err: releaseErr }, "failed to release sync lock");
            }
          }
        }
      }
    }
  };
}

// src/modules/omie-orders/infrastructure/db/omie-product.repo.prisma.ts
function createOmieProductRepoPrisma2(prisma2) {
  return {
    async upsertFromOmieItem(item) {
      const dto = OmieAdapter.toProductDTO(item);
      const omieCode = String(item?.codigo ?? item?.cod_int ?? item?.codigo_item ?? dto?.omieId ?? "").trim();
      if (!omieCode) {
        throw new Error("OMIE_CODE_NOT_FOUND");
      }
      const rawOmieIdValue = item?.id ?? item?.codigo_produto;
      const omieId = rawOmieIdValue !== void 0 && rawOmieIdValue !== null ? String(rawOmieIdValue).trim() : null;
      const now = /* @__PURE__ */ new Date();
      const familyDescription = OmieAdapter.extractFamilyDescription(dto.rawPayload);
      await prisma2.omieProduct.upsert({
        where: { omieCode },
        create: {
          omieCode,
          omieId,
          sku: dto.sku,
          description: dto.description,
          familyDescription,
          active: dto.active,
          rawPayload: dto.rawPayload,
          lastSyncAt: now
        },
        update: {
          omieId,
          sku: dto.sku,
          description: dto.description,
          familyDescription,
          active: dto.active,
          rawPayload: dto.rawPayload,
          lastSyncAt: now
        }
      });
      return { omieCode, omieId, dto };
    }
  };
}

// src/modules/omie-orders/infrastructure/db/sync-lock.repo.prisma.ts
var SYNC_LOCK_KEY2 = "omie_products_sync";
function createSyncLockRepoPrisma2(prisma2) {
  function isSyncLockTableUnavailable(error) {
    return error?.code === "P2021" || error?.code === "P2022";
  }
  return {
    key: SYNC_LOCK_KEY2,
    isTableUnavailableError: isSyncLockTableUnavailable,
    async ensureRowExists() {
      let lock = await prisma2.syncLock.findUnique({ where: { key: SYNC_LOCK_KEY2 } });
      if (!lock) {
        try {
          lock = await prisma2.syncLock.create({
            data: { key: SYNC_LOCK_KEY2, lockedUntil: /* @__PURE__ */ new Date(0) }
          });
        } catch (e) {
          if (e?.code === "P2002") {
            lock = await prisma2.syncLock.findUnique({ where: { key: SYNC_LOCK_KEY2 } });
          } else {
            throw e;
          }
        }
      }
      return lock;
    },
    async tryAcquire(nowMs, ttlMs) {
      const lock = await this.ensureRowExists();
      if (lock.lockedUntil.getTime() > nowMs) {
        throw new AppError("SYNC_IN_PROGRESS", 409, "Sincroniza\xE7\xE3o j\xE1 em andamento");
      }
      const updated = await prisma2.syncLock.updateMany({
        where: { key: SYNC_LOCK_KEY2, lockedUntil: lock.lockedUntil },
        data: { lockedUntil: new Date(nowMs + ttlMs) }
      });
      if (updated.count === 0) {
        throw new AppError("SYNC_IN_PROGRESS", 409, "Sincroniza\xE7\xE3o j\xE1 em andamento");
      }
      return true;
    },
    async release() {
      await prisma2.syncLock.update({
        where: { key: SYNC_LOCK_KEY2 },
        data: { lockedUntil: /* @__PURE__ */ new Date(0) }
      });
    }
  };
}

// src/modules/omie-orders/application/use-cases/list-production-orders-page.usecase.ts
function createListProductionOrdersPageUseCase(deps) {
  return {
    async execute(input) {
      const { page, pageSize, filterCompleted, filterCompletionDateStart, filterCompletionDateEnd } = input;
      try {
        const endpoint = OMIE_ENDPOINTS.PRODUCTION_ORDERS;
        const params = [
          { pagina: page },
          { registros_por_pagina: pageSize }
        ];
        if (filterCompleted !== void 0) {
          params.push({ cConcluida: filterCompleted ? "S" : "N" });
        }
        if (filterCompletionDateStart) {
          params.push({ dDtConclusaoDe: filterCompletionDateStart });
        }
        if (filterCompletionDateEnd) {
          params.push({ dDtConclusaoAte: filterCompletionDateEnd });
        }
        const payload = { call: endpoint.call, param: params };
        if (deps.logger) {
          deps.logger.info(`[OMIE] Listando ordens de produ\xE7\xE3o p\xE1gina ${page}`, {
            endpoint: endpoint.path,
            call: endpoint.call,
            params
          });
        }
        const resp = await deps.omieClient.post(endpoint.path, payload);
        return {
          resp,
          resolvedOmieEndpoint: { path: endpoint.path, call: endpoint.call }
        };
      } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("OMIE_LIST_PRODUCTION_ORDERS_FAILED", 502, "Falha ao listar ordens de produ\xE7\xE3o do Omie", {
          message: err?.message,
          stack: err?.stack
        });
      }
    }
  };
}

// src/shared/integrations/omie/OmieProductionOrdersAdapter.ts
function mapProductionOrder(order) {
  const identificacao = order?.identificacao ?? {};
  const infAdicionais = order?.infAdicionais ?? {};
  const outrasInf = order?.outrasInf ?? {};
  const omieCode = String(identificacao.nCodOP ?? "");
  const internalCode = identificacao.cCodIntOP ? String(identificacao.cCodIntOP) : null;
  const mappedOrder = {
    omieCode,
    internalCode,
    productCode: identificacao.nCodProduto ? String(identificacao.nCodProduto) : null,
    productIntegrationCode: identificacao.cCodIntProd ? String(identificacao.cCodIntProd) : null,
    quantity: String(identificacao.nQtde ?? 0),
    forecastDate: brDateToISO(identificacao.dDtPrevisao),
    startDate: brDateToISO(infAdicionais.dDtInicio),
    completionDate: brDateToISO(infAdicionais.dDtConclusao),
    stage: infAdicionais.cEtapa ? String(infAdicionais.cEtapa) : null,
    projectCode: infAdicionais.nCodProjeto ? String(infAdicionais.nCodProjeto) : null,
    completed: String(outrasInf.cConcluida ?? "").trim() === "S",
    rawPayload: order,
    lastSyncAt: /* @__PURE__ */ new Date()
  };
  const items = [];
  const mainItems = order?.itens ?? [];
  mainItems.forEach((item) => {
    const omieItemCode = `main_${item.nIdProdutoMalha ?? Date.now()}`;
    items.push({
      omieItemCode,
      omieProductionOrderId: omieCode,
      productMeshId: item.nIdProdutoMalha ?? null,
      useFromStock: item.cUtilizarDoEstoque ?? null,
      rawPayload: item,
      lastSyncAt: /* @__PURE__ */ new Date()
    });
  });
  const detailedItems = order?.itensDetalhes ?? [];
  detailedItems.forEach((item, index) => {
    const omieItemCode = `detail_${item.nIdProdutoMalha ?? index}`;
    items.push({
      omieItemCode,
      omieProductionOrderId: omieCode,
      productMeshId: item.nIdProdutoMalha ?? null,
      useFromStock: item.cUtilizarDoEstoque ?? null,
      quantity: item.nQtde != null ? String(item.nQtde) : null,
      stockLocationCode: item.codigo_local_estoque ?? null,
      observation: item.cObs ?? null,
      rawPayload: item,
      lastSyncAt: /* @__PURE__ */ new Date()
    });
  });
  return { order: mappedOrder, items };
}

// src/modules/omie-orders/application/use-cases/sync-production-orders.usecase.ts
function createSyncProductionOrdersUseCase(deps) {
  const LOCK_KEY = "omie:production-orders:sync";
  const LOCK_TTL_MS = 5 * 60 * 1e3;
  const PAGE_SIZE = 50;
  return {
    async execute(options) {
      const lockRun = await deps.jobLock.runExclusive(LOCK_KEY, LOCK_TTL_MS, async ({ renew }) => {
        let page = 1;
        let totalPages = 1;
        let syncedOrders = 0;
        let skippedOrders = 0;
        const activeOmieCodes = /* @__PURE__ */ new Set();
        try {
          let resolvedOmieEndpoint = null;
          do {
            const { resp, resolvedOmieEndpoint: resolved } = await deps.listProductionOrdersPage.execute({
              page,
              pageSize: PAGE_SIZE,
              filterCompleted: options?.filterCompleted,
              filterCompletionDateStart: options?.filterCompletionDateStart,
              filterCompletionDateEnd: options?.filterCompletionDateEnd
            });
            if (!resolvedOmieEndpoint) resolvedOmieEndpoint = resolved;
            totalPages = Number(resp?.total_de_paginas ?? 1);
            const cadastros = resp?.cadastros ?? [];
            for (const cadastro of cadastros) {
              const { order, items } = mapProductionOrder(cadastro);
              activeOmieCodes.add(String(order.omieCode));
              const validItems = items.filter(
                (i) => i?.omieItemCode && i?.productMeshId
              );
              await deps.productionOrdersRepo.upsertOrderWithItems(order, validItems);
              syncedOrders++;
            }
            await renew();
            page++;
          } while (page <= totalPages);
          const reconciledCount = await deps.productionOrdersRepo.reconcileMissingOrders([...activeOmieCodes]);
          return {
            ok: true,
            reason: "DONE",
            syncedOrders,
            skippedOrders,
            reconciledCount,
            pages: totalPages,
            ...resolvedOmieEndpoint ? { omieEndpoint: resolvedOmieEndpoint } : {}
          };
        } catch (err) {
          if (err instanceof AppError) throw err;
          throw new AppError("OMIE_PRODUCTION_ORDERS_SYNC_FAILED", 500, "Falha ao sincronizar ordens de produ\xE7\xE3o", {
            message: err?.message,
            stack: err?.stack
          });
        }
      });
      if (!lockRun.acquired) {
        return {
          ok: true,
          reason: "LOCKED",
          lockedUntil: lockRun.lockedUntil,
          syncedOrders: 0,
          skippedOrders: 0,
          reconciledCount: 0,
          pages: 0
        };
      }
      return lockRun.result;
    }
  };
}

// src/modules/omie-orders/infrastructure/db/omie-production-orders.repo.prisma.ts
function createOmieProductionOrdersRepoPrisma(prisma2) {
  return {
    async upsertOrderWithItems(order, items) {
      await prisma2.$transaction(async (tx) => {
        const savedOrder = await tx.omieProductionOrder.upsert({
          where: { omieCode: order.omieCode },
          create: order,
          update: order,
          select: { id: true }
        });
        for (const it of items) {
          await tx.omieProductionOrderItem.upsert({
            where: { omieItemCode: it.omieItemCode },
            create: { ...it, omieProductionOrderId: savedOrder.id },
            update: { ...it, omieProductionOrderId: savedOrder.id }
          });
        }
      });
    },
    async reconcileMissingOrders(activeOmieCodes) {
      const normalizedCodes = Array.from(
        new Set((activeOmieCodes ?? []).map((c) => String(c ?? "").trim()).filter(Boolean))
      );
      const where = normalizedCodes.length > 0 ? {
        omieCode: { notIn: normalizedCodes }
      } : {};
      const result = await prisma2.omieProductionOrder.updateMany({
        where,
        data: {
          // Marca como inativo no espelho local quando não aparece mais no snapshot atual
          active: false,
          lastSyncAt: /* @__PURE__ */ new Date()
        }
      });
      return result.count ?? 0;
    },
    async listOrders(options) {
      const page = options?.page ?? 1;
      const pageSize = options?.pageSize ?? 50;
      const skip = (page - 1) * pageSize;
      const where = {};
      if (options?.filterCompleted !== void 0) {
        where.completed = options.filterCompleted;
      }
      if (options?.filterCompletionDateStart || options?.filterCompletionDateEnd) {
        where.completionDate = {};
        if (options.filterCompletionDateStart) {
          where.completionDate.gte = new Date(options.filterCompletionDateStart);
        }
        if (options.filterCompletionDateEnd) {
          where.completionDate.lte = new Date(options.filterCompletionDateEnd);
        }
      }
      const [orders, total] = await Promise.all([
        prisma2.omieProductionOrder.findMany({
          where,
          include: {
            items: true
          },
          orderBy: {
            forecastDate: "desc"
          },
          skip,
          take: pageSize
        }),
        prisma2.omieProductionOrder.count({ where })
      ]);
      return {
        data: orders,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    },
    async getOrderByCode(omieCode) {
      return prisma2.omieProductionOrder.findUnique({
        where: { omieCode },
        include: {
          items: true
        }
      });
    },
    async getOrdersByProductCode(productCode) {
      return prisma2.omieProductionOrder.findMany({
        where: { productCode },
        include: {
          items: true
        },
        orderBy: {
          forecastDate: "desc"
        }
      });
    },
    async getOrdersByProductIntegrationCode(integrationCode) {
      return prisma2.omieProductionOrder.findMany({
        where: { productIntegrationCode: integrationCode },
        include: {
          items: true
        },
        orderBy: {
          forecastDate: "desc"
        }
      });
    },
    async getActiveOrdersCount() {
      return prisma2.omieProductionOrder.count({
        where: { completed: false, active: true }
      });
    },
    async getCompletedOrdersCount(startDate, endDate) {
      const where = { completed: true, active: true };
      if (startDate || endDate) {
        where.completionDate = {};
        if (startDate) {
          where.completionDate.gte = new Date(startDate);
        }
        if (endDate) {
          where.completionDate.lte = new Date(endDate);
        }
      }
      return prisma2.omieProductionOrder.count({ where });
    }
  };
}

// src/modules/omie-orders/application/use-cases/list-orders.usecase.ts
function createListOrdersUseCase(deps) {
  return {
    /**
     * Replica a lógica legacy:
     * - paginação simples (page, pageSize)
     * - retorna orders com campos resumidos + items mínimos
     * - ordena por lastSyncAt desc
     */
    async execute(input) {
      const page = Math.max(Number(input?.page ?? 1), 1);
      const pageSize = Math.min(Math.max(Number(input?.pageSize ?? 50), 1), 200);
      const where = {
        etapa: "20",
        cancelado: "N",
        encerrado: "N"
      };
      const [total, orders] = await Promise.all([
        deps.prisma.omieOrder.count({ where }),
        deps.prisma.omieOrder.findMany({
          where,
          select: {
            omieCode: true,
            numeroPedido: true,
            etapa: true,
            cancelado: true,
            encerrado: true,
            dataPrevisao: true,
            lastSyncAt: true,
            items: {
              select: {
                omieItemCode: true,
                description: true,
                quantity: true,
                unit: true
              },
              orderBy: { description: "asc" }
            }
          },
          orderBy: { lastSyncAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize
        })
      ]);
      return { page, pageSize, total, orders };
    }
  };
}

// src/modules/omie-orders/application/use-cases/list-stage20-orders.usecase.ts
function createListStage20OrdersUseCase(deps) {
  return {
    /**
     * Replica a lógica legacy:
     * - page, pageSize (1..200)
     * - filtro opcional q (busca por descrição nos itens)
     * - apenas etapa 20, não cancelado, não encerrado
     * - orderBy lastSyncAt desc
     * - retorna { data, meta }
     */
    async execute(input) {
      const page = Math.max(Number(input?.page ?? 1), 1);
      const pageSize = Math.min(Math.max(Number(input?.pageSize ?? 50), 1), 200);
      const q = input?.q?.trim();
      const where = {
        etapa: "20",
        cancelado: "N",
        encerrado: "N",
        ...q ? {
          items: {
            some: {
              description: {
                contains: q,
                mode: "insensitive"
              }
            }
          }
        } : {}
      };
      const [total, data] = await Promise.all([
        deps.prisma.omieOrder.count({ where }),
        deps.prisma.omieOrder.findMany({
          where,
          include: {
            items: {
              select: {
                description: true,
                quantity: true
              }
            }
          },
          orderBy: { lastSyncAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize
        })
      ]);
      return { data, meta: { page, pageSize, total } };
    }
  };
}

// src/modules/omie-orders/application/use-cases/get-stage20-totals.usecase.ts
function createGetStage20TotalsUseCase(deps) {
  return {
    async execute() {
      const rows = await deps.prisma.$queryRaw`
        SELECT
          i.description,
          SUM(i.quantity) AS total_quantity
        FROM omie_order_item i
        JOIN omie_order o ON o.id = i."omieOrderId"
        WHERE
          o.etapa = '20'
          AND o.cancelado = 'N'
          AND o.encerrado = 'N'
        GROUP BY i.description
        ORDER BY total_quantity DESC
      `;
      return rows.map((r) => ({
        description: r.description,
        totalQuantity: Number(r.total_quantity)
      }));
    }
  };
}

// src/modules/omie-orders/application/use-cases/list-production-orders.usecase.ts
function createListProductionOrdersUseCase(deps) {
  return {
    async execute(input) {
      const {
        page = 1,
        pageSize = 50,
        filterCompleted,
        filterCompletionDateStart,
        filterCompletionDateEnd
      } = input;
      const result = await deps.productionOrdersRepo.listOrders({
        page,
        pageSize,
        filterCompleted,
        filterCompletionDateStart,
        filterCompletionDateEnd
      });
      return result;
    }
  };
}

// src/modules/omie-orders/application/use-cases/get-production-order-by-code.usecase.ts
function createGetProductionOrderByCodeUseCase(deps) {
  return {
    async execute(input) {
      const order = await deps.productionOrdersRepo.getOrderByCode(input.omieCode);
      return order;
    }
  };
}

// src/modules/omie-orders/application/use-cases/get-production-orders-by-product-code.usecase.ts
function createGetProductionOrdersByProductCodeUseCase(deps) {
  return {
    async execute(input) {
      const { productCode, page = 1, pageSize = 50 } = input;
      const orders = await deps.productionOrdersRepo.getOrdersByProductCode(productCode);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedOrders = orders.slice(startIndex, endIndex);
      return {
        data: paginatedOrders,
        meta: {
          page,
          pageSize,
          total: orders.length,
          totalPages: Math.ceil(orders.length / pageSize)
        }
      };
    }
  };
}

// src/modules/omie-orders/application/use-cases/get-production-orders-by-product-integration-code.usecase.ts
function createGetProductionOrdersByProductIntegrationCodeUseCase(deps) {
  return {
    async execute(input) {
      const { integrationCode, page = 1, pageSize = 50 } = input;
      const orders = await deps.productionOrdersRepo.getOrdersByProductIntegrationCode(integrationCode);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedOrders = orders.slice(startIndex, endIndex);
      return {
        data: paginatedOrders,
        meta: {
          page,
          pageSize,
          total: orders.length,
          totalPages: Math.ceil(orders.length / pageSize)
        }
      };
    }
  };
}

// src/modules/omie-orders/application/use-cases/get-production-orders-stats.usecase.ts
function createGetProductionOrdersStatsUseCase(deps) {
  return {
    async execute() {
      const [activeCount, completedCount] = await Promise.all([
        deps.productionOrdersRepo.getActiveOrdersCount(),
        deps.productionOrdersRepo.getCompletedOrdersCount()
      ]);
      return {
        active: activeCount,
        completed: completedCount,
        total: activeCount + completedCount
      };
    }
  };
}

// src/modules/omie-orders/application/use-cases/get-active-production-orders-count.usecase.ts
function createGetActiveProductionOrdersCountUseCase(deps) {
  return {
    async execute() {
      return deps.productionOrdersRepo.getActiveOrdersCount();
    }
  };
}

// src/modules/omie-orders/application/use-cases/get-completed-production-orders-count.usecase.ts
function createGetCompletedProductionOrdersCountUseCase(deps) {
  return {
    async execute(input) {
      const { startDate, endDate } = input;
      return deps.productionOrdersRepo.getCompletedOrdersCount(startDate, endDate);
    }
  };
}

// src/modules/omie-orders/index.ts
var state = {
  lastGlobalSyncAt: 0,
  inMemoryLockUntil: 0
};
function createOmieOrdersModule(app) {
  const prisma2 = app.prisma;
  const omieClient = app.omieClient;
  const logger = app.log;
  const jobLock = createJobLock(prisma2);
  const omieOrdersRepo = createOmieOrdersRepoPrisma(prisma2);
  const listOmieOrdersPage = createListOmieOrdersPageUseCase({ omieClient });
  const syncStage20Orders = createSyncStage20OrdersUseCase({
    jobLock,
    listOmieOrdersPage,
    omieOrdersRepo
  });
  const syncLockRepo = createSyncLockRepoPrisma2(prisma2);
  const omieProductRepo = createOmieProductRepoPrisma2(prisma2);
  const fetchOmieProductsPage = createFetchOmieProductsPageUseCase2({
    omieClient,
    logger
  });
  const syncOmieProducts = createSyncOmieProductsUseCase2({
    prisma: prisma2,
    syncLockRepo,
    fetchOmieProductsPage,
    omieProductRepo,
    logger,
    state
  });
  const productionOrdersRepo = createOmieProductionOrdersRepoPrisma(prisma2);
  const listProductionOrdersPage = createListProductionOrdersPageUseCase({
    omieClient,
    logger
  });
  const syncProductionOrders = createSyncProductionOrdersUseCase({
    jobLock,
    listProductionOrdersPage,
    productionOrdersRepo,
    logger
  });
  const listOrders = createListOrdersUseCase({ prisma: prisma2 });
  const listStage20Orders = createListStage20OrdersUseCase({ prisma: prisma2 });
  const getStage20Totals = createGetStage20TotalsUseCase({ prisma: prisma2 });
  const listProductionOrders = createListProductionOrdersUseCase({ productionOrdersRepo });
  const getProductionOrderByCode = createGetProductionOrderByCodeUseCase({ productionOrdersRepo });
  const getProductionOrdersByProductCode = createGetProductionOrdersByProductCodeUseCase({ productionOrdersRepo });
  const getProductionOrdersByProductIntegrationCode = createGetProductionOrdersByProductIntegrationCodeUseCase({ productionOrdersRepo });
  const getProductionOrdersStats = createGetProductionOrdersStatsUseCase({ productionOrdersRepo });
  const getActiveProductionOrdersCount = createGetActiveProductionOrdersCountUseCase({ productionOrdersRepo });
  const getCompletedProductionOrdersCount = createGetCompletedProductionOrdersCountUseCase({ productionOrdersRepo });
  return {
    useCases: {
      // sync
      syncStage20Orders,
      syncOmieProducts,
      syncProductionOrders,
      // leitura (controller depende disso)
      listOrders,
      listStage20Orders,
      getStage20Totals,
      // leitura de ordens de produção
      listProductionOrders,
      getProductionOrderByCode,
      getProductionOrdersByProductCode,
      getProductionOrdersByProductIntegrationCode,
      getProductionOrdersStats,
      getActiveProductionOrdersCount,
      getCompletedProductionOrdersCount
    }
  };
}
function createOmieOrdersController(useCases) {
  return {
    async ping(request, reply) {
      return sendOk(request, reply, { ok: true }, {});
    },
    async syncStage20(request, reply) {
      const result = await useCases.syncStage20Orders.execute();
      return sendOk(request, reply, result, {});
    },
    async syncStage20Info(_request, reply) {
      return reply.send(
        ok({
          ok: true,
          module: "omie-orders",
          operation: "stage20-sync",
          description: "Sincroniza\xE7\xE3o de pedidos Omie da etapa 20 para o banco local.",
          howToRun: {
            method: "POST",
            endpoint: "/v1/admin/omie/orders/stage20/sync",
            idempotent: true,
            lockStrategy: "exclusive"
          },
          status: {
            running: false,
            // futuro: pode vir de lockRepo
            locked: false,
            lockedUntil: null
          },
          lastExecution: {
            supported: false,
            note: "Ainda n\xE3o h\xE1 persist\xEAncia de hist\xF3rico de execu\xE7\xE3o"
          },
          behavior: {
            onSuccess: "Pedidos s\xE3o persistidos/atualizados no banco",
            onLocked: "Retorna reason=LOCKED sem executar",
            onError: "Retorna AppError com c\xF3digo espec\xEDfico"
          }
        })
      );
    },
    async listOrders(request, reply) {
      const q = zod.z.object({
        page: zod.z.coerce.number().min(1).default(1),
        pageSize: zod.z.coerce.number().min(1).max(200).default(50)
      }).parse(request.query);
      const result = await useCases.listOrders.execute(q);
      return sendOk(request, reply, result, {});
    },
    async listStage20(request, reply) {
      const q = zod.z.object({
        page: zod.z.coerce.number().int().min(1).default(1),
        pageSize: zod.z.coerce.number().int().min(1).max(200).default(50),
        q: zod.z.string().trim().optional()
      }).parse(request.query);
      const result = await useCases.listStage20Orders.execute(q);
      return reply.send(
        paginated(
          result.data,
          result.meta,
          {
            self: `/v1/admin/orders/stage20?page=${result.meta.page}&pageSize=${result.meta.pageSize}${q.q ? `&q=${encodeURIComponent(q.q)}` : ""}`
          }
        )
      );
    },
    async getStage20Totals(_request, reply) {
      const data = await useCases.getStage20Totals.execute();
      return reply.send(ok(data));
    }
  };
}

// src/modules/omie-orders/presentation/http/omie-orders.routes.ts
async function registerOmieOrdersRoutes(app, controller) {
  app.get("/v1/admin/orders", controller.listOrders);
  app.get("/v1/admin/orders/stage20", controller.listStage20);
  app.get("/v1/admin/orders/stage20/totals", controller.getStage20Totals);
  app.post("/v1/admin/omie/orders/stage20/sync", controller.syncStage20);
  app.get("/v1/admin/omie/orders/stage20/sync", controller.syncStage20Info);
  app.get("/v1/admin/omie/orders/stage20/ping", controller.ping);
}
function createOmieProductionOrdersController(useCases) {
  return {
    async ping(request, reply) {
      return sendOk(request, reply, { ok: true }, {});
    },
    async syncProductionOrders(request, reply) {
      const querySchema = zod.z.object({
        filterCompleted: zod.z.enum(["true", "false"]).optional().transform((val) => val === "true"),
        filterCompletionDateStart: zod.z.string().optional(),
        filterCompletionDateEnd: zod.z.string().optional()
      });
      const options = querySchema.parse(request.query);
      const result = await useCases.syncProductionOrders.execute(options);
      return sendOk(request, reply, result, {});
    },
    async syncProductionOrdersInfo(_request, reply) {
      return reply.send(
        ok({
          ok: true,
          module: "omie-production-orders",
          operation: "production-orders-sync",
          description: "Sincroniza\xE7\xE3o de ordens de produ\xE7\xE3o Omie para o banco local.",
          howToRun: {
            method: "POST",
            endpoint: "/v1/admin/omie/production-orders/sync",
            idempotent: true,
            lockStrategy: "exclusive",
            queryParams: {
              filterCompleted: "optional - 'true' ou 'false' para filtrar por conclus\xE3o",
              filterCompletionDateStart: "optional - data inicial para filtro por data de conclus\xE3o",
              filterCompletionDateEnd: "optional - data final para filtro por data de conclus\xE3o"
            }
          },
          status: {
            running: false,
            locked: false,
            lockedUntil: null
          },
          lastExecution: {
            supported: false,
            note: "Ainda n\xE3o h\xE1 persist\xEAncia de hist\xF3rico de execu\xE7\xE3o"
          },
          behavior: {
            onSuccess: "Ordens de produ\xE7\xE3o s\xE3o persistidas/atualizadas no banco",
            onLocked: "Retorna reason=LOCKED sem executar",
            onError: "Retorna AppError com c\xF3digo espec\xEDfico"
          },
          omieEndpoint: {
            path: "produtos/op/",
            call: "ListarOrdemProducao"
          }
        })
      );
    },
    async listProductionOrders(request, reply) {
      const querySchema = zod.z.object({
        page: zod.z.coerce.number().int().min(1).default(1),
        pageSize: zod.z.coerce.number().int().min(1).max(200).default(50),
        filterCompleted: zod.z.enum(["true", "false"]).optional().transform((val) => val === "true"),
        filterCompletionDateStart: zod.z.string().optional(),
        filterCompletionDateEnd: zod.z.string().optional(),
        sortBy: zod.z.enum(["forecastDate", "completionDate", "stage", "quantity"]).default("forecastDate"),
        sortOrder: zod.z.enum(["asc", "desc"]).default("desc")
      });
      const query = querySchema.parse(request.query);
      const result = await useCases.listProductionOrders.execute(query);
      return reply.send(
        paginated(
          result.data,
          result.meta,
          {
            self: `/v1/admin/omie/production-orders?page=${result.meta.page}&pageSize=${result.meta.pageSize}${query.filterCompleted !== void 0 ? `&filterCompleted=${query.filterCompleted}` : ""}${query.filterCompletionDateStart ? `&filterCompletionDateStart=${encodeURIComponent(query.filterCompletionDateStart)}` : ""}${query.filterCompletionDateEnd ? `&filterCompletionDateEnd=${encodeURIComponent(query.filterCompletionDateEnd)}` : ""}`
          }
        )
      );
    },
    async getProductionOrderByCode(request, reply) {
      const paramsSchema = zod.z.object({
        omieCode: zod.z.string().trim().min(1)
      });
      const { omieCode } = paramsSchema.parse(request.params);
      const order = await useCases.getProductionOrderByCode.execute({ omieCode });
      if (!order) {
        return reply.status(404).send({
          error: {
            code: "PRODUCTION_ORDER_NOT_FOUND",
            message: `Ordem de produ\xE7\xE3o com c\xF3digo ${omieCode} n\xE3o encontrada`
          }
        });
      }
      return reply.send(ok(order));
    },
    async getProductionOrdersByProductCode(request, reply) {
      const querySchema = zod.z.object({
        productCode: zod.z.string().trim().min(1),
        page: zod.z.coerce.number().int().min(1).default(1),
        pageSize: zod.z.coerce.number().int().min(1).max(200).default(50)
      });
      const query = querySchema.parse({ ...request.query, ...request.params });
      const result = await useCases.getProductionOrdersByProductCode.execute(query);
      return reply.send(
        paginated(
          result.data,
          result.meta,
          {
            self: `/v1/admin/omie/production-orders/product/${query.productCode}?page=${result.meta.page}&pageSize=${result.meta.pageSize}`
          }
        )
      );
    },
    async getProductionOrdersByProductIntegrationCode(request, reply) {
      const querySchema = zod.z.object({
        integrationCode: zod.z.string().trim().min(1),
        page: zod.z.coerce.number().int().min(1).default(1),
        pageSize: zod.z.coerce.number().int().min(1).max(200).default(50)
      });
      const query = querySchema.parse({ ...request.query, ...request.params });
      const result = await useCases.getProductionOrdersByProductIntegrationCode.execute(query);
      return reply.send(
        paginated(
          result.data,
          result.meta,
          {
            self: `/v1/admin/omie/production-orders/product-integration/${query.integrationCode}?page=${result.meta.page}&pageSize=${result.meta.pageSize}`
          }
        )
      );
    },
    async getProductionOrdersStats(_request, reply) {
      const stats = await useCases.getProductionOrdersStats.execute();
      return reply.send(ok(stats));
    },
    async getActiveProductionOrdersCount(_request, reply) {
      const count = await useCases.getActiveProductionOrdersCount.execute();
      return reply.send(ok({ count }));
    },
    async getCompletedProductionOrdersCount(request, reply) {
      const querySchema = zod.z.object({
        startDate: zod.z.string().optional(),
        endDate: zod.z.string().optional()
      });
      const query = querySchema.parse(request.query);
      const count = await useCases.getCompletedProductionOrdersCount.execute(query);
      return reply.send(ok({ count }));
    }
  };
}

// src/modules/omie-orders/presentation/http/omie-production-orders.routes.ts
async function registerOmieProductionOrdersRoutes(app, controller) {
  app.get("/v1/admin/omie/production-orders", controller.listProductionOrders);
  app.get("/v1/admin/omie/production-orders/:omieCode", controller.getProductionOrderByCode);
  app.get("/v1/admin/omie/production-orders/product/:productCode", controller.getProductionOrdersByProductCode);
  app.get("/v1/admin/omie/production-orders/product-integration/:integrationCode", controller.getProductionOrdersByProductIntegrationCode);
  app.get("/v1/admin/omie/production-orders/stats", controller.getProductionOrdersStats);
  app.get("/v1/admin/omie/production-orders/stats/active", controller.getActiveProductionOrdersCount);
  app.get("/v1/admin/omie/production-orders/stats/completed", controller.getCompletedProductionOrdersCount);
  app.post("/v1/admin/omie/production-orders/sync", controller.syncProductionOrders);
  app.get("/v1/admin/omie/production-orders/sync", controller.syncProductionOrdersInfo);
  app.get("/v1/admin/omie/production-orders/ping", controller.ping);
}

// src/modules/omie-orders/register.ts
async function registerOmieOrdersModule(app) {
  const { useCases } = createOmieOrdersModule(app);
  const ordersController = createOmieOrdersController(useCases);
  await registerOmieOrdersRoutes(app, ordersController);
  const productionOrdersController = createOmieProductionOrdersController(useCases);
  await registerOmieProductionOrdersRoutes(app, productionOrdersController);
  return { useCases };
}

// src/modules/orders-enriched/presentation/http/orders-enriched.controller.ts
var OrdersEnrichedController = class {
  async listStage20Enriched(request, reply) {
    const page = request.query.page ? Number(request.query.page) : void 0;
    const pageSize = request.query.pageSize ? Number(request.query.pageSize) : void 0;
    const q = request.query.q?.trim();
    const payload = await request.server.listStage20OrdersEnrichedUseCase.execute({
      page,
      pageSize,
      q
    });
    return reply.code(200).send(payload);
  }
};

// src/modules/orders-enriched/presentation/http/orders-enriched.schemas.ts
var listStage20OrdersEnrichedSchema = {
  tags: ["orders"],
  summary: "List stage20 orders enriched with client data (local DB)",
  querystring: {
    type: "object",
    properties: {
      page: { type: "string" },
      pageSize: { type: "string" },
      q: { type: "string" }
    }
  }
};

// src/modules/orders-enriched/presentation/http/orders-enriched.routes.ts
async function ordersEnrichedRoutes(app) {
  const controller = new OrdersEnrichedController();
  app.get(
    "/admin/orders/stage20/enriched",
    { schema: listStage20OrdersEnrichedSchema },
    controller.listStage20Enriched.bind(controller)
  );
}

// src/modules/orders-enriched/infrastructure/integrations/internal/stage20-orders.fetcher.fastify.ts
var Stage20OrdersFetcherFastify = class {
  constructor(app) {
    this.app = app;
  }
  app;
  async fetch(query) {
    const qs = new URLSearchParams();
    if (query.page) qs.set("page", String(query.page));
    if (query.pageSize) qs.set("pageSize", String(query.pageSize));
    if (query.q) qs.set("q", query.q);
    const url = `/v1/admin/orders/stage20${qs.toString() ? `?${qs.toString()}` : ""}`;
    const res = await this.app.inject({
      method: "GET",
      url
    });
    if (res.statusCode >= 400) {
      throw new Error(`Failed to fetch stage20 orders. status=${res.statusCode} body=${res.body}`);
    }
    return res.json();
  }
};

// src/modules/orders-enriched/infrastructure/db/client-lookup.prisma.ts
var ClientLookupPrisma = class {
  constructor(prisma2) {
    this.prisma = prisma2;
  }
  prisma;
  async findManyByOmieClientCodes(codes) {
    const rows = await this.prisma.client.findMany({
      where: { omieClientCode: { in: codes } },
      select: {
        omieClientCode: true,
        legalName: true,
        tradeName: true,
        document: true
      }
    });
    return rows.map((r) => ({
      omieClientCode: r.omieClientCode,
      legalName: r.legalName,
      tradeName: r.tradeName ?? null,
      document: r.document
    }));
  }
};

// src/modules/orders-enriched/application/use-cases/list-stage20-orders-enriched.usecase.ts
function extractOrdersArray(payload) {
  if (payload?.data && Array.isArray(payload.data)) return { containerKey: "data", orders: payload.data };
  if (payload?.orders && Array.isArray(payload.orders)) return { containerKey: "orders", orders: payload.orders };
  if (payload?.items && Array.isArray(payload.items)) return { containerKey: "items", orders: payload.items };
  return { containerKey: "data", orders: [] };
}
function tryBigInt(value) {
  try {
    if (value === null || value === void 0) return null;
    if (typeof value === "bigint") return value;
    if (typeof value === "number") {
      if (!Number.isFinite(value)) return null;
      return BigInt(value);
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return null;
      return BigInt(trimmed);
    }
    return null;
  } catch {
    return null;
  }
}
function extractOmieClientCode(order) {
  const fromHeader = order?.cabecalho?.codigo_cliente;
  const parsedFromHeader = tryBigInt(fromHeader);
  if (parsedFromHeader) return parsedFromHeader;
  const camel = order?.codigoCliente ?? order?.codigoClienteOmie ?? order?.omieClientCode;
  const parsedCamel = tryBigInt(camel);
  if (parsedCamel) return parsedCamel;
  const snake = order?.codigo_cliente ?? order?.codigo_cliente_omie;
  const parsedSnake = tryBigInt(snake);
  if (parsedSnake) return parsedSnake;
  return null;
}
var ListStage20OrdersEnrichedUseCase = class {
  constructor(ordersFetcher, clientLookup) {
    this.ordersFetcher = ordersFetcher;
    this.clientLookup = clientLookup;
  }
  ordersFetcher;
  clientLookup;
  async execute(query) {
    const ordersPayload = await this.ordersFetcher.fetch(query);
    const { containerKey, orders } = extractOrdersArray(ordersPayload);
    const codes = Array.from(
      new Set(
        orders.map(extractOmieClientCode).filter((x) => x !== null).map((x) => x.toString())
      )
    ).map((s) => BigInt(s));
    const clients = codes.length > 0 ? await this.clientLookup.findManyByOmieClientCodes(codes) : [];
    const clientMap = /* @__PURE__ */ new Map();
    for (const c of clients) clientMap.set(c.omieClientCode.toString(), c);
    const enrichedOrders = orders.map((order) => {
      const code = extractOmieClientCode(order);
      const client = code ? clientMap.get(code.toString()) ?? null : null;
      return {
        ...order,
        client: client ? {
          omieClientCode: client.omieClientCode.toString(),
          // JSON-safe
          legalName: client.legalName,
          tradeName: client.tradeName,
          document: client.document
        } : null
      };
    });
    return {
      ...ordersPayload,
      enrichedOrders
    };
  }
};

// src/modules/orders-enriched/register.ts
async function registerOrdersEnrichedModule(app) {
  const prisma2 = app.prisma;
  const ordersFetcher = new Stage20OrdersFetcherFastify(app);
  const clientLookup = new ClientLookupPrisma(prisma2);
  const listStage20OrdersEnrichedUseCase = new ListStage20OrdersEnrichedUseCase(
    ordersFetcher,
    clientLookup
  );
  app.decorate("listStage20OrdersEnrichedUseCase", listStage20OrdersEnrichedUseCase);
  await app.register(ordersEnrichedRoutes, { prefix: "/v1" });
}

// src/modules/orders-view/infrastructure/orders-view.repository.prisma.ts
var OrdersViewRepository = class {
  constructor(prisma2) {
    this.prisma = prisma2;
  }
  prisma;
  async listStage20(params) {
    const { page, pageSize } = params;
    const [orders, total] = await this.prisma.$transaction([
      this.prisma.omieOrder.findMany({
        where: { etapa: "20" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { dataPrevisao: "desc" },
        include: { items: true }
      }),
      this.prisma.omieOrder.count({
        where: { etapa: "20" }
      })
    ]);
    return { orders, total };
  }
  async findClientsByCodes(codes) {
    if (codes.length === 0) return [];
    return this.prisma.client.findMany({
      where: {
        omieClientCode: {
          in: codes.map((c) => BigInt(c))
        }
      },
      select: {
        omieClientCode: true,
        legalName: true,
        tradeName: true,
        document: true
      }
    });
  }
};

// src/modules/orders-view/application/list-orders-view.usecase.ts
function toNumberOrNull(value) {
  if (value === null || value === void 0) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
var ListOrdersViewUseCase = class {
  constructor(repo) {
    this.repo = repo;
  }
  repo;
  async execute(input) {
    const { orders, total } = await this.repo.listStage20(input);
    const clientCodes = Array.from(
      new Set(
        orders.map((o) => o.codigoCliente).filter((x) => typeof x === "string" && x.trim() !== "")
      )
    );
    const clients = await this.repo.findClientsByCodes(clientCodes);
    const clientMap = new Map(
      clients.map((c) => [c.omieClientCode.toString(), c])
    );
    const result = orders.map((order) => {
      const client = order.codigoCliente && order.codigoCliente.trim() !== "" ? clientMap.get(order.codigoCliente) ?? null : null;
      return {
        order: {
          omieCode: order.omieCode,
          orderNumber: order.numeroPedido ?? null,
          stage: order.etapa,
          expectedDate: order.dataPrevisao ? order.dataPrevisao.toISOString() : null,
          cancelled: order.cancelado === "S",
          closed: order.encerrado === "S"
        },
        client: client ? {
          omieClientCode: client.omieClientCode.toString(),
          legalName: client.legalName,
          tradeName: client.tradeName ?? null,
          document: client.document
        } : null,
        // ✅ itens com dados relevantes de produto (sem expor rawPayload)
        items: order.items.map((item) => {
          const raw = item.rawPayload ?? {};
          const produto = raw.produto ?? {};
          return {
            product: {
              // codigo_produto (numérico) ou omieProductCode se existir
              productId: produto.codigo_produto ?? item.omieProductCode ?? null,
              // codigo (SKU do Omie) ou sku persistido
              sku: produto.codigo ?? item.sku ?? null,
              description: produto.descricao ?? item.description,
              unit: produto.unidade ?? item.unit ?? null,
              reserved: (produto.reservado ?? "N") === "S"
            },
            quantity: toNumberOrNull(produto.quantidade) ?? toNumberOrNull(item.quantity) ?? 0,
            unitPrice: toNumberOrNull(produto.valor_unitario) ?? toNumberOrNull(item.unitPrice),
            discount: toNumberOrNull(produto.valor_desconto) ?? 0,
            totalPrice: toNumberOrNull(produto.valor_total) ?? toNumberOrNull(produto.valor_mercadoria) ?? toNumberOrNull(item.totalPrice)
          };
        }),
        lastSyncAt: order.lastSyncAt.toISOString()
      };
    });
    return {
      meta: {
        page: input.page,
        pageSize: input.pageSize,
        total
      },
      orders: result
    };
  }
};

// src/modules/orders-view/presentation/orders-view.controller.ts
var OrdersViewController = class {
  async list(request, reply) {
    const page = Math.max(Number(request.query.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(request.query.pageSize ?? 20), 1), 100);
    const data = await request.server.ordersViewUseCase.execute({ page, pageSize });
    return reply.send(data);
  }
};

// src/modules/orders-view/presentation/orders-view.routes.ts
async function ordersViewRoutes(app) {
  const controller = new OrdersViewController();
  app.get("/orders", controller.list.bind(controller));
}

// src/modules/orders-view/register.ts
async function registerOrdersViewModule(app) {
  const prisma2 = app.prisma;
  const repo = new OrdersViewRepository(prisma2);
  const useCase = new ListOrdersViewUseCase(repo);
  app.decorate("ordersViewUseCase", useCase);
  await app.register(ordersViewRoutes, { prefix: "/v1" });
}

// src/bootstrap/routes.ts
async function registerRoutes(app) {
  app.get("/", async (request, reply) => {
    const protocol = request.protocol;
    const hostname = request.hostname;
    const baseUrl = `${protocol}://${hostname}`;
    return sendOk(
      request,
      reply,
      {
        name: "Production Manager API",
        status: "ok",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        versions: { v1: `${baseUrl}/v1` },
        endpoints: {
          health: `${baseUrl}/health`,
          indexV1: `${baseUrl}/v1`,
          docs: `${baseUrl}/docs`
        },
        resources: {
          publicProducts: `${baseUrl}/v1/products`,
          adminOrders: `${baseUrl}/v1/admin/orders`,
          adminProducts: `${baseUrl}/v1/admin/managed-products`,
          adminSectors: `${baseUrl}/v1/admin/sectors`,
          adminPlans: `${baseUrl}/v1/admin/plans`
        },
        contracts: {
          public: {
            products: {
              endpoint: `${baseUrl}/v1/products`,
              description: "Cat\xE1logo p\xFAblico (BizChat): produto + estoque atual + estoque m\xEDnimo. (chave: omieCode).",
              fields: {
                omieCode: "string",
                description: "string",
                sku: "string | null",
                stockQuantity: "string (decimal)",
                minimumStock: "string (decimal)",
                stockUpdatedAt: "ISO string | null"
              },
              discover: {
                query: "?describe=true",
                header: "X-Describe: true",
                pretty: "?pretty=true"
              },
              notes: [
                "Este \xE9 o \xFAnico endpoint p\xFAblico que retorna produtos e estoque",
                "Nenhum outro endpoint \xE9 necess\xE1rio para consumo externo"
              ]
            }
          }
        },
        tips: [
          "Para cat\xE1logo e estoque use sempre GET /v1/products",
          "Endpoints admin n\xE3o fazem parte do contrato p\xFAblico",
          "sync \xE9 POST, listas s\xE3o GET",
          "Para resposta mais leg\xEDvel use ?pretty=true"
        ]
      },
      {}
    );
  });
  app.get("/health", async (request, reply) => {
    return sendOk(request, reply, { ok: true }, {});
  });
  app.get("/v1", async (request, reply) => {
    const publicEndpoints = [
      {
        method: "GET",
        path: "/v1/clients",
        description: "[Admin] Lista clientes sincronizados da Omie (banco local).",
        example: 'curl "/v1/clients?page=1&pageSize=20&q=instituto"'
      },
      {
        method: "GET",
        path: "/v1/clients/:omieClientCode",
        description: "[Admin] Detalhe do cliente por c\xF3digo Omie (banco local).",
        example: 'curl "/v1/clients/9181474497"'
      },
      {
        method: "POST",
        path: "/v1/admin/omie/clients/sync",
        description: "[Admin][Omie] For\xE7a sincroniza\xE7\xE3o de clientes da Omie para o banco local.",
        example: 'curl -X POST "/v1/admin/omie/clients/sync"'
      },
      {
        method: "GET",
        path: "/v1/products",
        description: "[Public][BizChat] Cat\xE1logo + estoque atual + estoque m\xEDnimo (chave: omieCode).",
        example: 'curl "/v1/products?q=cor&page=1&pageSize=50&pretty=true"'
      },
      {
        method: "GET",
        path: "/v1/products/:omieCode",
        description: "[Public][BizChat] Detalhe por omieCode.",
        example: 'curl "/v1/products/12345?pretty=true"'
      },
      {
        method: "GET",
        path: "/v1/orders",
        description: "[Public] Lista pedidos etapa 20 com itens e cliente (payload organizado para consumo).",
        example: 'curl "/v1/orders?page=1&pageSize=20"'
      }
    ];
    const adminEndpoints = [
      // produtos gerenciados
      { method: "POST", path: "/v1/admin/managed-products", description: "[Admin] Seleciona um produto Omie para ser gerenciado." },
      { method: "POST", path: "/v1/admin/managed-products/bulk", description: "[Admin] Seleciona v\xE1rios produtos Omie em lote." },
      { method: "GET", path: "/v1/admin/managed-products", description: "[Admin] Lista produtos gerenciados." },
      { method: "GET", path: "/v1/admin/managed-products/:id", description: "[Admin] Detalhe do produto gerenciado." },
      { method: "PATCH", path: "/v1/admin/managed-products/:id", description: "[Admin] Atualiza nickname/active." },
      { method: "GET", path: "/v1/admin/managed-products/:id/stock", description: "[Admin] Estoque por UUID do Product." },
      { method: "GET", path: "/v1/admin/managed-products/:id/stock/history", description: "[Admin] Hist\xF3rico de estoque por UUID do Product." },
      { method: "DELETE", path: "/v1/admin/managed-products/:id", description: "[Admin] Remove um produto do gerenciador." },
      // product-sector
      { method: "PUT", path: "/v1/admin/managed-products/:productId/sector", description: "[Admin] Define setor padr\xE3o de um produto." },
      { method: "GET", path: "/v1/admin/managed-products/:productId/sector", description: "[Admin] Obt\xE9m setor padr\xE3o de um produto." },
      // setores
      { method: "POST", path: "/v1/admin/sectors", description: "[Admin] Cria um setor." },
      { method: "GET", path: "/v1/admin/sectors", description: "[Admin] Lista setores (use includeInactive=true para incluir inativos)." },
      { method: "PATCH", path: "/v1/admin/sectors/:id", description: "[Admin] Atualiza um setor." },
      { method: "DELETE", path: "/v1/admin/sectors/:id", description: "[Admin] Desativa um setor (soft delete)." },
      // planos
      { method: "POST", path: "/v1/admin/plans", description: "[Admin] Cria um plano de produ\xE7\xE3o." },
      { method: "GET", path: "/v1/admin/plans", description: "[Admin] Lista planos de produ\xE7\xE3o." },
      { method: "GET", path: "/v1/admin/plans/:id", description: "[Admin] Detalha um plano (com itens)." },
      { method: "POST", path: "/v1/admin/plans/:id/items", description: "[Admin] Adiciona item ao plano." },
      { method: "GET", path: "/v1/admin/plans/:id/by-sector", description: "[Admin] Lista itens do plano agrupados por setor." },
      { method: "GET", path: "/v1/admin/plans/:id/export.csv", description: "[Admin] Exporta o plano em CSV." },
      // pedidos (omie-orders)
      { method: "GET", path: "/v1/admin/orders", description: "[Admin] Lista ordens persistidas (paginado)." },
      { method: "GET", path: "/v1/admin/orders/stage20", description: "[Admin] Lista pedidos etapa 20 (paginado e filtro q)." },
      // ✅ ACRÉSCIMO — ENDPOINT ENRIQUECIDO (NÃO ALTERA O LEGADO)
      {
        method: "GET",
        path: "/v1/admin/orders/stage20/enriched",
        description: "[Admin] \u2705 Lista pedidos etapa 20 ENRIQUECIDOS com dados do cliente (nome, documento). Endpoint recomendado para consumo."
      },
      { method: "GET", path: "/v1/admin/orders/stage20/totals", description: "[Admin] Totais consolidados por descri\xE7\xE3o (stage 20)." },
      { method: "POST", path: "/v1/admin/omie/orders/stage20/sync", description: "[Admin][Omie] Sincroniza pedidos etapa 20." },
      { method: "GET", path: "/v1/admin/omie/orders/stage20/ping", description: "[Admin][Omie] Ping do m\xF3dulo de pedidos." },
      // Omie admin de produtos/estoque/sync
      { method: "POST", path: "/v1/admin/omie/sync/products", description: "[Admin][Omie] Sincroniza produtos do Omie." },
      { method: "POST", path: "/v1/admin/omie/products/stock/refresh", description: "[Admin][Omie] Atualiza e persiste o estoque atual (ProductStock)." },
      { method: "GET", path: "/v1/admin/omie/stock", description: "[Admin][Omie] Info do estoque (fonte: database)." },
      { method: "GET", path: "/v1/admin/omie/categories", description: "[Admin][Omie] Lista categorias/fam\xEDlias (\xFAnicas e ordenadas)." },
      { method: "GET", path: "/v1/admin/omie/products/search", description: "[Admin][Omie] Busca no cat\xE1logo Omie." },
      { method: "GET", path: "/v1/admin/omie/products", description: "[Admin][Omie] Lista produtos Omie enriquecidos com estoque." },
      { method: "GET", path: "/v1/admin/omie/products/:id", description: "[Admin][Omie] Detalhe do produto Omie por UUID." },
      { method: "GET", path: "/v1/admin/omie/products/by-code/:omieCode", description: "[Admin][Omie] Detalhe do produto Omie por c\xF3digo." },
      { method: "GET", path: "/v1/admin/omie/products/:id/stock", description: "[Admin][Omie] Estoque por UUID do OmieProduct." },
      { method: "GET", path: "/v1/admin/omie/products/by-code/:omieCode/stock", description: "[Admin][Omie] Estoque por c\xF3digo do Omie." }
    ];
    const deprecatedEndpoints = [
      { method: "GET", path: "/v1/products/stock", replacement: "/v1/products", description: "[Deprecated] Alias do cat\xE1logo p\xFAblico." },
      { method: "GET", path: "/v1/products/managed", replacement: "/v1/admin/managed-products", description: "[Deprecated] Lista gerenciados." },
      { method: "POST", path: "/v1/products", replacement: "/v1/admin/managed-products", description: "[Deprecated] Cria gerenciado." },
      { method: "POST", path: "/v1/products/bulk", replacement: "/v1/admin/managed-products/bulk", description: "[Deprecated] Cria gerenciados em lote." },
      { method: "GET", path: "/v1/products/:id", replacement: "/v1/admin/managed-products/:id", description: "[Deprecated] Detalhe gerenciado." },
      { method: "PATCH", path: "/v1/products/:id", replacement: "/v1/admin/managed-products/:id", description: "[Deprecated] Atualiza gerenciado." },
      { method: "GET", path: "/v1/products/:id/stock", replacement: "/v1/admin/managed-products/:id/stock", description: "[Deprecated] Estoque do gerenciado." },
      { method: "GET", path: "/v1/products/:id/stock/history", replacement: "/v1/admin/managed-products/:id/stock/history", description: "[Deprecated] Hist\xF3rico do gerenciado." },
      { method: "DELETE", path: "/v1/products/:id", replacement: "/v1/admin/managed-products/:id", description: "[Deprecated] Remove gerenciado." },
      { method: "ANY", path: "/v1/admin/products*", replacement: "/v1/admin/managed-products*", description: "[Deprecated] Padroniza\xE7\xE3o interna." },
      { method: "ANY", path: "/v1/omie/*", replacement: "/v1/admin/omie/*", description: "[Deprecated] Padroniza\xE7\xE3o interna." },
      { method: "ANY", path: "/v1/sectors*", replacement: "/v1/admin/sectors*", description: "[Deprecated] Padroniza\xE7\xE3o interna." },
      { method: "ANY", path: "/v1/plans*", replacement: "/v1/admin/plans*", description: "[Deprecated] Padroniza\xE7\xE3o interna." }
    ];
    return sendOk(
      request,
      reply,
      {
        publicEndpoints,
        adminEndpoints,
        deprecatedEndpoints,
        routes: [
          { method: "GET", path: "/v1", description: "\xCDndice de rotas v1" },
          ...publicEndpoints,
          ...adminEndpoints,
          ...deprecatedEndpoints
        ]
      },
      {}
    );
  });
  await registerOrdersEnrichedModule(app);
  await createProductsModule(app);
  await registerSectorsModule(app);
  await registerProductSectorModule(app);
  await registerPlansModule(app);
  await registerOmieOrdersModule(app);
  createOmieOrdersModule(app);
  await registerOrdersViewModule(app);
}
function setBaseLogger(logger) {
}
var globalForPrisma = globalThis;
var prisma = globalForPrisma.prisma ?? new client.PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL
    }
  }
});
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
function resolveLogger(input) {
  const maybeFastify = input;
  const maybeLogger = input;
  if (maybeFastify && typeof maybeFastify.log?.info === "function") {
    return maybeFastify.log;
  }
  return maybeLogger;
}
function startStockRefreshJob(appOrLogger) {
  const log = resolveLogger(appOrLogger);
  const enabled = String(process.env.ENABLE_STOCK_REFRESH_JOB ?? "").trim().toLowerCase() === "true";
  if (!enabled) {
    log.info({}, "stock refresh job disabled");
    return;
  }
  const cronExpr = String(process.env.STOCK_REFRESH_CRON ?? "").trim() || "*/30 * * * *";
  const effectiveCronExpr = cron__default.default.validate(cronExpr) ? cronExpr : "*/30 * * * *";
  if (effectiveCronExpr !== cronExpr) {
    log.warn(
      { cronExpr },
      "stock refresh job: invalid cron expr, falling back to */30 * * * *"
    );
  }
  log.info(
    { cronExpr: effectiveCronExpr },
    "stock refresh job scheduled"
  );
  let inFlight = false;
  const tick = async () => {
    if (inFlight) {
      log.warn(
        {},
        "stock refresh job skipped (previous run still in progress)"
      );
      return;
    }
    inFlight = true;
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();
    log.info({ startedAt: startedAtIso }, "stock refresh started");
    try {
      const app = "decorate" in appOrLogger ? appOrLogger : null;
      if (!app) {
        throw new Error(
          "Fastify instance is required to run stock refresh job"
        );
      }
      const { useCases } = await createProductsModule(app);
      const result = await useCases.refreshStock.execute();
      if (result?.meta?.skippedLocked) {
        log.warn(
          { startedAt: startedAtIso, meta: result.meta },
          "stock refresh skipped: already running"
        );
        return;
      }
      log.info(
        {
          startedAt: startedAtIso,
          finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
          insertedCount: result.insertedCount,
          meta: result.meta,
          durationMs: Date.now() - startedAt
        },
        "stock refresh finished"
      );
    } catch (err) {
      log.error(
        { err, stack: err?.stack, startedAt: startedAtIso },
        "stock refresh failed"
      );
    } finally {
      inFlight = false;
    }
  };
  const task = cron__default.default.schedule(effectiveCronExpr, () => {
    void tick();
  });
  return () => task.stop();
}
function resolveLogger2(input) {
  const maybeFastify = input;
  const maybeLogger = input;
  if (maybeFastify && typeof maybeFastify.log?.info === "function") {
    return maybeFastify.log;
  }
  return maybeLogger;
}
function startOmieProductSyncJob(appOrLogger) {
  const log = resolveLogger2(appOrLogger);
  if (process.env.NODE_ENV === "test") {
    return;
  }
  const enabledValue = String(
    process.env.ENABLE_OMIE_PRODUCT_SYNC_JOB ?? ""
  ).trim().toLowerCase();
  const enabled = enabledValue === "true" || enabledValue === "1";
  if (!enabled) {
    log.info({}, "omie product sync job disabled");
    return;
  }
  const cronExpr = String(process.env.OMIE_PRODUCT_SYNC_CRON ?? "").trim() || "0 */6 * * *";
  const effectiveCronExpr = cron__default.default.validate(cronExpr) ? cronExpr : "0 */6 * * *";
  if (effectiveCronExpr !== cronExpr) {
    log.warn(
      { cronExpr },
      "omie product sync job: invalid cron expr, falling back to 0 */6 * * *"
    );
  }
  log.info(
    { cronExpr: effectiveCronExpr },
    "omie product sync job scheduled"
  );
  let inFlight = false;
  const tick = async () => {
    if (inFlight) {
      log.warn(
        {},
        "omie product sync skipped (previous run still in progress)"
      );
      return;
    }
    inFlight = true;
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();
    log.info(
      { startedAt: startedAtIso },
      "omie product sync started"
    );
    try {
      const app = "decorate" in appOrLogger ? appOrLogger : null;
      if (!app) {
        throw new Error(
          "Fastify instance is required to run Omie Product Sync job"
        );
      }
      const { useCases } = createProductsModule(app);
      const requestId = `job-${Date.now()}`;
      const result = await useCases.syncOmieProducts.execute({
        requestId,
        force: false
      });
      log.info(
        {
          startedAt: startedAtIso,
          finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
          durationMs: Date.now() - startedAt,
          ...result
        },
        "omie product sync finished"
      );
    } catch (err) {
      if (err instanceof AppError && err.code === "SYNC_IN_PROGRESS") {
        log.warn(
          { startedAt: startedAtIso, code: err.code },
          "omie product sync skipped: already running"
        );
        return;
      }
      log.error(
        { err, stack: err?.stack, startedAt: startedAtIso },
        "omie product sync failed"
      );
    } finally {
      inFlight = false;
    }
  };
  const task = cron__default.default.schedule(effectiveCronExpr, () => {
    void tick();
  });
  return () => task.stop();
}
function resolveLogger3(input) {
  const maybeFastify = input;
  const maybeLogger = input;
  if (maybeFastify && typeof maybeFastify.log?.info === "function") {
    return maybeFastify.log;
  }
  return maybeLogger;
}
function startOmieOrdersStage20SyncJob(appOrLogger) {
  const log = resolveLogger3(appOrLogger);
  if (process.env.NODE_ENV === "test") {
    return;
  }
  const enabledValue = String(
    process.env.OMIE_ORDERS_STAGE_SYNC ?? ""
  ).trim().toLowerCase();
  const enabled = enabledValue === "true" || enabledValue === "1";
  if (!enabled) {
    log.info({}, "omie orders stage20 sync job disabled");
    return;
  }
  const cronExpr = String(process.env.OMIE_ORDERS_STAGE20_CRON ?? "").trim() || "*/10 * * * *";
  const effectiveCronExpr = cron__default.default.validate(cronExpr) ? cronExpr : "*/10 * * * *";
  if (effectiveCronExpr !== cronExpr) {
    log.warn(
      { cronExpr },
      "omie orders stage20 sync job: invalid cron expr, falling back to */10 * * * *"
    );
  }
  log.info(
    { cronExpr: effectiveCronExpr },
    "omie orders stage20 sync job scheduled"
  );
  let inFlight = false;
  const tick = async () => {
    if (inFlight) {
      log.warn(
        {},
        "omie orders stage20 sync skipped (previous run still in progress)"
      );
      return;
    }
    inFlight = true;
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();
    log.info(
      { startedAt: startedAtIso },
      "omie orders stage20 sync started"
    );
    try {
      const app = "decorate" in appOrLogger ? appOrLogger : null;
      if (!app) {
        throw new Error(
          "Fastify instance is required to run Omie Orders Stage20 job"
        );
      }
      const { useCases } = createOmieOrdersModule(app);
      const result = await useCases.syncStage20Orders.execute();
      log.info(
        {
          startedAt: startedAtIso,
          finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
          durationMs: Date.now() - startedAt,
          ...result
        },
        "omie orders stage20 sync finished"
      );
    } catch (err) {
      if (err instanceof AppError && err.code === "SYNC_IN_PROGRESS") {
        log.warn(
          { startedAt: startedAtIso, code: err.code },
          "omie orders stage20 sync skipped: already running"
        );
        return;
      }
      log.error(
        { err, stack: err?.stack, startedAt: startedAtIso },
        "omie orders stage20 sync failed"
      );
    } finally {
      inFlight = false;
    }
  };
  const task = cron__default.default.schedule(effectiveCronExpr, () => {
    void tick();
  });
  return () => task.stop();
}
function resolveLogger4(input) {
  const maybeFastify = input;
  const maybeLogger = input;
  if (maybeFastify && typeof maybeFastify.log?.info === "function") {
    return maybeFastify.log;
  }
  return maybeLogger;
}
function isOmieRedundantSample(sample) {
  if (typeof sample !== "string") return false;
  return sample.includes("REDUNDANT") || sample.includes("Consumo redundante");
}
function startOmieClientSyncJob(appOrLogger) {
  const log = resolveLogger4(appOrLogger);
  if (process.env.NODE_ENV === "test") {
    return;
  }
  const enabledValue = String(process.env.ENABLE_OMIE_CLIENT_SYNC_JOB ?? "").trim().toLowerCase();
  const enabled = enabledValue === "true" || enabledValue === "1";
  if (!enabled) {
    log.info({}, "omie client sync job disabled");
    return;
  }
  const cronExpr = String(process.env.OMIE_CLIENT_SYNC_CRON ?? "").trim() || "*/10 * * * *";
  const effectiveCronExpr = cron__default.default.validate(cronExpr) ? cronExpr : "*/10 * * * *";
  if (effectiveCronExpr !== cronExpr) {
    log.warn(
      { cronExpr },
      "omie client sync job: invalid cron expr, falling back to */10 * * * *"
    );
  }
  log.info({ cronExpr: effectiveCronExpr }, "omie client sync job scheduled");
  const app = "decorate" in appOrLogger ? appOrLogger : null;
  if (app && typeof app.omieClientSyncJobStop === "function") {
    log.warn({}, "omie client sync job already scheduled; skipping duplicate schedule");
    return app.omieClientSyncJobStop;
  }
  let inFlight = false;
  const tick = async () => {
    if (inFlight) {
      log.warn({}, "omie client sync skipped (previous run still in progress)");
      return;
    }
    inFlight = true;
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();
    log.info({ startedAt: startedAtIso }, "omie client sync started");
    try {
      if (!app) {
        throw new Error("Fastify instance is required to run Omie Client sync job");
      }
      const state2 = app.clientSyncState;
      if (state2?.running) {
        log.warn({ startedAt: startedAtIso }, "omie client sync skipped: already running (state)");
        return;
      }
      if (state2) {
        state2.running = true;
        state2.lastStartedAt = /* @__PURE__ */ new Date();
      }
      await app.syncOmieClientsUseCase.execute();
      if (state2) state2.lastFinishedAt = /* @__PURE__ */ new Date();
      log.info(
        {
          startedAt: startedAtIso,
          finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
          durationMs: Date.now() - startedAt
        },
        "omie client sync finished"
      );
    } catch (err) {
      if (err instanceof AppError) {
        if (err.code === "SYNC_IN_PROGRESS") {
          log.warn(
            { startedAt: startedAtIso, code: err.code },
            "omie client sync skipped: already running"
          );
          return;
        }
        const sample = err?.details?.sample;
        if (isOmieRedundantSample(sample)) {
          log.warn(
            { startedAt: startedAtIso, code: err.code },
            "omie client sync skipped: redundant consumption (Omie REDUNDANT)"
          );
          return;
        }
      }
      log.error(
        { err, stack: err?.stack, startedAt: startedAtIso },
        "omie client sync failed"
      );
    } finally {
      if (app) {
        const state2 = app.clientSyncState;
        if (state2 && state2.running) state2.running = false;
      }
      inFlight = false;
    }
  };
  const task = cron__default.default.schedule(effectiveCronExpr, () => {
    void tick();
  }, { timezone: "America/Sao_Paulo" });
  const stop = () => task.stop();
  if (app) {
    app.decorate?.("omieClientSyncJobStop", stop);
  }
  return stop;
}

// src/bootstrap/app.ts
function isAppError(err) {
  return err !== null && typeof err === "object" && typeof err.code === "string" && typeof err.statusCode === "number" && typeof err.message === "string";
}
async function buildApp() {
  const app = Fastify__default.default({
    logger: process.env.NODE_ENV !== "test",
    trustProxy: true
  });
  setBaseLogger(app.log);
  app.decorate("prisma", prisma);
  app.decorate("omieClient", createOmieClient({
    baseUrl: env.OMIE_BASE_URL,
    appKey: env.OMIE_APP_KEY,
    appSecret: env.OMIE_APP_SECRET,
    timeoutMs: 2e4,
    retry: { attempts: 3, baseDelayMs: 250, maxDelayMs: 2e3 },
    debug: process.env.NODE_ENV !== "production"
  }));
  const allowedOrigins = new Set(
    env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
  );
  if (process.env.NODE_ENV !== "production") {
    allowedOrigins.add("http://localhost:5173");
    allowedOrigins.add("http://localhost:5174");
    allowedOrigins.add("http://127.0.0.1:5173");
    allowedOrigins.add("http://127.0.0.1:5174");
  }
  await app.register(cors__default.default, {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    }
  });
  app.decorateRequest("requestId", "");
  app.addHook("onRequest", async (request) => {
    const incomingId = request.headers["x-request-id"];
    request.requestId = incomingId || crypto__default.default.randomUUID();
    if (process.env.NODE_ENV !== "test") {
      request.log = request.log.child({ reqId: request.requestId });
    }
  });
  app.setErrorHandler((error, request, reply) => {
    const requestId = request.requestId;
    const isDev = process.env.NODE_ENV !== "production";
    if (error instanceof zod.ZodError) {
      const message = error.issues?.[0]?.message || "Dados inv\xE1lidos.";
      const details = isDev ? { ...error.format(), stack: error.stack } : error.format();
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message,
          details,
          requestId
        }
      });
    }
    if (isAppError(error)) {
      if (process.env.NODE_ENV !== "test") {
        request.log.warn({ requestId }, `[${error.code}] ${error.message}`);
      }
      const details = isDev ? { ...error.details || {}, stack: error.stack } : error.details;
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          ...details ? { details } : {},
          requestId
        }
      });
    }
    if (process.env.NODE_ENV !== "test") {
      request.log.error({ err: error, requestId }, "Erro Inesperado");
    }
    return reply.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Erro interno",
        requestId
      }
    });
  });
  await registerRoutes(app);
  console.log(app.printRoutes());
  if (env.ENABLE_STOCK_REFRESH_JOB) {
    startStockRefreshJob(app);
  }
  if (env.ENABLE_OMIE_PRODUCT_SYNC_JOB) {
    startOmieProductSyncJob(app);
  }
  if (env.OMIE_ORDERS_STAGE_SYNC) {
    startOmieOrdersStage20SyncJob(app);
  }
  if (env.ENABLE_OMIE_CLIENT_SYNC_JOB) {
    startOmieClientSyncJob(app);
  }
  if (process.env.OMIE_ORDERS_STAGE_SYNC_ON_STARTUP === "true") {
    setImmediate(async () => {
      try {
        const res = await app.inject({
          method: "POST",
          url: "/v1/admin/omie/orders/stage20/sync"
        });
        app.log.info(
          { statusCode: res.statusCode, body: res.body },
          "[Startup] Stage20 orders sync triggered"
        );
      } catch (err) {
        app.log.error({ err }, "[Startup] Stage20 orders sync failed");
      }
    });
  }
  return app;
}

// src/bootstrap/server.ts
async function startServer() {
  const app = await buildApp();
  app.ready(() => {
    app.log.info("\n" + app.printRoutes());
  });
  await app.listen({
    port: env.PORT,
    host: "0.0.0.0"
  });
  app.log.info(`Server running on http://localhost:${env.PORT}`);
}

// src/server.ts
startServer().catch((err) => {
  console.error(err);
  process.exit(1);
});
//# sourceMappingURL=server.js.map
//# sourceMappingURL=server.js.map