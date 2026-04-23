// src/modules/omie-orders/index.ts
import { createJobLock } from "@/shared/utils/job-lock";
import { createListOmieOrdersPageUseCase } from "./application/use-cases/list-omie-orders-page.usecase";
import { createSyncStage20OrdersUseCase } from "./application/use-cases/sync-stage20-orders.usecase";
import { createOmieOrdersRepoPrisma } from "./infrastructure/db/omie-orders.repo.prisma";

import { createFetchOmieProductsPageUseCase } from "./application/use-cases/fetch-omie-products-page.usecase";
import { createSyncOmieProductsUseCase } from "./application/use-cases/sync-omie-products.usecase";

import { createOmieProductRepoPrisma } from "./infrastructure/db/omie-product.repo.prisma";
import { createSyncLockRepoPrisma } from "./infrastructure/db/sync-lock.repo.prisma";



const state = {
  lastGlobalSyncAt: 0,
  inMemoryLockUntil: 0,
};


export function createOmieOrdersModule(app: any) {
  const prisma = app.prisma;
  const omieClient = app.omieClient; // idealmente decorado via plugin bootstrap
  const logger = app.log;

  const jobLock = createJobLock(prisma);
  const omieOrdersRepo = createOmieOrdersRepoPrisma(prisma);

  const listOmieOrdersPage = createListOmieOrdersPageUseCase({ omieClient });

  const syncStage20Orders = createSyncStage20OrdersUseCase({
    jobLock,
    listOmieOrdersPage,
    omieOrdersRepo,
  });

  
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


  return {
    useCases: {
      syncStage20Orders,
      syncOmieProducts,
    },
  };
}