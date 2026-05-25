// File: apps/api/src/modules/orders-enriched/register.ts

import type { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";

import { ordersEnrichedRoutes } from "./presentation/http/orders-enriched.routes";
import { Stage20OrdersFetcherFastify } from "./infrastructure/integrations/internal/stage20-orders.fetcher.fastify";
import { ClientLookupPrisma } from "./infrastructure/db/client-lookup.prisma";
import { ListStage20OrdersEnrichedUseCase } from "./application/use-cases/list-stage20-orders-enriched.usecase";

export async function registerOrdersEnrichedModule(app: FastifyInstance) {
  const prisma = app.prisma as PrismaClient;

  const ordersFetcher = new Stage20OrdersFetcherFastify(app);
  const clientLookup = new ClientLookupPrisma(prisma);

  const listStage20OrdersEnrichedUseCase = new ListStage20OrdersEnrichedUseCase(
    ordersFetcher,
    clientLookup
  );

  app.decorate("listStage20OrdersEnrichedUseCase", listStage20OrdersEnrichedUseCase);

  await app.register(ordersEnrichedRoutes, { prefix: "/v1" });
}