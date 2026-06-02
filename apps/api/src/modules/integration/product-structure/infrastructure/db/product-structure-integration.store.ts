import type { PrismaClient } from "@prisma/client";
import type { ProductStructureFetchResult } from "../../application/ports/product-structure-fetch.gateway";

export class ProductStructureIntegrationStore {
  constructor(private readonly prisma: PrismaClient) {}

  async save(result: ProductStructureFetchResult): Promise<void> {
    const { productCode, hasStructure, items } = result;

    await this.prisma.productStructure.upsert({
      where: { codProduto: productCode },
      update: {
        hasStructure,
        items: {
          deleteMany: {},
          create: items.map((item) => ({
            codProdutoComponente: item.componentCode,
            quantidade: item.quantity,
            unidade: item.unit,
          })),
        },
      },
      create: {
        codProduto: productCode,
        hasStructure,
        items: {
          create: items.map((item) => ({
            codProdutoComponente: item.componentCode,
            quantidade: item.quantity,
            unidade: item.unit,
          })),
        },
      },
    });
  }

  async hasStructure(productCode: string): Promise<boolean> {
    const count = await this.prisma.productStructure.count({
      where: {
        codProduto: productCode,
        hasStructure: true,
      },
    });

    return count > 0;
  }
}