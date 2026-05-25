// src/modules/products/application/use-cases/delete-managed-product.usecase.ts
import { NotFoundError } from "@/shared/errors/domain-errors";

export function createDeleteManagedProductUseCase(deps: {
  prisma: any;
  productRepo: { deleteById: (id: string) => Promise<any> };
}) {
  return {
    async execute(input: { id: string }) {
      const product = await deps.prisma.product.findUnique({ where: { id: input.id } });
      if (!product) throw new NotFoundError("Produto");

      await deps.productRepo.deleteById(input.id);
      return { success: true };
    },
  };
}