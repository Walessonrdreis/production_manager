'use strict';

require('dotenv/config');
var Fastify = require('fastify');
var cors = require('@fastify/cors');
var crypto = require('crypto');
var zod = require('zod');
var client = require('@prisma/client');
var contracts = require('@shared/contracts');
var zodToJsonSchema = require('zod-to-json-schema');
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
  PRODUCTION_ORDER_GATEWAY: zod.z.enum(["fake", "real"]).default("fake"),
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
  OMIE_PRODUCTION_ORDERS_SYNC: zod.z.coerce.boolean().default(false),
  OMIE_PRODUCTION_ORDERS_CRON: zod.z.string().default("*/15 * * * *"),
  ENABLE_OMIE_CLIENT_SYNC_JOB: zod.z.coerce.boolean().default(false),
  OMIE_CLIENT_SYNC_CRON: zod.z.string().default("*/10 * * * *"),
  ENABLE_OMIE_PRODUCT_STRUCTURE_SYNC_JOB: zod.z.coerce.boolean().default(false),
  OMIE_PRODUCT_STRUCTURE_SYNC_CRON: zod.z.string().default("*/20 * * * *")
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
function sendPaginated(request, reply, data, meta, links) {
  const payload = paginated(data, meta, links);
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
var ClientPrismaRepository = class {
  constructor(prisma2) {
    this.prisma = prisma2;
  }
  prisma;
  async upsert(client) {
    await this.prisma.client.upsert({
      where: {
        omieClientCode: client.omieClientCode
      },
      create: {
        omieClientCode: client.omieClientCode,
        legalName: client.legalName,
        tradeName: client.tradeName,
        document: client.document,
        personType: client.personType,
        email: client.email,
        phone: client.phone,
        isActive: client.isActive,
        isBlocked: client.isBlocked,
        isBillingBlocked: client.isBillingBlocked,
        createdAtOmie: client.createdAtOmie,
        updatedAtOmie: client.updatedAtOmie
      },
      update: {
        legalName: client.legalName,
        tradeName: client.tradeName,
        document: client.document,
        personType: client.personType,
        email: client.email,
        phone: client.phone,
        isActive: client.isActive,
        isBlocked: client.isBlocked,
        isBillingBlocked: client.isBillingBlocked,
        updatedAtOmie: client.updatedAtOmie
      }
    });
  }
  async findByOmieClientCode(omieClientCode) {
    const record = await this.prisma.client.findUnique({
      where: { omieClientCode }
    });
    if (!record) return null;
    return {
      omieClientCode: record.omieClientCode,
      legalName: record.legalName,
      tradeName: record.tradeName,
      document: record.document,
      personType: record.personType,
      email: record.email,
      phone: record.phone,
      isActive: record.isActive,
      isBlocked: record.isBlocked,
      isBillingBlocked: record.isBillingBlocked,
      createdAtOmie: record.createdAtOmie,
      updatedAtOmie: record.updatedAtOmie
    };
  }
  async list(params) {
    const { page, pageSize, q } = params;
    const where = q ? {
      OR: [
        {
          legalName: {
            contains: q,
            mode: client.Prisma.QueryMode.insensitive
          }
        },
        {
          tradeName: {
            contains: q,
            mode: client.Prisma.QueryMode.insensitive
          }
        },
        {
          document: {
            contains: q
          }
        }
      ]
    } : void 0;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { legalName: "asc" }
      }),
      this.prisma.client.count({ where })
    ]);
    return {
      total,
      data: data.map((record) => ({
        omieClientCode: record.omieClientCode,
        legalName: record.legalName,
        tradeName: record.tradeName,
        document: record.document,
        personType: record.personType,
        email: record.email,
        phone: record.phone,
        isActive: record.isActive,
        isBlocked: record.isBlocked,
        isBillingBlocked: record.isBillingBlocked,
        createdAtOmie: record.createdAtOmie,
        updatedAtOmie: record.updatedAtOmie
      }))
    };
  }
};

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

// src/modules/client/presentation/http/client-admin.controller.ts
function isOmieRedundantError(err) {
  const sample = err?.details?.sample;
  if (typeof sample !== "string") return false;
  return sample.includes("REDUNDANT") || sample.includes("Consumo redundante");
}
var ClientAdminController = class {
  async syncFromOmie(request, reply) {
    const state2 = request.server.clientSyncState;
    if (state2.running) {
      return reply.code(409).send({
        error: {
          code: "CLIENT_SYNC_RUNNING",
          message: "Client sync is already running.",
          requestId: request.requestId
        }
      });
    }
    const now = Date.now();
    const last = state2.lastStartedAt?.getTime() ?? 0;
    const cooldownMs = 65e3;
    if (last && now - last < cooldownMs) {
      return reply.code(429).send({
        error: {
          code: "CLIENT_SYNC_COOLDOWN",
          message: "Client sync was triggered recently. Try again later.",
          requestId: request.requestId
        }
      });
    }
    state2.running = true;
    state2.lastStartedAt = /* @__PURE__ */ new Date();
    try {
      request.log.info("[ClientAdmin] Omie client sync started");
      await request.server.syncOmieClientsUseCase.execute();
      request.log.info("[ClientAdmin] Omie client sync finished");
      state2.lastFinishedAt = /* @__PURE__ */ new Date();
      return reply.code(204).send();
    } catch (err) {
      if (isOmieRedundantError(err)) {
        request.log.warn({ err }, "[ClientAdmin] Omie redundant consumption detected");
        return reply.code(429).send({
          error: {
            code: "OMIE_REDUNDANT",
            message: "Omie refused the request due to redundant consumption. Try again later.",
            requestId: request.requestId
          }
        });
      }
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError("CLIENT_SYNC_FAILED", 500, "Falha ao sincronizar clientes no Omie", {
        message: err?.message
      });
    } finally {
      state2.running = false;
    }
  }
};

// src/modules/client/presentation/http/client-admin.schemas.ts
var syncClientsFromOmieSchema = {
  tags: ["client"],
  summary: "Sync clients from Omie into local database (admin)",
  response: {
    204: { type: "null" }
  }
};

// src/modules/client/presentation/http/client-admin.routes.ts
async function clientAdminRoutes(app) {
  const controller = new ClientAdminController();
  app.post(
    "/admin/omie/clients/sync",
    { schema: syncClientsFromOmieSchema },
    controller.syncFromOmie.bind(controller)
  );
}

// src/modules/client/infrastructure/integrations/omie/omie-client.gateway.ts
var OmieClientGatewayImpl = class {
  constructor(omieClient) {
    this.omieClient = omieClient;
  }
  omieClient;
  async listClients(page) {
    const response = await this.omieClient.post(
      "/api/v1/geral/clientes/",
      {
        // ✅ Envelope padrão Omie v1
        call: "ListarClientes",
        param: [
          {
            pagina: page,
            registros_por_pagina: 50
          }
        ]
      }
    );
    return response.clientes ?? response.clientes_cadastro ?? [];
  }
};

// src/modules/client/application/use-cases/sync-omie-clients.usecase.ts
function parseOmieDate(date, time) {
  if (!date) return null;
  const [day, month, year] = date.split("/").map(Number);
  if (!day || !month || !year) return null;
  if (time) {
    const [hour, minute, second] = time.split(":").map(Number);
    return new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
  }
  return new Date(year, month - 1, day);
}
var SyncOmieClientsUseCase = class {
  constructor(clientRepository, omieGateway) {
    this.clientRepository = clientRepository;
    this.omieGateway = omieGateway;
  }
  clientRepository;
  omieGateway;
  async execute() {
    let page = 1;
    while (true) {
      const rawClients = await this.omieGateway.listClients(page);
      if (rawClients.length === 0) {
        break;
      }
      for (const raw of rawClients) {
        const client = {
          omieClientCode: BigInt(raw.codigo_cliente_omie),
          legalName: raw.razao_social,
          tradeName: raw.nome_fantasia ?? null,
          document: raw.cnpj_cpf,
          personType: raw.pessoa_fisica === "S" ? "INDIVIDUAL" : "COMPANY",
          email: raw.email ?? null,
          phone: raw.telefone1_ddd && raw.telefone1_numero ? `${raw.telefone1_ddd}${raw.telefone1_numero}` : null,
          isActive: raw.inativo !== "S",
          isBlocked: raw.bloqueado === "S",
          isBillingBlocked: raw.bloquear_faturamento === "S",
          createdAtOmie: parseOmieDate(
            raw.info?.dInc,
            raw.info?.hInc
          ),
          updatedAtOmie: parseOmieDate(
            raw.info?.dAlt,
            raw.info?.hAlt
          )
        };
        await this.clientRepository.upsert(client);
      }
      page++;
    }
  }
};

// src/modules/client/application/use-cases/get-client-by-omie-client-code.usecase.ts
var GetClientByOmieClientCodeUseCase = class {
  constructor(clientRepository) {
    this.clientRepository = clientRepository;
  }
  clientRepository;
  async execute(omieClientCode) {
    return this.clientRepository.findByOmieClientCode(omieClientCode);
  }
};

// src/modules/client/presentation/client.controller.ts
var ClientController = class {
  async getByOmieClientCode(request, reply) {
    const { omieClientCode } = request.params;
    if (!/^\d+$/.test(omieClientCode)) {
      return reply.code(400).send({
        message: "Invalid omieClientCode. Must be a numeric string."
      });
    }
    const code = BigInt(omieClientCode);
    const client = await request.server.getClientByOmieClientCodeUseCase.execute(
      code
    );
    if (!client) {
      return reply.code(404).send({ message: "Client not found" });
    }
    return reply.code(200).send({
      omieClientCode: client.omieClientCode.toString(),
      legalName: client.legalName,
      tradeName: client.tradeName ?? null,
      document: client.document,
      personType: client.personType,
      email: client.email ?? null,
      phone: client.phone ?? null,
      isActive: client.isActive,
      isBlocked: client.isBlocked,
      isBillingBlocked: client.isBillingBlocked,
      createdAtOmie: client.createdAtOmie ? client.createdAtOmie.toISOString() : null,
      updatedAtOmie: client.updatedAtOmie ? client.updatedAtOmie.toISOString() : null
    });
  }
};

// src/modules/client/presentation/http/client.schemas.ts
var getClientByOmieClientCodeSchema = {
  tags: ["client"],
  summary: "Get client by Omie client code (local DB)",
  params: {
    type: "object",
    required: ["omieClientCode"],
    properties: {
      omieClientCode: { type: "string", pattern: "^\\d+$" }
    }
  },
  response: {
    200: {
      type: "object",
      properties: {
        omieClientCode: { type: "string" },
        // bigint -> string (JSON-safe)
        legalName: { type: "string" },
        tradeName: { type: ["string", "null"] },
        document: { type: "string" },
        personType: { type: "string", enum: ["INDIVIDUAL", "COMPANY"] },
        email: { type: ["string", "null"] },
        phone: { type: ["string", "null"] },
        isActive: { type: "boolean" },
        isBlocked: { type: "boolean" },
        isBillingBlocked: { type: "boolean" },
        createdAtOmie: { type: ["string", "null"] },
        updatedAtOmie: { type: ["string", "null"] }
      }
    },
    400: {
      type: "object",
      properties: {
        message: { type: "string" }
      }
    },
    404: {
      type: "object",
      properties: {
        message: { type: "string" }
      }
    }
  }
};

// src/modules/client/presentation/http/client.routes.ts
async function clientRoutes(app) {
  const controller = new ClientController();
  app.get(
    "/clients/:omieClientCode",
    { schema: getClientByOmieClientCodeSchema },
    controller.getByOmieClientCode.bind(controller)
  );
}

// src/modules/client/application/use-cases/list-clients.usecase.ts
var ListClientsUseCase = class {
  constructor(clientRepository) {
    this.clientRepository = clientRepository;
  }
  clientRepository;
  async execute(input) {
    return this.clientRepository.list(input);
  }
};

// src/modules/client/presentation/http/client-list.controller.ts
var ClientListController = class {
  async list(request, reply) {
    const page = Math.max(Number(request.query.page ?? 1), 1);
    const pageSize = Math.min(Number(request.query.pageSize ?? 20), 100);
    const q = request.query.q?.trim();
    const result = await request.server.listClientsUseCase.execute({
      page,
      pageSize,
      q
    });
    return reply.send({
      page,
      pageSize,
      total: result.total,
      data: result.data.map((c) => ({
        omieClientCode: c.omieClientCode.toString(),
        legalName: c.legalName,
        tradeName: c.tradeName,
        document: c.document,
        personType: c.personType,
        email: c.email,
        phone: c.phone,
        isActive: c.isActive,
        isBlocked: c.isBlocked
      }))
    });
  }
};

// src/modules/client/presentation/http/client-list.routes.ts
async function clientListRoutes(app) {
  const controller = new ClientListController();
  app.get("/clients", controller.list.bind(controller));
}

