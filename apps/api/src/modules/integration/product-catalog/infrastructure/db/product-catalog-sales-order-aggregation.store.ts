import { prisma } from "@/shared/db/prisma";

export class ProductCatalogSalesOrderAggregationStore {
  /**
   * 🔥 Reseta completamente a agregação de pedidos em aberto (etapa 20)
   * Deve ser chamado antes de recalcular o read-model
   */
  async resetStage20Aggregation() {
    await prisma.productCatalogProductionReadyReadModel.updateMany({
      data: {
        hasOpenSalesOrderStage20: false,
        openSalesOrderStage20Count: 0,
      },
    });
  }

  /**
   * 🔥 Incrementa a contagem de pedidos (stage 20) para um produto
   */
  async incrementProduct(productCode: string) {
    await prisma.productCatalogProductionReadyReadModel.updateMany({
      where: {
        productCode,
      },
      data: {
        hasOpenSalesOrderStage20: true,
        openSalesOrderStage20Count: {
          increment: 1,
        },
      },
    });
  }
}