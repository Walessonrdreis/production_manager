import { createJobLock } from "@/shared/utils/job-lock";

// sync orders (stage 20)
import { createListOmieOrdersPageUseCase } from "./application/use-cases/list-omie-orders-page.usecase";
import { createSyncStage20OrdersUseCase } from "./application/use-cases/sync-stage20-orders.usecase";
import { createOmieOrdersRepoPrisma } from "./infrastructure/db/omie-orders.repo.prisma";

// sync products (omie catalog)
import { createFetchOmieProductsPageUseCase } from "./application/use-cases/fetch-omie-products-page.usecase";
import { createSyncOmieProductsUseCase } from "./application/use-cases/sync-omie-products.usecase";
import { createOmieProductRepoPrisma } from "./infrastructure/db/omie-product.repo.prisma";
import { createSyncLockRepoPrisma } from "./infrastructure/db/sync-lock.repo.prisma";

// sync production orders
import { createListProductionOrdersPageUseCase } from "./application/use-cases/list-production-orders-page.usecase";
import { createSyncProductionOrdersUseCase } from "./application/use-cases/sync-production-orders.usecase";
import { createOmieProductionOrdersRepoPrisma } from "./infrastructure/db/omie-production-orders.repo.prisma";

// leitura (HTTP / admin)
import { createListOrdersUseCase } from "./application/use-cases/list-orders.usecase";
import { createListStage20OrdersUseCase } from "./application/use-cases/list-stage20-orders.usecase";
import { createGetStage20TotalsUseCase } from "./application/use-cases/get-stage20-totals.usecase";

// leitura de ordens de produção
import { createListProductionOrdersUseCase } from "./application/use-cases/list-production-orders.usecase";
import { createGetProductionOrderByCodeUseCase } from "./application/use-cases/get-production-order-by-code.usecase";
import { createGetProductionOrdersByProductCodeUseCase } from "./application/use-cases/get-production-orders-by-product-code.usecase";
import { createGetProductionOrdersByProductIntegrationCodeUseCase } from "./application/use-cases/get-production-orders-by-product-integration-code.usecase";
import { createGetProductionOrdersStatsUseCase } from "./application/use-cases/get-production-orders-stats.usecase";
import { createGetActiveProductionOrdersCountUseCase } from "./application/use-cases/get-active-production-orders-count.usecase";
import { createGetCompletedProductionOrdersCountUseCase } from "./application/use-cases/get-completed-production-orders-count.usecase";

// estado em memória para sync de produtos
const state = {
  lastGlobalSyncAt: 0,
  inMemoryLockUntil: 0,
};

export function createOmieOrdersModule(app: any) {
  const prisma = app.prisma;
  const omieClient = app.omieClient;
  const logger = app.log;

  // ---------------------------------------------------------------------------
  // infra base
  // ---------------------------------------------------------------------------
  const jobLock = createJobLock(prisma);
  const omieOrdersRepo = createOmieOrdersRepoPrisma(prisma);

  // ---------------------------------------------------------------------------
  // sync de pedidos (stage 20)
  // ---------------------------------------------------------------------------
  const listOmieOrdersPage = createListOmieOrdersPageUseCase({ omieClient });

  const syncStage20Orders = createSyncStage20OrdersUseCase({
    jobLock,
    listOmieOrdersPage,
    omieOrdersRepo,
  });

  // ---------------------------------------------------------------------------
  // sync de produtos Omie
  // ---------------------------------------------------------------------------
  const syncLockRepo = createSyncLockRepoPrisma(prisma);
  const omieProductRepo = createOmieProductRepoPrisma(prisma);

  const fetchOmieProductsPage = createFetchOmieProductsPageUseCase({
    omieClient,
    logger,
  });

  const syncOmieProducts = createSyncOmieProductsUseCase({
    prisma,
    syncLockRepo,
    fetchOmieProductsPage,
    omieProductRepo,
    logger,
    state,
  });

  // ---------------------------------------------------------------------------
  // sync de ordens de produção
  // ---------------------------------------------------------------------------
  const productionOrdersRepo = createOmieProductionOrdersRepoPrisma(prisma);

  const listProductionOrdersPage = createListProductionOrdersPageUseCase({
    omieClient,
    logger,
  });

  const syncProductionOrders = createSyncProductionOrdersUseCase({
    jobLock,
    listProductionOrdersPage,
    productionOrdersRepo,
    logger,
  });

  // ---------------------------------------------------------------------------
  // leitura (HTTP / admin)
  // ---------------------------------------------------------------------------
  const listOrders = createListOrdersUseCase({ prisma });
  const listStage20Orders = createListStage20OrdersUseCase({ prisma });
  const getStage20Totals = createGetStage20TotalsUseCase({ prisma });

  // ---------------------------------------------------------------------------
  // leitura de ordens de produção
  // ---------------------------------------------------------------------------
  const listProductionOrders = createListProductionOrdersUseCase({ productionOrdersRepo });
  const getProductionOrderByCode = createGetProductionOrderByCodeUseCase({ productionOrdersRepo });
  const getProductionOrdersByProductCode = createGetProductionOrdersByProductCodeUseCase({ productionOrdersRepo });
  const getProductionOrdersByProductIntegrationCode = createGetProductionOrdersByProductIntegrationCodeUseCase({ productionOrdersRepo });
  const getProductionOrdersStats = createGetProductionOrdersStatsUseCase({ productionOrdersRepo });
  const getActiveProductionOrdersCount = createGetActiveProductionOrdersCountUseCase({ productionOrdersRepo });
  const getCompletedProductionOrdersCount = createGetCompletedProductionOrdersCountUseCase({ productionOrdersRepo });

  // ---------------------------------------------------------------------------
  // expose use cases (SEM REMOVER NADA)
  // ---------------------------------------------------------------------------
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
      getCompletedProductionOrdersCount,
    },
  };
}