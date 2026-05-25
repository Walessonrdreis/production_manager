import { NotFoundError } from "@/shared/errors/domain-errors";

export function createGetPlanByIdUseCase(deps: {
  planRepo: { findByIdWithItems: (id: string) => Promise<any | null> };
}) {
  return {
    async execute(input: { id: string }) {
      const plan = await deps.planRepo.findByIdWithItems(input.id);
      if (!plan) throw new NotFoundError("Plano");
      return plan;
    },
  };
}