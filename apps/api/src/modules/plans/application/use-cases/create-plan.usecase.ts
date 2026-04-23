export function createCreatePlanUseCase(deps: {
  planRepo: {
    create: (data: { name: string; startDate: Date; endDate: Date }) => Promise<any>;
  };
}) {
  return {
    async execute(input: { name: string; startDate: Date | string; endDate: Date | string }) {
      const plan = await deps.planRepo.create({
        name: input.name,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
      });

      return plan;
    },
  };
}