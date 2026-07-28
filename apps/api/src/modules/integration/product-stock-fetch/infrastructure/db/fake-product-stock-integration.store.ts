// ---------------------------------------------------------------------------
// Fake Store: FakeProductStockIntegrationStore
// ---------------------------------------------------------------------------

import { getLogger } from "@/shared/logger";

type StockRecord = {
    productOmieId: string;
    stockQuantity: number;
    minimumStock: number;
    updatedAt: Date;
};

export class FakeProductStockIntegrationStore {
    private readonly logger = getLogger("FakeProductStockIntegrationStore");
    private readonly data: Map<string, StockRecord>;

    constructor() {
        this.data = new Map();
        this.logger.info("FakeProductStockIntegrationStore initialized");
    }

    async upsert(
        productId: string,
        data: { stockQuantity: number; minimumStock?: number },
    ) {
        const existing = this.data.get(productId);
        const record: StockRecord = {
            productOmieId: productId,
            stockQuantity: data.stockQuantity,
            minimumStock: data.minimumStock ?? existing?.minimumStock ?? 0,
            updatedAt: new Date(),
        };
        this.data.set(productId, record);
        return record;
    }

    async findByProductId(productId: string) {
        return this.data.get(productId) ?? null;
    }

    async saveMany(
        items: Array<{ productId: string; stockQuantity: number; minimumStock?: number }>,
    ) {
        const records = items.map((item) => {
            const existing = this.data.get(item.productId);
            const record: StockRecord = {
                productOmieId: item.productId,
                stockQuantity: item.stockQuantity,
                minimumStock: item.minimumStock ?? existing?.minimumStock ?? 0,
                updatedAt: new Date(),
            };
            this.data.set(item.productId, record);
            return record;
        });
        return records;
    }

    async list(limit = 50, offset = 0) {
        return Array.from(this.data.values())
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(offset, offset + limit);
    }
}
