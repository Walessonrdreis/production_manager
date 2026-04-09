import { prisma } from '../db';
import { Prisma } from '@prisma/client';

export class ProductRepository {
  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
    });
  }

  async findByOmieId(omieProductId: string) {
    return prisma.product.findUnique({
      where: { omieProductId },
    });
  }

  async create(data: Prisma.ProductUncheckedCreateInput) {
    return prisma.product.create({
      data,
    });
  }

  async delete(id: string) {
    return prisma.product.delete({
      where: { id },
    });
  }

  async findAllWithDetails() {
    return prisma.product.findMany({
      include: {
        omieProduct: true,
        productSector: {
          include: {
            sector: true,
          },
        },
      },
      orderBy: {
        omieProduct: {
          description: 'asc',
        },
      },
    });
  }

  // --- Mapeamento Product Sector ---

  async findProductSector(productId: string) {
    return prisma.productSector.findUnique({
      where: { productId },
    });
  }

  async upsertProductSector(productId: string, sectorId: string, notes?: string) {
    return prisma.productSector.upsert({
      where: { productId },
      create: {
        productId,
        sectorId,
        notes,
      },
      update: {
        sectorId,
        notes,
      },
    });
  }
}
