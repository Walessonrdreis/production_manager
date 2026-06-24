// apps/api/src/bootstrap/routes.ts
import type { FastifyInstance } from "fastify";
import { sendOk } from "@/shared/http/response";

// ---------------------------------------------------------------------------
// LEGACY — ainda ativos (pendentes de migração)
// ---------------------------------------------------------------------------
import { registerClientModule } from "../modules/legacy/client/register";
import { createProductsModule } from "@/modules/legacy/products";
import { createOmieSalesOrdersModule } from "@/modules/legacy/omie-sales-orders";
import { registerOmieSalesOrdersModule } from "@/modules/legacy/omie-sales-orders/register";
import { createOmieProductionOrdersModule } from "@/modules/legacy/omie-production-orders";
import { registerOmieProductionOrdersModule } from "@/modules/legacy/omie-production-orders/register";
import { registerSalesProductionIntegrationModule } from "@/modules/legacy/sales-production-integration/register";
import { registerProductStructureModule } from "@/modules/legacy/product-structure/register";

import { createProductionOrderIntegration } from "@/modules/integration/production-orders";
import { createProductStructureIntegration } from "@/modules/integration/product-structure";
import { createProductCatalogIntegration } from "@/modules/integration/product-catalog";
import { createSalesOrderSyncIntegration } from "@/modules/integration/sales-order-sync";
import { createCustomerSyncIntegration } from "@/modules/integration/customer-sync";

// ---------------------------------------------------------------------------
// NOVO/FUTURO (integration)
// ---------------------------------------------------------------------------
import { createProductStockFetchIntegration } from "@/modules/integration/product-stock-fetch";
import { createProductManagerIntegration } from "@/modules/integration/product-manager";
import { registerOrdersModule } from "@/modules/legacy/orders/register-orders-module";

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
  await registerOrdersModule(app);
  await createProductionOrderIntegration().register(app);
  await createProductStructureIntegration().register(app);

  // ✅ NOVO módulo product-catalog
  await createProductCatalogIntegration().register(app);


  // ✅ NOVO módulo de pedidos de venda
  await createSalesOrderSyncIntegration().register(app);
  // ✅ NOVO módulo customer-sync
  await createCustomerSyncIntegration().register(app);
  // ---------------------------------------------------------------------------
  // 🔕 LEGACY — DESATIVADO TEMPORARIAMENTE
  // ---------------------------------------------------------------------------

  // await registerOrdersEnrichedModule(app);

  await createProductsModule(app);
  // await registerSectorsModule(app);
  // await registerProductSectorModule(app);
  // await registerPlansModule(app);
  await registerProductStructureModule(app);

  await registerOmieSalesOrdersModule(app);
  const omieSalesOrders = createOmieSalesOrdersModule(app);

  await registerOmieProductionOrdersModule(app);
  const omieProductionOrders = createOmieProductionOrdersModule(app);

  // await registerOrdersViewModule(app);

  await registerClientModule(app);

  // await registerInternalProductionOrdersModule(app);

  // await registerTrelloIntegrationModule(app);

  // await registerProductSectorsModule(app);

  // registerAlertsModule(app);

  registerSalesProductionIntegrationModule(app);

  // sync / production queue já estavam instáveis antes
  // registerSyncModule(app);
  // registerProductionQueueModule(app);

  void omieSalesOrders;
  void omieProductionOrders;
}