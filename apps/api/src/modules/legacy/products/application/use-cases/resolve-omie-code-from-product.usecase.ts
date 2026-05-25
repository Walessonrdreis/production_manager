// src/modules/products/application/use-cases/resolve-omie-code-from-product.usecase.ts
import { AppError } from "@/shared/errors/AppError";

export function createResolveOmieCodeFromProductUseCase(deps: {
  productRepo: { findForOmieResolution: (id: string) => Promise<any | null> };
  omieProductRepo: { findForCodeResolution: (id: string) => Promise<any | null> };
  omieAdapter: { extractProductCode: (raw: any) => string | null | undefined };
}) {
  return {
    async execute(input: { productId: string }) {
      const product = await deps.productRepo.findForOmieResolution(input.productId);
      if (!product) throw new AppError("PRODUCT_NOT_FOUND", 404, "Product not found");

      if (!product.omieProductId) {
        throw new AppError("OMIE_PRODUCT_LINK_MISSING", 409, "Product is not linked to an OmieProduct");
      }

      const omieProduct = await deps.omieProductRepo.findForCodeResolution(product.omieProductId);
      if (!omieProduct) throw new AppError("OMIE_PRODUCT_NOT_FOUND", 404, "Omie product not found");

      const extracted = deps.omieAdapter.extractProductCode(omieProduct.rawPayload)?.trim();
      const omieCode = extracted || omieProduct.omieCode || omieProduct.omieId;

      if (!omieCode) throw new AppError("OMIE_CODE_NOT_FOUND", 422, "Omie code not found");

      return { productId: product.id, omieCode };
    },
  };
}