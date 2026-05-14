import { registerProductSectorsRoutes } from "./presentation/http/product-sectors.routes"
import { createProductSectorsController } from "./presentation/http/product-sectors.controller"
import { createProductSectorsRepoPrisma } from "./infrastructure/db/product-sectors.repo.prisma"
import { createListSectorsUseCase } from "./application/use-cases/list-sectors.usecase"
import { createUpdateSectorUseCase } from "./application/use-cases/update-sector.usecase"
import { createDeleteSectorUseCase } from "./application/use-cases/delete-sector.usecase"
import { createSeedDefaultSectorsUseCase } from "./application/use-cases/seed-default-sectors.usecase"

export async function registerProductSectorsModule(app: any) {
  const prisma = app.prisma
  const logger = app.log

  const repo = createProductSectorsRepoPrisma(prisma)

  const useCases = {
    listSectorsUseCase: createListSectorsUseCase({ repo }),
    updateSectorUseCase: createUpdateSectorUseCase({ repo }),
    deleteSectorUseCase: createDeleteSectorUseCase({ repo }),
  }

  const controller = createProductSectorsController(useCases)
  await registerProductSectorsRoutes(app, controller)

  const seedUseCase = createSeedDefaultSectorsUseCase({ repo })
  const seeded = await seedUseCase.execute()
  logger.info({ count: seeded.length }, "[ProductSectors] setores padrão sincronizados")
}
