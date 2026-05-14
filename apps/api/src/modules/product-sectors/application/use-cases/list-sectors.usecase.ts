export function createListSectorsUseCase(deps: { repo: any }) {
  return {
    async execute(input: { includeInactive: boolean }) {
      return deps.repo.list(input.includeInactive)
    },
  }
}
