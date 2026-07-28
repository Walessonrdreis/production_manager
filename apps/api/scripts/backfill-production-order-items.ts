// ---------------------------------------------------------------------------
// One-shot script: Popula itens de todas as ordens de produção existentes
// ---------------------------------------------------------------------------
// As 1565 ordens já sincronizadas não têm itens porque o ListarOrdemProducao
// (sync global) não retorna o array "itens". Este script consulta cada ordem
// individualmente via ConsultarOrdemProducao e persiste os itens.
//
// Uso:
//   npx tsx -r tsconfig-paths/register apps/api/scripts/backfill-production-order-items.ts
// ---------------------------------------------------------------------------

import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import { sleep } from "@/shared/integration/strategies/retry.strategy";
import { OmieClientWithCircuitBreaker } from "@/shared/integrations/omie/omie-client-with-circuit-breaker";
import { env } from "@/config";
import { RealProductionOrderConsultGateway } from "@/modules/integration/production-orders/infrastructure/gateways/consult/real-production-order-consult.gateway";
import { SyncProductionOrderItemsUseCase } from "@/modules/integration/production-orders/application/use-cases/sync-production-order-items.usecase";

const logger = getLogger("backfill-production-order-items");

async function main() {
    logger.info("Starting one-shot backfill of production order items");

    // Contar quantas ordens precisam de itens
    const total = await prisma.omieProductionOrder.count({
        where: { items: { none: {} } },
    });

    logger.info("Orders needing items", { total });

    if (total === 0) {
        logger.info("No orders need items - nothing to do");
        await prisma.$disconnect();
        return;
    }

    // Criar cliente HTTP Omie + gateway de consulta
    const omieClient = new OmieClientWithCircuitBreaker({
        appKey: env.OMIE_APP_KEY,
        appSecret: env.OMIE_APP_SECRET,
        baseUrl: env.OMIE_BASE_URL ?? "https://app.omie.com.br",
    });

    const consultGateway = new RealProductionOrderConsultGateway(omieClient);
    const useCase = new SyncProductionOrderItemsUseCase(consultGateway, prisma);

    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalFailed = 0;
    let batchNumber = 0;

    while (true) {
        batchNumber++;
        const externalRequestId = `backfill-items-${Date.now()}-batch-${batchNumber}`;

        logger.info("Processing batch", { batchNumber, externalRequestId });

        const result = await useCase.execute({
            externalRequestId,
            maxOrders: 100,
        });

        totalProcessed += result.processed;
        totalUpdated += result.updated;
        totalFailed += result.failed;

        logger.info("Batch completed", {
            batchNumber,
            processed: result.processed,
            updated: result.updated,
            failed: result.failed,
            totalProcessed,
            totalUpdated,
            totalFailed,
            hasMore: result.hasMore,
        });

        if (!result.hasMore) break;

        // Pequena pausa entre lotes
        await sleep(300);
    }

    logger.info("Backfill completed", {
        totalProcessed,
        totalUpdated,
        totalFailed,
    });

    await prisma.$disconnect();
}

main().catch((error) => {
    logger.error("Backfill failed", { error: String(error) });
    prisma.$disconnect();
    process.exit(1);
});
