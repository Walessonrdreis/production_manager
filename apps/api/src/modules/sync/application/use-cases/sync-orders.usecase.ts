import { SyncRepositoryPort } from "../ports/sync.repository.port";
import { OmieGatewayPort } from "../ports/omie.gateway.port";
import { SyncOrdersRequest, SyncOrdersResponse } from "../dtos/sync-orders.dto";
import { Logger } from "fastify";

export interface SyncOrdersUseCaseDependencies {
  syncRepository: SyncRepositoryPort;
  omieGateway: OmieGatewayPort;
  logger: Logger;
}

export class SyncOrdersUseCase {
  constructor(private readonly dependencies: SyncOrdersUseCaseDependencies) {}

  async execute(request: SyncOrdersRequest): Promise<SyncOrdersResponse> {
    const { syncRepository, omieGateway, logger } = this.dependencies;
    const startTime = Date.now();

    logger.info("Iniciando sincronização de pedidos", { request });

    try {
      const syncRecord = await syncRepository.createSyncRecord({
        syncType: "orders",
        status: "in_progress",
        startedAt: new Date(),
        itemsProcessed: 0,
        itemsFailed: 0,
        metadata: { request },
      });

      let totalOrders = 0;
      let syncedOrders = 0;
      let failedOrders = 0;
      let productionOrders = 0;
      let salesOrders = 0;

      // Sincronizar pedidos de produção
      if (request.includeProductionOrders) {
        logger.info("Sincronizando pedidos de produção");

        let productionPage = 1;
        const productionLimit = request.batchSize;

        do {
          const result = await omieGateway.getProductionOrders({
            page: productionPage,
            limit: productionLimit,
            status: request.orderStatus === "all" ? undefined : request.orderStatus,
            dateFrom: request.dateFrom ? new Date(request.dateFrom) : undefined,
            dateTo: request.dateTo ? new Date(request.dateTo) : undefined,
          });

          totalOrders += result.total;

          for (const order of result.orders) {
            try {
              // Aqui seria a lógica para atualizar o pedido no banco de dados
              syncedOrders++;
              productionOrders++;
              logger.debug(`Pedido de produção sincronizado: ${order.codigo_pedido}`, {
                status: order.status,
                etapa: order.etapa,
              });
            } catch (error) {
              failedOrders++;
              logger.error(`Erro ao sincronizar pedido de produção ${order.codigo_pedido}`, {
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }

          productionPage++;

          if (result.orders.length < productionLimit) {
            break;
          }
        } while (productionOrders + (failedOrders / 2) < totalOrders / 2);
      }

      // Sincronizar pedidos de venda
      if (request.includeSalesOrders) {
        logger.info("Sincronizando pedidos de venda");

        let salesPage = 1;
        const salesLimit = request.batchSize;

        do {
          const result = await omieGateway.getSalesOrders({
            page: salesPage,
            limit: salesLimit,
            status: request.orderStatus === "all" ? undefined : request.orderStatus,
            dateFrom: request.dateFrom ? new Date(request.dateFrom) : undefined,
            dateTo: request.dateTo ? new Date(request.dateTo) : undefined,
          });

          totalOrders += result.total;

          for (const order of result.orders) {
            try {
              // Aqui seria a lógica para atualizar o pedido no banco de dados
              syncedOrders++;
              salesOrders++;
              logger.debug(`Pedido de venda sincronizado: ${order.cabecalho.codigo_pedido}`, {
                status: order.cabecalho.status,
                etapa: order.cabecalho.etapa,
              });
            } catch (error) {
              failedOrders++;
              logger.error(`Erro ao sincronizar pedido de venda ${order.cabecalho.codigo_pedido}`, {
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }

          salesPage++;

          if (result.orders.length < salesLimit) {
            break;
          }
        } while (salesOrders + (failedOrders / 2) < totalOrders / 2);
      }

      const durationMs = Date.now() - startTime;
      const nextSyncAt = new Date(Date.now() + 60 * 1000); // 1 minuto

      await syncRepository.updateSyncRecord(syncRecord.id, {
        status: failedOrders === 0 ? "success" : "failed",
        completedAt: new Date(),
        durationMs,
        itemsProcessed: syncedOrders + failedOrders,
        itemsFailed: failedOrders,
        error: failedOrders > 0 ? `${failedOrders} pedidos falharam` : undefined,
      });

      const response: SyncOrdersResponse = {
        success: failedOrders === 0,
        message: failedOrders === 0
          ? `Pedidos sincronizados com sucesso: ${syncedOrders} pedidos`
          : `Sincronização parcial: ${syncedOrders} sucessos, ${failedOrders} falhas`,
        data: {
          totalOrders,
          syncedOrders,
          failedOrders,
          productionOrders,
          salesOrders,
          durationMs,
          nextSyncAt: nextSyncAt.toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      logger.info("Sincronização de pedidos concluída", {
        success: response.success,
        durationMs,
        syncedOrders,
        failedOrders,
        productionOrders,
        salesOrders,
      });

      return response;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error("Erro na sincronização de pedidos", {
        error: errorMessage,
        durationMs,
      });

      const response: SyncOrdersResponse = {
        success: false,
        message: `Erro na sincronização: ${errorMessage}`,
        data: {
          totalOrders: 0,
          syncedOrders: 0,
          failedOrders: 0,
          productionOrders: 0,
          salesOrders: 0,
          durationMs,
          nextSyncAt: undefined,
        },
        timestamp: new Date().toISOString(),
      };

      return response;
    }
  }
}

export function createSyncOrdersUseCase(dependencies: SyncOrdersUseCaseDependencies): SyncOrdersUseCase {
  return new SyncOrdersUseCase(dependencies);
}