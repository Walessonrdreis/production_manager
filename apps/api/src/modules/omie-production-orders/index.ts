import { createJobLock } from "@/shared/utils/job-lock";

// sync production orders
import { createListProductionOrdersPageUseCase } from "./application/use-cases/list-production-orders-page.usecase";
import { createSyncProductionOrdersUseCase } from "./application/use-cases/sync-production-orders.usecase";
import { createOmieProductionOrdersRepoPrisma } from "./infrastructure/db/omie-production-orders.repo.prisma";

// reading (HTTP / admin)
import { createListProductionOrdersUseCase } from "./application/use-cases/list-production-orders.usecase";
import { createGetProductionOrderByCodeUseCase } from "./application/use-cases/get-production-order-by-code.usecase";
import { createGetProductionOrdersByProductCodeUseCase } from "./application/use-cases/get-production-orders-by-product-code.usecase";
import { createGetProductionOrdersByProductIntegrationCodeUseCase } from "./application/use-cases/get-production-orders-by-product-integration-code.usecase";
import { createGetProductionOrdersStatsUseCase } from "./application/use-cases/get-production-orders-stats.usecase";
import { createGetActiveProductionOrdersCountUseCase } from "./application/use-cases/get-active-production-orders-count.usecase";
import { createGetCompletedProductionOrdersCountUseCase } from "./application/use-cases/get-completed-production-orders-count.usecase";

export function createOmieProductionOrdersModule(app: any) {
  const prisma = app.prisma;
  const omieClient = app.omieClient;
  const logger = app.log;

  // ---------------------------------------------------------------------------
  // infra base
  // ---------------------------------------------------------------------------
  const jobLock = createJobLock(prisma);

  // ---------------------------------------------------------------------------
  // sync production orders
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
  // reading (HTTP / admin)
  // ---------------------------------------------------------------------------
  const listProductionOrders = createListProductionOrdersUseCase({ productionOrdersRepo });
  const getProductionOrderByCode = createGetProductionOrderByCodeUseCase({ productionOrdersRepo });
  const getProductionOrdersByProductCode = createGetProductionOrdersByProductCodeUseCase({ productionOrdersRepo });
  const getProductionOrdersByProductIntegrationCode = createGetProductionOrdersByProductIntegrationCodeUseCase({ productionOrdersRepo });
  const getProductionOrdersStats = createGetProductionOrdersStatsUseCase({ productionOrdersRepo });
  const getActiveProductionOrdersCount = createGetActiveProductionOrdersCountUseCase({ productionOrdersRepo });
  const getCompletedProductionOrdersCount = createGetCompletedProductionOrdersCountUseCase({ productionOrdersRepo });

  // ---------------------------------------------------------------------------
  // expose use cases
  // ---------------------------------------------------------------------------
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
      getCompletedProductionOrdersCount,
    },
  };
}