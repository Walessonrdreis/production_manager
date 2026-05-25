import type { FastifyInstance } from "fastify";
import { sendOk } from "@/shared/http/response";

// ---------------------------------------------------------------------------
// LEGACY (movidos para modules/legacy) — manter importado só se precisar.
// RECOMENDADO: comentar/desabilitar o registro (não precisa apagar imports agora).
// ---------------------------------------------------------------------------
import { registerClientModule } from "../modules/legacy/client/register";
import { createProductsModule } from "@/modules/legacy/products";
import { registerSectorsModule } from "@/modules/legacy/sectors";
import { registerProductSectorModule } from "@/modules/legacy/product-sector";
import { registerPlansModule } from "@/modules/legacy/plans";
import { createOmieSalesOrdersModule } from "@/modules/legacy/omie-sales-orders";
import { registerOmieSalesOrdersModule } from "@/modules/legacy/omie-sales-orders/register";
import { createOmieProductionOrdersModule } from "@/modules/legacy/omie-production-orders";
import { registerOmieProductionOrdersModule } from "@/modules/legacy/omie-production-orders/register";
import { registerOrdersEnrichedModule } from "@/modules/legacy/orders-enriched/register";
import { registerOrdersViewModule } from "@/modules/legacy/orders-view/register";
import { registerSyncModule } from "@/modules/legacy/sync/register";
import { registerAlertsModule } from "@/modules/legacy/alerts/register";
import { registerProductionQueueModule } from "@/modules/legacy/production-queue/register";
import { registerSalesProductionIntegrationModule } from "@/modules/legacy/sales-production-integration/register";
import { registerProductStructureModule } from "@/modules/legacy/product-structure/register";
import { registerInternalProductionOrdersModule } from "@/modules/legacy/internal-production-orders/register";
import { registerTrelloIntegrationModule } from "@/modules/legacy/trello-integration/register";
import { registerProductSectorsModule } from "@/modules/legacy/product-sectors";

// ---------------------------------------------------------------------------
// NOVO/FUTURO (integration)
// ---------------------------------------------------------------------------
import { registerIntegrationModule } from "@/modules/integration/register";
import { registerStockModule } from "@/modules/integration/stock/register-stock-module";
import { registerOrdersModule } from "@/modules/integration/orders/register-orders-module";

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
  await registerIntegrationModule(app);
  await registerStockModule(app);
  await registerOrdersModule(app);

  // ---------------------------------------------------------------------------
  // 🔕 LEGACY — DESATIVADO TEMPORARIAMENTE
  // (para não gerar sync indireto / REDUNDANT e não atrapalhar o desenvolvimento)
  // ---------------------------------------------------------------------------

  // await registerOrdersEnrichedModule(app);

  // await createProductsModule(app);
  // await registerSectorsModule(app);
  // await registerProductSectorModule(app);
  // await registerPlansModule(app);
  // await registerProductStructureModule(app);

   await registerOmieSalesOrdersModule(app);
  // const omieSalesOrders = createOmieSalesOrdersModule(app);

  // await registerOmieProductionOrdersModule(app);
  // const omieProductionOrders = createOmieProductionOrdersModule(app);

  // await registerOrdersViewModule(app);

   await registerClientModule(app);

  // await registerInternalProductionOrdersModule(app);

  // await registerTrelloIntegrationModule(app);

  // await registerProductSectorsModule(app);

  // registerAlertsModule(app);

  // registerSalesProductionIntegrationModule(app);

  // sync / production queue já estavam instáveis antes
  // registerSyncModule(app);
  // registerProductionQueueModule(app);

  // void omieSalesOrders;
  // void omieProductionOrders;
}