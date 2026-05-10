import type { FastifyInstance } from "fastify";
import { registerSyncRoutes } from "./presentation/http/sync.routes";
import { createSyncStockUseCase } from "./application/use-cases/sync-stock.usecase";
import { createSyncOrdersUseCase } from "./application/use-cases/sync-orders.usecase";
import { createGetSyncStatusUseCase } from "./application/use-cases/get-sync-status.usecase";
import { createSyncRepository } from "./infrastructure/db/sync.repository.prisma";
import { createOmieGateway } from "./infrastructure/integrations/omie.gateway";

/**
 * Registra o módulo sync na aplicação Fastify
 * Configura todas as dependências e rotas do módulo
 */
export function registerSyncModule(app: FastifyInstance): void {
  // Criar repositórios
  const syncRepository = createSyncRepository(app.prisma);
  
  // Criar gateways
  const omieGateway = createOmieGateway(app.log);
  
  // Criar casos de uso
  const syncStockUseCase = createSyncStockUseCase({
    syncRepository,
    omieGateway,
    logger: app.log,
  });
  
  const syncOrdersUseCase = createSyncOrdersUseCase({
    syncRepository,
    omieGateway,
    logger: app.log,
  });
  
  const getSyncStatusUseCase = createGetSyncStatusUseCase({
    syncRepository,
    logger: app.log,
  });
  
  // Registrar dependências no contêiner DI do Fastify
  app.decorate("diContainer", {
    resolve: (name: string) => {
      const dependencies: Record<string, any> = {
        syncRepository,
        omieGateway,
        syncStockUseCase,
        syncOrdersUseCase,
        getSyncStatusUseCase,
      };
      
      if (!dependencies[name]) {
        throw new Error(`Dependency ${name} not found`);
      }
      
      return dependencies[name];
    },
  });
  
  // Registrar rotas
  registerSyncRoutes(app);
  
  app.log.info("Módulo sync registrado com sucesso");
}