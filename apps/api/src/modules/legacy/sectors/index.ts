import { registerSectorsRoutes } from "./presentation/http/sectors.routes";
import { createSectorsController } from "./presentation/http/sectors.controller";

import { createSectorRepoPrisma } from "./infrastructure/db/sector.repo.prisma";

import { createCreateSectorUseCase } from "./application/use-cases/create-sector.usecase";
import { createListSectorsUseCase } from "./application/use-cases/list-sectors.usecase";
import { createUpdateSectorUseCase } from "./application/use-cases/update-sector.usecase";
import { createDeleteSectorUseCase } from "./application/use-cases/delete-sector.usecase";

export async function registerSectorsModule(app: any) {
  const prisma = app.prisma;

  const sectorRepo = createSectorRepoPrisma(prisma);

  const useCases = {
    createSector: createCreateSectorUseCase({ sectorRepo }),
    listSectors: createListSectorsUseCase({ sectorRepo }),
    updateSector: createUpdateSectorUseCase({ sectorRepo }),
    deleteSector: createDeleteSectorUseCase({ sectorRepo }),
  };

  const controller = createSectorsController(useCases);
  await registerSectorsRoutes(app, controller);
}