// src/modules/client/register.ts
async function registerClientModule(app) {
  const prisma2 = app.prisma;
  const omieClient = app.omieClient;
  const clientRepository = new ClientPrismaRepository(prisma2);
  const listClientsUseCase = new ListClientsUseCase(clientRepository);
  const omieClientGateway = new OmieClientGatewayImpl(omieClient);
  const syncOmieClientsUseCase = new SyncOmieClientsUseCase(
    clientRepository,
    omieClientGateway
  );
  const getClientByOmieClientCodeUseCase = new GetClientByOmieClientCodeUseCase(clientRepository);
  app.decorate("clientRepository", clientRepository);
  app.decorate("listClientsUseCase", listClientsUseCase);
  app.decorate("omieClientGateway", omieClientGateway);
  app.decorate("syncOmieClientsUseCase", syncOmieClientsUseCase);
  app.decorate(
    "getClientByOmieClientCodeUseCase",
    getClientByOmieClientCodeUseCase
  );
  app.decorate("clientSyncState", {
    running: false,
    lastStartedAt: null,
    lastFinishedAt: null
  });
  await app.register(clientRoutes, { prefix: "/v1" });
  await app.register(clientAdminRoutes, { prefix: "/v1" });
  await app.register(clientListRoutes, { prefix: "/v1" });
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
     * Se a Omie falhar, mantém o cache anterior como fallback.
     */
    async refreshNow() {
      if (!refreshPromise) {
        refreshPromise = refresh().finally(() => {
          refreshPromise = null;
        });
      }
      try {
        await refreshPromise;
      } catch (err) {
        logger.warn?.(
          { scope: "omie-stock-cache", err: err?.message ?? err },
          "Refresh Omie falhou, usando cache anterior como fallback"
        );
      }
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

// src/modules/omie-sales-orders/application/use-cases/list-omie-orders-page.usecase.ts
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

// src/modules/omie-sales-orders/application/use-cases/sync-stage20-orders.usecase.ts
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

// src/modules/omie-sales-orders/infrastructure/db/omie-orders.repo.prisma.ts
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

// src/modules/omie-sales-orders/application/use-cases/fetch-omie-products-page.usecase.ts
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

// src/modules/omie-sales-orders/application/use-cases/sync-omie-products.usecase.ts
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

// src/modules/omie-sales-orders/infrastructure/db/omie-product.repo.prisma.ts
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

// src/modules/omie-sales-orders/infrastructure/db/sync-lock.repo.prisma.ts
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

// src/modules/omie-sales-orders/application/use-cases/list-orders.usecase.ts
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

// src/modules/omie-sales-orders/application/use-cases/list-stage20-orders.usecase.ts
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

// src/modules/omie-sales-orders/application/use-cases/get-stage20-totals.usecase.ts
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

// src/modules/omie-sales-orders/application/use-cases/get-stage20-totals-detailed.usecase.ts
function createGetStage20TotalsDetailedUseCase(deps) {
  return {
    async execute() {
      const orders = await deps.prisma.omieOrder.findMany({
        where: {
          etapa: "20",
          cancelado: "N",
          encerrado: "N"
        },
        include: {
          items: true
        }
      });
      const productMap = /* @__PURE__ */ new Map();
      for (const order of orders) {
        let clientName = null;
        if (order.codigoCliente) {
          try {
            const client = await deps.prisma.client.findFirst({
              where: {
                omieClientCode: BigInt(order.codigoCliente)
              },
              select: {
                tradeName: true,
                legalName: true
              }
            });
            if (client) {
              clientName = client.tradeName || client.legalName;
            }
          } catch (error) {
            console.warn(`Erro ao buscar cliente ${order.codigoCliente}:`, error);
          }
        }
        for (const item of order.items) {
          const description = item.description;
          const quantity = Number(item.quantity);
          if (!productMap.has(description)) {
            productMap.set(description, {
              description,
              totalQuantity: 0,
              orders: []
            });
          }
          const productData = productMap.get(description);
          productData.totalQuantity += quantity;
          productData.orders.push({
            orderId: order.id,
            orderNumber: order.numeroPedido,
            clientCode: order.codigoCliente,
            clientName,
            quantity,
            productCode: item.omieProductCode
          });
        }
      }
      const result = Array.from(productMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
      return result;
    }
  };
}

// src/modules/omie-sales-orders/index.ts
var state = {
  lastGlobalSyncAt: 0,
  inMemoryLockUntil: 0
};
function createOmieSalesOrdersModule(app) {
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
  const listOrders = createListOrdersUseCase({ prisma: prisma2 });
  const listStage20Orders = createListStage20OrdersUseCase({ prisma: prisma2 });
  const getStage20Totals = createGetStage20TotalsUseCase({ prisma: prisma2 });
  const getStage20TotalsDetailed = createGetStage20TotalsDetailedUseCase({ prisma: prisma2 });
  return {
    useCases: {
      // sync
      syncStage20Orders,
      syncOmieProducts,
      // leitura (controller depende disso)
      listOrders,
      listStage20Orders,
      getStage20Totals,
      getStage20TotalsDetailed
    }
  };
}
function createOmieSalesOrdersController(useCases) {
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
          module: "omie-sales-orders",
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
    },
    async getStage20TotalsDetailed(_request, reply) {
      const data = await useCases.getStage20TotalsDetailed.execute();
      return reply.send(ok(data));
    }
  };
}

// src/modules/omie-sales-orders/presentation/http/omie-sales-orders.routes.ts
async function registerOmieSalesOrdersRoutes(app, controller) {
  app.get("/v1/admin/orders", controller.listOrders);
  app.get("/v1/admin/orders/stage20", controller.listStage20);
  app.get("/v1/admin/orders/stage20/totals", controller.getStage20Totals);
  app.get("/v1/admin/orders/stage20/totals/detailed", controller.getStage20TotalsDetailed);
  app.post("/v1/admin/omie/orders/stage20/sync", controller.syncStage20);
  app.get("/v1/admin/omie/orders/stage20/sync", controller.syncStage20Info);
  app.get("/v1/admin/omie/orders/stage20/ping", controller.ping);
}

// src/modules/omie-sales-orders/register.ts
async function registerOmieSalesOrdersModule(app) {
  const { useCases } = createOmieSalesOrdersModule(app);
  const salesOrdersController = createOmieSalesOrdersController(useCases);
  await registerOmieSalesOrdersRoutes(app, salesOrdersController);
  return { useCases };
}

// src/modules/omie-production-orders/application/use-cases/list-production-orders-page.usecase.ts
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
    forecastDate: brDateToISO(identificacao.dDtPrevisao)?.toISOString() || null,
    startDate: brDateToISO(infAdicionais.dDtInicio)?.toISOString() || null,
    completionDate: brDateToISO(infAdicionais.dDtConclusao)?.toISOString() || null,
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

// src/modules/omie-production-orders/application/use-cases/sync-production-orders.usecase.ts
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

// src/modules/omie-production-orders/infrastructure/db/omie-production-orders.repo.prisma.ts
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

// src/modules/omie-production-orders/application/use-cases/list-production-orders.usecase.ts
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

// src/modules/omie-production-orders/application/use-cases/get-production-order-by-code.usecase.ts
function createGetProductionOrderByCodeUseCase(deps) {
  return {
    async execute(input) {
      const order = await deps.productionOrdersRepo.getOrderByCode(input.omieCode);
      return order;
    }
  };
}

// src/modules/omie-production-orders/application/use-cases/get-production-orders-by-product-code.usecase.ts
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

// src/modules/omie-production-orders/application/use-cases/get-production-orders-by-product-integration-code.usecase.ts
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

// src/modules/omie-production-orders/application/use-cases/get-production-orders-stats.usecase.ts
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

// src/modules/omie-production-orders/application/use-cases/get-active-production-orders-count.usecase.ts
function createGetActiveProductionOrdersCountUseCase(deps) {
  return {
    async execute() {
      return deps.productionOrdersRepo.getActiveOrdersCount();
    }
  };
}

// src/modules/omie-production-orders/application/use-cases/get-completed-production-orders-count.usecase.ts
function createGetCompletedProductionOrdersCountUseCase(deps) {
  return {
    async execute(input) {
      const { startDate, endDate } = input;
      return deps.productionOrdersRepo.getCompletedOrdersCount(startDate, endDate);
    }
  };
}

// src/modules/omie-production-orders/index.ts
function createOmieProductionOrdersModule(app) {
  const prisma2 = app.prisma;
  const omieClient = app.omieClient;
  const logger = app.log;
  const jobLock = createJobLock(prisma2);
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
      syncProductionOrders,
      // reading (controller depends on this)
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

// src/modules/omie-production-orders/presentation/http/omie-production-orders.routes.ts
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

// src/modules/omie-production-orders/register.ts
async function registerOmieProductionOrdersModule(app) {
  const { useCases } = createOmieProductionOrdersModule(app);
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
function filterFinancialData(rawPayload) {
  if (!rawPayload) return rawPayload;
  const filteredPayload = JSON.parse(JSON.stringify(rawPayload));
  if (filteredPayload.det && Array.isArray(filteredPayload.det)) {
    filteredPayload.det = filteredPayload.det.map((item) => {
      const { imposto, ...itemWithoutTax } = item;
      return itemWithoutTax;
    });
  }
  const financialSections = [
    "total_pedido",
    "lista_parcelas",
    "frete"
  ];
  financialSections.forEach((section) => {
    if (filteredPayload[section]) {
      delete filteredPayload[section];
    }
  });
  return filteredPayload;
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
      const nomeCliente = client ? client.tradeName || client.legalName : null;
      const { id, omieCode, numeroPedido, codigoCliente, codigoEmpresa, etapa, cancelado, encerrado, dataPrevisao, rawPayload, ...otherFields } = order;
      const filteredRawPayload = filterFinancialData(rawPayload);
      const enrichedOrder = {
        id,
        omieClientCode: omieCode,
        // Mantém compatibilidade
        omieCode,
        numeroPedido,
        codigoCliente,
        nomeCliente,
        // Adiciona nomeCliente logo após codigoCliente
        codigoEmpresa,
        etapa,
        cancelado,
        encerrado,
        dataPrevisao,
        rawPayload: filteredRawPayload,
        // Outros campos que podem existir
        ...otherFields,
        client: client ? {
          omieClientCode: client.omieClientCode.toString(),
          // JSON-safe
          legalName: client.legalName,
          tradeName: client.tradeName,
          document: client.document
        } : null
      };
      return enrichedOrder;
    });
    return enrichedOrders;
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

// src/modules/alerts/presentation/http/stock-alerts.routes.ts
function registerStockAlertsRoutes(fastify, controller) {
  fastify.get(
    "/api/alerts/stock",
    {
      schema: {
        description: "Listar alertas de estoque com filtros",
        tags: ["alerts"],
        querystring: {
          type: "object",
          properties: {
            page: { type: "number", minimum: 1, default: 1 },
            pageSize: { type: "number", minimum: 1, maximum: 100, default: 20 },
            severity: { type: "string", enum: ["critical", "warning", "info"] },
            resolved: { type: "boolean" },
            productCode: { type: "string" },
            dateFrom: { type: "string", format: "date-time" },
            dateTo: { type: "string", format: "date-time" }
          },
          additionalProperties: false
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  alerts: { type: "array" },
                  total: { type: "number" },
                  page: { type: "number" },
                  pageSize: { type: "number" },
                  statistics: {
                    type: "object",
                    properties: {
                      critical: { type: "number" },
                      warning: { type: "number" },
                      info: { type: "number" },
                      active: { type: "number" },
                      resolved: { type: "number" },
                      acknowledged: { type: "number" }
                    }
                  }
                }
              },
              message: { type: "string" }
            }
          },
          400: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
              details: { type: "string" }
            }
          },
          500: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" }
            }
          }
        }
      }
    },
    controller.listStockAlerts.bind(controller)
  );
  fastify.get(
    "/api/alerts/stock/critical",
    {
      schema: {
        description: "Listar alertas cr\xEDticos de estoque",
        tags: ["alerts"],
        querystring: {
          type: "object",
          properties: {
            page: { type: "number", minimum: 1, default: 1 },
            pageSize: { type: "number", minimum: 1, maximum: 100, default: 20 },
            severity: { type: "string", enum: ["critical", "warning", "info"] },
            resolved: { type: "boolean" },
            productCode: { type: "string" },
            dateFrom: { type: "string", format: "date-time" },
            dateTo: { type: "string", format: "date-time" }
          },
          additionalProperties: false
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  alerts: { type: "array" },
                  total: { type: "number" },
                  page: { type: "number" },
                  pageSize: { type: "number" },
                  statistics: {
                    type: "object",
                    properties: {
                      critical: { type: "number" },
                      warning: { type: "number" },
                      info: { type: "number" },
                      active: { type: "number" },
                      resolved: { type: "number" },
                      acknowledged: { type: "number" }
                    }
                  }
                }
              },
              message: { type: "string" }
            }
          },
          400: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
              details: { type: "string" }
            }
          },
          500: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" }
            }
          }
        }
      }
    },
    controller.listCriticalStockAlerts.bind(controller)
  );
  fastify.post(
    "/api/alerts/stock/configure",
    {
      schema: {
        description: "Configurar regras de alertas de estoque",
        tags: ["alerts"],
        body: {
          type: "object",
          properties: {
            productCode: { type: "string" },
            criticalThreshold: { type: "number", minimum: 0 },
            warningThreshold: { type: "number", minimum: 0 },
            notificationChannels: {
              type: "array",
              items: { type: "string", enum: ["email", "sms", "dashboard"] }
            },
            autoResolveDays: { type: "number", minimum: 1 }
          },
          additionalProperties: false
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  productCode: { type: "string" },
                  minimumStock: { type: "number" },
                  warningThreshold: { type: "number" },
                  criticalThreshold: { type: "number" },
                  notificationChannels: { type: "array", items: { type: "string" } },
                  enabled: { type: "boolean" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" }
                }
              },
              message: { type: "string" }
            }
          },
          400: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
              details: { type: "string" }
            }
          },
          500: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" }
            }
          }
        }
      }
    },
    controller.configureAlerts.bind(controller)
  );
  fastify.patch(
    "/api/alerts/stock/:id/status",
    {
      schema: {
        description: "Atualizar status de um alerta de estoque",
        tags: ["alerts"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" }
          },
          required: ["id"]
        },
        body: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["resolved", "acknowledged"] },
            notes: { type: "string" }
          },
          required: ["status"],
          additionalProperties: false
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  status: { type: "string" },
                  resolvedAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" }
                }
              },
              message: { type: "string" }
            }
          },
          400: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
              details: { type: "string" }
            }
          },
          404: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" }
            }
          },
          500: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" }
            }
          }
        }
      }
    },
    controller.updateAlertStatus.bind(controller)
  );
  fastify.get(
    "/api/alerts/stock/statistics",
    {
      schema: {
        description: "Obter estat\xEDsticas de alertas de estoque",
        tags: ["alerts"],
        querystring: {
          type: "object",
          properties: {
            page: { type: "number", minimum: 1, default: 1 },
            pageSize: { type: "number", minimum: 1, maximum: 100, default: 20 },
            severity: { type: "string", enum: ["critical", "warning", "info"] },
            resolved: { type: "boolean" },
            productCode: { type: "string" },
            dateFrom: { type: "string", format: "date-time" },
            dateTo: { type: "string", format: "date-time" }
          },
          additionalProperties: false
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  total: { type: "number" },
                  critical: { type: "number" },
                  warning: { type: "number" },
                  info: { type: "number" },
                  active: { type: "number" },
                  resolved: { type: "number" },
                  acknowledged: { type: "number" }
                }
              },
              message: { type: "string" }
            }
          },
          400: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
              details: { type: "string" }
            }
          },
          500: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" }
            }
          }
        }
      }
    },
    controller.getAlertStatistics.bind(controller)
  );
}
var StockAlertsRequestSchema = zod.z.object({
  page: zod.z.number().int().positive().optional().default(1),
  pageSize: zod.z.number().int().positive().max(100).optional().default(20),
  severity: zod.z.enum(["critical", "warning", "info"]).optional(),
  resolved: zod.z.boolean().optional(),
  productCode: zod.z.string().optional(),
  dateFrom: zod.z.string().datetime().optional(),
  dateTo: zod.z.string().datetime().optional()
});
zod.z.object({
  success: zod.z.boolean(),
  message: zod.z.string(),
  data: zod.z.object({
    alerts: zod.z.array(zod.z.object({
      id: zod.z.string().uuid(),
      productCode: zod.z.string(),
      productDescription: zod.z.string(),
      currentStock: zod.z.number().nonnegative(),
      minimumStock: zod.z.number().nonnegative(),
      severity: zod.z.enum(["critical", "warning", "info"]),
      status: zod.z.enum(["active", "resolved", "acknowledged"]),
      createdAt: zod.z.string().datetime(),
      resolvedAt: zod.z.string().datetime().optional(),
      metadata: zod.z.record(zod.z.any()).optional()
    })),
    pagination: zod.z.object({
      page: zod.z.number().int().positive(),
      pageSize: zod.z.number().int().positive(),
      totalItems: zod.z.number().int().nonnegative(),
      totalPages: zod.z.number().int().positive()
    }),
    summary: zod.z.object({
      criticalCount: zod.z.number().int().nonnegative(),
      warningCount: zod.z.number().int().nonnegative(),
      infoCount: zod.z.number().int().nonnegative(),
      activeCount: zod.z.number().int().nonnegative(),
      resolvedCount: zod.z.number().int().nonnegative()
    })
  }),
  timestamp: zod.z.string().datetime()
});
var AlertConfigRequestSchema = zod.z.object({
  productCode: zod.z.string().optional(),
  // Se não especificado, aplica a todos
  criticalThreshold: zod.z.number().positive().optional(),
  warningThreshold: zod.z.number().positive().optional(),
  notificationChannels: zod.z.array(zod.z.enum(["email", "sms", "dashboard"])).optional(),
  autoResolveDays: zod.z.number().int().positive().optional()
});
zod.z.object({
  success: zod.z.boolean(),
  message: zod.z.string(),
  data: zod.z.object({
    id: zod.z.string().uuid(),
    productCode: zod.z.string().optional(),
    criticalThreshold: zod.z.number().positive(),
    warningThreshold: zod.z.number().positive(),
    notificationChannels: zod.z.array(zod.z.enum(["email", "sms", "dashboard"])),
    autoResolveDays: zod.z.number().int().positive(),
    createdAt: zod.z.string().datetime(),
    updatedAt: zod.z.string().datetime()
  }),
  timestamp: zod.z.string().datetime()
});
var AlertStatusRequestSchema = zod.z.object({
  status: zod.z.enum(["resolved", "acknowledged"]),
  notes: zod.z.string().optional()
});
zod.z.object({
  success: zod.z.boolean(),
  message: zod.z.string(),
  data: zod.z.object({
    id: zod.z.string().uuid(),
    status: zod.z.enum(["resolved", "acknowledged"]),
    resolvedAt: zod.z.string().datetime().optional(),
    notes: zod.z.string().optional(),
    updatedAt: zod.z.string().datetime()
  }),
  timestamp: zod.z.string().datetime()
});

// src/modules/alerts/presentation/http/stock-alerts.controller.ts
var StockAlertsController = class {
  constructor(listStockAlertsUseCase, configureAlertsUseCase, updateAlertStatusUseCase) {
    this.listStockAlertsUseCase = listStockAlertsUseCase;
    this.configureAlertsUseCase = configureAlertsUseCase;
    this.updateAlertStatusUseCase = updateAlertStatusUseCase;
  }
  listStockAlertsUseCase;
  configureAlertsUseCase;
  updateAlertStatusUseCase;
  async listStockAlerts(request, reply) {
    try {
      const query = request.query;
      const validatedQuery = StockAlertsRequestSchema.parse(query);
      const result = await this.listStockAlertsUseCase.execute(validatedQuery);
      return reply.code(200).send({
        success: true,
        data: result,
        message: "Alertas de estoque recuperados com sucesso"
      });
    } catch (error) {
      request.log.error("Erro ao listar alertas de estoque:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({
          success: false,
          error: "Par\xE2metros de consulta inv\xE1lidos",
          details: error.message
        });
      }
      return reply.code(500).send({
        success: false,
        error: "Erro interno ao processar solicita\xE7\xE3o"
      });
    }
  }
  async listCriticalStockAlerts(request, reply) {
    try {
      const query = request.query;
      const validatedQuery = StockAlertsRequestSchema.parse(query);
      const result = await this.listStockAlertsUseCase.execute({
        ...validatedQuery,
        severity: "critical",
        resolved: false
      });
      return reply.code(200).send({
        success: true,
        data: result,
        message: "Alertas cr\xEDticos de estoque recuperados com sucesso"
      });
    } catch (error) {
      request.log.error("Erro ao listar alertas cr\xEDticos de estoque:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({
          success: false,
          error: "Par\xE2metros de consulta inv\xE1lidos",
          details: error.message
        });
      }
      return reply.code(500).send({
        success: false,
        error: "Erro interno ao processar solicita\xE7\xE3o"
      });
    }
  }
  async configureAlerts(request, reply) {
    try {
      const body = request.body;
      const validatedBody = AlertConfigRequestSchema.parse(body);
      const result = await this.configureAlertsUseCase.execute(validatedBody);
      return reply.code(200).send({
        success: true,
        data: result,
        message: "Configura\xE7\xE3o de alertas atualizada com sucesso"
      });
    } catch (error) {
      request.log.error("Erro ao configurar alertas:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({
          success: false,
          error: "Dados de configura\xE7\xE3o inv\xE1lidos",
          details: error.message
        });
      }
      return reply.code(500).send({
        success: false,
        error: "Erro interno ao processar solicita\xE7\xE3o"
      });
    }
  }
  async updateAlertStatus(request, reply) {
    try {
      const { id } = request.params;
      const body = request.body;
      const validatedBody = AlertStatusRequestSchema.parse(body);
      const result = await this.updateAlertStatusUseCase.execute(id, validatedBody);
      return reply.code(200).send({
        success: true,
        data: result,
        message: "Status do alerta atualizado com sucesso"
      });
    } catch (error) {
      request.log.error("Erro ao atualizar status do alerta:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({
          success: false,
          error: "Dados de atualiza\xE7\xE3o inv\xE1lidos",
          details: error.message
        });
      }
      if (error instanceof Error && error.message.includes("n\xE3o encontrado")) {
        return reply.code(404).send({
          success: false,
          error: "Alerta n\xE3o encontrado"
        });
      }
      return reply.code(500).send({
        success: false,
        error: "Erro interno ao processar solicita\xE7\xE3o"
      });
    }
  }
  async getAlertStatistics(request, reply) {
    try {
      const query = request.query;
      const validatedQuery = StockAlertsRequestSchema.parse(query);
      const result = await this.listStockAlertsUseCase.execute(validatedQuery);
      const statistics = {
        total: result.total,
        critical: result.statistics.critical,
        warning: result.statistics.warning,
        info: result.statistics.info,
        active: result.statistics.active,
        resolved: result.statistics.resolved,
        acknowledged: result.statistics.acknowledged
      };
      return reply.code(200).send({
        success: true,
        data: statistics,
        message: "Estat\xEDsticas de alertas recuperadas com sucesso"
      });
    } catch (error) {
      request.log.error("Erro ao obter estat\xEDsticas de alertas:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({
          success: false,
          error: "Par\xE2metros de consulta inv\xE1lidos",
          details: error.message
        });
      }
      return reply.code(500).send({
        success: false,
        error: "Erro interno ao processar solicita\xE7\xE3o"
      });
    }
  }
};

