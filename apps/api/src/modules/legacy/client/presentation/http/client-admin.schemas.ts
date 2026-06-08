// File: apps/api/src/modules/client/presentation/http/client-admin.schemas.ts

export const syncClientsFromOmieSchema = {
  tags: ["client"],
  summary: "Sync clients from Omie into local database (admin)",
  response: {
    204: { type: "null" },
  },
} as const;
