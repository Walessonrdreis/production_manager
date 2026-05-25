import { DEFAULT_SECTORS } from '../../infrastructure/db/product-sectors.repo.prisma'

export function createDeleteSectorUseCase(deps: { repo: any }) {
  return {
    async execute(input: { id: string }) {
      const existing = await deps.repo.findById(input.id)
      if (!existing) {
        const err: any = new Error('Setor não encontrado')
        err.statusCode = 404
        throw err
      }

      if (DEFAULT_SECTORS.includes(existing.name)) {
        const err: any = new Error(`Setor padrão "${existing.name}" não pode ser deletado`)
        err.statusCode = 403
        throw err
      }

      return deps.repo.softDelete(input.id)
    },
  }
}
