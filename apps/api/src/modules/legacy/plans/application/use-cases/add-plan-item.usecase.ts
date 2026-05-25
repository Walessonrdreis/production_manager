import {
  NotFoundError,
  ValidationError,
  MissingDefaultSectorError,
} from "@/shared/errors/domain-errors";

export function createAddPlanItemUseCase(deps: {
  planRepo: {
    findById: (id: string) => Promise<any | null>;
    createItem: (data: {
      planId: string;
      productId: string;
      sectorId: string;
      quantity: number;
      notes?: string;
    }) => Promise<any>;
  };
  productRepo: {
    findById: (id: string) => Promise<any | null>;
  };
  productSectorRepo: {
    findByProductId: (productId: string) => Promise<{ sectorId: string } | null>;
  };
  sectorRepo: {
    findById: (id: string) => Promise<any | null>;
  };
}) {
  return {
    async execute(input: {
      planId: string;
      productId: string;
      quantity: number;
      sectorId?: string;
      notes?: string;
    }) {
      const { planId, productId, quantity, sectorId, notes } = input;

      // 1) Plano existe?
      const plan = await deps.planRepo.findById(planId);
      if (!plan) {
        throw new NotFoundError("Plano");
      }

      // 2) Produto existe?
      const product = await deps.productRepo.findById(productId);
      if (!product) {
        throw new NotFoundError("Produto");
      }

      let finalSectorId = sectorId;

      // 3) Setor não informado → usa setor padrão do produto
      if (!finalSectorId) {
        const productSector = await deps.productSectorRepo.findByProductId(productId);
        if (!productSector) {
          throw new MissingDefaultSectorError();
        }
        finalSectorId = productSector.sectorId;
      } else {
        // 4) Setor informado → valida
        const sector = await deps.sectorRepo.findById(finalSectorId);
        if (!sector || sector.active !== true) {
          throw new ValidationError("Setor inválido ou inativo");
        }
      }

      // 5) Cria item do plano
      return deps.planRepo.createItem({
        planId,
        productId,
        sectorId: finalSectorId,
        quantity,
        notes,
      });
    },
  };
}
``