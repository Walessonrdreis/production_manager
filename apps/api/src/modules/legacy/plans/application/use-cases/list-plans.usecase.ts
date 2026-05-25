export function createListPlansUseCase(deps: {
  planRepo: { list: () => Promise<any[]> };
}) {
  return {
    async execute() {
      return deps.planRepo.list();
    },
  };
}