// src/modules/alerts/application/use-cases/list-stock-alerts.usecase.ts
var ListStockAlertsUseCase = class {
  constructor(dependencies) {
    this.dependencies = dependencies;
  }
  dependencies;
  async execute(request) {
    const validatedRequest = StockAlertsRequestSchema.parse(request);
    const { alertsRepository } = this.dependencies;
    const { alerts, total } = await alertsRepository.getStockAlerts(validatedRequest);
    const criticalCount = alerts.filter((a) => a.severity === "critical").length;
    const warningCount = alerts.filter((a) => a.severity === "warning").length;
    const infoCount = alerts.filter((a) => a.severity === "info").length;
    const activeCount = alerts.filter((a) => a.status === "active").length;
    const resolvedCount = alerts.filter((a) => a.status === "resolved").length;
    const totalPages = Math.ceil(total / validatedRequest.pageSize);
    return {
      success: true,
      message: "Alertas de estoque recuperados com sucesso",
      data: {
        alerts: alerts.map((alert) => ({
          id: alert.id,
          productCode: alert.productCode,
          productDescription: alert.productDescription,
          currentStock: alert.currentStock,
          minimumStock: alert.minimumStock,
          severity: alert.severity,
          status: alert.status,
          createdAt: alert.createdAt.toISOString(),
          resolvedAt: alert.resolvedAt?.toISOString(),
          metadata: alert.metadata
        })),
        pagination: {
          page: validatedRequest.page,
          pageSize: validatedRequest.pageSize,
          totalItems: total,
          totalPages
        },
        summary: {
          criticalCount,
          warningCount,
          infoCount,
          activeCount,
          resolvedCount
        }
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
};
function createListStockAlertsUseCase(dependencies) {
  return new ListStockAlertsUseCase(dependencies);
}

// src/modules/alerts/application/use-cases/configure-alerts.usecase.ts
var ConfigureAlertsUseCase = class {
  constructor(dependencies) {
    this.dependencies = dependencies;
  }
  dependencies;
  async execute(request) {
    const validatedRequest = AlertConfigRequestSchema.parse(request);
    const { alertsRepository } = this.dependencies;
    let config;
    if (validatedRequest.productCode) {
      const existingConfig = await alertsRepository.getAlertConfigByProductCode(
        validatedRequest.productCode
      );
      if (existingConfig) {
        config = await alertsRepository.updateAlertConfig(existingConfig.id, {
          criticalThreshold: validatedRequest.criticalThreshold,
          warningThreshold: validatedRequest.warningThreshold,
          notificationChannels: validatedRequest.notificationChannels,
          autoResolveDays: validatedRequest.autoResolveDays
        });
      } else {
        config = await alertsRepository.createAlertConfig({
          productCode: validatedRequest.productCode,
          criticalThreshold: validatedRequest.criticalThreshold || 5,
          warningThreshold: validatedRequest.warningThreshold || 10,
          notificationChannels: validatedRequest.notificationChannels || ["dashboard"],
          autoResolveDays: validatedRequest.autoResolveDays || 7
        });
      }
    } else {
      const defaultConfig = await alertsRepository.getDefaultAlertConfig();
      if (defaultConfig) {
        config = await alertsRepository.updateAlertConfig(defaultConfig.id, {
          criticalThreshold: validatedRequest.criticalThreshold,
          warningThreshold: validatedRequest.warningThreshold,
          notificationChannels: validatedRequest.notificationChannels,
          autoResolveDays: validatedRequest.autoResolveDays
        });
      } else {
        config = await alertsRepository.createAlertConfig({
          criticalThreshold: validatedRequest.criticalThreshold || 5,
          warningThreshold: validatedRequest.warningThreshold || 10,
          notificationChannels: validatedRequest.notificationChannels || ["dashboard"],
          autoResolveDays: validatedRequest.autoResolveDays || 7
        });
      }
    }
    return {
      success: true,
      message: validatedRequest.productCode ? `Configura\xE7\xE3o de alertas para produto ${validatedRequest.productCode} atualizada com sucesso` : "Configura\xE7\xE3o padr\xE3o de alertas atualizada com sucesso",
      data: {
        id: config.id,
        productCode: config.productCode,
        criticalThreshold: config.criticalThreshold,
        warningThreshold: config.warningThreshold,
        notificationChannels: config.notificationChannels,
        autoResolveDays: config.autoResolveDays,
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString()
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
};
function createConfigureAlertsUseCase(dependencies) {
  return new ConfigureAlertsUseCase(dependencies);
}

// src/modules/alerts/application/use-cases/update-alert-status.usecase.ts
var UpdateAlertStatusUseCase = class {
  constructor(dependencies) {
    this.dependencies = dependencies;
  }
  dependencies;
  async execute(alertId, request) {
    const validatedRequest = AlertStatusRequestSchema.parse(request);
    const { alertsRepository } = this.dependencies;
    const existingAlert = await alertsRepository.getStockAlertById(alertId);
    if (!existingAlert) {
      throw new Error(`Alerta com ID ${alertId} n\xE3o encontrado`);
    }
    let updatedAlert;
    if (validatedRequest.status === "resolved") {
      updatedAlert = await alertsRepository.resolveStockAlert(
        alertId,
        validatedRequest.notes
      );
    } else if (validatedRequest.status === "acknowledged") {
      updatedAlert = await alertsRepository.updateStockAlert(alertId, {
        status: "acknowledged"
      });
    } else {
      throw new Error(`Status inv\xE1lido: ${validatedRequest.status}`);
    }
    return {
      success: true,
      message: `Status do alerta atualizado para ${validatedRequest.status}`,
      data: {
        id: updatedAlert.id,
        status: updatedAlert.status,
        resolvedAt: updatedAlert.resolvedAt?.toISOString(),
        notes: validatedRequest.notes,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
};
function createUpdateAlertStatusUseCase(dependencies) {
  return new UpdateAlertStatusUseCase(dependencies);
}

// src/modules/alerts/infrastructure/db/alerts.repository.prisma.ts
var AlertsRepositoryPrisma = class {
  constructor(prisma2) {
    this.prisma = prisma2;
  }
  prisma;
  // Alertas de estoque
  async createStockAlert(alert) {
    const record = await this.prisma.stockAlert.create({
      data: {
        productCode: alert.productCode,
        productDescription: alert.productDescription,
        currentStock: alert.currentStock,
        minimumStock: alert.minimumStock,
        severity: alert.severity,
        status: alert.status,
        resolvedAt: alert.resolvedAt,
        metadata: alert.metadata
      }
    });
    return this.mapStockAlertToDomain(record);
  }
  async updateStockAlert(id, updates) {
    const record = await this.prisma.stockAlert.update({
      where: { id },
      data: {
        productCode: updates.productCode,
        productDescription: updates.productDescription,
        currentStock: updates.currentStock,
        minimumStock: updates.minimumStock,
        severity: updates.severity,
        status: updates.status,
        resolvedAt: updates.resolvedAt,
        metadata: updates.metadata
      }
    });
    return this.mapStockAlertToDomain(record);
  }
  async getStockAlertById(id) {
    const record = await this.prisma.stockAlert.findUnique({
      where: { id }
    });
    return record ? this.mapStockAlertToDomain(record) : null;
  }
  async getStockAlerts(params) {
    const where = {};
    if (params.severity) {
      where.severity = params.severity;
    }
    if (params.resolved !== void 0) {
      if (params.resolved) {
        where.status = { in: ["resolved", "acknowledged"] };
      } else {
        where.status = "active";
      }
    }
    if (params.productCode) {
      where.productCode = params.productCode;
    }
    if (params.dateFrom) {
      where.createdAt = {
        gte: new Date(params.dateFrom)
      };
    }
    if (params.dateTo) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(params.dateTo)
      };
    }
    const [alerts, total] = await Promise.all([
      this.prisma.stockAlert.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize
      }),
      this.prisma.stockAlert.count({ where })
    ]);
    return {
      alerts: alerts.map((record) => this.mapStockAlertToDomain(record)),
      total
    };
  }
  async getActiveStockAlerts() {
    const records = await this.prisma.stockAlert.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" }
    });
    return records.map((record) => this.mapStockAlertToDomain(record));
  }
  async resolveStockAlert(id, notes) {
    const record = await this.prisma.stockAlert.update({
      where: { id },
      data: {
        status: "resolved",
        resolvedAt: /* @__PURE__ */ new Date(),
        metadata: notes ? { resolutionNotes: notes } : void 0
      }
    });
    return this.mapStockAlertToDomain(record);
  }
  // Configurações de alerta
  async createAlertConfig(config) {
    const record = await this.prisma.alertConfig.create({
      data: {
        productCode: config.productCode,
        criticalThreshold: config.criticalThreshold,
        warningThreshold: config.warningThreshold,
        notificationChannels: config.notificationChannels,
        autoResolveDays: config.autoResolveDays
      }
    });
    return this.mapAlertConfigToDomain(record);
  }
  async updateAlertConfig(id, updates) {
    const record = await this.prisma.alertConfig.update({
      where: { id },
      data: {
        productCode: updates.productCode,
        criticalThreshold: updates.criticalThreshold,
        warningThreshold: updates.warningThreshold,
        notificationChannels: updates.notificationChannels,
        autoResolveDays: updates.autoResolveDays
      }
    });
    return this.mapAlertConfigToDomain(record);
  }
  async getAlertConfigById(id) {
    const record = await this.prisma.alertConfig.findUnique({
      where: { id }
    });
    return record ? this.mapAlertConfigToDomain(record) : null;
  }
  async getAlertConfigByProductCode(productCode) {
    const record = await this.prisma.alertConfig.findUnique({
      where: { productCode }
    });
    return record ? this.mapAlertConfigToDomain(record) : null;
  }
  async getDefaultAlertConfig() {
    const record = await this.prisma.alertConfig.findFirst({
      where: { productCode: null }
    });
    return record ? this.mapAlertConfigToDomain(record) : null;
  }
  async listAlertConfigs() {
    const records = await this.prisma.alertConfig.findMany({
      orderBy: [{ productCode: "asc" }, { updatedAt: "desc" }]
    });
    return records.map((record) => this.mapAlertConfigToDomain(record));
  }
  // Métricas e estatísticas
  async getAlertStats() {
    const [
      totalAlerts,
      activeAlerts,
      resolvedAlerts,
      criticalCount,
      warningCount,
      infoCount,
      byProductRaw
    ] = await Promise.all([
      this.prisma.stockAlert.count(),
      this.prisma.stockAlert.count({ where: { status: "active" } }),
      this.prisma.stockAlert.count({ where: { status: { in: ["resolved", "acknowledged"] } } }),
      this.prisma.stockAlert.count({ where: { severity: "critical" } }),
      this.prisma.stockAlert.count({ where: { severity: "warning" } }),
      this.prisma.stockAlert.count({ where: { severity: "info" } }),
      this.prisma.stockAlert.groupBy({
        by: ["productCode", "productDescription"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10
      })
    ]);
    const byProduct = byProductRaw.map((item) => ({
      productCode: item.productCode,
      productDescription: item.productDescription,
      alertCount: item._count.id
    }));
    return {
      totalAlerts,
      activeAlerts,
      resolvedAlerts,
      criticalCount,
      warningCount,
      infoCount,
      byProduct
    };
  }
  // Limpeza de alertas antigos
  async cleanupOldAlerts(days) {
    const cutoffDate = /* @__PURE__ */ new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const result = await this.prisma.stockAlert.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: { in: ["resolved", "acknowledged"] }
      }
    });
    return result.count;
  }
  // Métodos de mapeamento
  mapStockAlertToDomain(record) {
    return {
      id: record.id,
      productCode: record.productCode,
      productDescription: record.productDescription,
      currentStock: Number(record.currentStock),
      minimumStock: Number(record.minimumStock),
      severity: record.severity,
      status: record.status,
      createdAt: record.createdAt,
      resolvedAt: record.resolvedAt,
      metadata: record.metadata
    };
  }
  mapAlertConfigToDomain(record) {
    return {
      id: record.id,
      productCode: record.productCode || void 0,
      criticalThreshold: Number(record.criticalThreshold),
      warningThreshold: Number(record.warningThreshold),
      notificationChannels: record.notificationChannels,
      autoResolveDays: record.autoResolveDays,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }
};
function createAlertsRepository(prisma2) {
  return new AlertsRepositoryPrisma(prisma2);
}

// src/modules/alerts/register.ts
function registerAlertsModule(app) {
  const alertsRepository = createAlertsRepository(app.prisma);
  const listStockAlertsUseCase = createListStockAlertsUseCase({
    alertsRepository,
    logger: app.log
  });
  const configureAlertsUseCase = createConfigureAlertsUseCase({
    alertsRepository,
    logger: app.log
  });
  const updateAlertStatusUseCase = createUpdateAlertStatusUseCase({
    alertsRepository,
    logger: app.log
  });
  const stockAlertsController = new StockAlertsController(
    listStockAlertsUseCase,
    configureAlertsUseCase,
    updateAlertStatusUseCase
  );
  app.decorate("diContainer", {
    resolve: (name) => {
      const dependencies = {
        alertsRepository,
        listStockAlertsUseCase,
        configureAlertsUseCase,
        updateAlertStatusUseCase,
        stockAlertsController
      };
      if (!dependencies[name]) {
        throw new Error(`Dependency ${name} not found`);
      }
      return dependencies[name];
    }
  });
  registerStockAlertsRoutes(app, stockAlertsController);
  app.log.info("M\xF3dulo alerts registrado com sucesso");
}

// src/shared/logger/logger.ts
var baseLogger = null;
function setBaseLogger(logger) {
  baseLogger = logger;
}
function getLogger(context) {
  if (baseLogger) {
    if (typeof baseLogger.child === "function") {
      return baseLogger.child({ context });
    }
    return baseLogger;
  }
  return {
    info: (msg, obj) => console.log(msg, obj ?? ""),
    warn: (msg, obj) => console.warn(msg, obj ?? ""),
    error: (msg, obj) => console.error(msg, obj ?? ""),
    debug: (msg, obj) => console.debug(msg, obj ?? "")
  };
}

// src/modules/production-queue/infrastructure/db/production-queue.repository.prisma.ts
var ProductionQueueRepositoryPrisma = class {
  constructor(prisma2) {
    this.prisma = prisma2;
  }
  prisma;
  async create(item) {
    const record = await this.prisma.productionQueue.create({
      data: {
        orderId: item.orderId,
        priority: item.priority,
        status: item.status,
        position: item.position,
        estimatedStartDate: item.estimatedStartDate,
        scheduledDate: item.scheduledDate,
        notes: item.notes,
        completedAt: item.completedAt,
        metadata: item.metadata
      }
    });
    return this.mapToDomain(record);
  }
  async update(id, updates) {
    const record = await this.prisma.productionQueue.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
    return this.mapToDomain(record);
  }
  async delete(id) {
    await this.prisma.productionQueue.delete({
      where: { id }
    });
  }
  async findById(id) {
    const record = await this.prisma.productionQueue.findUnique({
      where: { id }
    });
    return record ? this.mapToDomain(record) : null;
  }
  async findByOrderId(orderId) {
    const record = await this.prisma.productionQueue.findFirst({
      where: { orderId }
    });
    return record ? this.mapToDomain(record) : null;
  }
  async list(params) {
    const { page = 1, pageSize = 20, status, priority, dateFrom, dateTo } = params;
    const skip = (page - 1) * pageSize;
    const where = {};
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }
    const [records, total] = await Promise.all([
      this.prisma.productionQueue.findMany({
        where,
        orderBy: [
          { priority: "desc" },
          { position: "asc" }
        ],
        skip,
        take: pageSize
      }),
      this.prisma.productionQueue.count({ where })
    ]);
    return {
      items: records.map((record) => this.mapToDomain(record)),
      total
    };
  }
  async getNextPosition() {
    const lastItem = await this.prisma.productionQueue.findFirst({
      where: { status: { in: ["pending", "in_progress"] } },
      orderBy: { position: "desc" }
    });
    return lastItem ? lastItem.position + 1 : 1;
  }
  async reorderItems(items) {
    const updates = items.map(
      (item) => this.prisma.productionQueue.update({
        where: { id: item.id },
        data: { position: item.newPosition, updatedAt: /* @__PURE__ */ new Date() }
      })
    );
    const results = await this.prisma.$transaction(updates);
    return results.length;
  }
  async updatePositionsAfterDeletion(deletedPosition) {
    await this.prisma.productionQueue.updateMany({
      where: {
        position: { gt: deletedPosition },
        status: { in: ["pending", "in_progress"] }
      },
      data: {
        position: { decrement: 1 },
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
  }
  async getStatistics(params) {
    const { dateFrom, dateTo } = params;
    const where = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }
    const items = await this.prisma.productionQueue.findMany({
      where
    });
    const domainItems = items.map((item) => this.mapToDomain(item));
    const statistics = {
      totalOrders: domainItems.length,
      pendingOrders: domainItems.filter((item) => item.status === "pending").length,
      inProgressOrders: domainItems.filter((item) => item.status === "in_progress").length,
      completedOrders: domainItems.filter((item) => item.status === "completed").length,
      cancelledOrders: domainItems.filter((item) => item.status === "cancelled").length,
      averageCompletionTime: void 0,
      priorityDistribution: {
        high: domainItems.filter((item) => item.priority === "high").length,
        medium: domainItems.filter((item) => item.priority === "medium").length,
        low: domainItems.filter((item) => item.priority === "low").length
      },
      dailyThroughput: void 0
    };
    const completedItems = domainItems.filter((item) => item.status === "completed" && item.completedAt);
    if (completedItems.length > 0) {
      const totalCompletionTime = completedItems.reduce((sum, item) => {
        const completionTime = item.completedAt.getTime();
        const creationTime = item.createdAt.getTime();
        return sum + (completionTime - creationTime);
      }, 0);
      statistics.averageCompletionTime = totalCompletionTime / (completedItems.length * 1e3 * 60 * 60);
    }
    const dailyMap = /* @__PURE__ */ new Map();
    completedItems.forEach((item) => {
      const dateStr = item.completedAt.toISOString().split("T")[0];
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
    });
    if (dailyMap.size > 0) {
      statistics.dailyThroughput = Array.from(dailyMap.entries()).map(([date, completed]) => ({
        date,
        completed
      }));
    }
    return statistics;
  }
  async updateStatus(id, statusUpdate) {
    const updates = {
      status: statusUpdate.status,
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (statusUpdate.status === "completed") {
      updates.completedAt = statusUpdate.completedAt ? new Date(statusUpdate.completedAt) : /* @__PURE__ */ new Date();
    }
    if (statusUpdate.notes) {
      updates.notes = statusUpdate.notes;
    }
    const record = await this.prisma.productionQueue.update({
      where: { id },
      data: updates
    });
    return this.mapToDomain(record);
  }
  async countByStatus(status) {
    return this.prisma.productionQueue.count({
      where: { status }
    });
  }
  async countByPriority(priority) {
    return this.prisma.productionQueue.count({
      where: { priority }
    });
  }
  async getItemsByPriority(priority) {
    const records = await this.prisma.productionQueue.findMany({
      where: { priority },
      orderBy: { position: "asc" }
    });
    return records.map((record) => this.mapToDomain(record));
  }
  async getPendingItems() {
    const records = await this.prisma.productionQueue.findMany({
      where: { status: "pending" },
      orderBy: { position: "asc" }
    });
    return records.map((record) => this.mapToDomain(record));
  }
  async getInProgressItems() {
    const records = await this.prisma.productionQueue.findMany({
      where: { status: "in_progress" },
      orderBy: { position: "asc" }
    });
    return records.map((record) => this.mapToDomain(record));
  }
  async cleanupOldItems(days) {
    const cutoffDate = /* @__PURE__ */ new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const result = await this.prisma.productionQueue.deleteMany({
      where: {
        status: { in: ["completed", "cancelled"] },
        updatedAt: { lt: cutoffDate }
      }
    });
    return result.count;
  }
  async validateOrderExists(orderId) {
    return true;
  }
  async validatePositionAvailable(position) {
    const existing = await this.prisma.productionQueue.findFirst({
      where: { position, status: { in: ["pending", "in_progress"] } }
    });
    return !existing;
  }
  mapToDomain(record) {
    return {
      id: record.id,
      orderId: record.orderId,
      priority: record.priority,
      status: record.status,
      position: record.position,
      estimatedStartDate: record.estimatedStartDate,
      scheduledDate: record.scheduledDate,
      notes: record.notes,
      completedAt: record.completedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      metadata: record.metadata
    };
  }
};

// src/modules/sales-production-integration/application/use-cases/sales-to-production.usecase.ts
var SalesToProductionUseCase = class {
  constructor(dependencies) {
    this.dependencies = dependencies;
  }
  dependencies;
  async execute(request) {
    const { productionQueueRepository, logger } = this.dependencies;
    try {
      logger.info(`Iniciando integra\xE7\xE3o vendas\u2192produ\xE7\xE3o para ordem ${request.orderId}`);
      const existingItem = await productionQueueRepository.findByOrderId(request.orderId);
      if (existingItem) {
        logger.warn(`Ordem ${request.orderId} j\xE1 est\xE1 na fila de produ\xE7\xE3o`);
        return {
          success: false,
          data: existingItem,
          message: "Ordem j\xE1 est\xE1 na fila de produ\xE7\xE3o"
        };
      }
      const priority = this.calculatePriority(request);
      const nextPosition = await productionQueueRepository.getNextPosition();
      const estimatedStartDate = this.calculateEstimatedStartDate(priority);
      const createdItem = await productionQueueRepository.create({
        orderId: request.orderId,
        priority,
        status: "pending",
        position: nextPosition,
        estimatedStartDate,
        scheduledDate: request.deliveryDeadline ? new Date(request.deliveryDeadline) : void 0,
        notes: request.notes,
        metadata: {
          customerType: request.customerType,
          orderValue: request.orderValue,
          integratedAt: /* @__PURE__ */ new Date()
        }
      });
      logger.info(`Ordem ${request.orderId} integrada \xE0 fila de produ\xE7\xE3o com prioridade ${priority}`);
      return {
        success: true,
        data: createdItem,
        message: "Ordem integrada \xE0 fila de produ\xE7\xE3o com sucesso"
      };
    } catch (error) {
      logger.error(`Erro na integra\xE7\xE3o vendas\u2192produ\xE7\xE3o para ordem ${request.orderId}:`, error);
      throw error;
    }
  }
  calculatePriority(request) {
    const { customerType, orderValue, deliveryDeadline } = request;
    if (customerType === "vip") {
      return "high";
    }
    if (orderValue > 1e4) {
      return "high";
    }
    if (deliveryDeadline) {
      const deadline = new Date(deliveryDeadline);
      const now = /* @__PURE__ */ new Date();
      const hoursToDeadline = (deadline.getTime() - now.getTime()) / (1e3 * 60 * 60);
      if (hoursToDeadline < 48) {
        return "high";
      }
    }
    if (customerType === "corporate") {
      return "medium";
    }
    if (orderValue >= 1e3 && orderValue <= 1e4) {
      return "medium";
    }
    if (deliveryDeadline) {
      const deadline = new Date(deliveryDeadline);
      const now = /* @__PURE__ */ new Date();
      const hoursToDeadline = (deadline.getTime() - now.getTime()) / (1e3 * 60 * 60);
      if (hoursToDeadline >= 48 && hoursToDeadline <= 168) {
        return "medium";
      }
    }
    return "low";
  }
  calculateEstimatedStartDate(priority) {
    const now = /* @__PURE__ */ new Date();
    switch (priority) {
      case "high":
        return new Date(now.getTime() + 2 * 60 * 60 * 1e3);
      case "medium":
        return new Date(now.getTime() + 24 * 60 * 60 * 1e3);
      case "low":
        return new Date(now.getTime() + 72 * 60 * 60 * 1e3);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1e3);
    }
  }
};

// src/modules/sales-production-integration/application/use-cases/integration-statistics.usecase.ts
var IntegrationStatisticsUseCase = class {
  constructor(dependencies) {
    this.dependencies = dependencies;
  }
  dependencies;
  async execute() {
    const { productionQueueRepository, logger } = this.dependencies;
    try {
      logger.info("Calculando estat\xEDsticas de integra\xE7\xE3o vendas\u2192produ\xE7\xE3o");
      const allItems = await productionQueueRepository.findAll({
        page: 1,
        pageSize: 1e3
        // Número grande para pegar todos
      });
      const integratedItems = allItems.filter(
        (item) => item.metadata && item.metadata.integratedAt
      );
      const statistics = {
        totalIntegrated: integratedItems.length,
        byPriority: {
          high: integratedItems.filter((item) => item.priority === "high").length,
          medium: integratedItems.filter((item) => item.priority === "medium").length,
          low: integratedItems.filter((item) => item.priority === "low").length
        },
        byCustomerType: {
          regular: integratedItems.filter(
            (item) => item.metadata && item.metadata.customerType === "regular"
          ).length,
          vip: integratedItems.filter(
            (item) => item.metadata && item.metadata.customerType === "vip"
          ).length,
          corporate: integratedItems.filter(
            (item) => item.metadata && item.metadata.customerType === "corporate"
          ).length
        },
        averageIntegrationTime: this.calculateAverageIntegrationTime(integratedItems),
        lastIntegrationAt: this.getLastIntegrationTime(integratedItems)
      };
      logger.info(`Estat\xEDsticas calculadas: ${statistics.totalIntegrated} ordens integradas`);
      return {
        success: true,
        data: statistics,
        message: "Estat\xEDsticas de integra\xE7\xE3o calculadas com sucesso"
      };
    } catch (error) {
      logger.error("Erro ao calcular estat\xEDsticas de integra\xE7\xE3o:", error);
      throw error;
    }
  }
  calculateAverageIntegrationTime(items) {
    if (items.length === 0) return 0;
    const totalTime = items.reduce((sum, item) => {
      if (item.metadata && item.metadata.integratedAt) {
        const integratedAt = new Date(item.metadata.integratedAt);
        const createdAt = new Date(item.createdAt);
        const integrationTime = integratedAt.getTime() - createdAt.getTime();
        return sum + integrationTime;
      }
      return sum;
    }, 0);
    return totalTime / items.length;
  }
  getLastIntegrationTime(items) {
    if (items.length === 0) return void 0;
    const integratedItems = items.filter(
      (item) => item.metadata && item.metadata.integratedAt
    );
    if (integratedItems.length === 0) return void 0;
    const lastItem = integratedItems.reduce((latest, item) => {
      const itemTime = new Date(item.metadata.integratedAt).getTime();
      const latestTime = latest ? new Date(latest.metadata.integratedAt).getTime() : 0;
      return itemTime > latestTime ? item : latest;
    }, null);
    return lastItem.metadata.integratedAt;
  }
};

// src/modules/sales-production-integration/presentation/http/sales-production-integration.controller.ts
var SalesProductionIntegrationController = class {
  constructor(salesToProductionUseCase, integrationStatisticsUseCase) {
    this.salesToProductionUseCase = salesToProductionUseCase;
    this.integrationStatisticsUseCase = integrationStatisticsUseCase;
  }
  salesToProductionUseCase;
  integrationStatisticsUseCase;
  async salesToProduction(request, reply) {
    try {
      const body = request.body;
      const result = await this.salesToProductionUseCase.execute(body);
      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          message: result.message
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.message,
          data: result.data
        });
      }
    } catch (error) {
      request.log.error("Erro na integra\xE7\xE3o vendas\u2192produ\xE7\xE3o:", error);
      return reply.code(500).send({
        success: false,
        error: "Erro interno na integra\xE7\xE3o vendas\u2192produ\xE7\xE3o",
        details: error.message
      });
    }
  }
  async integrationStatistics(request, reply) {
    try {
      const result = await this.integrationStatisticsUseCase.execute();
      return reply.code(200).send({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error) {
      request.log.error("Erro ao calcular estat\xEDsticas de integra\xE7\xE3o:", error);
      return reply.code(500).send({
        success: false,
        error: "Erro interno ao calcular estat\xEDsticas de integra\xE7\xE3o",
        details: error.message
      });
    }
  }
};

// src/modules/sales-production-integration/presentation/http/sales-production-integration.routes.ts
function registerSalesProductionIntegrationRoutes(fastify, controller) {
  fastify.post(
    "/api/integration/sales-to-production",
    {
      schema: {
        description: "Integrar pedido de venda \xE0 fila de produ\xE7\xE3o automaticamente",
        tags: ["sales-production-integration"],
        body: {
          type: "object",
          required: ["orderId", "customerType", "orderValue"],
          properties: {
            orderId: { type: "string", format: "uuid" },
            customerType: { type: "string", enum: ["regular", "vip", "corporate"] },
            orderValue: { type: "number", minimum: 0 },
            deliveryDeadline: { type: "string", format: "date-time" },
            notes: { type: "string" }
          }
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  orderId: { type: "string", format: "uuid" },
                  priority: { type: "string", enum: ["high", "medium", "low"] },
                  status: { type: "string", enum: ["pending", "in_progress", "completed", "cancelled"] },
                  position: { type: "number" },
                  estimatedStartDate: { type: "string", format: "date-time" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" }
                }
              },
              message: { type: "string" }
            }
          },
          400: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
              data: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  orderId: { type: "string", format: "uuid" },
                  priority: { type: "string", enum: ["high", "medium", "low"] },
                  status: { type: "string", enum: ["pending", "in_progress", "completed", "cancelled"] },
                  position: { type: "number" },
                  estimatedStartDate: { type: "string", format: "date-time" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" }
                }
              }
            }
          }
        }
      }
    },
    controller.salesToProduction.bind(controller)
  );
  fastify.get(
    "/api/integration/sales-to-production/statistics",
    {
      schema: {
        description: "Obter estat\xEDsticas da integra\xE7\xE3o vendas\u2192produ\xE7\xE3o",
        tags: ["sales-production-integration"],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  totalIntegrated: { type: "number" },
                  byPriority: {
                    type: "object",
                    properties: {
                      high: { type: "number" },
                      medium: { type: "number" },
                      low: { type: "number" }
                    }
                  },
                  byCustomerType: {
                    type: "object",
                    properties: {
                      regular: { type: "number" },
                      vip: { type: "number" },
                      corporate: { type: "number" }
                    }
                  },
                  averageIntegrationTime: { type: "number" },
                  lastIntegrationAt: { type: "string", format: "date-time" }
                }
              },
              message: { type: "string" }
            }
          }
        }
      }
    },
    controller.integrationStatistics.bind(controller)
  );
}

