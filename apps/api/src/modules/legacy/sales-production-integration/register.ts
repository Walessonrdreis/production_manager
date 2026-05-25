import type { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { getLogger } from "@/shared/logger";
import { ProductionQueueRepositoryPrisma } from "@/modules/legacy/production-queue/infrastructure/db/production-queue.repository.prisma";
import { SalesToProductionUseCase } from "./application/use-cases/sales-to-production.usecase";
import { IntegrationStatisticsUseCase } from "./application/use-cases/integration-statistics.usecase";
import { SalesProductionIntegrationController } from "./presentation/http/sales-production-integration.controller";
import { registerSalesProductionIntegrationRoutes } from "./presentation/http/sales-production-integration.routes";

export function registerSalesProductionIntegrationModule(app: FastifyInstance) {
  const logger = getLogger("sales-production-integration");
  const prisma = new PrismaClient();
  
  // Repositórios
  const productionQueueRepository = new ProductionQueueRepositoryPrisma(prisma);
  
  // Use Cases
  const salesToProductionUseCase = new SalesToProductionUseCase({
    productionQueueRepository,
    logger,
  });
  
  const integrationStatisticsUseCase = new IntegrationStatisticsUseCase({
    productionQueueRepository,
    logger,
  });
  
  // Controller
  const controller = new SalesProductionIntegrationController(
    salesToProductionUseCase,
    integrationStatisticsUseCase
  );
  
  // Registrar rotas
  registerSalesProductionIntegrationRoutes(app, controller);
  
  logger.info("Módulo de integração vendas→produção registrado");
}