import type { FastifyInstance } from "fastify";
import { registerStockAlertsRoutes } from "./presentation/http/stock-alerts.routes";
import { StockAlertsController } from "./presentation/http/stock-alerts.controller";
import { createListStockAlertsUseCase } from "./application/use-cases/list-stock-alerts.usecase";
import { createConfigureAlertsUseCase } from "./application/use-cases/configure-alerts.usecase";
import { createUpdateAlertStatusUseCase } from "./application/use-cases/update-alert-status.usecase";
import { createAlertsRepository } from "./infrastructure/db/alerts.repository.prisma";

/**
 * Registra o módulo alerts na aplicação Fastify
 * Configura todas as dependências e rotas do módulo
 */
export function registerAlertsModule(app: FastifyInstance): void {
  // Criar repositórios
  const alertsRepository = createAlertsRepository(app.prisma);
  
  // Criar casos de uso
  const listStockAlertsUseCase = createListStockAlertsUseCase({
    alertsRepository,
    logger: app.log,
  });
  
  const configureAlertsUseCase = createConfigureAlertsUseCase({
    alertsRepository,
    logger: app.log,
  });
  
  const updateAlertStatusUseCase = createUpdateAlertStatusUseCase({
    alertsRepository,
    logger: app.log,
  });
  
  // Criar controller
  const stockAlertsController = new StockAlertsController(
    listStockAlertsUseCase,
    configureAlertsUseCase,
    updateAlertStatusUseCase
  );
  
  // Registrar dependências no contêiner DI do Fastify
  app.decorate("diContainer", {
    resolve: (name: string) => {
      const dependencies: Record<string, any> = {
        alertsRepository,
        listStockAlertsUseCase,
        configureAlertsUseCase,
        updateAlertStatusUseCase,
        stockAlertsController,
      };
      
      if (!dependencies[name]) {
        throw new Error(`Dependency ${name} not found`);
      }
      
      return dependencies[name];
    },
  });
  
  // Registrar rotas
  registerStockAlertsRoutes(app, stockAlertsController);
  
  app.log.info("Módulo alerts registrado com sucesso");
}