export function createUpdateSectorUseCase(deps: { repo: any }) {
  return {
    async execute(input: { id: string; data: { name?: string; order?: number | null; active?: boolean } }) {
      const existing = await deps.repo.findById(input.id)
      if (!existing) {
        const err: any = new Error('Setor não encontrado')
        err.statusCode = 404
        throw err
      }

      return deps.repo.update(input.id, input.data)
    },
  }
}