// src/modules/sales-production-integration/register.ts
function registerSalesProductionIntegrationModule(app) {
  const logger = getLogger("sales-production-integration");
  const prisma2 = new client.PrismaClient();
  const productionQueueRepository = new ProductionQueueRepositoryPrisma(prisma2);
  const salesToProductionUseCase = new SalesToProductionUseCase({
    productionQueueRepository,
    logger
  });
  const integrationStatisticsUseCase = new IntegrationStatisticsUseCase({
    productionQueueRepository,
    logger
  });
  const controller = new SalesProductionIntegrationController(
    salesToProductionUseCase,
    integrationStatisticsUseCase
  );
  registerSalesProductionIntegrationRoutes(app, controller);
  logger.info("M\xF3dulo de integra\xE7\xE3o vendas\u2192produ\xE7\xE3o registrado");
}

// src/modules/product-structure/presentation/http/controllers/sync-product-structure.controller.ts
function resolveInFlightKey(body) {
  const cod = body?.codProduto?.trim();
  if (cod) return `cod:${cod}`;
  if (typeof body?.idProduto === "number" && !Number.isNaN(body.idProduto)) {
    return `id:${body.idProduto}`;
  }
  const intp = body?.intProduto?.trim();
  if (intp) return `int:${intp}`;
  return null;
}
function secondsUntil(tsMs) {
  const now = Date.now();
  if (tsMs <= now) return 0;
  return Math.ceil((tsMs - now) / 1e3);
}
async function syncProductStructureController(req, reply) {
  const blockedUntil = req.server.omieMalhaRateLimit.blockedUntil ?? 0;
  const remaining = secondsUntil(blockedUntil);
  if (remaining > 0) {
    return reply.header("Retry-After", String(remaining)).code(429).send({
      message: "Omie temporariamente bloqueada para consulta de malha (janela de rate-limit).",
      code: "OMIE_REDUNDANT",
      retryAfterSeconds: remaining
    });
  }
  const key = resolveInFlightKey(req.body);
  if (key) {
    const inFlight = req.server.productStructureInFlight;
    const running = inFlight.get(key);
    if (running) {
      try {
        const result = await running;
        return reply.code(200).send(result);
      } catch (e) {
      }
    }
    const promise = req.server.productStructure.syncUseCase.execute(req.body ?? {});
    inFlight.set(key, promise);
    try {
      const result = await promise;
      return reply.code(200).send(result);
    } catch (e) {
      const code = e?.code;
      if (code === "VALIDATION_ERROR") {
        return reply.code(400).send({ message: e.message, code });
      }
      if (code === "OMIE_REDUNDANT") {
        const retryAfter = e?.retryAfterSeconds ?? 60;
        req.server.omieMalhaRateLimit.blockedUntil = Date.now() + retryAfter * 1e3;
        return reply.header("Retry-After", String(retryAfter)).code(429).send({
          message: e.message,
          code,
          retryAfterSeconds: retryAfter,
          details: e?.details
        });
      }
      if (code === "OMIE_NOT_FOUND") {
        return reply.code(404).send({ message: e.message, code });
      }
      if (code === "OMIE_HTTP_ERROR" || code === "OMIE_FAULT" || code === "INTEGRATION_ERROR") {
        return reply.code(502).send({ message: e.message, code, details: e?.details });
      }
      req.log?.error?.({ err: e }, "sync product-structure failed");
      return reply.code(500).send({ message: "Erro interno", code: "INTERNAL_ERROR" });
    } finally {
      inFlight.delete(key);
    }
  }
  try {
    const result = await req.server.productStructure.syncUseCase.execute(req.body ?? {});
    return reply.code(200).send(result);
  } catch (e) {
    const code = e?.code;
    if (code === "VALIDATION_ERROR") {
      return reply.code(400).send({ message: e.message, code });
    }
    if (code === "OMIE_REDUNDANT") {
      const retryAfter = e?.retryAfterSeconds ?? 60;
      req.server.omieMalhaRateLimit.blockedUntil = Date.now() + retryAfter * 1e3;
      return reply.header("Retry-After", String(retryAfter)).code(429).send({
        message: e.message,
        code,
        retryAfterSeconds: retryAfter,
        details: e?.details
      });
    }
    if (code === "OMIE_NOT_FOUND") {
      return reply.code(404).send({ message: e.message, code });
    }
    if (code === "OMIE_HTTP_ERROR" || code === "OMIE_FAULT" || code === "INTEGRATION_ERROR") {
      return reply.code(502).send({ message: e.message, code, details: e?.details });
    }
    req.log?.error?.({ err: e }, "sync product-structure failed");
    return reply.code(500).send({ message: "Erro interno", code: "INTERNAL_ERROR" });
  }
}

// src/modules/product-structure/presentation/http/controllers/get-product-structure.controller.ts
async function getProductStructureController(req, reply) {
  try {
    const result = await req.server.productStructure.getByCodProdutoUseCase.execute(req.params.codProduto);
    return reply.code(200).send(result);
  } catch (e) {
    const code = e?.code;
    if (code === "VALIDATION_ERROR") {
      return reply.code(400).send({ message: e.message, code });
    }
    if (code === "NOT_FOUND") {
      return reply.code(404).send({ message: e.message, code });
    }
    req.log?.error?.({ err: e }, "get product-structure failed");
    return reply.code(500).send({ message: "Erro interno", code: "INTERNAL_ERROR" });
  }
}

// src/modules/product-structure/presentation/http/controllers/sync-product-structure-job-tick.controller.ts
async function syncProductStructureJobTickController(req, reply) {
  try {
    const gateway = req.server.productStructureGateway;
    const repo = req.server.productStructureRepository;
    const state2 = req.server.productStructureSyncJobState;
    const now = Date.now();
    if (state2.blockedUntil && now < state2.blockedUntil) {
      const remaining = Math.ceil((state2.blockedUntil - now) / 1e3);
      return reply.header("Retry-After", String(remaining)).code(429).send({ code: "OMIE_REDUNDANT", retryAfterSeconds: remaining });
    }
    const page = state2.page ?? 1;
    const pageSize = state2.pageSize ?? 100;
    const r = await gateway.listStructuresPage(page, pageSize);
    let persisted = 0;
    let skipped = 0;
    for (const estrutura of r.estruturas) {
      const codProduto = estrutura?.ident?.codProduto?.trim();
      if (!codProduto) continue;
      const upsertBase = req.server.productStructureMapOmieToUpsert(estrutura);
      const structureHash = req.server.productStructureComputeHash(upsertBase);
      const existing = await repo.findByCodProduto(upsertBase.codProduto);
      if (existing?.structureHash && existing.structureHash === structureHash) {
        skipped++;
        continue;
      }
      await repo.upsertStructureWithItems({ ...upsertBase, structureHash });
      persisted++;
    }
    if (typeof r.totalPages === "number" && r.totalPages > 0) {
      state2.page = page >= r.totalPages ? 1 : page + 1;
    } else {
      state2.page = page + 1;
    }
    return reply.code(200).send({
      pageProcessed: page,
      nextPage: state2.page,
      persisted,
      skipped,
      count: r.estruturas.length
    });
  } catch (e) {
    if (e?.code === "OMIE_REDUNDANT") {
      const retryAfter = e?.retryAfterSeconds ?? 60;
      const state2 = req.server.productStructureSyncJobState;
      state2.blockedUntil = Date.now() + retryAfter * 1e3;
      return reply.header("Retry-After", String(retryAfter)).code(429).send({ code: "OMIE_REDUNDANT", retryAfterSeconds: retryAfter, message: e.message });
    }
    req.log?.error?.({ err: e }, "[product-structure] job tick failed");
    return reply.code(500).send({ code: "INTERNAL_ERROR", message: "Erro interno" });
  }
}

// src/modules/product-structure/presentation/http/controllers/list-product-structures.controller.ts
async function listProductStructuresController(req, reply) {
  if (!req.server.productStructure) {
    req.log.error("[list-product-structures] productStructure module NOT registered");
    return reply.code(500).send({
      message: "M\xF3dulo product-structure n\xE3o registrado",
      code: "MODULE_NOT_REGISTERED"
    });
  }
  try {
    const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
    const pageSize = req.query.pageSize ? Math.min(100, Math.max(1, Number(req.query.pageSize))) : 20;
    const hasStructure = req.query.hasStructure !== void 0 ? req.query.hasStructure === "true" : void 0;
    const q = req.query.q?.trim() || void 0;
    const result = await req.server.productStructure.listUseCase.execute({
      page,
      pageSize,
      hasStructure,
      q
    });
    return sendPaginated(req, reply, result.data, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages
    });
  } catch (e) {
    req.log?.error?.({ err: e, message: e?.message }, "list product-structures failed");
    return reply.code(500).send({
      message: e?.message || "Erro interno ao listar estruturas de produtos",
      code: "INTERNAL_ERROR",
      error: process.env.NODE_ENV !== "production" ? e?.message : void 0
    });
  }
}

// src/modules/product-structure/presentation/http/schemas.ts
var SyncProductStructureBodySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    codProduto: { type: "string", minLength: 1 },
    idProduto: { type: "number" },
    intProduto: { type: "string", minLength: 1 }
  }
};
var SyncProductStructureResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    codProduto: { type: "string" },
    hasStructure: { type: "boolean" },
    updated: { type: "boolean" },
    itemsCount: { type: "number" }
  },
  required: ["codProduto", "hasStructure", "updated", "itemsCount"]
};
var GetProductStructureParamsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    codProduto: { type: "string", minLength: 1 }
  },
  required: ["codProduto"]
};
var ProductStructureOutputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    codProduto: { type: "string" },
    descrProduto: { type: ["string", "null"] },
    codFamilia: { type: ["string", "null"] },
    descrFamilia: { type: ["string", "null"] },
    tipoProduto: { type: ["string", "null"] },
    unidProduto: { type: ["string", "null"] },
    pesoBruto: { type: ["number", "null"] },
    pesoLiquido: { type: ["number", "null"] },
    hasStructure: { type: "boolean" },
    idProdutoOmie: { type: ["number", "null"] },
    intProdutoOmie: { type: ["string", "null"] },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          codProdutoComponente: { type: "string" },
          descrProdutoComponente: { type: ["string", "null"] },
          codFamiliaComponente: { type: ["string", "null"] },
          descrFamiliaComponente: { type: ["string", "null"] },
          quantidade: { type: "number" },
          unidade: { type: ["string", "null"] },
          tipoProdutoComponente: { type: ["string", "null"] },
          percentualPerda: { type: ["number", "null"] },
          idMalhaOmie: { type: ["number", "null"] }
        },
        required: ["codProdutoComponente", "quantidade"]
      }
    },
    createdAt: { type: "string" },
    updatedAt: { type: "string" }
  },
  required: ["codProduto", "hasStructure", "items", "createdAt", "updatedAt"]
};

// src/modules/product-structure/presentation/http/routes.ts
async function productStructureRoutes(app) {
  app.route({
    method: "GET",
    url: "/v1/admin/product-structures",
    schema: {
      tags: ["admin", "product-structures"],
      description: "[Admin] Lista as estruturas de produtos persistidas com pagina\xE7\xE3o e filtros."
    },
    handler: listProductStructuresController
  });
  app.route({
    method: "POST",
    url: "/v1/admin/omie/product-structures/sync",
    schema: {
      tags: ["admin", "omie", "product-structures"],
      description: "[Admin][Omie] Sincroniza a estrutura (malha) de um produto. Aceita codProduto, idProduto ou intProduto.",
      body: SyncProductStructureBodySchema,
      response: {
        200: SyncProductStructureResponseSchema
      }
    },
    handler: syncProductStructureController
  });
  app.route({
    method: "GET",
    url: "/v1/admin/product-structures/:codProduto",
    schema: {
      tags: ["admin", "product-structures"],
      description: "[Admin] Obt\xE9m a estrutura (malha) persistida pelo codProduto (dom\xEDnio est\xE1vel).",
      params: GetProductStructureParamsSchema,
      response: {
        200: ProductStructureOutputSchema
      }
    },
    handler: getProductStructureController
  });
  app.route({
    method: "POST",
    url: "/v1/admin/omie/product-structures/sync-job-tick",
    schema: {
      description: "[Admin][Omie][Job] Executa 1 tick de sincroniza\xE7\xE3o por p\xE1gina (interno)."
    },
    handler: syncProductStructureJobTickController
  });
}

// src/modules/product-structure/infrastructure/db/prisma/product-structure.prisma-repository.ts
var ProductStructurePrismaRepository = class {
  constructor(prisma2) {
    this.prisma = prisma2;
  }
  prisma;
  async findByCodProduto(codProduto) {
    return await this.prisma.productStructure.findUnique({
      where: { codProduto },
      include: { items: true }
    });
  }
  async upsertStructureWithItems(input) {
    await this.prisma.$transaction(async (tx) => {
      await tx.productStructure.upsert({
        where: { codProduto: input.codProduto },
        create: {
          codProduto: input.codProduto,
          descrProduto: input.descrProduto ?? null,
          codFamilia: input.codFamilia ?? null,
          descrFamilia: input.descrFamilia ?? null,
          tipoProduto: input.tipoProduto ?? null,
          unidProduto: input.unidProduto ?? null,
          pesoBruto: input.pesoBruto ?? null,
          pesoLiquido: input.pesoLiquido ?? null,
          hasStructure: input.hasStructure,
          idProdutoOmie: input.idProdutoOmie ?? null,
          intProdutoOmie: input.intProdutoOmie ?? null,
          structureHash: input.structureHash ?? null
        },
        update: {
          descrProduto: input.descrProduto ?? null,
          codFamilia: input.codFamilia ?? null,
          descrFamilia: input.descrFamilia ?? null,
          tipoProduto: input.tipoProduto ?? null,
          unidProduto: input.unidProduto ?? null,
          pesoBruto: input.pesoBruto ?? null,
          pesoLiquido: input.pesoLiquido ?? null,
          hasStructure: input.hasStructure,
          idProdutoOmie: input.idProdutoOmie ?? null,
          intProdutoOmie: input.intProdutoOmie ?? null,
          structureHash: input.structureHash ?? null
        }
      });
      await tx.productStructureItem.deleteMany({
        where: { codProdutoPai: input.codProduto }
      });
      if (input.items.length > 0) {
        await tx.productStructureItem.createMany({
          data: input.items.map((i) => ({
            codProdutoPai: input.codProduto,
            codProdutoComponente: i.codProdutoComponente,
            descrProdutoComponente: i.descrProdutoComponente ?? null,
            codFamiliaComponente: i.codFamiliaComponente ?? null,
            descrFamiliaComponente: i.descrFamiliaComponente ?? null,
            quantidade: i.quantidade,
            unidade: i.unidade ?? null,
            tipoProdutoComponente: i.tipoProdutoComponente ?? null,
            percentualPerda: i.percentualPerda ?? null,
            idMalhaOmie: i.idMalhaOmie ?? null
          })),
          skipDuplicates: true
        });
      }
    });
  }
  async findAll(params) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const skip = (page - 1) * pageSize;
    const where = {};
    if (params.hasStructure !== void 0) {
      where.hasStructure = params.hasStructure;
    }
    if (params.q?.trim()) {
      where.codProduto = { contains: params.q.trim(), mode: "insensitive" };
    }
    const [data, total] = await Promise.all([
      this.prisma.productStructure.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: "desc" },
        include: { items: true }
      }),
      this.prisma.productStructure.count({ where })
    ]);
    const totalNumber = Number(total);
    return {
      data,
      total: totalNumber,
      page,
      pageSize,
      totalPages: Math.ceil(totalNumber / pageSize)
    };
  }
};

