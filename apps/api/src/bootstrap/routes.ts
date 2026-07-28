// apps/api/src/bootstrap/routes.ts
import type { FastifyInstance } from "fastify";
import { sendOk } from "@/shared/http/response";

import { createProductionOrderIntegration } from "@/modules/integration/production-orders";
import { createProductStructureIntegration } from "@/modules/integration/product-structure";
import { createProductCatalogIntegration } from "@/modules/integration/product-catalog";
import { createSalesOrderSyncIntegration } from "@/modules/integration/sales-order-sync";
import { createCustomerSyncIntegration } from "@/modules/integration/customer-sync";

import { createProductStockFetchIntegration } from "@/modules/integration/product-stock-fetch";
import { createProductManagerIntegration } from "@/modules/integration/product-manager";

export async function registerRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // meta routes (mantém)
  // ---------------------------------------------------------------------------
  app.get("/", async (request, reply) => {
    return sendOk(request, reply, { name: "Production Manager API", status: "ok" }, {});
  });

  app.get("/health", async (request, reply) => {
    return sendOk(request, reply, { ok: true }, {});
  });

  // ---------------------------------------------------------------------------
  // register modules
  // ---------------------------------------------------------------------------

  // ✅ NOVO/FUTURO — manter ligados
  await createProductStockFetchIntegration().register(app);
  // ✅ NOVO módulo product-manager (comandos de criar/atualizar/inativar)
  await createProductManagerIntegration().register(app);
  await createProductionOrderIntegration().register(app);
  await createProductStructureIntegration().register(app);

  // ✅ NOVO módulo product-catalog
  await createProductCatalogIntegration().register(app);


  // ✅ NOVO módulo de pedidos de venda
  await createSalesOrderSyncIntegration().register(app);
  // ✅ NOVO módulo customer-sync
  await createCustomerSyncIntegration().register(app);
}