import { NotFoundError, ValidationError, MissingDefaultSectorError } from '../utils/domainErrors';
import { PlanRepository } from '../repositories/PlanRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { SectorRepository } from '../repositories/SectorRepository';

export class CreatePlanItemService {
  constructor(
    private planRepo = new PlanRepository(),
    private productRepo = new ProductRepository(),
    private sectorRepo = new SectorRepository()
  ) {}

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
    const plan = await this.planRepo.findById(planId);
    if (!plan) {
      throw new NotFoundError('Plano');
    }

    const product = await this.productRepo.findById(productId);
    if (!product) {
      throw new NotFoundError('Produto');
    }

    let finalSectorId = sectorId;

    if (!finalSectorId) {
      const productSector = await this.productRepo.findProductSector(productId);

      if (!productSector) {
        throw new MissingDefaultSectorError();
      }
      finalSectorId = productSector.sectorId;
    } else {
      const sector = await this.sectorRepo.findById(finalSectorId);
      if (!sector || !sector.active) {
        throw new ValidationError('Setor inválido ou inativo');
      }
    }

    const item = await this.planRepo.createItem({
      planId,
      productId,
      sectorId: finalSectorId,
      quantity,
      notes,
    });

    return item;
  }
}