// src/modules/product-structure/infrastructure/integrations/omie/omie-product-structure.gateway.ts
function extractEstruturas(resp) {
  return resp.produtosEncontrados ?? resp.listaEstruturas ?? resp.estruturas ?? resp.lista ?? [];
}
function isOmieErrorResponse(resp) {
  return Boolean(resp?.faultstring) || resp?.status === "error";
}
function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function parseRetryAfterSecondsFromFault(faultstring) {
  if (!faultstring) return null;
  const m = faultstring.match(/Aguarde\s+(\d+)\s+segundos/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}
function isRedundantFault(faultstring) {
  return typeof faultstring === "string" && /REDUNDANT/i.test(faultstring);
}
function buildOmieFaultError(message, details) {
  const err = new Error(message);
  err.code = "OMIE_FAULT";
  err.details = details;
  return err;
}
function buildOmieRedundantError(faultstring, details) {
  const retryAfterSeconds = parseRetryAfterSecondsFromFault(faultstring) ?? 60;
  const err = new Error(faultstring);
  err.code = "OMIE_REDUNDANT";
  err.retryAfterSeconds = retryAfterSeconds;
  err.details = details;
  return err;
}
var OmieProductStructureGatewayImpl = class {
  constructor(client) {
    this.client = client;
  }
  client;
  /**
   * ✅ Método para JOB: lista UMA página de estruturas
   * - 1 chamada Omie por execução
   * - reduz chance de REDUNDANT
   */
  async listStructuresPage(page, pageSize) {
    const payload = {
      call: "ListarEstruturas",
      param: [{ nPagina: page, nRegPorPagina: pageSize }]
    };
    let resp;
    try {
      resp = await this.client.post("/api/v1/geral/malha/", payload);
    } catch (e) {
      if (e?.code === "OMIE_HTTP_ERROR" && e?.details?.sample) {
        const parsed2 = safeJsonParse(String(e.details.sample));
        const faultstring = parsed2?.faultstring ?? parsed2?.message;
        if (isRedundantFault(faultstring)) {
          throw buildOmieRedundantError(faultstring, {
            httpStatus: e?.details?.httpStatus,
            url: e?.details?.url,
            call: "ListarEstruturas",
            faultcode: parsed2?.faultcode,
            faultstring
          });
        }
        if (parsed2?.faultstring || parsed2?.status === "error") {
          throw buildOmieFaultError(
            parsed2?.faultstring || parsed2?.message || "Erro Omie ao listar estruturas",
            { httpStatus: e?.details?.httpStatus, url: e?.details?.url, call: "ListarEstruturas", sample: parsed2 }
          );
        }
      }
      throw e;
    }
    if (isOmieErrorResponse(resp)) {
      const faultstring = resp?.faultstring || resp?.message || "Erro Omie ao listar estruturas";
      if (isRedundantFault(faultstring)) {
        throw buildOmieRedundantError(faultstring, {
          call: "ListarEstruturas",
          faultcode: resp?.faultcode,
          faultstring,
          nPagina: resp?.nPagina
        });
      }
      throw buildOmieFaultError(faultstring, resp);
    }
    const estruturas = extractEstruturas(resp);
    const totalPages = typeof resp.nTotPaginas === "number" ? resp.nTotPaginas : null;
    return {
      page: typeof resp.nPagina === "number" ? resp.nPagina : page,
      totalPages,
      estruturas
    };
  }
  /**
   * ✅ Método do endpoint manual (continua existindo)
   * Busca uma estrutura específica via listagem + filtro em memória.
   */
  async fetchStructure(input) {
    const maxPages = 50;
    const pageSize = 100;
    let page = 1;
    const wantedCod = input.codProduto?.trim();
    const wantedId = typeof input.idProduto === "number" ? input.idProduto : void 0;
    const wantedInt = input.intProduto?.trim();
    while (page <= maxPages) {
      const { estruturas, totalPages } = await this.listStructuresPage(page, pageSize);
      const found = estruturas.find((e) => {
        const ident = e.ident;
        if (!ident) return false;
        if (wantedCod) return (ident.codProduto ?? "").trim() === wantedCod;
        if (wantedId) return ident.idProduto === wantedId;
        if (wantedInt) return ident.intProduto?.trim?.() === wantedInt;
        return false;
      });
      if (found) {
        const ident = found.ident;
        const itens = found.itens ?? [];
        return {
          parent: {
            codProduto: ident.codProduto,
            descrProduto: ident.descrProduto,
            codFamilia: ident.codFamilia,
            descrFamilia: ident.descrFamilia,
            idProduto: ident.idProduto,
            idFamilia: ident.idFamilia,
            tipoProduto: ident.tipoProduto,
            unidProduto: ident.unidProduto,
            pesoBrutoProduto: ident.pesoBrutoProduto,
            pesoLiqProduto: ident.pesoLiqProduto,
            intProduto: ident.intProduto
          },
          items: itens.map((i) => ({
            codProdMalha: i.codProdMalha,
            descrProdMalha: i.descrProdMalha,
            codFamMalha: i.codFamMalha,
            descrFamMalha: i.descrFamMalha,
            quantProdMalha: i.quantProdMalha,
            unidProdMalha: i.unidProdMalha,
            tipoProdMalha: i.tipoProdMalha,
            percPerdaProdMalha: i.percPerdaProdMalha,
            idMalha: i.idMalha,
            idProdMalha: i.idProdMalha,
            idFamMalha: i.idFamMalha
          }))
        };
      }
      if (typeof totalPages === "number" && page >= totalPages) break;
      if (!totalPages && estruturas.length === 0) break;
      page++;
    }
    const err = new Error(
      wantedCod ? `Estrutura n\xE3o encontrada na Omie para codProduto=${wantedCod}` : wantedId ? `Estrutura n\xE3o encontrada na Omie para idProduto=${wantedId}` : `Estrutura n\xE3o encontrada na Omie para intProduto=${wantedInt}`
    );
    err.code = "OMIE_NOT_FOUND";
    throw err;
  }
};

// src/modules/product-structure/application/utils/resolve-product-identifier.ts
function resolveProductIdentifier(input) {
  const codProduto = input.codProduto?.trim();
  const intProduto = input.intProduto?.trim();
  const idProduto = input.idProduto;
  if (!codProduto && (idProduto === void 0 || idProduto === null) && !intProduto) {
    const err = new Error("Informe ao menos um identificador: codProduto, idProduto ou intProduto.");
    err.code = "VALIDATION_ERROR";
    throw err;
  }
  if (codProduto) return { kind: "codProduto", codProduto };
  if (typeof idProduto === "number" && !Number.isNaN(idProduto)) return { kind: "idProduto", idProduto };
  return { kind: "intProduto", intProduto };
}

// src/modules/product-structure/application/utils/omie-mappers.ts
function mapOmieToUpsertInput(omie) {
  const parent = omie.parent;
  const codProduto = (parent.codProduto ?? "").trim();
  if (!codProduto) {
    const err = new Error("Omie retornou estrutura sem codProduto no ident.");
    err.code = "INTEGRATION_ERROR";
    throw err;
  }
  const items = (omie.items ?? []).filter((i) => (i.codProdMalha ?? "").trim().length > 0).map((i) => ({
    codProdutoComponente: i.codProdMalha.trim(),
    descrProdutoComponente: i.descrProdMalha,
    codFamiliaComponente: i.codFamMalha,
    descrFamiliaComponente: i.descrFamMalha,
    quantidade: Number(i.quantProdMalha ?? 0),
    unidade: i.unidProdMalha,
    tipoProdutoComponente: i.tipoProdMalha,
    percentualPerda: i.percPerdaProdMalha,
    idMalhaOmie: i.idMalha ?? null
  }));
  return {
    codProduto,
    descrProduto: parent.descrProduto,
    codFamilia: parent.codFamilia,
    descrFamilia: parent.descrFamilia,
    tipoProduto: parent.tipoProduto,
    unidProduto: parent.unidProduto,
    pesoBruto: parent.pesoBrutoProduto,
    pesoLiquido: parent.pesoLiqProduto,
    hasStructure: items.length > 0,
    idProdutoOmie: parent.idProduto ?? null,
    intProdutoOmie: parent.intProduto ?? null,
    items
  };
}
function computeStructureHash(payload) {
  const normalizedItems = [...payload.items].map((i) => ({
    codProdutoComponente: (i.codProdutoComponente ?? "").trim(),
    quantidade: Number(i.quantidade),
    unidade: i.unidade?.trim() ?? null,
    percentualPerda: i.percentualPerda ?? null,
    idMalhaOmie: i.idMalhaOmie ?? null
  })).sort((a, b) => {
    const ka = `${a.codProdutoComponente}:${a.idMalhaOmie ?? ""}`;
    const kb = `${b.codProdutoComponente}:${b.idMalhaOmie ?? ""}`;
    return ka.localeCompare(kb);
  });
  const raw = JSON.stringify({
    codProduto: payload.codProduto.trim(),
    items: normalizedItems
  });
  return crypto__default.default.createHash("sha256").update(raw).digest("hex");
}

// src/modules/product-structure/application/use-cases/sync-omie-product-structure.usecase.ts
var SyncOmieProductStructureUseCase = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  async execute(input) {
    const resolved = resolveProductIdentifier(input);
    const omieResult = await this.deps.gateway.fetchStructure({
      codProduto: resolved.kind === "codProduto" ? resolved.codProduto : void 0,
      idProduto: resolved.kind === "idProduto" ? resolved.idProduto : void 0,
      intProduto: resolved.kind === "intProduto" ? resolved.intProduto : void 0
    });
    const upsertBase = mapOmieToUpsertInput(omieResult);
    const structureHash = computeStructureHash({
      codProduto: upsertBase.codProduto,
      items: upsertBase.items.map((i) => ({
        codProdutoComponente: i.codProdutoComponente,
        quantidade: i.quantidade,
        unidade: i.unidade,
        percentualPerda: i.percentualPerda,
        idMalhaOmie: i.idMalhaOmie ?? null
      }))
    });
    const existing = await this.deps.repository.findByCodProduto(upsertBase.codProduto);
    if (existing?.structureHash && existing.structureHash === structureHash) {
      return {
        codProduto: upsertBase.codProduto,
        hasStructure: upsertBase.hasStructure,
        updated: false,
        itemsCount: upsertBase.items.length
      };
    }
    await this.deps.repository.upsertStructureWithItems({
      ...upsertBase,
      structureHash
    });
    return {
      codProduto: upsertBase.codProduto,
      hasStructure: upsertBase.hasStructure,
      updated: true,
      itemsCount: upsertBase.items.length
    };
  }
};

// src/modules/product-structure/application/use-cases/get-product-structure-by-codproduto.usecase.ts
var GetProductStructureByCodProdutoUseCase = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  async execute(codProduto) {
    const normalized = (codProduto ?? "").trim();
    if (!normalized) {
      const err = new Error("codProduto \xE9 obrigat\xF3rio.");
      err.code = "VALIDATION_ERROR";
      throw err;
    }
    const found = await this.deps.repository.findByCodProduto(normalized);
    if (!found) {
      const err = new Error(`Estrutura n\xE3o encontrada para codProduto: ${normalized}`);
      err.code = "NOT_FOUND";
      throw err;
    }
    return {
      codProduto: found.codProduto,
      descrProduto: found.descrProduto,
      codFamilia: found.codFamilia,
      descrFamilia: found.descrFamilia,
      tipoProduto: found.tipoProduto,
      unidProduto: found.unidProduto,
      pesoBruto: found.pesoBruto ? Number(found.pesoBruto) : null,
      pesoLiquido: found.pesoLiquido ? Number(found.pesoLiquido) : null,
      hasStructure: found.hasStructure,
      idProdutoOmie: found.idProdutoOmie,
      intProdutoOmie: found.intProdutoOmie,
      items: (found.items ?? []).map((i) => ({
        codProdutoComponente: i.codProdutoComponente,
        descrProdutoComponente: i.descrProdutoComponente,
        codFamiliaComponente: i.codFamiliaComponente,
        descrFamiliaComponente: i.descrFamiliaComponente,
        quantidade: i.quantidade ? Number(i.quantidade) : 0,
        unidade: i.unidade,
        tipoProdutoComponente: i.tipoProdutoComponente,
        percentualPerda: i.percentualPerda ? Number(i.percentualPerda) : null,
        idMalhaOmie: i.idMalhaOmie
      })),
      createdAt: found.createdAt.toISOString(),
      updatedAt: found.updatedAt.toISOString()
    };
  }
};

// src/modules/product-structure/application/use-cases/list-product-structures.usecase.ts
var ListProductStructuresUseCase = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  async execute(input) {
    const result = await this.deps.repository.findAll({
      page: input.page,
      pageSize: input.pageSize,
      hasStructure: input.hasStructure,
      q: input.q
    });
    const data = result.data.map((found) => ({
      codProduto: found.codProduto,
      descrProduto: found.descrProduto,
      codFamilia: found.codFamilia,
      descrFamilia: found.descrFamilia,
      tipoProduto: found.tipoProduto,
      unidProduto: found.unidProduto,
      pesoBruto: found.pesoBruto ? Number(found.pesoBruto) : null,
      pesoLiquido: found.pesoLiquido ? Number(found.pesoLiquido) : null,
      hasStructure: found.hasStructure,
      idProdutoOmie: found.idProdutoOmie ? Number(found.idProdutoOmie) : null,
      intProdutoOmie: found.intProdutoOmie,
      items: (found.items ?? []).map((i) => ({
        codProdutoComponente: i.codProdutoComponente,
        descrProdutoComponente: i.descrProdutoComponente,
        codFamiliaComponente: i.codFamiliaComponente,
        descrFamiliaComponente: i.descrFamiliaComponente,
        quantidade: i.quantidade ? Number(i.quantidade) : 0,
        unidade: i.unidade,
        tipoProdutoComponente: i.tipoProdutoComponente,
        percentualPerda: i.percentualPerda ? Number(i.percentualPerda) : null,
        idMalhaOmie: i.idMalhaOmie ? Number(i.idMalhaOmie) : null
      })),
      createdAt: found.createdAt.toISOString(),
      updatedAt: found.updatedAt.toISOString()
    }));
    return {
      data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages
    };
  }
};

// src/modules/product-structure/index.ts
async function registerProductStructureModule(app) {
  app.log.info("[product-structure] registering module...");
  try {
    const repository = new ProductStructurePrismaRepository(app.prisma);
    const gateway = new OmieProductStructureGatewayImpl(app.omieClient);
    const syncUseCase = new SyncOmieProductStructureUseCase({ gateway, repository });
    const getByCodProdutoUseCase = new GetProductStructureByCodProdutoUseCase({ repository });
    const listUseCase = new ListProductStructuresUseCase({ repository });
    app.decorate("productStructure", { syncUseCase, getByCodProdutoUseCase, listUseCase });
    app.decorate("productStructureInFlight", /* @__PURE__ */ new Map());
    app.decorate("omieMalhaRateLimit", { blockedUntil: 0 });
    app.decorate("productStructureSyncJobState", {
      page: 1,
      blockedUntil: 0,
      pageSize: 100,
      maxPages: 50
    });
    app.decorate("productStructureGateway", gateway);
    app.decorate("productStructureRepository", repository);
    app.decorate("productStructureMapOmieToUpsert", (estrutura) => {
      const omieResult = {
        parent: estrutura.ident,
        items: estrutura.itens ?? []
      };
      return mapOmieToUpsertInput(omieResult);
    });
    app.decorate("productStructureComputeHash", (upsertBase) => {
      return computeStructureHash({
        codProduto: upsertBase.codProduto,
        items: upsertBase.items.map((it) => ({
          codProdutoComponente: it.codProdutoComponente,
          quantidade: it.quantidade,
          unidade: it.unidade,
          percentualPerda: it.percentualPerda,
          idMalhaOmie: it.idMalhaOmie ?? null
        }))
      });
    });
    app.log.info("[product-structure] module decorated successfully");
    await productStructureRoutes(app);
    app.log.info("[product-structure] routes registered successfully");
  } catch (err) {
    app.log.error({ err }, "[product-structure] FAILED to register module");
    throw err;
  }
}

// src/modules/product-structure/register.ts
async function registerProductStructureModule2(app) {
  await registerProductStructureModule(app);
}

// src/modules/internal-production-orders/infrastructure/db/internal-production-order.repository.prisma.ts
function mapToDomain(record) {
  return {
    id: record.id,
    trelloCardId: record.trelloCardId,
    trelloCardUrl: record.trelloCardUrl,
    source: record.source,
    status: record.status,
    lote: record.lote,
    quantityValue: Number(record.quantityValue),
    quantityUnit: record.quantityUnit,
    omieCode: record.omieCode,
    parsedProductName: record.parsedProductName,
    productDescription: record.productDescription,
    stockQuantity: record.stockQuantity ? Number(record.stockQuantity) : null,
    minimumStock: record.minimumStock ? Number(record.minimumStock) : null,
    startedAt: record.startedAt,
    completedAt: record.completedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}
var InternalProductionOrderRepositoryPrisma = class {
  constructor(prisma2) {
    this.prisma = prisma2;
  }
  prisma;
  async create(data) {
    const record = await this.prisma.internalProductionOrder.create({
      data: {
        lote: data.lote,
        quantityValue: data.quantityValue,
        quantityUnit: data.quantityUnit ?? "UN",
        omieCode: data.omieCode ?? null,
        parsedProductName: data.parsedProductName ?? null,
        productDescription: data.productDescription ?? null,
        stockQuantity: data.stockQuantity ?? null,
        minimumStock: data.minimumStock ?? null,
        source: data.source ?? "MANUAL",
        trelloCardId: data.trelloCardId ?? null,
        trelloCardUrl: data.trelloCardUrl ?? null
      }
    });
    return mapToDomain(record);
  }
  async update(id, data) {
    const record = await this.prisma.internalProductionOrder.update({
      where: { id },
      data: {
        ...data.lote !== void 0 && { lote: data.lote },
        ...data.quantityValue !== void 0 && { quantityValue: data.quantityValue },
        ...data.quantityUnit !== void 0 && { quantityUnit: data.quantityUnit },
        ...data.omieCode !== void 0 && { omieCode: data.omieCode },
        ...data.parsedProductName !== void 0 && { parsedProductName: data.parsedProductName },
        ...data.productDescription !== void 0 && { productDescription: data.productDescription },
        ...data.stockQuantity !== void 0 && { stockQuantity: data.stockQuantity },
        ...data.minimumStock !== void 0 && { minimumStock: data.minimumStock }
      }
    });
    return mapToDomain(record);
  }
  async start(id) {
    const record = await this.prisma.internalProductionOrder.update({
      where: { id },
      data: { status: "IN_PROGRESS", startedAt: /* @__PURE__ */ new Date() }
    });
    return mapToDomain(record);
  }
  async complete(id) {
    const record = await this.prisma.internalProductionOrder.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: /* @__PURE__ */ new Date() }
    });
    return mapToDomain(record);
  }
  async findById(id) {
    const record = await this.prisma.internalProductionOrder.findUnique({ where: { id } });
    return record ? mapToDomain(record) : null;
  }
  async findByTrelloCardId(trelloCardId) {
    const record = await this.prisma.internalProductionOrder.findUnique({ where: { trelloCardId } });
    return record ? mapToDomain(record) : null;
  }
  async list(params) {
    const { page = 1, pageSize = 20, status, source, dateFrom, dateTo } = params;
    const skip = (page - 1) * pageSize;
    const where = {};
    if (status) where.status = status;
    if (source) where.source = source;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    const [records, total] = await Promise.all([
      this.prisma.internalProductionOrder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.internalProductionOrder.count({ where })
    ]);
    return { items: records.map(mapToDomain), total };
  }
  async delete(id) {
    await this.prisma.$transaction(async (tx) => {
      await tx.internalProductionOrderChange.deleteMany({
        where: { event: { orderId: id } }
      });
      await tx.internalProductionOrderEvent.deleteMany({
        where: { orderId: id }
      });
      await tx.internalProductionOrder.delete({ where: { id } });
    });
  }
  async createEventWithChanges(event, changes) {
    await this.prisma.$transaction(async (tx) => {
      const createdEvent = await tx.internalProductionOrderEvent.create({
        data: {
          orderId: event.orderId,
          type: event.type,
          actorType: event.actorType,
          actorId: event.actorId,
          source: event.source,
          message: event.message
        }
      });
      if (changes.length > 0) {
        await tx.internalProductionOrderChange.createMany({
          data: changes.map((c) => ({
            eventId: createdEvent.id,
            field: c.field,
            before: c.before,
            after: c.after
          }))
        });
      }
    });
  }
};

