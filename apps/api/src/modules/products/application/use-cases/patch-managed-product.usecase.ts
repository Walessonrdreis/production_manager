// src/modules/products/application/use-cases/patch-managed-product.usecase.ts
import { AppError } from "@/shared/errors/AppError";

export function createPatchManagedProductUseCase(deps: {
  productRepo: {
    existsById: (id: string) => Promise<any | null>;
    updateManaged: (id: string, data: any) => Promise<any>;
  };
}) {
  return {
    async execute(input: { id: string; data: { nickname?: string; active?: boolean } }) {
      const existing = await deps.productRepo.existsById(input.id);
      if (!existing) throw new AppError("PRODUCT_NOT_FOUND", 404, "Product not found");

      const updated = await deps.productRepo.updateManaged(input.id, {
        ...(input.data.nickname !== undefined ? { nickname: input.data.nickname } : {}),
        ...(input.data.active !== undefined ? { active: input.data.active } : {}),
      });

      return updated;
    },
  };
}