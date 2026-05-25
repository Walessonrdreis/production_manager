import { NotFoundError, ValidationError } from "@/shared/errors/domain-errors.js";


export function createSetProductDefaultSectorUseCase(deps: {
  productRepo: { findById: (id: string) => Promise<any | null> };
  sectorRepo: { findById: (id: string) => Promise<any | null> };
  productSectorRepo: { upsert: (productId: string, sectorId: string, notes?: string) => Promise<any> };
}) {
  return {
    async execute(input: { productId: string; sectorId: string; notes?: string }) {
      const product = await deps.productRepo.findById(input.productId);
      if (!product) throw new NotFoundError("Produto");

      const sector = await deps.sectorRepo.findById(input.sectorId);
      if (!sector || sector.active !== true) {
        throw new ValidationError("Setor não encontrado ou inativo.");
      }

      return deps.productSectorRepo.upsert(input.productId, input.sectorId, input.notes);
    },
  };
}
