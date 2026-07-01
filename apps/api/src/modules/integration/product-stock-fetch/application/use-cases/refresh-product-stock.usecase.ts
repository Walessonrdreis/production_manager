// ---------------------------------------------------------------------------
// Use Case: RefreshProductStockUseCase
// Atualiza a posição de estoque de um produto com idempotência.
// Retorna 202 ACCEPTED e persiste o resultado na store.
// ---------------------------------------------------------------------------

import type { ProductStockFetchGateway } from "../ports/product-stock-fetch.gateway";
import type {
    RefreshProductStockRequestDTO,
    RefreshProductStockResponseDTO,
} from "../dto/refresh-product-stock.dto";

export interface CommandStoreContract {
    findByExternalRequestId(externalRequestId: string): Promise<any>;
    getOrCreateAccepted(input: {
        externalRequestId: string;
        productOmieId: string;
        commandType: string;
        source?: string;
    }): Promise<{ record: any; created: boolean }>;
    markConfirmed(externalRequestId: string): Promise<any>;
    markFailed(externalRequestId: string, error: unknown): Promise<any>;
}

export interface IntegrationStoreContract {
    upsert(productId: string, data: {
        stockQuantity: number;
        minimumStock?: number;
    }): Promise<any>;
}

export class RefreshProductStockUseCase {
    constructor(
        private readonly fetchGateway: ProductStockFetchGateway,
        private readonly integrationStore: IntegrationStoreContract,
        private readonly commandStore: CommandStoreContract,
    ) { }

    async execute(
        input: RefreshProductStockRequestDTO,
    ): Promise<RefreshProductStockResponseDTO> {
        const { record, created } = await this.commandStore.getOrCreateAccepted({
            externalRequestId: input.externalRequestId,
            productOmieId: input.productId,
            commandType: "REFRESH_STOCK",
            source: "API2",
        });

        return {
            status: "ACCEPTED",
            externalRequestId: record.externalRequestId,
            productId: input.productId,
        };
    }

    async process(input: {
        externalRequestId: string;
        productOmieId: string;
    }) {
        try {
            const stockData = await this.fetchGateway.fetch(input.productOmieId);

            await this.integrationStore.upsert(input.productOmieId, {
                stockQuantity: stockData.total,
                minimumStock: 0,
            });

            await this.commandStore.markConfirmed(input.externalRequestId);
        } catch (error) {
            await this.commandStore.markFailed(input.externalRequestId, error);
            throw error;
        }
    }
}
