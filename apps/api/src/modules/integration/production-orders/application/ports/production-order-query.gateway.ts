// ---------------------------------------------------------------------------
// Port — Production Order Query Gateway
// ---------------------------------------------------------------------------
// Define o contrato para consultas do espelho local de ordens de produção.
// Implementações: RealProductionOrderQueryGateway (Prisma),
//                 FakeProductionOrderQueryGateway (in-memory + Prisma).
// ---------------------------------------------------------------------------

import type {
    ProductionOrderListResult,
    ProductionOrderDetailResult,
    ProductionOrderStatsResult,
    ProductionOrderListFilters,
} from "../../infrastructure/db/production-order-query.store";

export type ProductionOrderQueryGateway = {
    /** Tracking: busca por externalRequestId na tabela de comandos */
    getByExternalRequestId(externalRequestId: string): Promise<any | null>;
    /** Tracking: lista por productId na tabela de comandos */
    listByProductId?(productId: string): Promise<any[]>;

    // ─── Leitura do espelho local (omie_production_order) ──────────────

    /** Lista paginada do espelho local */
    listProductionOrders(
        page?: number,
        limit?: number,
        filters?: ProductionOrderListFilters
    ): Promise<{ items: ProductionOrderListResult[]; total: number; page: number; limit: number }>;

    /** Detalhe da OP + itens por omieCode */
    getProductionOrderByCode(omieId: string): Promise<ProductionOrderDetailResult | null>;

    /** Estatísticas do espelho local */
    getProductionOrderStats(): Promise<ProductionOrderStatsResult>;
};
