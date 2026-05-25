// File: apps/api/src/modules/orders-enriched/presentation/http/orders-enriched.schemas.ts

export const listStage20OrdersEnrichedSchema = {
  tags: ["orders"],
  summary: "List stage20 orders enriched with client data (local DB)",
  querystring: {
    type: "object",
    properties: {
      page: { type: "string" },
      pageSize: { type: "string" },
      q: { type: "string" },
    },
  },
} as const;