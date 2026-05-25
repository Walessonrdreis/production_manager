// File: apps/api/src/modules/orders-enriched/infrastructure/integrations/internal/stage20-orders.fetcher.fastify.ts

import type { FastifyInstance } from "fastify";
import { Stage20OrdersFetcher, Stage20OrdersQuery } from "../../../application/ports/stage20-orders-fetcher.port";

export class Stage20OrdersFetcherFastify implements Stage20OrdersFetcher {
  constructor(private readonly app: FastifyInstance) {}

  async fetch(query: Stage20OrdersQuery): Promise<any> {
    const qs = new URLSearchParams();

    if (query.page) qs.set("page", String(query.page));
    if (query.pageSize) qs.set("pageSize", String(query.pageSize));
    if (query.q) qs.set("q", query.q);

    const url = `/v1/admin/orders/stage20${qs.toString() ? `?${qs.toString()}` : ""}`;

    const res = await this.app.inject({
      method: "GET",
      url,
    });

    if (res.statusCode >= 400) {
      // repassa a resposta legada para diagnóstico
      throw new Error(`Failed to fetch stage20 orders. status=${res.statusCode} body=${res.body}`);
    }

    return res.json();
  }
}