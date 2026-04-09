import { ProductRepository } from '../repositories/ProductRepository';
import { SectorRepository } from '../repositories/SectorRepository';
import { NotFoundError, ValidationError } from '../utils/domainErrors';

interface IRequest {
  productId: string;
  sectorId: string;
  notes?: string;
}

export class SetProductDefaultSectorService {
  constructor(
    private productRepo = new ProductRepository(),
    private sectorRepo = new SectorRepository()
  ) {}

  async execute({ productId, sectorId, notes }: IRequest) {
    const product = await this.productRepo.findById(productId);

    if (!product) {
      throw new NotFoundError('Produto');
    }

    const sector = await this.sectorRepo.findById(sectorId);

    if (!sector || !sector.active) {
      throw new ValidationError('Setor não encontrado ou inativo.');
    }

    const productSector = await this.productRepo.upsertProductSector(productId, sectorId, notes);

    return productSector;
  }
}
