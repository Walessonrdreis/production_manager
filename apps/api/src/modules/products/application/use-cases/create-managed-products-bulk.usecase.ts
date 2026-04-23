// src/modules/products/application/use-cases/create-managed-products-bulk.usecase.ts
import { ValidationError } from "@/shared/errors/domain-errors";

export function createCreateManagedProductsBulkUseCase(deps: {
  productRepo: {
    // retorna {count}
    createManyManaged: (ids: string[]) => Promise<{ count: number }>;
    // lista existentes
    // se quiser, dá para otimizar mais tarde
  };
  omieProductRepo: { findManyIds: (ids: string[]) => Promise<Array<{ id: string }>> };
  prisma: any; // para buscar existingProducts como no original (opcional)
}) {
  return {
    async execute(input: { omieProductIds: string[] }) {
      const uniqueIds = Array.from(new Set(input.omieProductIds));

      const omieProducts = await deps.omieProductRepo.findManyIds(uniqueIds);
      const omieProductIdSet = new Set(omieProducts.map((item) => item.id));
      const missingIds = uniqueIds.filter((id) => !omieProductIdSet.has(id));

      if (missingIds.length > 0) {
        throw new ValidationError("Alguns produtos Omie não existem.", { missingIds });
      }

      // manter lógica do original: descobrir quais já existem
      const existingProducts = await deps.prisma.product.findMany({
        where: { omieProductId: { in: uniqueIds } },
        select: { omieProductId: true },
      });

      const existingIdSet = new Set(existingProducts.map((item: any) => item.omieProductId));
      const toCreate = uniqueIds.filter((omieProductId) => !existingIdSet.has(omieProductId));

      const createResult = await deps.productRepo.createManyManaged(toCreate);

      return {
        created: createResult.count,
        skippedExisting: existingIdSet.size,
        requested: uniqueIds.length,
      };
    },
  };
}