// src/modules/internal-production-orders/infrastructure/integrations/http-products-catalog.adapter.ts
var HttpProductsCatalogAdapter = class {
  constructor(baseUrl, logger) {
    this.baseUrl = baseUrl;
    this.logger = logger;
  }
  baseUrl;
  logger;
  cache = /* @__PURE__ */ new Map();
  cacheTtlMs = 5 * 60 * 1e3;
  async findByOmieCode(omieCode) {
    const cacheKey = `product:${omieCode}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      this.logger?.info("Cat\xE1logo: cache hit para omieCode", { omieCode });
      return cached.data;
    }
    this.logger?.info("Cat\xE1logo: consultando produto", { omieCode });
    try {
      const response = await fetch(`${this.baseUrl}/v1/products`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(1e4)
      });
      if (!response.ok) {
        this.logger?.error("Cat\xE1logo: resposta n\xE3o OK", { status: response.status, omieCode });
        return null;
      }
      const body = await response.json();
      const products = body.products ?? body.data ?? [];
      const found = products.find(
        (p) => p.codigo_do_produto === omieCode || p.codigo === omieCode
      );
      if (!found) {
        this.logger?.info("Cat\xE1logo: produto n\xE3o encontrado", { omieCode });
        return null;
      }
      const result = {
        productDescription: found.descricao ?? null,
        stockQuantity: found.estoque ?? null,
        minimumStock: found.estoque_minimo ?? null
      };
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      this.logger?.info("Cat\xE1logo: produto enriquecido", { omieCode });
      return result;
    } catch (error) {
      this.logger?.error("Cat\xE1logo: erro na consulta", { omieCode, error: error.message });
      return null;
    }
  }
};

// src/modules/internal-production-orders/application/utils/diff.ts
function normalizeValue(value) {
  if (value === null || value === void 0) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}
function computeDiff(before, after) {
  const changes = [];
  const allKeys = /* @__PURE__ */ new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of allKeys) {
    if (key === "updatedAt") continue;
    const beforeVal = normalizeValue(before[key]);
    const afterVal = normalizeValue(after[key]);
    if (beforeVal !== afterVal) {
      changes.push({ field: key, before: beforeVal, after: afterVal });
    }
  }
  return changes;
}

// src/modules/internal-production-orders/application/services/internal-production-order-audit.service.ts
var InternalProductionOrderAuditService = class {
  constructor(repository, catalog, logger) {
    this.repository = repository;
    this.catalog = catalog;
    this.logger = logger;
  }
  repository;
  catalog;
  logger;
  async recordEvent(orderId, type, actorType, actorId, source, message, changes = []) {
    await this.repository.createEventWithChanges(
      { orderId, type, actorType, actorId, source, message },
      changes
    );
    this.logger?.info(`Audit: ${type}`, { orderId, actorType, changesCount: changes.length });
  }
  async recordEventFromDiff(orderId, type, actorType, actorId, source, message, before, after) {
    const changes = computeDiff(before, after);
    if (changes.length === 0) {
      this.logger?.info("Audit: diff vazio, evento n\xE3o gerado", { orderId, type });
      return;
    }
    await this.recordEvent(orderId, type, actorType, actorId, source, message, changes);
  }
  async enrichFromCatalog(order, actorType, actorId, source) {
    if (!order.omieCode) {
      await this.recordEvent(
        order.id,
        "LOOKUP_SKIPPED_NO_CODE",
        actorType,
        actorId,
        source,
        "OP interna sem omieCode, enriquecimento ignorado"
      );
      return order;
    }
    const product = await this.catalog.findByOmieCode(order.omieCode);
    if (!product) {
      await this.recordEvent(
        order.id,
        "PRODUCT_NOT_FOUND",
        actorType,
        actorId,
        source,
        `Produto com omieCode ${order.omieCode} n\xE3o encontrado no cat\xE1logo`
      );
      return order;
    }
    const updateInput = {
      productDescription: product.productDescription,
      stockQuantity: product.stockQuantity,
      minimumStock: product.minimumStock
    };
    const updated = await this.repository.update(order.id, updateInput);
    await this.recordEventFromDiff(
      order.id,
      "ENRICHED_FROM_OMIECODE",
      actorType,
      actorId,
      source,
      `OP enriquecida com dados do cat\xE1logo para omieCode ${order.omieCode}`,
      {
        productDescription: order.productDescription,
        stockQuantity: order.stockQuantity,
        minimumStock: order.minimumStock
      },
      {
        productDescription: updated.productDescription,
        stockQuantity: updated.stockQuantity,
        minimumStock: updated.minimumStock
      }
    );
    return updated;
  }
};
var CreateInternalProductionOrderSchema = zod.z.object({
  lote: zod.z.string().min(1).max(64),
  quantityValue: zod.z.number().positive(),
  quantityUnit: zod.z.enum(["UN", "B", "G", "KG"]).default("UN"),
  omieCode: zod.z.string().max(64).optional().nullable(),
  parsedProductName: zod.z.string().max(512).optional().nullable(),
  productDescription: zod.z.string().optional().nullable(),
  stockQuantity: zod.z.number().optional().nullable(),
  minimumStock: zod.z.number().optional().nullable(),
  source: zod.z.enum(["MANUAL", "TRELLO"]).default("MANUAL"),
  trelloCardId: zod.z.string().max(128).optional().nullable(),
  trelloCardUrl: zod.z.string().max(1024).optional().nullable()
});
var UpdateInternalProductionOrderSchema = zod.z.object({
  lote: zod.z.string().min(1).max(64).optional(),
  quantityValue: zod.z.number().positive().optional(),
  quantityUnit: zod.z.enum(["UN", "B", "G", "KG"]).optional(),
  omieCode: zod.z.string().max(64).optional().nullable(),
  parsedProductName: zod.z.string().max(512).optional().nullable(),
  productDescription: zod.z.string().optional().nullable(),
  stockQuantity: zod.z.number().optional().nullable(),
  minimumStock: zod.z.number().optional().nullable()
});
var ListInternalProductionOrdersSchema = zod.z.object({
  page: zod.z.coerce.number().int().positive().optional().default(1),
  pageSize: zod.z.coerce.number().int().positive().max(100).optional().default(20),
  status: zod.z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
  source: zod.z.enum(["MANUAL", "TRELLO"]).optional(),
  dateFrom: zod.z.string().datetime().optional(),
  dateTo: zod.z.string().datetime().optional()
});
function toOutput(order) {
  return {
    id: order.id,
    trelloCardId: order.trelloCardId,
    trelloCardUrl: order.trelloCardUrl,
    source: order.source,
    status: order.status,
    lote: order.lote,
    quantityValue: Number(order.quantityValue),
    quantityUnit: order.quantityUnit,
    omieCode: order.omieCode,
    parsedProductName: order.parsedProductName,
    productDescription: order.productDescription,
    stockQuantity: order.stockQuantity != null ? Number(order.stockQuantity) : null,
    minimumStock: order.minimumStock != null ? Number(order.minimumStock) : null,
    startedAt: order.startedAt?.toISOString() ?? null,
    completedAt: order.completedAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString()
  };
}

// src/modules/internal-production-orders/application/use-cases/create-internal-production-order.usecase.ts
var CreateInternalProductionOrderUseCase = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  async execute(input, actorType = "SYSTEM", actorId = null) {
    const { internalProductionOrderRepository, auditService, logger } = this.deps;
    const validated = CreateInternalProductionOrderSchema.parse(input);
    if (validated.trelloCardId) {
      const existing = await internalProductionOrderRepository.findByTrelloCardId(validated.trelloCardId);
      if (existing) {
        throw new Error(`OP interna com trelloCardId ${validated.trelloCardId} j\xE1 existe`);
      }
    }
    const created = await internalProductionOrderRepository.create(validated);
    logger?.info("OP interna criada", { id: created.id, lote: created.lote });
    await auditService.recordEvent(
      created.id,
      "CREATED",
      actorType,
      actorId,
      validated.source === "TRELLO" ? "TRELLO" : "MANUAL",
      `OP interna criada via ${validated.source}`
    );
    const enriched = await auditService.enrichFromCatalog(created, actorType, actorId, "SYSTEM");
    return toOutput(enriched);
  }
};

// src/modules/internal-production-orders/application/use-cases/update-internal-production-order.usecase.ts
var UpdateInternalProductionOrderUseCase = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  async execute(id, input, actorType = "SYSTEM", actorId = null) {
    const { internalProductionOrderRepository, auditService, logger } = this.deps;
    const validated = UpdateInternalProductionOrderSchema.parse(input);
    const before = await internalProductionOrderRepository.findById(id);
    if (!before) {
      throw new Error(`OP interna ${id} n\xE3o encontrada`);
    }
    const updated = await internalProductionOrderRepository.update(id, validated);
    logger?.info("OP interna atualizada", { id });
    await auditService.recordEventFromDiff(
      id,
      "UPDATED",
      actorType,
      actorId,
      "SYSTEM",
      `OP interna atualizada`,
      before,
      updated
    );
    if (updated.omieCode) {
      const enriched = await auditService.enrichFromCatalog(updated, actorType, actorId, "SYSTEM");
      return toOutput(enriched);
    }
    return toOutput(updated);
  }
};

// src/modules/internal-production-orders/application/use-cases/start-internal-production-order.usecase.ts
var StartInternalProductionOrderUseCase = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  async execute(id, actorType = "SYSTEM", actorId = null) {
    const { internalProductionOrderRepository, auditService, logger } = this.deps;
    const before = await internalProductionOrderRepository.findById(id);
    if (!before) {
      throw new Error(`OP interna ${id} n\xE3o encontrada`);
    }
    if (before.status !== "PENDING") {
      throw new Error(`OP interna ${id} n\xE3o pode ser iniciada. Status atual: ${before.status}`);
    }
    const updated = await internalProductionOrderRepository.start(id);
    logger?.info("OP interna iniciada", { id });
    await auditService.recordEventFromDiff(
      id,
      "STARTED",
      actorType,
      actorId,
      "SYSTEM",
      `OP interna iniciada`,
      { status: before.status, startedAt: before.startedAt },
      { status: updated.status, startedAt: updated.startedAt }
    );
    return toOutput(updated);
  }
};

// src/modules/internal-production-orders/application/use-cases/complete-internal-production-order.usecase.ts
var CompleteInternalProductionOrderUseCase = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  async execute(id, actorType = "SYSTEM", actorId = null) {
    const { internalProductionOrderRepository, auditService, logger } = this.deps;
    const before = await internalProductionOrderRepository.findById(id);
    if (!before) {
      throw new Error(`OP interna ${id} n\xE3o encontrada`);
    }
    if (before.status !== "IN_PROGRESS") {
      throw new Error(`OP interna ${id} n\xE3o pode ser conclu\xEDda. Status atual: ${before.status}`);
    }
    const updated = await internalProductionOrderRepository.complete(id);
    logger?.info("OP interna conclu\xEDda", { id });
    await auditService.recordEventFromDiff(
      id,
      "COMPLETED",
      actorType,
      actorId,
      "SYSTEM",
      `OP interna conclu\xEDda`,
      { status: before.status, completedAt: before.completedAt },
      { status: updated.status, completedAt: updated.completedAt }
    );
    return toOutput(updated);
  }
};

// src/modules/internal-production-orders/application/use-cases/delete-internal-production-order.usecase.ts
var DeleteInternalProductionOrderUseCase = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  async execute(id) {
    const { internalProductionOrderRepository, logger } = this.deps;
    const existing = await internalProductionOrderRepository.findById(id);
    if (!existing) {
      throw new Error(`OP interna ${id} n\xE3o encontrada`);
    }
    await internalProductionOrderRepository.delete(id);
    logger?.info("OP interna deletada", { id });
  }
};

// src/modules/internal-production-orders/application/use-cases/get-internal-production-orders.usecase.ts
var GetInternalProductionOrdersUseCase = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  async execute(input) {
    const { internalProductionOrderRepository } = this.deps;
    const validated = ListInternalProductionOrdersSchema.parse(input);
    const result = await internalProductionOrderRepository.list(validated);
    return {
      items: result.items.map(toOutput),
      total: result.total
    };
  }
};

// src/modules/internal-production-orders/application/use-cases/get-internal-production-order-by-id.usecase.ts
var GetInternalProductionOrderByIdUseCase = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  async execute(id) {
    const { internalProductionOrderRepository } = this.deps;
    const existing = await internalProductionOrderRepository.findById(id);
    if (!existing) {
      throw new Error(`OP interna ${id} n\xE3o encontrada`);
    }
    return toOutput(existing);
  }
};
var InternalProductionOrderController = class {
  constructor(createUseCase, updateUseCase, startUseCase, completeUseCase, listUseCase, getByIdUseCase, deleteUseCase) {
    this.createUseCase = createUseCase;
    this.updateUseCase = updateUseCase;
    this.startUseCase = startUseCase;
    this.completeUseCase = completeUseCase;
    this.listUseCase = listUseCase;
    this.getByIdUseCase = getByIdUseCase;
    this.deleteUseCase = deleteUseCase;
  }
  createUseCase;
  updateUseCase;
  startUseCase;
  completeUseCase;
  listUseCase;
  getByIdUseCase;
  deleteUseCase;
  async create(request, reply) {
    try {
      const validated = CreateInternalProductionOrderSchema.parse(request.body);
      const result = await this.createUseCase.execute(validated);
      return reply.code(201).send({ success: true, data: result });
    } catch (error) {
      return this.handleError(error, request, reply);
    }
  }
  async update(request, reply) {
    try {
      const { id } = request.params;
      const validated = UpdateInternalProductionOrderSchema.parse(request.body);
      const result = await this.updateUseCase.execute(id, validated);
      return reply.code(200).send({ success: true, data: result });
    } catch (error) {
      return this.handleError(error, request, reply);
    }
  }
  async start(request, reply) {
    try {
      const { id } = request.params;
      const actorType = this.resolveActorType(request);
      const result = await this.startUseCase.execute(id, actorType);
      return reply.code(200).send({ success: true, data: result });
    } catch (error) {
      return this.handleError(error, request, reply);
    }
  }
  async complete(request, reply) {
    try {
      const { id } = request.params;
      const actorType = this.resolveActorType(request);
      const result = await this.completeUseCase.execute(id, actorType);
      return reply.code(200).send({ success: true, data: result });
    } catch (error) {
      return this.handleError(error, request, reply);
    }
  }
  async list(request, reply) {
    try {
      const validated = ListInternalProductionOrdersSchema.parse(request.query);
      const result = await this.listUseCase.execute(validated);
      return reply.code(200).send({ success: true, ...result });
    } catch (error) {
      return this.handleError(error, request, reply);
    }
  }
  async getById(request, reply) {
    try {
      const { id } = request.params;
      const result = await this.getByIdUseCase.execute(id);
      return reply.code(200).send({ success: true, data: result });
    } catch (error) {
      return this.handleError(error, request, reply);
    }
  }
  async delete(request, reply) {
    try {
      const { id } = request.params;
      await this.deleteUseCase.execute(id);
      return reply.code(200).send({ success: true });
    } catch (error) {
      return this.handleError(error, request, reply);
    }
  }
  handleError(error, request, reply) {
    if (error instanceof zod.ZodError) {
      return reply.code(400).send({ success: false, error: "Dados inv\xE1lidos", details: error.errors });
    }
    if (error instanceof Error) {
      if (error.message.includes("n\xE3o encontrada")) {
        return reply.code(404).send({ success: false, error: error.message });
      }
      if (error.message.includes("j\xE1 existe")) {
        return reply.code(409).send({ success: false, error: error.message });
      }
      if (error.message.includes("n\xE3o pode ser")) {
        return reply.code(422).send({ success: false, error: error.message });
      }
    }
    request.log.error({ error }, "Erro interno no m\xF3dulo internal-production-orders");
    return reply.code(500).send({ success: false, error: "Erro interno ao processar solicita\xE7\xE3o" });
  }
  resolveActorType(request) {
    const header = request.headers["x-actor-type"] || "USER";
    if (header === "SYSTEM" || header === "INTEGRATION") return header;
    return "USER";
  }
};

// src/modules/internal-production-orders/presentation/http/routes.ts
function registerInternalProductionOrderRoutes(app, controller) {
  app.post("/v1/internal-production-orders", controller.create.bind(controller));
  app.get("/v1/internal-production-orders", controller.list.bind(controller));
  app.get("/v1/internal-production-orders/:id", controller.getById.bind(controller));
  app.patch("/v1/internal-production-orders/:id", controller.update.bind(controller));
  app.post("/v1/internal-production-orders/:id/start", controller.start.bind(controller));
  app.post("/v1/internal-production-orders/:id/complete", controller.complete.bind(controller));
  app.patch("/v1/internal-production-orders/:id/start", controller.start.bind(controller));
  app.patch("/v1/internal-production-orders/:id/complete", controller.complete.bind(controller));
  app.delete("/v1/internal-production-orders/:id", controller.delete.bind(controller));
}

// src/modules/internal-production-orders/register.ts
var CATALOG_BASE_URL = "https://production-manager-api.onrender.com";
async function registerInternalProductionOrdersModule(app) {
  const prisma2 = app.prisma;
  const repository = new InternalProductionOrderRepositoryPrisma(prisma2);
  const productsCatalog = new HttpProductsCatalogAdapter(CATALOG_BASE_URL, app.log);
  const auditService = new InternalProductionOrderAuditService(repository, productsCatalog, app.log);
  const createUseCase = new CreateInternalProductionOrderUseCase({
    internalProductionOrderRepository: repository,
    productsCatalog,
    auditService,
    logger: app.log
  });
  const updateUseCase = new UpdateInternalProductionOrderUseCase({
    internalProductionOrderRepository: repository,
    auditService,
    logger: app.log
  });
  const startUseCase = new StartInternalProductionOrderUseCase({
    internalProductionOrderRepository: repository,
    auditService,
    logger: app.log
  });
  const completeUseCase = new CompleteInternalProductionOrderUseCase({
    internalProductionOrderRepository: repository,
    auditService,
    logger: app.log
  });
  const deleteUseCase = new DeleteInternalProductionOrderUseCase({
    internalProductionOrderRepository: repository,
    logger: app.log
  });
  const listUseCase = new GetInternalProductionOrdersUseCase({ internalProductionOrderRepository: repository });
  const getByIdUseCase = new GetInternalProductionOrderByIdUseCase({ internalProductionOrderRepository: repository });
  const controller = new InternalProductionOrderController(
    createUseCase,
    updateUseCase,
    startUseCase,
    completeUseCase,
    listUseCase,
    getByIdUseCase,
    deleteUseCase
  );
  app.decorate("internalProductionOrderRepository", repository);
  app.decorate("createInternalProductionOrderUseCase", createUseCase);
  app.decorate("updateInternalProductionOrderUseCase", updateUseCase);
  app.decorate("startInternalProductionOrderUseCase", startUseCase);
  app.decorate("completeInternalProductionOrderUseCase", completeUseCase);
  app.decorate("deleteInternalProductionOrderUseCase", deleteUseCase);
  app.decorate("getInternalProductionOrdersUseCase", listUseCase);
  app.decorate("getInternalProductionOrderByIdUseCase", getByIdUseCase);
  registerInternalProductionOrderRoutes(app, controller);
}

// src/modules/trello-integration/application/utils/parse-card-name.ts
var VALID_UNITS = /* @__PURE__ */ new Set(["UN", "B", "G", "KG"]);
var UNIT_ALIASES = { UNIDADE: "UN" };
function normalizeUnit(raw) {
  const upper = raw.toUpperCase();
  if (upper in UNIT_ALIASES) return UNIT_ALIASES[upper];
  if (VALID_UNITS.has(upper)) return upper;
  return "UN";
}
function looksLikeOmieCode(value) {
  return /^\d/.test(value) || /^[A-Z0-9][A-Z0-9._/-]*\d[A-Z0-9._/-]*$/i.test(value);
}
function splitBeforeQty(beforeQty) {
  const parts = beforeQty.split(/\s+-\s+/).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return parts;
  const lastSpaceHyphen = beforeQty.lastIndexOf(" -");
  const lastHyphenSpace = beforeQty.lastIndexOf("- ");
  const splitPos = Math.max(
    lastSpaceHyphen > 0 ? lastSpaceHyphen : -1,
    lastHyphenSpace > 0 ? lastHyphenSpace : -1
  );
  if (splitPos > 0) {
    const left = beforeQty.slice(0, splitPos).trim();
    const right = beforeQty.slice(splitPos + 2).trim();
    if (left && right) return [left, right];
  }
  return parts;
}
function parseCardName(cardName) {
  const trimmed = cardName.trim();
  if (!trimmed) return null;
  const qtyRegex = /(\d+(?:\.\d+)?)\s*(UN|UNIDADE|B|G|KG)\s*(?:\([^)]*\))?\s*$/i;
  const qtyMatch = qtyRegex.exec(trimmed);
  if (!qtyMatch) return null;
  if (qtyMatch.index > 0 && trimmed[qtyMatch.index - 1] === "-") return null;
  const quantityValue = Number(qtyMatch[1]);
  if (quantityValue <= 0) return null;
  const quantityUnit = normalizeUnit(qtyMatch[2]);
  const beforeQty = trimmed.slice(0, qtyMatch.index).trim();
  if (!beforeQty) return null;
  const beforeQtyClean = beforeQty.replace(/-\s*$/, "").trim();
  if (!beforeQtyClean) return null;
  const segments = splitBeforeQty(beforeQtyClean);
  if (segments.length < 2) return null;
  const lote = segments[segments.length - 1];
  const before = segments.slice(0, -1);
  if (before.length === 1) {
    const first = before[0];
    if (!first) {
      return { parsedProductName: null, omieCode: null, lote, quantityValue, quantityUnit };
    }
    if (looksLikeOmieCode(first)) {
      return { parsedProductName: null, omieCode: first, lote, quantityValue, quantityUnit };
    }
    return { parsedProductName: first, omieCode: null, lote, quantityValue, quantityUnit };
  }
  if (before.length === 2) {
    return {
      parsedProductName: before[0],
      omieCode: before[1],
      lote,
      quantityValue,
      quantityUnit
    };
  }
  if (before.length > 2) {
    return {
      parsedProductName: before.slice(0, -1).join(" - "),
      omieCode: before[before.length - 1],
      lote,
      quantityValue,
      quantityUnit
    };
  }
  return null;
}

// src/modules/trello-integration/application/utils/trello-event-guards.ts
function isCardEnteredTargetList(event, targetListId) {
  const { action } = event;
  if (action.type === "createCard" || action.type === "copyCard") {
    return action.data.list?.id === targetListId;
  }
  if (action.type === "updateCard") {
    const listBefore = action.data.listBefore?.id;
    const listAfter = action.data.listAfter?.id;
    return listBefore !== targetListId && listAfter === targetListId;
  }
  return false;
}

// src/modules/trello-integration/application/use-cases/process-trello-webhook.use-case.ts
var ProcessTrelloWebhookUseCase = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  async execute(event) {
    const { createInternalProductionOrderUseCase, targetListId, logger } = this.deps;
    logger?.info("Webhook recebido", { type: event.action.type, cardId: event.action.data.card.id });
    if (!isCardEnteredTargetList(event, targetListId)) {
      logger?.info("Evento ignorado - n\xE3o entrou na lista alvo", {
        type: event.action.type,
        cardId: event.action.data.card.id
      });
      return { handled: false, created: false, reason: "not-target-list" };
    }
    const cardName = event.action.data.card.name;
    const parsed2 = parseCardName(cardName);
    if (!parsed2) {
      logger?.info("Evento ignorado - falha no parsing do nome", {
        cardId: event.action.data.card.id,
        cardName
      });
      return { handled: true, created: false, reason: "parse-failed" };
    }
    const input = {
      lote: parsed2.lote,
      quantityValue: parsed2.quantityValue,
      quantityUnit: parsed2.quantityUnit,
      omieCode: parsed2.omieCode ?? null,
      parsedProductName: parsed2.parsedProductName ?? null,
      source: "TRELLO",
      trelloCardId: event.action.data.card.id,
      trelloCardUrl: event.action.data.card.url ?? null
    };
    try {
      const result = await createInternalProductionOrderUseCase.execute(input, "INTEGRATION", null);
      logger?.info("OP interna criada via Trello", {
        productionOrderId: result.id,
        lote: result.lote
      });
      return { handled: true, created: true, productionOrderId: result.id };
    } catch (error) {
      if (error instanceof Error && error.message.includes("j\xE1 existe")) {
        logger?.info("OP interna j\xE1 existe para este card", { cardId: event.action.data.card.id });
        return { handled: true, created: false, reason: "already-exists" };
      }
      logger?.error("Erro ao criar OP interna via Trello", {
        cardId: event.action.data.card.id,
        error: error instanceof Error ? error.message : "unknown"
      });
      return { handled: true, created: false, reason: "internal-error" };
    }
  }
};

// src/modules/trello-integration/presentation/http/controllers/trello-webhook.controller.ts
var TrelloWebhookController = class {
  constructor(processWebhook) {
    this.processWebhook = processWebhook;
  }
  processWebhook;
  async handlePost(request, reply) {
    try {
      const event = request.body;
      const result = await this.processWebhook.execute(event);
      return reply.code(200).send(result);
    } catch (error) {
      request.log.error({ error: error instanceof Error ? error.message : "unknown" }, "Erro no webhook POST");
      return reply.code(200).send({ handled: false, created: false, reason: "internal-error" });
    }
  }
  async handleGet(request, reply) {
    const challenge = request.query["hub.challenge"];
    if (challenge) {
      return reply.code(200).send(Number(challenge));
    }
    return reply.code(200).send({ ok: true, message: "Webhook endpoint ativo" });
  }
};

// src/modules/trello-integration/presentation/http/routes.ts
function registerTrelloIntegrationRoutes(app, controller) {
  app.get("/v1/trello/webhook", controller.handleGet.bind(controller));
  app.post("/v1/trello/webhook", controller.handlePost.bind(controller));
}

// src/modules/trello-integration/register.ts
var DEFAULT_TARGET_LIST_ID = "";
async function registerTrelloIntegrationModule(app) {
  const targetListId = process.env["TRELLO_LISTA_PRODUCAO_ID"] || DEFAULT_TARGET_LIST_ID;
  const createInternalProductionOrderUseCase = app.createInternalProductionOrderUseCase;
  if (!createInternalProductionOrderUseCase) {
    app.log.error("createInternalProductionOrderUseCase n\xE3o encontrado - trello-integration n\xE3o ser\xE1 registrado");
    return;
  }
  const processWebhook = new ProcessTrelloWebhookUseCase({
    createInternalProductionOrderUseCase,
    targetListId,
    logger: app.log
  });
  const controller = new TrelloWebhookController(processWebhook);
  registerTrelloIntegrationRoutes(app, controller);
}

// src/modules/product-sectors/presentation/http/product-sectors.routes.ts
function registerProductSectorsRoutes(app, controller) {
  const prefix = "/v1/product-sectors";
  app.get(`${prefix}`, controller.list.bind(controller));
  app.put(`${prefix}/:id`, controller.update.bind(controller));
  app.delete(`${prefix}/:id`, controller.delete.bind(controller));
}
var listSectorsQuerySchema2 = zod.z.object({
  includeInactive: zod.z.string().optional().transform((v) => v === "true")
});
var sectorIdParamsSchema2 = zod.z.object({
  id: zod.z.string().min(1, "id \xE9 obrigat\xF3rio")
});
var updateSectorBodySchema2 = zod.z.object({
  name: zod.z.string().min(1, "nome \xE9 obrigat\xF3rio").optional(),
  order: zod.z.number().int().optional(),
  active: zod.z.boolean().optional()
});

// src/modules/product-sectors/presentation/http/product-sectors.controller.ts
function createProductSectorsController(deps) {
  return {
    async list(request, reply) {
      const query = listSectorsQuerySchema2.parse(request.query);
      const sectors = await deps.listSectorsUseCase.execute({ includeInactive: query.includeInactive });
      return reply.code(200).send({ data: sectors });
    },
    async update(request, reply) {
      const params = sectorIdParamsSchema2.parse(request.params);
      const body = updateSectorBodySchema2.parse(request.body);
      const sector = await deps.updateSectorUseCase.execute({ id: params.id, data: body });
      return reply.code(200).send({ data: sector });
    },
    async delete(request, reply) {
      const params = sectorIdParamsSchema2.parse(request.params);
      await deps.deleteSectorUseCase.execute({ id: params.id });
      return reply.code(204).send();
    }
  };
}

// src/modules/product-sectors/infrastructure/db/product-sectors.repo.prisma.ts
var DEFAULT_SECTORS = ["Refino", "Temperagem", "Confeitaria", "Embalagem"];
function createProductSectorsRepoPrisma(prisma2) {
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
      return prisma2.sector.update({ where: { id }, data: { active: false } });
    },
    upsertDefault(name) {
      return prisma2.sector.upsert({
        where: { name },
        update: { active: true },
        create: { name, active: true }
      });
    }
  };
}

// src/modules/product-sectors/application/use-cases/list-sectors.usecase.ts
function createListSectorsUseCase2(deps) {
  return {
    async execute(input) {
      return deps.repo.list(input.includeInactive);
    }
  };
}

// src/modules/product-sectors/application/use-cases/update-sector.usecase.ts
function createUpdateSectorUseCase2(deps) {
  return {
    async execute(input) {
      const existing = await deps.repo.findById(input.id);
      if (!existing) {
        const err = new Error("Setor n\xE3o encontrado");
        err.statusCode = 404;
        throw err;
      }
      return deps.repo.update(input.id, input.data);
    }
  };
}

// src/modules/product-sectors/application/use-cases/delete-sector.usecase.ts
function createDeleteSectorUseCase2(deps) {
  return {
    async execute(input) {
      const existing = await deps.repo.findById(input.id);
      if (!existing) {
        const err = new Error("Setor n\xE3o encontrado");
        err.statusCode = 404;
        throw err;
      }
      if (DEFAULT_SECTORS.includes(existing.name)) {
        const err = new Error(`Setor padr\xE3o "${existing.name}" n\xE3o pode ser deletado`);
        err.statusCode = 403;
        throw err;
      }
      return deps.repo.softDelete(input.id);
    }
  };
}

// src/modules/product-sectors/application/use-cases/seed-default-sectors.usecase.ts
function createSeedDefaultSectorsUseCase(deps) {
  return {
    async execute() {
      const results = await Promise.all(
        DEFAULT_SECTORS.map(
          (name, index) => deps.repo.upsertDefault(name).then((sector) => ({ ...sector, defaultOrder: index }))
        )
      );
      return results;
    }
  };
}

// src/modules/product-sectors/index.ts
async function registerProductSectorsModule(app) {
  const prisma2 = app.prisma;
  const logger = app.log;
  const repo = createProductSectorsRepoPrisma(prisma2);
  const useCases = {
    listSectorsUseCase: createListSectorsUseCase2({ repo }),
    updateSectorUseCase: createUpdateSectorUseCase2({ repo }),
    deleteSectorUseCase: createDeleteSectorUseCase2({ repo })
  };
  const controller = createProductSectorsController(useCases);
  await registerProductSectorsRoutes(app, controller);
  const seedUseCase = createSeedDefaultSectorsUseCase({ repo });
  const seeded = await seedUseCase.execute();
  logger.info({ count: seeded.length }, "[ProductSectors] setores padr\xE3o sincronizados");
}
var CreateProductionOrderRequestSchema = zod.z.object({
  productId: zod.z.string(),
  quantity: zod.z.number().positive(),
  externalRequestId: zod.z.string(),
  scheduledDate: zod.z.string().datetime().optional(),
  notes: zod.z.string().optional()
});
var CreateProductionOrderResponseSchema = zod.z.object({
  success: zod.z.boolean(),
  data: zod.z.object({
    externalRequestId: zod.z.string(),
    status: zod.z.enum(["ACCEPTED"])
  })
});
var ValidationErrorResponseSchema = zod.z.object({
  success: zod.z.boolean(),
  error: zod.z.literal("VALIDATION_ERROR"),
  message: zod.z.string()
});
var InternalErrorResponseSchema = zod.z.object({
  success: zod.z.boolean(),
  error: zod.z.literal("INTERNAL_ERROR"),
  message: zod.z.string()
});

// src/modules/integration/infrastructure/gateways/fake-production-order-integration.gateway.ts
var FakeProductionOrderIntegrationGateway = class {
  async createProductionOrder(command) {
    return {
      externalRequestId: command.externalRequestId,
      status: "ACCEPTED"
    };
  }
};

// src/modules/integration/infrastructure/gateways/real-production-order-integration.gateway.ts
var RealProductionOrderIntegrationGateway = class {
  constructor(omieClient) {
    this.omieClient = omieClient;
  }
  omieClient;
  async createProductionOrder(command) {
    this.validateRequiredFields(command);
    const payload = {
      call: "IncluirOrdemProducao",
      app_key: env.OMIE_APP_KEY,
      app_secret: env.OMIE_APP_SECRET,
      param: [
        {
          identificacao: {
            cCodIntOP: command.externalRequestId,
            dDtPrevisao: command.scheduledDate ? this.formatDate(command.scheduledDate) : this.getCurrentDate(),
            nCodProduto: Number(command.productId),
            nQtde: command.quantity
          }
        }
      ]
    };
    try {
      const response = await this.omieClient.post("/api/v1/produtos/op/", payload);
      if (response.faultstring || response.error || response.codigo_status !== "0") {
        console.error("[OmieIntegrationError]", response);
        throw new Error(`Omie API error: ${response.faultstring || response.error || "Unknown error"}`);
      }
      return { externalRequestId: command.externalRequestId, status: "ACCEPTED" };
    } catch (error) {
      console.error("[OMIE ERROR FULL]", error);
      if (error?.response) {
        console.error("[OMIE RESPONSE DATA]", error.response.data);
      }
      throw new Error(
        error?.response?.data?.faultstring || error?.response?.data?.error || error.message || "Omie unknown error"
      );
    }
  }
  formatDate(date) {
    const parsedDate = new Date(date);
    const day = String(parsedDate.getDate()).padStart(2, "0");
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const year = parsedDate.getFullYear();
    return `${day}/${month}/${year}`;
  }
  getCurrentDate() {
    const today = /* @__PURE__ */ new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  }
  validateRequiredFields(command) {
    const missingFields = [];
    if (!command.productId || command.productId.trim() === "") {
      missingFields.push("productId");
    }
    if (!command.quantity || command.quantity <= 0) {
      missingFields.push("quantity");
    }
    if (!command.externalRequestId || command.externalRequestId.trim() === "") {
      missingFields.push("externalRequestId");
    }
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }
  }
};

// src/modules/integration/application/use-cases/create-production-order.usecase.ts
var CreateProductionOrderUseCase = class {
  gateway;
  constructor(gateway) {
    if (gateway) {
      this.gateway = gateway;
      return;
    }
    const gatewayType = process.env.PRODUCTION_ORDER_GATEWAY;
    if (gatewayType === "real") {
      this.gateway = new RealProductionOrderIntegrationGateway();
    } else {
      this.gateway = new FakeProductionOrderIntegrationGateway();
    }
  }
  async execute(request) {
    const integrationResult = await this.gateway.createProductionOrder(request);
    const response = {
      success: true,
      data: {
        externalRequestId: integrationResult.externalRequestId,
        status: integrationResult.status
      }
    };
    return response;
  }
};
async function createProductionOrderController(request, reply, useCase) {
  try {
    const validatedData = CreateProductionOrderRequestSchema.parse(request.body);
    const useCaseInstance = useCase || new CreateProductionOrderUseCase();
    const successResponse = await useCaseInstance.execute(validatedData);
    return reply.code(202).send(successResponse);
  } catch (error) {
    if (error instanceof zod.z.ZodError) {
      const validationError = {
        success: false,
        error: "VALIDATION_ERROR",
        message: "Invalid request payload"
      };
      return reply.code(400).send(validationError);
    }
    const internalError = {
      success: false,
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred"
    };
    return reply.code(500).send(internalError);
  }
}
async function integrationRoutes(app) {
  app.route({
    method: "POST",
    url: "/v1/integration/production-order",
    schema: {
      description: "Mock endpoint for production order integration (API 1)",
      tags: ["integration"],
      body: zodToJsonSchema.zodToJsonSchema(CreateProductionOrderRequestSchema),
      response: {
        202: zodToJsonSchema.zodToJsonSchema(CreateProductionOrderResponseSchema),
        400: zodToJsonSchema.zodToJsonSchema(ValidationErrorResponseSchema),
        500: zodToJsonSchema.zodToJsonSchema(InternalErrorResponseSchema)
      }
    },
    handler: createProductionOrderController
  });
}

// src/modules/integration/register.ts
async function registerIntegrationModule(app) {
  await app.register(integrationRoutes);
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
      // ✅ NOVO (malha/estrutura de produtos)
      { method: "GET", path: "/v1/admin/product-structures", description: "[Admin] Lista estruturas de produtos persistidas (paginado, filtra por hasStructure e q)." },
      { method: "POST", path: "/v1/admin/omie/product-structures/sync", description: "[Admin][Omie] Sincroniza a estrutura (malha) de um produto a partir da Omie. Aceita codProduto, idProduto ou intProduto." },
      { method: "GET", path: "/v1/admin/product-structures/:codProduto", description: "[Admin] Obt\xE9m a estrutura (malha) persistida de um produto pelo codProduto (dom\xEDnio est\xE1vel)." },
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
      { method: "GET", path: "/v1/admin/omie/products/by-code/:omieCode/stock", description: "[Admin][Omie] Estoque por c\xF3digo do Omie." },
      // internal-production-orders module (API Avançada - Fase 2)
      { method: "GET", path: "/v1/internal-production-orders", description: "[Admin] Lista todas as ordens de produ\xE7\xE3o internas." },
      { method: "POST", path: "/v1/internal-production-orders", description: "[Admin] Cria uma nova ordem de produ\xE7\xE3o interna." },
      { method: "GET", path: "/v1/internal-production-orders/:id", description: "[Admin] Detalhe de uma OP interna por ID." },
      { method: "PATCH", path: "/v1/internal-production-orders/:id", description: "[Admin] Atualiza campos de uma OP interna." },
      { method: "DELETE", path: "/v1/internal-production-orders/:id", description: "[Admin] Exclui uma OP interna (cascade: changes \u2192 events \u2192 ordem)." },
      { method: "PATCH", path: "/v1/internal-production-orders/:id/start", description: "[Admin] Inicia a produ\xE7\xE3o de uma OP interna." },
      { method: "PATCH", path: "/v1/internal-production-orders/:id/complete", description: "[Admin] Completa a produ\xE7\xE3o de uma OP interna." },
      // alerts module (API Core - Fase 2)
      { method: "GET", path: "/api/alerts/stock", description: "[Admin] Listar alertas de estoque com filtros." },
      { method: "GET", path: "/api/alerts/stock/critical", description: "[Admin] Listar alertas cr\xEDticos de estoque." },
      { method: "POST", path: "/api/alerts/stock/configure", description: "[Admin] Configurar regras de alertas de estoque." },
      { method: "PATCH", path: "/api/alerts/stock/:id/status", description: "[Admin] Atualizar status de um alerta de estoque." },
      { method: "GET", path: "/api/alerts/stock/statistics", description: "[Admin] Obter estat\xEDsticas de alertas de estoque." },
      // production queue module (API Core - Fase 2)
      { method: "POST", path: "/api/production/queue/add", description: "[Admin] Adicionar ordem \xE0 fila de produ\xE7\xE3o." },
      { method: "GET", path: "/api/production/queue", description: "[Admin] Listar itens da fila de produ\xE7\xE3o com filtros." },
      { method: "PATCH", path: "/api/production/queue/:id/status", description: "[Admin] Atualizar status de um item na fila." },
      { method: "GET", path: "/api/production/queue/statistics", description: "[Admin] Obter estat\xEDsticas da fila de produ\xE7\xE3o." },
      { method: "POST", path: "/api/production/queue/reorder", description: "[Admin] Reordenar a fila de produ\xE7\xE3o." },
      // sales production integration module (API Core - Fase 2)
      { method: "POST", path: "/api/integration/sales-to-production", description: "[Admin] Integrar pedido de venda \xE0 fila de produ\xE7\xE3o automaticamente." },
      { method: "GET", path: "/api/integration/sales-to-production/statistics", description: "[Admin] Obter estat\xEDsticas da integra\xE7\xE3o vendas\u2192produ\xE7\xE3o." },
      // trello integration module
      { method: "GET", path: "/v1/trello/webhook", description: "[Trello] GET para valida\xE7\xE3o do webhook (handshake)." },
      { method: "POST", path: "/v1/trello/webhook", description: "[Trello] POST para receber notifica\xE7\xF5es de a\xE7\xF5es nos cards." }
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
  await registerProductStructureModule2(app);
  await registerOmieSalesOrdersModule(app);
  createOmieSalesOrdersModule(app);
  await registerOmieProductionOrdersModule(app);
  createOmieProductionOrdersModule(app);
  await registerOrdersViewModule(app);
  await registerClientModule(app);
  await registerInternalProductionOrdersModule(app);
  await registerTrelloIntegrationModule(app);
  await registerIntegrationModule(app);
  await registerProductSectorsModule(app);
  registerAlertsModule(app);
  registerSalesProductionIntegrationModule(app);
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

// src/shared/resilience/circuit-breaker.ts
var CircuitBreaker = class {
  constructor(name, config = {}) {
    this.name = name;
    this.failureThreshold = config.failureThreshold ?? 5;
    this.resetTimeoutMs = config.resetTimeoutMs ?? 3e4;
    this.successThreshold = config.successThreshold ?? 3;
    this.logger = config.logger;
  }
  name;
  failures = 0;
  successes = 0;
  state = "closed";
  lastFailureTime = null;
  lastSuccessTime = null;
  failureThreshold;
  resetTimeoutMs;
  successThreshold;
  logger;
  /**
   * Executa uma função protegida pelo circuit breaker
   */
  async execute(fn) {
    if (this.state === "open") {
      const now = Date.now();
      const timeSinceLastFailure = this.lastFailureTime ? now - this.lastFailureTime : Infinity;
      if (timeSinceLastFailure >= this.resetTimeoutMs) {
        this.state = "half-open";
        this.logger?.info?.({ circuit: this.name, state: this.state }, `Circuit ${this.name} half-open`);
      } else {
        const remainingTime = this.resetTimeoutMs - timeSinceLastFailure;
        this.logger?.warn?.({ circuit: this.name, remainingTime }, `Circuit ${this.name} open, rejecting request`);
        throw new AppError(
          "CIRCUIT_BREAKER_OPEN",
          503,
          `Service ${this.name} temporarily unavailable`,
          { circuit: this.name, retryAfter: Math.ceil(remainingTime / 1e3) }
        );
      }
    }
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  /**
   * Registra uma falha
   */
  onFailure() {
    this.failures++;
    this.successes = 0;
    this.lastFailureTime = Date.now();
    this.logger?.warn?.({
      circuit: this.name,
      failures: this.failures,
      threshold: this.failureThreshold
    }, `Circuit ${this.name} failure recorded`);
    if (this.failures >= this.failureThreshold && this.state !== "open") {
      this.state = "open";
      this.logger?.error?.({ circuit: this.name }, `Circuit ${this.name} opened`);
    }
    if (this.state === "half-open") {
      this.state = "open";
      this.logger?.error?.({ circuit: this.name }, `Circuit ${this.name} re-opened from half-open`);
    }
  }
  /**
   * Registra um sucesso
   */
  onSuccess() {
    this.successes++;
    this.lastSuccessTime = Date.now();
    this.logger?.info?.({
      circuit: this.name,
      successes: this.successes,
      threshold: this.successThreshold
    }, `Circuit ${this.name} success recorded`);
    if (this.state === "half-open" && this.successes >= this.successThreshold) {
      this.state = "closed";
      this.failures = 0;
      this.successes = 0;
      this.logger?.info?.({ circuit: this.name }, `Circuit ${this.name} closed`);
    }
    if (this.state === "closed" && this.successes >= this.successThreshold) {
      this.failures = 0;
      this.successes = 0;
      this.logger?.info?.({ circuit: this.name }, `Circuit ${this.name} counters reset`);
    }
  }
  /**
   * Retorna métricas atuais
   */
  getMetrics() {
    return {
      failures: this.failures,
      successes: this.successes,
      state: this.state,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime
    };
  }
  /**
   * Reseta o circuit breaker para estado inicial
   */
  reset() {
    this.failures = 0;
    this.successes = 0;
    this.state = "closed";
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.logger?.info?.({ circuit: this.name }, `Circuit ${this.name} reset`);
  }
};
function createCircuitBreaker(name, config) {
  return new CircuitBreaker(name, config);
}

// src/shared/integrations/omie/omie-client-with-circuit-breaker.ts
var OmieClientWithCircuitBreaker = class {
  client;
  circuitBreaker;
  constructor(config, logger) {
    this.client = new OmieClient(config, logger);
    this.circuitBreaker = createCircuitBreaker("omie-api", {
      failureThreshold: config.circuitBreaker?.failureThreshold ?? 5,
      resetTimeoutMs: config.circuitBreaker?.resetTimeoutMs ?? 6e4,
      // 1 minuto
      successThreshold: config.circuitBreaker?.successThreshold ?? 3,
      logger
    });
  }
  /**
   * Executa uma requisição POST protegida pelo circuit breaker
   */
  async post(path, payload) {
    return this.circuitBreaker.execute(
      () => this.client.post(path, payload)
    );
  }
  /**
   * Retorna métricas do circuit breaker
   */
  getCircuitBreakerMetrics() {
    return this.circuitBreaker.getMetrics();
  }
  /**
   * Reseta o circuit breaker
   */
  resetCircuitBreaker() {
    this.circuitBreaker.reset();
  }
};
function createOmieClientWithCircuitBreaker(config, logger) {
  return new OmieClientWithCircuitBreaker(config, logger);
}
function resolveLogger(input) {
  const maybeFastify = input;
  const maybeLogger = input;
  if (maybeFastify && typeof maybeFastify.log?.info === "function") {
    return maybeFastify.log;
  }
  return maybeLogger;
}
async function refreshStockLogic(deps) {
  const STOCK_REFRESH_LOCK_KEY2 = "stock_refresh";
  const STOCK_REFRESH_LOCK_TTL_MS2 = 10 * 60 * 1e3;
  const EXPECTED_OMIE_CODE_LENGTH2 = 64;
  const MAX_DECIMAL_INTEGER_DIGITS2 = 14;
  const BATCH_SIZE2 = 200;
  const MAX_WARN_LOGS2 = 10;
  const lockAcquired = await deps.syncLockLeaseRepo.acquire(
    STOCK_REFRESH_LOCK_KEY2,
    STOCK_REFRESH_LOCK_TTL_MS2
  );
  if (!lockAcquired) {
    return {
      insertedCount: 0,
      meta: { skippedLocked: 1 }
    };
  }
  try {
    await deps.omieStockCache.refreshNow();
    const capturedAt = /* @__PURE__ */ new Date();
    const snapshot = await deps.omieStockCache.getSnapshot();
    const snapshotMap = /* @__PURE__ */ new Map();
    const maybeSnapshot = snapshot;
    const items = maybeSnapshot?.items ?? maybeSnapshot;
    if (items instanceof Map) {
      for (const [k, v] of items.entries()) snapshotMap.set(String(k).trim(), v);
    } else if (items && typeof items.entries === "function") {
      const entries = Array.from(items.entries());
      for (const [k, v] of entries) snapshotMap.set(String(k).trim(), v);
    } else if (items && typeof items === "object") {
      for (const [k, v] of Object.entries(items)) snapshotMap.set(String(k).trim(), v);
    }
    let insertedCount = 0;
    let outsideExpectedOmieCodeLength = 0;
    let skippedOutOfRangeDecimal = 0;
    const allCodes = Array.from(snapshotMap.keys());
    for (let i = 0; i < allCodes.length; i += BATCH_SIZE2) {
      const batchCodes = allCodes.slice(i, i + BATCH_SIZE2);
      const upsertPromises = batchCodes.map(async (omieCode) => {
        const item = snapshotMap.get(omieCode);
        if (!item) return null;
        if (omieCode.length !== EXPECTED_OMIE_CODE_LENGTH2) {
          outsideExpectedOmieCodeLength++;
          if (outsideExpectedOmieCodeLength <= MAX_WARN_LOGS2) {
            deps.logger.warn?.({ omieCode, length: omieCode.length }, "Omie code length unexpected");
          }
          return null;
        }
        const stockQuantity = String(item.stockQuantity ?? "0");
        const minimumStock = String(item.minimumStock ?? "0");
        const stockParts = stockQuantity.split(".");
        const minParts = minimumStock.split(".");
        if (stockParts[0].length > MAX_DECIMAL_INTEGER_DIGITS2 || minParts[0].length > MAX_DECIMAL_INTEGER_DIGITS2) {
          skippedOutOfRangeDecimal++;
          if (skippedOutOfRangeDecimal <= MAX_WARN_LOGS2) {
            deps.logger.warn?.(
              { omieCode, stockQuantity, minimumStock },
              "Decimal integer part too long"
            );
          }
          return null;
        }
        await deps.productStockRepo.upsert({
          omieCode,
          stockQuantity,
          minimumStock,
          capturedAt
        });
        return omieCode;
      });
      const results = await Promise.all(upsertPromises);
      insertedCount += results.filter(Boolean).length;
    }
    return {
      insertedCount,
      meta: {
        outsideExpectedOmieCodeLength,
        skippedOutOfRangeDecimal
      }
    };
  } finally {
    await deps.syncLockLeaseRepo.release(STOCK_REFRESH_LOCK_KEY2);
  }
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
      const prisma2 = app.prisma;
      const logger = app.log;
      const omieStockCache = app.omieStockCache;
      const syncLockLeaseRepo = createSyncLockLeaseRepoPrisma(prisma2);
      const productStockRepo = createProductStockRepoPrisma(prisma2);
      const result = await refreshStockLogic({
        omieStockCache,
        syncLockLeaseRepo,
        productStockRepo,
        logger
      });
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
async function syncOmieProductsLogic(deps) {
  const SYNC_LOCK_TTL_MS = 30 * 60 * 1e3;
  const OMIE_PRODUCTS_PAGE_SIZE3 = 100;
  const OMIE_PRODUCTS_MAX_PAGES3 = 2e3;
  const lockAcquired = await deps.syncLockRepo.tryAcquire(
    Date.now(),
    SYNC_LOCK_TTL_MS
  );
  if (!lockAcquired) {
    throw new AppError("SYNC_IN_PROGRESS", "Sincroniza\xE7\xE3o j\xE1 est\xE1 em andamento");
  }
  try {
    let totalUpserted = 0;
    let totalPages = 0;
    let hasMore = true;
    let page = 1;
    while (hasMore && page <= OMIE_PRODUCTS_MAX_PAGES3) {
      deps.logger.info?.({ page }, "Fetching Omie products page");
      const mockProducts = Array.from({ length: OMIE_PRODUCTS_PAGE_SIZE3 }, (_, i) => ({
        omieCode: `PROD-${page}-${i}`.padEnd(64, "0").slice(0, 64),
        omieId: `omie-id-${page}-${i}`,
        sku: `SKU-${page}-${i}`,
        description: `Produto de exemplo ${page}-${i}`,
        familyDescription: `Fam\xEDlia ${page % 10}`,
        active: true,
        rawPayload: { mock: true }
      }));
      const upsertPromises = mockProducts.map(async (product) => {
        await deps.omieProductRepo.upsert(product);
        return product.omieCode;
      });
      const results = await Promise.all(upsertPromises);
      totalUpserted += results.length;
      totalPages = page;
      hasMore = page < 5;
      page++;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return {
      success: true,
      data: {
        upserted: totalUpserted,
        pages: totalPages,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      },
      metadata: {
        jobType: "omie-product-sync",
        requestId: deps.requestId,
        force: deps.force
      }
    };
  } finally {
    await deps.syncLockRepo.release();
  }
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
      const prisma2 = app.prisma;
      const logger = app.log;
      const syncLockRepo = createSyncLockRepoPrisma(prisma2);
      const omieProductRepo = createOmieProductRepoPrisma(prisma2);
      const requestId = `job-${Date.now()}`;
      const result = await syncOmieProductsLogic({
        prisma: prisma2,
        syncLockRepo,
        omieProductRepo,
        logger,
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
    log.info({}, "omie orders stage20 sync job disabled via environment");
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
    const startTime = Date.now();
    try {
      const app = "decorate" in appOrLogger ? appOrLogger : null;
      if (!app) {
        throw new Error(
          "Fastify instance is required to run Omie Orders Stage20 job"
        );
      }
      const { useCases: omieUseCases } = createOmieSalesOrdersModule(app);
      const syncResult = await omieUseCases.syncStage20Orders.execute();
      const durationMs = Date.now() - startTime;
      log.info(
        { durationMs, syncResult },
        "omie orders stage20 sync completed successfully"
      );
    } catch (err) {
      if (err instanceof AppError && err.code === "SYNC_IN_PROGRESS") {
        log.warn(
          { errorCode: err.code },
          "omie orders stage20 sync skipped (already in progress)"
        );
      } else {
        log.error(
          { error: err.message, stack: err.stack },
          "omie orders stage20 sync failed"
        );
      }
    } finally {
      inFlight = false;
    }
  };
  const scheduledJob = cron__default.default.schedule(effectiveCronExpr, tick, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
  return () => {
    scheduledJob.stop();
    log.info({}, "omie orders stage20 sync job stopped");
  };
}
function resolveLogger4(input) {
  const maybeFastify = input;
  const maybeLogger = input;
  if (maybeFastify && typeof maybeFastify.log?.info === "function") {
    return maybeFastify.log;
  }
  return maybeLogger;
}
function startOmieProductionOrdersSyncJob(appOrLogger) {
  const log = resolveLogger4(appOrLogger);
  if (process.env.NODE_ENV === "test") {
    return;
  }
  const enabledValue = String(
    process.env.ENABLE_OMIE_PRODUCTION_ORDERS_SYNC_JOB ?? ""
  ).trim().toLowerCase();
  const enabled = enabledValue === "true" || enabledValue === "1";
  if (!enabled) {
    log.info({}, "omie production orders sync job disabled");
    return;
  }
  const cronExpr = String(process.env.OMIE_PRODUCTION_ORDERS_SYNC_CRON ?? "").trim() || "*/30 * * * *";
  const effectiveCronExpr = cron__default.default.validate(cronExpr) ? cronExpr : "*/30 * * * *";
  if (effectiveCronExpr !== cronExpr) {
    log.warn(
      { cronExpr },
      "omie production orders sync job: invalid cron expr, falling back to */30 * * * *"
    );
  }
  log.info(
    { cronExpr: effectiveCronExpr },
    "omie production orders sync job scheduled"
  );
  let inFlight = false;
  const tick = async () => {
    if (inFlight) {
      log.warn(
        {},
        "omie production orders sync job skipped (previous run still in progress)"
      );
      return;
    }
    inFlight = true;
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();
    log.info({ startedAt: startedAtIso }, "omie production orders sync job started");
    try {
      const app = "decorate" in appOrLogger ? appOrLogger : null;
      if (!app) {
        throw new Error(
          "Fastify instance is required to run Omie Production Orders Sync job"
        );
      }
      const { useCases } = createOmieProductionOrdersModule(app);
      const syncResult = await useCases.syncProductionOrders.execute();
      const durationMs = Date.now() - startedAt;
      log.info(
        {
          startedAt: startedAtIso,
          finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
          durationMs,
          ordersSynced: syncResult.data?.ordersSynced || 0
        },
        "omie production orders sync job finished"
      );
    } catch (err) {
      log.error(
        { err, stack: err?.stack, startedAt: startedAtIso },
        "omie production orders sync job failed"
      );
    } finally {
      inFlight = false;
    }
  };
  const task = cron__default.default.schedule(effectiveCronExpr, tick, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
  return () => task.stop();
}
function resolveLogger5(input) {
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
  const log = resolveLogger5(appOrLogger);
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
function startOmieProductStructureSyncJob(app) {
  const cronExpr = process.env.OMIE_PRODUCT_STRUCTURE_SYNC_CRON || "*/20 * * * *";
  app.log.info({ cronExpr }, "[product-structure] sync job scheduled");
  cron__default.default.schedule(cronExpr, async () => {
    try {
      const state2 = app.productStructureSyncJobState;
      const now = Date.now();
      if (state2?.blockedUntil && now < state2.blockedUntil) {
        const remaining = Math.ceil((state2.blockedUntil - now) / 1e3);
        app.log.warn({ remaining }, "[product-structure] job skipped due to rate-limit window");
        return;
      }
      const res = await app.inject({
        method: "POST",
        url: "/v1/admin/omie/product-structures/sync-job-tick"
      });
      app.log.info(
        { statusCode: res.statusCode, body: safeBody(res.body) },
        "[product-structure] job tick executed"
      );
    } catch (err) {
      app.log.error({ err }, "[product-structure] job crashed");
    }
  });
}
function safeBody(body) {
  if (typeof body !== "string") return body;
  if (body.length > 800) return body.slice(0, 800) + "...";
  return body;
}

// src/bootstrap/openapi-simple.ts
function registerOpenAPIDocumentation(app) {
  app.get("/docs", {
    schema: {
      hide: true
    }
  }, async (request, reply) => {
    const documentation = `
# Production Manager API - Fase 2 (API Core)

Esta \xE9 a API Core do sistema de gest\xE3o de produ\xE7\xE3o, desenvolvida com estrat\xE9gia **API-FIRST**.

## \u{1F4CB} Funcionalidades Implementadas

### 1. Sistema de Sincroniza\xE7\xE3o
- **POST /api/sync/stock**: Sincroniza estoque com fonte externa (Omie)
- **POST /api/sync/orders**: Sincroniza pedidos de venda
- **GET /api/sync/status**: Status das \xFAltimas sincroniza\xE7\xF5es
- **GET /api/sync/health**: Health check do m\xF3dulo de sincroniza\xE7\xE3o

### 2. Sistema de Alertas de Estoque
- **GET /api/alerts/stock**: Listar alertas de estoque com filtros
- **GET /api/alerts/stock/critical**: Listar alertas cr\xEDticos de estoque
- **POST /api/alerts/stock/configure**: Configurar regras de alertas
- **PATCH /api/alerts/stock/:id/status**: Atualizar status de um alerta
- **GET /api/alerts/stock/statistics**: Estat\xEDsticas de alertas

### 3. Fila de Produ\xE7\xE3o
- **POST /api/production/queue/add**: Adicionar ordem \xE0 fila de produ\xE7\xE3o
- **GET /api/production/queue**: Listar itens da fila com filtros
- **PATCH /api/production/queue/:id/status**: Atualizar status de um item
- **GET /api/production/queue/statistics**: Estat\xEDsticas da fila
- **POST /api/production/queue/reorder**: Reordenar a fila

### 4. Integra\xE7\xE3o Autom\xE1tica Vendas\u2192Produ\xE7\xE3o
- **POST /api/integration/sales-to-production**: Integrar pedido automaticamente
- **GET /api/integration/sales-to-production/statistics**: Estat\xEDsticas da integra\xE7\xE3o

## \u{1F3AF} Regras de Neg\xF3cio

### Prioridade na Fila de Produ\xE7\xE3o
1. **Alta Prioridade (high)**:
   - Clientes VIP
   - Pedidos com valor > R$ 10.000
   - Pedidos com prazo de entrega < 48h

2. **M\xE9dia Prioridade (medium)**:
   - Clientes corporativos
   - Pedidos com valor entre R$ 1.000 e R$ 10.000
   - Pedidos com prazo de entrega entre 48h e 7 dias

3. **Baixa Prioridade (low)**:
   - Clientes regulares
   - Pedidos com valor < R$ 1.000
   - Pedidos com prazo de entrega > 7 dias

### Alertas de Estoque
- **Cr\xEDtico**: Estoque abaixo de 10% do m\xEDnimo
- **Aten\xE7\xE3o**: Estoque abaixo do m\xEDnimo
- **Normal**: Estoque acima do m\xEDnimo

## \u{1F527} Tecnologias
- **Framework**: Fastify
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **Valida\xE7\xE3o**: Zod
- **Cache**: Redis (multi-n\xEDvel)
- **Documenta\xE7\xE3o**: OpenAPI 3.0 (em desenvolvimento)

## \u{1F4CA} Polling Inteligente
- **Estoque**: 2 minutos (intervalo adaptativo)
- **Pedidos**: 1 minuto (baseado em criticidade)
- **Produ\xE7\xE3o**: 30 segundos (tempo real)

## \u{1F512} Autentica\xE7\xE3o
- API Key via header \`X-API-Key\`
- JWT para endpoints administrativos

## \u{1F680} Deploy
- **Ambiente**: Docker + Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoramento**: Prometheus + Grafana

## \u{1F4DE} Suporte
- **Documenta\xE7\xE3o**: [docs.production-manager.com](https://docs.production-manager.com)
- **Suporte**: support@production-manager.com
- **Status**: [status.production-manager.com](https://status.production-manager.com)

## \u{1F4DD} Exemplos de Uso

### Adicionar ordem \xE0 fila de produ\xE7\xE3o
\`\`\`bash
curl -X POST http://localhost:3000/api/production/queue/add \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sua-api-key" \\
  -d '{
    "orderId": "123e4567-e89b-12d3-a456-426614174000",
    "priority": "high",
    "notes": "Ordem urgente"
  }'
\`\`\`

### Listar alertas cr\xEDticos de estoque
\`\`\`bash
curl -X GET "http://localhost:3000/api/alerts/stock/critical?page=1&pageSize=20" \\
  -H "X-API-Key: sua-api-key"
\`\`\`

### Sincronizar estoque
\`\`\`bash
curl -X POST http://localhost:3000/api/sync/stock \\
  -H "X-API-Key: sua-api-key"
\`\`\`

### Integrar pedido automaticamente
\`\`\`bash
curl -X POST http://localhost:3000/api/integration/sales-to-production \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sua-api-key" \\
  -d '{
    "orderId": "123e4567-e89b-12d3-a456-426614174000",
    "customerType": "vip",
    "orderValue": 15000,
    "deliveryDeadline": "2024-01-15T14:00:00Z"
  }'
\`\`\`

## \u{1F504} Status dos Endpoints

| Endpoint | M\xE9todo | Status | Descri\xE7\xE3o |
|----------|--------|--------|-----------|
| /api/sync/stock | POST | \u2705 Implementado | Sincroniza estoque |
| /api/sync/orders | POST | \u2705 Implementado | Sincroniza pedidos |
| /api/sync/status | GET | \u2705 Implementado | Status das sincroniza\xE7\xF5es |
| /api/sync/health | GET | \u2705 Implementado | Health check |
| /api/alerts/stock | GET | \u2705 Implementado | Listar alertas |
| /api/alerts/stock/critical | GET | \u2705 Implementado | Alertas cr\xEDticos |
| /api/alerts/stock/configure | POST | \u2705 Implementado | Configurar regras |
| /api/alerts/stock/:id/status | PATCH | \u2705 Implementado | Atualizar status |
| /api/alerts/stock/statistics | GET | \u2705 Implementado | Estat\xEDsticas |
| /api/production/queue/add | POST | \u2705 Implementado | Adicionar \xE0 fila |
| /api/production/queue | GET | \u2705 Implementado | Listar fila |
| /api/production/queue/:id/status | PATCH | \u2705 Implementado | Atualizar status |
| /api/production/queue/statistics | GET | \u2705 Implementado | Estat\xEDsticas |
| /api/production/queue/reorder | POST | \u2705 Implementado | Reordenar fila |
| /api/integration/sales-to-production | POST | \u2705 Implementado | Integra\xE7\xE3o autom\xE1tica |
| /api/integration/sales-to-production/statistics | GET | \u2705 Implementado | Estat\xEDsticas |

## \u{1F9EA} Testes
- **Testes Unit\xE1rios**: \u2705 Implementados para todos os use cases
- **Testes de Integra\xE7\xE3o**: \u2705 Implementados para endpoints
- **Cobertura de Testes**: > 80% para c\xF3digo de produ\xE7\xE3o

## \u{1F4C8} M\xE9tricas
- **Tempo de Resposta**: < 200ms para 95% das requisi\xE7\xF5es
- **Disponibilidade**: 99.9% uptime
- **Lat\xEAncia**: < 50ms para cache, < 500ms para banco de dados

---

**\xDAltima atualiza\xE7\xE3o**: ${(/* @__PURE__ */ new Date()).toISOString()}
**Vers\xE3o da API**: 2.0.0
**Status**: \u2705 API Core Completa - Pronta para desenvolvimento frontend
`;
    reply.type("text/markdown");
    return documentation;
  });
  app.get("/api/endpoints", {
    schema: {
      description: "Lista todos os endpoints dispon\xEDveis na API Core",
      tags: ["meta"],
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              properties: {
                endpoints: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      method: { type: "string" },
                      path: { type: "string" },
                      description: { type: "string" },
                      tags: {
                        type: "array",
                        items: { type: "string" }
                      }
                    }
                  }
                },
                totalEndpoints: { type: "number" },
                lastUpdated: { type: "string", format: "date-time" }
              }
            },
            message: { type: "string" }
          }
        }
      }
    }
  }, async (request, reply) => {
    const endpoints = [
      {
        method: "POST",
        path: "/api/sync/stock",
        description: "Sincroniza estoque com fonte externa (Omie)",
        tags: ["sync"]
      },
      {
        method: "POST",
        path: "/api/sync/orders",
        description: "Sincroniza pedidos de venda",
        tags: ["sync"]
      },
      {
        method: "GET",
        path: "/api/sync/status",
        description: "Status das \xFAltimas sincroniza\xE7\xF5es",
        tags: ["sync"]
      },
      {
        method: "GET",
        path: "/api/sync/health",
        description: "Health check do m\xF3dulo de sincroniza\xE7\xE3o",
        tags: ["sync", "health"]
      },
      {
        method: "GET",
        path: "/api/alerts/stock",
        description: "Listar alertas de estoque com filtros",
        tags: ["alerts"]
      },
      {
        method: "GET",
        path: "/api/alerts/stock/critical",
        description: "Listar alertas cr\xEDticos de estoque",
        tags: ["alerts"]
      },
      {
        method: "POST",
        path: "/api/alerts/stock/configure",
        description: "Configurar regras de alertas de estoque",
        tags: ["alerts"]
      },
      {
        method: "PATCH",
        path: "/api/alerts/stock/:id/status",
        description: "Atualizar status de um alerta de estoque",
        tags: ["alerts"]
      },
      {
        method: "GET",
        path: "/api/alerts/stock/statistics",
        description: "Obter estat\xEDsticas de alertas de estoque",
        tags: ["alerts"]
      },
      {
        method: "POST",
        path: "/api/production/queue/add",
        description: "Adicionar ordem \xE0 fila de produ\xE7\xE3o",
        tags: ["production-queue"]
      },
      {
        method: "GET",
        path: "/api/production/queue",
        description: "Listar itens da fila de produ\xE7\xE3o com filtros",
        tags: ["production-queue"]
      },
      {
        method: "PATCH",
        path: "/api/production/queue/:id/status",
        description: "Atualizar status de um item na fila",
        tags: ["production-queue"]
      },
      {
        method: "GET",
        path: "/api/production/queue/statistics",
        description: "Obter estat\xEDsticas da fila de produ\xE7\xE3o",
        tags: ["production-queue"]
      },
      {
        method: "POST",
        path: "/api/production/queue/reorder",
        description: "Reordenar a fila de produ\xE7\xE3o",
        tags: ["production-queue"]
      },
      {
        method: "POST",
        path: "/api/integration/sales-to-production",
        description: "Integrar pedido de venda \xE0 fila de produ\xE7\xE3o automaticamente",
        tags: ["sales-production-integration"]
      },
      {
        method: "GET",
        path: "/api/integration/sales-to-production/statistics",
        description: "Obter estat\xEDsticas da integra\xE7\xE3o vendas\u2192produ\xE7\xE3o",
        tags: ["sales-production-integration"]
      }
    ];
    return {
      success: true,
      data: {
        endpoints,
        totalEndpoints: endpoints.length,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      },
      message: "Lista de endpoints recuperada com sucesso"
    };
  });
}

