export function createListSectorsUseCase(deps: {
  sectorRepo: { list: (includeInactive: boolean) => Promise<any[]> };
}) {
  return {
    async execute(input: { includeInactive: boolean }) {
      return deps.sectorRepo.list(input.includeInactive);
    },
  };
}