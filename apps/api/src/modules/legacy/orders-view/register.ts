import type { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";

import { OrdersViewRepository } from "./infrastructure/orders-view.repository.prisma";
import { ListOrdersViewUseCase } from "./application/list-orders-view.usecase";
import { ordersViewRoutes } from "./presentation/orders-view.routes";

export async function registerOrdersViewModule(app: FastifyInstance) {
  const prisma = app.prisma as PrismaClient;

  const repo = new OrdersViewRepository(prisma);
  const useCase = new ListOrdersViewUseCase(repo);

  app.decorate("ordersViewUseCase", useCase);

  await app.register(ordersViewRoutes, { prefix: "/v1" });
}