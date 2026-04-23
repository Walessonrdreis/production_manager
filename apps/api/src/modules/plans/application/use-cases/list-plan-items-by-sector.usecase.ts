import { NotFoundError } from "@/shared/errors/domain-errors";

export function createListPlanItemsBySectorUseCase(deps: {
  planRepo: { findByIdWithItems: (id: string) => Promise<any | null> };
}) {
  return {
    async execute(input: { planId: string }) {
      const plan = await deps.planRepo.findByIdWithItems(input.planId);
      if (!plan) throw new NotFoundError("Plano");

      const grouped = new Map<string, any>();

      for (const item of plan.items) {
        const sectorId = item.sector.id;

        if (!grouped.has(sectorId)) {
          grouped.set(sectorId, {
            sector: { id: item.sector.id, name: item.sector.name, order: item.sector.order },
            items: [],
          });
        }

        grouped.get(sectorId).items.push({
          itemId: item.id,
          productId: item.productId,
          productDescription: item.product.omieProduct.description,
          quantity: item.quantity,
        });
      }

      return Array.from(grouped.values())
        .sort((a, b) => a.sector.order - b.sector.order || a.sector.name.localeCompare(b.sector.name))
        .map(g => ({
          sector: { id: g.sector.id, name: g.sector.name },
          items: g.items,
        }));
    },
  };
}