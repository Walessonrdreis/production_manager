// src/modules/products/application/use-cases/get-managed-product.usecase.ts
import { AppError } from "@/shared/errors/AppError";

export function createGetManagedProductUseCase(deps: {
  productRepo: { findManagedById: (id: string) => Promise<any | null> };
  omieAdapter: { extractFamilyDescription: (raw: any) => any };
}) {
  return {
    async execute(input: { id: string }) {
      const product = await deps.productRepo.findManagedById(input.id);
      if (!product) throw new AppError("PRODUCT_NOT_FOUND", 404, "Product not found");

      return {
        id: product.id,
        nickname: product.nickname,
        active: product.active,
        omieProductId: product.omieProductId,
        omieProduct: {
          id: product.omieProduct.id,
          description: product.omieProduct.description,
          sku: product.omieProduct.sku,
          familyDescription: deps.omieAdapter.extractFamilyDescription(product.omieProduct.rawPayload),
          active: product.omieProduct.active,
        },
        productSector: product.productSector
          ? {
              sectorId: product.productSector.sectorId,
              notes: product.productSector.notes,
              sector: {
                id: product.productSector.sector.id,
                name: product.productSector.sector.name,
                order: product.productSector.sector.order,
              },
            }
          : null,
      };
    },
  };
}