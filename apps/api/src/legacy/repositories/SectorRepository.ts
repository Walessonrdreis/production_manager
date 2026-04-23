import { prisma } from '../db';
import { Prisma } from '@prisma/client';

export class SectorRepository {
  async findById(id: string) {
    return prisma.sector.findUnique({
      where: { id },
    });
  }

  async findByName(name: string) {
    return prisma.sector.findUnique({
      where: { name },
    });
  }

  async findAll(includeInactive: boolean = false) {
    return prisma.sector.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async create(data: Prisma.SectorCreateInput) {
    return prisma.sector.create({
      data,
    });
  }

  async update(id: string, data: Prisma.SectorUpdateInput) {
    return prisma.sector.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string) {
    return prisma.sector.update({
      where: { id },
      data: { active: false },
    });
  }
}
