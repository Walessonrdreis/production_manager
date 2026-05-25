// src/modules/products/index.ts
import { registerProductsRoutes } from "./presentation/http/products.routes";
import { createProductsController } from "./presentation/http/products.controller";

// repos
import { createProductRepoPrisma } from "./infrastructure/db/product.repo.prisma";
import { createOmieProductRepoPrisma } from "./infrastructure/db/omie-product.repo.prisma";
import { createProductStockRepoPrisma } from "./infrastructure/db/product-stock.repo.prisma";
import { createPublicProductsRepoPrisma } from "./infrastructure/db/public-products.repo.prisma";
import { createSyncLockLeaseRepoPrisma } from "./infrastructure/db/sync-lock-lease.repo.prisma";
import { createOmieProductReadRepoPrisma } from "./infrastructure/db/omie-product-read.repo.prisma";

// lock do sync de produtos
import { createSyncLockRepoPrisma } from "./infrastructure/db/sync-lock.repo.prisma";

// use cases base
import { createResolveOmieCodeFromProductUseCase } from "./application/use-cases/resolve-omie-code-from-product.usecase";
import { createGetManagedProductStockUseCase } from "./application/use-cases/get-managed-product-stock.usecase";
import { createGetManagedProductStockHistoryUseCase } from "./application/use-cases/get-managed-product-stock-history.usecase";

import { createCreateManagedProductUseCase } from "./application/use-cases/create-managed-product.usecase";
import { createCreateManagedProductsBulkUseCase } from "./application/use-cases/create-managed-products-bulk.usecase";
import { createListManagedProductsUseCase } from "./application/use-cases/list-managed-products.usecase";
import { createGetManagedProductUseCase } from "./application/use-cases/get-managed-product.usecase";
import { createPatchManagedProductUseCase } from "./application/use-cases/patch-managed-product.usecase";
import { createDeleteManagedProductUseCase } from "./application/use-cases/delete-managed-product.usecase";

import { createListPublicProductsUseCase } from "./application/use-cases/list-public-products.usecase";
import { createGetPublicProductByOmieCodeUseCase } from "./application/use-cases/get-public-product-by-omie-code.usecase";

import { createRefreshStockUseCase } from "./application/use-cases/refresh-stock.usecase";
import { createListOmieProductsWithStockUseCase } from "./application/use-cases/list-omie-products-with-stock.usecase";
import { createGetStockByRawPayloadUseCase } from "./application/use-cases/get-stock-by-raw-payload.usecase";
import { createGetOmieProductsUseCase } from "./application/use-cases/get-products.usecase";

// ✅ use cases admin/omie (leitura)
import { createListOmieCategoriesUseCase } from "./application/use-cases/admin-omie/list-omie-categories.usecase";
import { createSearchOmieProductsUseCase } from "./application/use-cases/admin-omie/search-omie-products.usecase";
import { createGetOmieProductByIdUseCase } from "./application/use-cases/admin-omie/get-omie-product-by-id.usecase";
import { createGetOmieProductByCodeUseCase } from "./application/use-cases/admin-omie/get-omie-product-by-code.usecase";
import { createGetOmieStockInfoUseCase } from "./application/use-cases/admin-omie/get-omie-stock-info.usecase";
import { createGetOmieProductStockUseCase } from "./application/use-cases/admin-omie/get-omie-product-stock.usecase";

// sync de produtos
import { createFetchOmieProductsPageUseCase } from "./application/use-cases/fetch-omie-products-page.usecase";
import { createSyncOmieProductsUseCase } from "./application/use-cases/sync-omie-products.usecase";

// shared
import { OmieAdapter, createOmieStockCache } from "@/shared/integrations/omie";

// estado em memória para throttle/lock fallback do sync
const omieProductsSyncState = {
  lastGlobalSyncAt: 0,
  inMemoryLockUntil: 0,
};

