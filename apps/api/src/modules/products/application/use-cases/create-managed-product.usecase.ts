// src/modules/products/application/use-cases/create-managed-product.usecase.ts
import { ConflictError, NotFoundError } from "@/shared/errors/domain-errors";

export function createCreateManagedProductUseCase(deps: {
  productRepo: { findByOmieProductId: (id: string) => Promise<any | null>; createManaged: (id: string) => Promise<any> };
  omieProductRepo: { findById: (id: string) => Promise<any | null> };
}) {
  return {
    async execute(input: { omieProductId: string }) {
      const omieProduct = await deps.omieProductRepo.findById(input.omieProductId);
      if (!omieProduct) throw new NotFoundError("Produto Omie");

      const existing = await deps.productRepo.findByOmieProductId(input.omieProductId);
      if (existing) throw new ConflictError("Produto já está selecionado.");

      return deps.productRepo.createManaged(input.omieProductId);
    },
  };
}