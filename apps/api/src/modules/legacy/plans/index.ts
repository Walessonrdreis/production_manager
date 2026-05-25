import { registerPlansRoutes } from "./presentation/http/plans.routes";
import { createPlansController } from "./presentation/http/plans.controller";

// repos (plans)
import { createPlanRepoPrisma } from "./infrastructure/db/plan.repo.prisma";

// repos (outros módulos)
import { createProductRepoPrisma } from "@/modules/legacy/products/infrastructure/db/product.repo.prisma";
import { createProductSectorRepoPrisma } from "@/modules/legacy/product-sector/infrastructure/db/product-sector.repo.prisma";
import { createSectorRepoPrisma } from "@/modules/legacy/sectors/infrastructure/db/sector.repo.prisma";

// use cases
import { createCreatePlanUseCase } from "./application/use-cases/create-plan.usecase";
import { createListPlansUseCase } from "./application/use-cases/list-plans.usecase";
import { createGetPlanByIdUseCase } from "./application/use-cases/get-plan-by-id.usecase";
import { createAddPlanItemUseCase } from "./application/use-cases/add-plan-item.usecase";
import { createListPlanItemsBySectorUseCase } from "./application/use-cases/list-plan-items-by-sector.usecase";
import { createExportPlanCsvUseCase } from "./application/use-cases/export-plan-csv.usecase";

export async function registerPlansModule(app: any) {
  const prisma = app.prisma;

  // ---------------------------------------------------------------------------
  // repos
  // ---------------------------------------------------------------------------
  const planRepo = createPlanRepoPrisma(prisma);
  const productRepo = createProductRepoPrisma(prisma);
  const productSectorRepo = createProductSectorRepoPrisma(prisma);
  const sectorRepo = createSectorRepoPrisma(prisma);

  // ---------------------------------------------------------------------------
  // use cases
  // ---------------------------------------------------------------------------
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
      sectorRepo,
    }),
  };

  // ---------------------------------------------------------------------------
  // http
  // ---------------------------------------------------------------------------
  const controller = createPlansController(useCases);
  await registerPlansRoutes(app, controller);

  return { useCases };
}