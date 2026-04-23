// src/modules/products/application/use-cases/get-public-product-by-omie-code.usecase.ts

import type { PublicProduct } from "@/modules/products/application/dtos/public-product.dto";

export function createGetPublicProductByOmieCodeUseCase(deps: {
  publicProductsRepo: {
    getByOmieCode: (normalizedCode: string) => Promise<any | null>;
    toPublicProduct: (row: any) => PublicProduct;
  };
}) {
  return {
    async execute(input: { omieCode: string }): Promise<PublicProduct | null> {
      const normalizedCode = String(input.omieCode ?? "").trim();
      if (!normalizedCode) return null;

      const row = await deps.publicProductsRepo.getByOmieCode(normalizedCode);
      if (!row) return null;

      return deps.publicProductsRepo.toPublicProduct(row);
    },
  };
}
