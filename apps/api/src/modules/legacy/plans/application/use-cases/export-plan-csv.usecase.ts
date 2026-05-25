import { NotFoundError } from "@/shared/errors/domain-errors.js";

export function createExportPlanCsvUseCase(deps: {
  planRepo: { findByIdWithItems: (id: string) => Promise<any | null> };
}) {
  return {
    async execute(input: { planId: string }): Promise<string> {
      const plan = await deps.planRepo.findByIdWithItems(input.planId);
      if (!plan) throw new NotFoundError("Plano");

      const sortedItems = plan.items.sort((a: any, b: any) =>
        a.sector.order - b.sector.order ||
        a.sector.name.localeCompare(b.sector.name) ||
        a.product.omieProduct.description.localeCompare(b.product.omieProduct.description)
      );

      let csv = "Setor;Produto;Quantidade\n";

      for (const item of sortedItems) {
        const sector = item.sector.name.replace(/;/g, ",");
        const product = item.product.omieProduct.description.replace(/;/g, ",");
        csv += `${sector};${product};${item.quantity}\n`;
      }

      return csv;
    },
  };
}