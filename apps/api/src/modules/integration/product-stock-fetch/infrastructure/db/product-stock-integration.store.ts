// ---------------------------------------------------------------------------
// DB Store: ProductStockIntegrationStore
// Persiste a posição de estoque no modelo ProductStock do Prisma.
// ---------------------------------------------------------------------------

import { prisma } from "@/shared/db/prisma";
import { getLogger } from "@/shared/logger";

export class ProductStockIntegrationStore {
    private readonly logger = getLogger("ProductStockIntegrationStore");

    async upsert(
        productId: string,
        data: { stockQuantity: number; minimumStock?: number },
    ) {
        this.logger.info("Atualizando estoque do produto", {
            productId,
            stockQuantity: data.stockQuantity,
        });

        return prisma.productStock.upsert({
            where: { omieCode: productId },
            create: {
                omieCode: productId,
                stockQuantity: data.stockQuantity,
                minimumStock: data.minimumStock ?? 0,
            },
            update: {
                stockQuantity: data.stockQuantity,
                minimumStock: data.minimumStock ?? 0,
            },
        });
    }

    async findByProductId(productId: string) {
        return prisma.productStock.findUnique({
            where: { omieCode: productId },
        });
    }

    async list(limit = 50, offset = 0) {
        return prisma.productStock.findMany({
            orderBy: { updatedAt: "desc" },
            take: limit,
            skip: offset,
        });
    }
}
