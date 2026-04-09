import { prisma } from '../db';
import { ErrorCodes } from '../utils/errors';

export class AppError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export class CreatePlanItemService {
  async execute({
    planId,
    productId,
    quantity,
    sectorId,
    notes,
  }: {
    planId: string;
    productId: string;
    quantity: number;
    sectorId?: string;
    notes?: string;
  }) {
    const plan = await prisma.productionPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Plano não encontrado');
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Produto não encontrado');
    }

    let finalSectorId = sectorId;

    if (!finalSectorId) {
      const productSector = await prisma.productSector.findUnique({
        where: { productId },
      });

      if (!productSector) {
        throw new AppError(ErrorCodes.MISSING_DEFAULT_SECTOR, 'Produto não possui setor padrão. Informe o sectorId.');
      }
      finalSectorId = productSector.sectorId;
    } else {
      const sector = await prisma.sector.findUnique({ where: { id: finalSectorId } });
      if (!sector || !sector.active) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Setor inválido ou inativo');
      }
    }

    const item = await prisma.productionPlanItem.create({
      data: {
        planId,
        productId,
        sectorId: finalSectorId,
        quantity,
        notes,
      },
    });

    return item;
  }
}
