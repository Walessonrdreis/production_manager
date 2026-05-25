import { NotFoundError } from "@/shared/errors/domain-errors.js";

export function createGetProductDefaultSectorUseCase(deps: {
  productRepo: { findById: (id: string) => Promise<any | null> };
  productSectorRepo: { findByProductId: (productId: string) => Promise<any | null> };
}) {
  return {
    async execute(input: { productId: string }) {
      const product = await deps.productRepo.findById(input.productId);
      if (!product) throw new NotFoundError("Produto");

      const productSector = await deps.productSectorRepo.findByProductId(input.productId);
      return productSector || null;
    },
  };
}