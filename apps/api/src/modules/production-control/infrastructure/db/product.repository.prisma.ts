import { PrismaClient } from "@prisma/client";
import { ProductRepository } from "@/modules/production-control/application/ports/product.repository.port";
import { Product } from "@/modules/production-control/application/entities/product.entity";
import { ProductDTO } from "@/modules/production-control/application/dtos/product.dto";
import { ProductionControlStatus } from "@/modules/production-control/application/entities/production-control-status.enum";

export class ProductRepositoryPrisma implements ProductRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createProduct(product: Product): Promise<Product> {
    const created = await this.prisma.productionControlProduct.create({
      data: {
        snapshotId: product.snapshotId,
        description: product.description,
        totalQuantity: product.totalQuantity,
        pendingQuantity: product.pendingQuantity,
        status: product.status as string,
        scheduledDate: product.scheduledDate,
        actualDate: product.actualDate,
      },
    });

    return ProductDTO.fromPrisma(created);
  }

  async createProducts(products: Product[]): Promise<Product[]> {
    const created = await this.prisma.productionControlProduct.createManyAndReturn({
      data: products.map(product => ({
        snapshotId: product.snapshotId,
        description: product.description,
        totalQuantity: product.totalQuantity,
        pendingQuantity: product.pendingQuantity,
        status: product.status as string,
        scheduledDate: product.scheduledDate,
        actualDate: product.actualDate,
      })),
    });

    return created.map(ProductDTO.fromPrisma);
  }

  async findProductById(id: string): Promise<Product | null> {
    const product = await this.prisma.productionControlProduct.findUnique({
      where: { id },
    });

    if (!product) {
      return null;
    }

    return ProductDTO.fromPrisma(product);
  }

  async findProductsBySnapshotId(snapshotId: string): Promise<Product[]> {
    const products = await this.prisma.productionControlProduct.findMany({
      where: { snapshotId },
      orderBy: {
        description: "asc",
      },
    });

    return products.map(ProductDTO.fromPrisma);
  }

  async findProductBySnapshotAndDescription(
    snapshotId: string,
    description: string
  ): Promise<Product | null> {
    const product = await this.prisma.productionControlProduct.findFirst({
      where: {
        snapshotId,
        description,
      },
    });

    if (!product) {
      return null;
    }

    return ProductDTO.fromPrisma(product);
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    try {
      const updated = await this.prisma.productionControlProduct.update({
        where: { id },
        data: {
          ...(updates.pendingQuantity !== undefined && { pendingQuantity: updates.pendingQuantity }),
          ...(updates.status !== undefined && { status: updates.status as string }),
          ...(updates.scheduledDate !== undefined && { scheduledDate: updates.scheduledDate }),
          ...(updates.actualDate !== undefined && { actualDate: updates.actualDate }),
          updatedAt: new Date(),
        },
      });

      return ProductDTO.fromPrisma(updated);
    } catch (error) {
      return null;
    }
  }

  async updateProductStatus(
    id: string,
    status: ProductionControlStatus
  ): Promise<Product | null> {
    return this.updateProduct(id, { status });
  }

  async updateProductPendingQuantity(
    id: string,
    pendingQuantity: number
  ): Promise<Product | null> {
    return this.updateProduct(id, { pendingQuantity });
  }

  async updateProductDates(
    id: string,
    scheduledDate?: Date,
    actualDate?: Date
  ): Promise<Product | null> {
    return this.updateProduct(id, { scheduledDate, actualDate });
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      await this.prisma.productionControlProduct.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteProductsBySnapshotId(snapshotId: string): Promise<number> {
    const result = await this.prisma.productionControlProduct.deleteMany({
      where: { snapshotId },
    });

    return result.count;
  }

  async countProductsBySnapshotId(snapshotId: string): Promise<number> {
    return await this.prisma.productionControlProduct.count({
      where: { snapshotId },
    });
  }

  async getProductWithOrders(id: string): Promise<Product | null> {
    const product = await this.prisma.productionControlProduct.findUnique({
      where: { id },
      include: {
        orders: true,
      },
    });

    if (!product) {
      return null;
    }

    return ProductDTO.fromPrisma(product);
  }

  async listProductsByStatus(
    status: ProductionControlStatus,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<Product[]> {
    const { limit = 100, offset = 0 } = options || {};

    const products = await this.prisma.productionControlProduct.findMany({
      where: { status: status as string },
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: "desc",
      },
    });

    return products.map(ProductDTO.fromPrisma);
  }

  async searchProducts(
    query: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<Product[]> {
    const { limit = 50, offset = 0 } = options || {};

    const products = await this.prisma.productionControlProduct.findMany({
      where: {
        description: {
          contains: query,
          mode: "insensitive",
        },
      },
      take: limit,
      skip: offset,
      orderBy: {
        description: "asc",
      },
    });

    return products.map(ProductDTO.fromPrisma);
  }
}