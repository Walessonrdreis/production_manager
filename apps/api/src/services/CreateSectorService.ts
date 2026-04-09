import { SectorRepository } from '../repositories/SectorRepository';
import { ConflictError } from '../utils/domainErrors';

interface IRequest {
  name: string;
  order?: number;
}

export class CreateSectorService {
  constructor(private sectorRepo = new SectorRepository()) {}

  async execute({ name, order = 0 }: IRequest) {
    const existingSector = await this.sectorRepo.findByName(name);

    if (existingSector) {
      throw new ConflictError('Um setor com este nome já existe.');
    }

    const sector = await this.sectorRepo.create({
      name,
      order,
    });

    return sector;
  }
}
