import type { FastifyInstance } from "fastify";
import { createProductionQueueRepository } from "./infrastructure/db/production-queue.repository.prisma";
import { createAddToQueueUseCase } from "./application/use-cases/add-to-queue.usecase";
import { createListQueueUseCase } from "./application/use-cases/list-queue.usecase";
import { createUpdateQueueStatusUseCase } from "./application/use-cases/update-queue-status.usecase";
import { createQueueStatisticsUseCase } from "./application/use-cases/queue-statistics.usecase";
import { createReorderQueueUseCase } from "./application/use-cases/reorder-queue.usecase";
import { ProductionQueueController } from "./presentation/http/production-queue.controller";
import { registerProductionQueueRoutes } from "./presentation/http/production-queue.routes";

/**
 * Registra o módulo production-queue na aplicação Fastify
 * Configura todas as dependências e rotas do módulo
 */
export function registerProductionQueueModule(app: FastifyInstance): void {
  // Criar repositórios
  const productionQueueRepository = createProductionQueueRepository(app.prisma);
  
  // Criar casos de uso
  const addToQueueUseCase = createAddToQueueUseCase({
    productionQueueRepository,
    logger: app.log,
  });
  
  const listQueueUseCase = createListQueueUseCase({
    productionQueueRepository,
    logger: app.log,
  });
  
  const updateQueueStatusUseCase = createUpdateQueueStatusUseCase({
    productionQueueRepository,
    logger: app.log,
  });
  
  const queueStatisticsUseCase = createQueueStatisticsUseCase({
    productionQueueRepository,
    logger: app.log,
  });
  
  const reorderQueueUseCase = createReorderQueueUseCase({
    productionQueueRepository,
    logger: app.log,
  });
  
  // Criar controller
  const productionQueueController = new ProductionQueueController(
    addToQueueUseCase,
    listQueueUseCase,
    updateQueueStatusUseCase,
    queueStatisticsUseCase,
    reorderQueueUseCase
  );
  
  // Registrar dependências no contêiner DI do Fastify
  app.decorate("diContainer", {
    resolve: (name: string) => {
      const dependencies: Record<string, any> = {
        productionQueueRepository,
        addToQueueUseCase,
        listQueueUseCase,
        updateQueueStatusUseCase,
        queueStatisticsUseCase,
        reorderQueueUseCase,
        productionQueueController,
      };
      
      if (!dependencies[name]) {
        throw new Error(`Dependency ${name} not found`);
      }
      
      return dependencies[name];
    },
  });
  
  // Registrar rotas
  registerProductionQueueRoutes(app, productionQueueController);
  
  app.log.info("Módulo production-queue registrado com sucesso");
}