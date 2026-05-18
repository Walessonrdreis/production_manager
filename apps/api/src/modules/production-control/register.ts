import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { productionControlRoutes } from './presentation/http/routes';
import { ProductionControlController } from './presentation/http/production-control.controller';
import { SnapshotRepositoryPrisma } from './infrastructure/db/snapshot.repository.prisma';
import { ProductRepositoryPrisma } from './infrastructure/db/product.repository.prisma';
import { OrderRepositoryPrisma } from './infrastructure/db/order.repository.prisma';
import { HistoryRepositoryPrisma } from './infrastructure/db/history.repository.prisma';
import { Stage20FetcherFastify } from './infrastructure/integrations/internal/stage20-fetcher.fastify';
import { SnapshotService } from './application/services/snapshot.service';
import { ReconciliationService } from './application/services/reconciliation.service';
import { HistoryService } from './application/services/history.service';
import { CreateSnapshotUseCase } from './application/use-cases/create-snapshot.usecase';
import { ListSnapshotsUseCase } from './application/use-cases/list-snapshots.usecase';
import { ToggleCheckUseCase } from './application/use-cases/toggle-check.usecase';
import { UpdateDatesUseCase } from './application/use-cases/update-dates.usecase';
import { GetHistoryUseCase } from './application/use-cases/get-history.usecase';

export async function registerProductionControlModule(app: FastifyInstance) {
  const prisma = new PrismaClient();

  // Repositories
  const snapshotRepository = new SnapshotRepositoryPrisma(prisma);
  const productRepository = new ProductRepositoryPrisma(prisma);
  const orderRepository = new OrderRepositoryPrisma(prisma);
  const historyRepository = new HistoryRepositoryPrisma(prisma);

  // Integrations
  const stage20Fetcher = new Stage20FetcherFastify(app);

  // Services
  const snapshotService = new SnapshotService(
    snapshotRepository,
    productRepository,
    orderRepository
  );
  const reconciliationService = new ReconciliationService(
    snapshotRepository,
    productRepository,
    orderRepository
  );
  const historyService = new HistoryService(historyRepository);

  // Use Cases
  const createSnapshotUseCase = new CreateSnapshotUseCase(
    snapshotRepository,
    productRepository,
    orderRepository,
    stage20Fetcher,
    snapshotService,
    reconciliationService,
    historyService
  );

  const listSnapshotsUseCase = new ListSnapshotsUseCase(snapshotRepository);
  const toggleCheckUseCase = new ToggleCheckUseCase(
    productRepository,
    orderRepository,
    reconciliationService,
    historyService
  );
  const updateDatesUseCase = new UpdateDatesUseCase(
    productRepository,
    historyService
  );
  const getHistoryUseCase = new GetHistoryUseCase(historyRepository);

  // Controller
  const controller = new ProductionControlController({
    createSnapshotUseCase,
    listSnapshotsUseCase,
    toggleCheckUseCase,
    updateDatesUseCase,
    getHistoryUseCase,
  });

  // Routes
  app.register(productionControlRoutes, { controller });

  console.log('✅ Módulo production-control registrado');
}