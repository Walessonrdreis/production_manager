import { createJobLock } from "@/shared/utils/job-lock";

// sync orders (stage 20)
import { createListOmieOrdersPageUseCase } from "./application/use-cases/list-omie-orders-page.usecase";
import { createSyncStage20OrdersUseCase } from "./application/use-cases/sync-stage20-orders.usecase";
import { createOmieOrdersRepoPrisma } from "./infrastructure/db/omie-orders.repo.prisma";

// ✅ NOVO: sync-missing-clients (para automatizar no mesmo fluxo)
import { createSyncMissingClientsUseCase } from "@/modules/legacy/client/application/use-cases/sync-missing-clients.usecase";

// sync products (omie catalog)
import { createFetchOmieProductsPageUseCase } from "./application/use-cases/fetch-omie-products-page.usecase";
import { createSyncOmieProductsUseCase } from "./application/use-cases/sync-omie-products.usecase";
import { createOmieProductRepoPrisma } from "./infrastructure/db/omie-product.repo.prisma";
import { createSyncLockRepoPrisma } from "./infrastructure/db/sync-lock.repo.prisma";

// leitura (HTTP / admin)
import { createListOrdersUseCase } from "./application/use-cases/list-orders.usecase";
import { createListStage20OrdersUseCase } from "./application/use-cases/list-stage20-orders.usecase";
import { createGetStage20TotalsUseCase } from "./application/use-cases/get-stage20-totals.usecase";
import { createGetStage20TotalsDetailedUseCase } from "./application/use-cases/get-stage20-totals-detailed.usecase";

// estado em memória para sync de produtos
const state = {
  lastGlobalSyncAt: 0,
  inMemoryLockUntil: 0,
};

export function createOmieSalesOrdersModule(app: any) {
  const prisma = app.prisma;
  const omieClient = app.omieClient;
  const logger = app.log;

  // ---------------------------------------------------------------------------
  // infra base
  // ---------------------------------------------------------------------------
  const jobLock = createJobLock(prisma);
  const omieOrdersRepo = createOmieOrdersRepoPrisma(prisma);

  // ---------------------------------------------------------------------------
  // ✅ deps opcionais do módulo legacy/client (para sync-missing-clients)
  // ---------------------------------------------------------------------------
  // Esses deps existem se você registrou registerClientModule(app) no bootstrap.
  const clientRepository = (app as any).clientRepository;
  const omieClientGateway = (app as any).omieClientGateway;

  const syncMissingClients =
    clientRepository && omieClientGateway
      ? createSyncMissingClientsUseCase({ clientRepository, omieClientGateway })
      : undefined;

  // ---------------------------------------------------------------------------
  // sync de pedidos (stage 20)
  // ---------------------------------------------------------------------------
  const listOmieOrdersPage = createListOmieOrdersPageUseCase({ omieClient });

  const syncStage20Orders = createSyncStage20OrdersUseCase({
    jobLock,
    listOmieOrdersPage,
    omieOrdersRepo,

    // ✅ NOVO: injeta automação (se disponível)
    syncMissingClients,
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
  // leitura (HTTP / admin)
  // ---------------------------------------------------------------------------
  const listOrders = createListOrdersUseCase({ prisma });
  const listStage20Orders = createListStage20OrdersUseCase({ prisma });
  const getStage20Totals = createGetStage20TotalsUseCase({ prisma });
  const getStage20TotalsDetailed = createGetStage20TotalsDetailedUseCase({ prisma });

  // ---------------------------------------------------------------------------
  // expose use cases
  // ---------------------------------------------------------------------------
  return {
    useCases: {
      // sync
      syncStage20Orders,
      syncOmieProducts,

      // leitura (controller depende disso)
      listOrders,
      listStage20Orders,
      getStage20Totals,
      getStage20TotalsDetailed,
    },
  };
}