export async function createProductsModule(app: any) {
  const prisma = app.prisma;
  const logger = app.log;
  const omieClient = app.omieClient;

  // repositories
  const productRepo = createProductRepoPrisma(prisma);
  const omieProductRepo = createOmieProductRepoPrisma(prisma);
  const productStockRepo = createProductStockRepoPrisma(prisma);
  const publicProductsRepo = createPublicProductsRepoPrisma(prisma);
  const syncLockLeaseRepo = createSyncLockLeaseRepoPrisma(prisma);
  const omieProductReadRepo = createOmieProductReadRepoPrisma(prisma);

  const syncLockRepo = createSyncLockRepoPrisma(prisma);

  // infra
  const omieStockCache =
    app.omieStockCache ?? createOmieStockCache(omieClient, { logger });

  const omieAdapter = OmieAdapter;

  // ======================
  // use cases base
  // ======================
  const getOmieProducts = createGetOmieProductsUseCase({
    omieProductReadRepo,
  });

  const refreshStock = createRefreshStockUseCase({
    omieStockCache,
    syncLockLeaseRepo,
    productStockRepo,
    logger,
  });

  const resolveOmieCodeFromProduct = createResolveOmieCodeFromProductUseCase({
    productRepo,
    omieProductRepo,
    omieAdapter,
  });

  const listOmieProductsWithStock = createListOmieProductsWithStockUseCase({
    omieProductReadRepo,
  });

  const getStockByRawPayload = createGetStockByRawPayloadUseCase({
    omieStockCache,
  });

  // ======================
  // sync de produtos
  // ======================
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
    state: omieProductsSyncState,
  });

  // ======================
  // admin / omie (leitura)
  // ======================
  const listOmieCategories = createListOmieCategoriesUseCase({ prisma });
  const searchOmieProducts = createSearchOmieProductsUseCase({ prisma });
  const getOmieProductById = createGetOmieProductByIdUseCase({ prisma });
  const getOmieProductByCode = createGetOmieProductByCodeUseCase({ prisma });
  const getOmieStockInfo = createGetOmieStockInfoUseCase({ prisma });
  const getOmieProductStock = createGetOmieProductStockUseCase({ prisma });

  // ======================
  // use cases expostos
  // ======================
  const useCases = {
    // público
    listPublicProducts: createListPublicProductsUseCase({ publicProductsRepo }),
    getPublicProductByOmieCode: createGetPublicProductByOmieCodeUseCase({
      publicProductsRepo,
    }),

    // managed/admin
    createManagedProduct: createCreateManagedProductUseCase({
      productRepo,
      omieProductRepo,
    }),
    createManagedProductsBulk: createCreateManagedProductsBulkUseCase({
      productRepo,
      omieProductRepo,
      prisma,
    }),
    listManagedProducts: createListManagedProductsUseCase({ productRepo }),
    getManagedProduct: createGetManagedProductUseCase({
      productRepo,
      omieAdapter,
    }),
    patchManagedProduct: createPatchManagedProductUseCase({ productRepo }),
    deleteManagedProduct: createDeleteManagedProductUseCase({
      productRepo,
      prisma,
    }),

    // stock
    refreshStock,
    listOmieProductsWithStock,
    getOmieProducts,
    getStockByRawPayload,

    getManagedProductStock: createGetManagedProductStockUseCase({
      resolveOmieCodeFromProduct,
      productStockRepo,
    }),
    getManagedProductStockHistory: createGetManagedProductStockHistoryUseCase({
      resolveOmieCodeFromProduct,
      productStockRepo,
    }),

    // admin / omie
    listOmieCategories,
    searchOmieProducts,
    getOmieProductById,
    getOmieProductByCode,
    getOmieStockInfo,
    getOmieProductStock,

    // sync
    syncOmieProducts,
  };

  // http
  const controller = createProductsController(useCases as any);
  await registerProductsRoutes(app, controller);

  return { useCases };
}
