// File: apps/api/src/modules/orders-enriched/application/ports/stage20-orders-fetcher.port.ts

export type Stage20OrdersQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
};

export interface Stage20OrdersFetcher {
  fetch(query: Stage20OrdersQuery): Promise<any>;
}
