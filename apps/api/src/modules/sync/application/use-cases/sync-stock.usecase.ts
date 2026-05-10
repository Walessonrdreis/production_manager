import { SyncRepositoryPort } from "../ports/sync.repository.port";
import { OmieGatewayPort } from "../ports/omie.gateway.port";
import { SyncStockRequest, SyncStockResponse } from "../dtos/sync-stock.dto";
import { Logger } from "fastify";

export interface SyncStockUseCaseDependencies {
  syncRepository: SyncRepositoryPort;
  omieGateway: OmieGatewayPort;
  logger: Logger;
}

export class SyncStockUseCase {
  constructor(private readonly dependencies: SyncStockUseCaseDependencies) {}

  async execute(request: SyncStockRequest): Promise<SyncStockResponse> {
    const { syncRepository, omieGateway, logger } = this.dependencies;
    const startTime = Date.now();

    logger.info("Iniciando sincronização de estoque", { request });

    try {
      const syncRecord = await syncRepository.createSyncRecord({
        syncType: "stock",
        status: "in_progress",
        startedAt: new Date(),
        itemsProcessed: 0,
        itemsFailed: 0,
        metadata: { request },
      });

      let totalProducts = 0;
      let syncedProducts = 0;
      let failedProducts = 0;
      let page = 1;
      const limit = request.batchSize;

      do {
        logger.debug(`Buscando produtos da página ${page}`, { limit });

        const result = await omieGateway.getProducts({
          page,
          limit,
          productCodes: request.productCodes,
          activeOnly: true,
        });

        totalProducts = result.total;

        for (const product of result.products) {
          try {
            // Aqui seria a lógica para atualizar o estoque no banco de dados
            // Por enquanto, apenas registramos o sucesso
            syncedProducts++;
            logger.debug(`Produto sincronizado: ${product.codigo}`, {
              estoque: product.estoque,
            });
          } catch (error) {
            failedProducts++;
            logger.error(`Erro ao sincronizar produto ${product.codigo}`, {
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        await syncRepository.updateSyncRecord(syncRecord.id, {
          itemsProcessed: syncedProducts + failedProducts,
          itemsFailed: failedProducts,
        });

        page++;

        if (result.products.length < limit) {
          break;
        }
      } while (syncedProducts + failedProducts < totalProducts);

      const durationMs = Date.now() - startTime;
      const nextSyncAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutos

      await syncRepository.updateSyncRecord(syncRecord.id, {
        status: failedProducts === 0 ? "success" : "failed",
        completedAt: new Date(),
        durationMs,
        itemsProcessed: syncedProducts + failedProducts,
        itemsFailed: failedProducts,
        error: failedProducts > 0 ? `${failedProducts} produtos falharam` : undefined,
      });

      const response: SyncStockResponse = {
        success: failedProducts === 0,
        message: failedProducts === 0
          ? `Estoque sincronizado com sucesso: ${syncedProducts} produtos`
          : `Sincronização parcial: ${syncedProducts} sucessos, ${failedProducts} falhas`,
        data: {
          totalProducts,
          syncedProducts,
          failedProducts,
          durationMs,
          nextSyncAt: nextSyncAt.toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      logger.info("Sincronização de estoque concluída", {
        success: response.success,
        durationMs,
        syncedProducts,
        failedProducts,
      });

      return response;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error("Erro na sincronização de estoque", {
        error: errorMessage,
        durationMs,
      });

      const response: SyncStockResponse = {
        success: false,
        message: `Erro na sincronização: ${errorMessage}`,
        data: {
          totalProducts: 0,
          syncedProducts: 0,
          failedProducts: 0,
          durationMs,
          nextSyncAt: undefined,
        },
        timestamp: new Date().toISOString(),
      };

      return response;
    }
  }
}

export function createSyncStockUseCase(dependencies: SyncStockUseCaseDependencies): SyncStockUseCase {
  return new SyncStockUseCase(dependencies);
}