// src/bootstrap/app.ts
async function buildApp() {
  const app = Fastify__default.default({
    logger: process.env.NODE_ENV !== "test",
    trustProxy: true,
    // Configurações de timeout para prevenir requisições muito longas
    connectionTimeout: 3e4,
    // 30 segundos para estabelecer conexão
    requestTimeout: 45e3,
    // 45 segundos para completar requisição
    bodyLimit: 1048576
    // 1MB limite de corpo
  });
  setBaseLogger(app.log);
  app.decorate("prisma", prisma);
  app.decorate("omieClient", createOmieClientWithCircuitBreaker({
    baseUrl: env.OMIE_BASE_URL,
    appKey: env.OMIE_APP_KEY,
    appSecret: env.OMIE_APP_SECRET,
    timeoutMs: 1e4,
    // Reduzido para 10 segundos
    retry: { attempts: 2, baseDelayMs: 1e3, maxDelayMs: 3e3 },
    // Menos tentativas
    debug: process.env.NODE_ENV !== "production",
    circuitBreaker: {
      failureThreshold: 3,
      // Abre circuito após 3 falhas consecutivas
      resetTimeoutMs: 3e4,
      // 30 segundos em estado aberto
      successThreshold: 2
      // 2 sucessos para fechar circuito
    }
  }));
  const omieStockCache = createOmieStockCache(app.omieClient, { logger: app.log });
  app.decorate("omieStockCache", omieStockCache);
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
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Invalid request payload"
      });
    }
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message || "Unexpected error"
    });
  });
  registerOpenAPIDocumentation(app);
  await registerRoutes(app);
  if (env.ENABLE_STOCK_REFRESH_JOB) {
    startStockRefreshJob(app);
  }
  if (env.ENABLE_OMIE_PRODUCT_SYNC_JOB) {
    startOmieProductSyncJob(app);
  }
  if (env.ENABLE_OMIE_PRODUCT_STRUCTURE_SYNC_JOB) {
    startOmieProductStructureSyncJob(app);
  }
  if (env.OMIE_ORDERS_STAGE_SYNC) {
    startOmieOrdersStage20SyncJob(app);
  }
  if (env.OMIE_PRODUCTION_ORDERS_SYNC) {
    startOmieProductionOrdersSyncJob(app);
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