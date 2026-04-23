import { registerProductSectorRoutes } from "./presentation/http/product-sector.routes";
import { createProductSectorController } from "./presentation/http/product-sector.controller";
import { createProductRepoPrisma } from "@/modules/products/infrastructure/db/product.repo.prisma";
import { createSectorRepoPrisma } from "@/modules/sectors/infrastructure/db/sector.repo.prisma";
import { createProductSectorRepoPrisma } from "./infrastructure/db/product-sector.repo.prisma";

import { createSetProductDefaultSectorUseCase } from "./application/use-cases/set-product-default-sector.usecase";
import { createGetProductDefaultSectorUseCase } from "./application/use-cases/get-product-default-sector.usecase";

export async function registerProductSectorModule(app: any) {
  const prisma = app.prisma;

   const productRepo = createProductRepoPrisma(prisma)
  const sectorRepo = createSectorRepoPrisma(prisma);
  const productSectorRepo = createProductSectorRepoPrisma(prisma);

  const useCases = {
    setProductDefaultSector: createSetProductDefaultSectorUseCase({
      productRepo,
      sectorRepo,
      productSectorRepo,
    }),
    getProductDefaultSector: createGetProductDefaultSectorUseCase({
      productRepo,
      productSectorRepo,
    }),
  };

  const controller = createProductSectorController(useCases);
  await registerProductSectorRoutes(app, controller);

  return { useCases };
}
``