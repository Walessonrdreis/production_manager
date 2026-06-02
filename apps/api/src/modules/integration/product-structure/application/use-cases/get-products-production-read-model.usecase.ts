import { prisma } from "@/shared/db/prisma";

export class GetProductsProductionReadModelUseCase {
  async execute() {
    const products = await prisma.omieProduct.findMany({
      where: { active: true },
      select: {
        omieCode: true,
        description: true,
      },
    });

    return Promise.all(
      products.map(async (product) => {
        const hasStructure = await prisma.productStructure.count({
          where: {
            codProduto: product.omieCode,
            hasStructure: true,
          },
        });

        return {
          productCode: product.omieCode,
          description: product.description,
          hasStructure: hasStructure > 0,
          canCreateProductionOrder: hasStructure > 0,
        };
      })
    );
  }
}