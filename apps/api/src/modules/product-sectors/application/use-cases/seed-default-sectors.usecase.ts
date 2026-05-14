import { DEFAULT_SECTORS } from '../../infrastructure/db/product-sectors.repo.prisma'

export function createSeedDefaultSectorsUseCase(deps: { repo: any }) {
  return {
    async execute() {
      const results = await Promise.all(
        (DEFAULT_SECTORS as readonly string[]).map((name: string, index: number) =>
          deps.repo.upsertDefault(name).then((sector: any) => ({ ...sector, defaultOrder: index }))
        )
      )
      return results
    },
  }
}
