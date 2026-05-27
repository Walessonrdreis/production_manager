export type IntegrationStatus = "ACCEPTED" | "CONFIRMED" | "FAILED";

export type ProductionOrderIntegrationRecord = {
  externalRequestId: string;
  productId: string;
  quantity: number;
  scheduledDate?: string;
  notes?: string;

  status: IntegrationStatus;

  // Quando estiver no real e conseguir extrair, ou quando reconciliar no futuro
  omieProductionOrderId?: number;

  createdAt: string;
  updatedAt: string;

  lastError?: {
    code: string;
    message: string;
  };
};

const store = new Map<string, ProductionOrderIntegrationRecord>();

function nowIso() {
  return new Date().toISOString();
}

export const productionOrderIntegrationStore = {
  upsertAccepted(input: Omit<ProductionOrderIntegrationRecord, "status" | "createdAt" | "updatedAt">) {
    const existing = store.get(input.externalRequestId);
    const createdAt = existing?.createdAt ?? nowIso();

    const record: ProductionOrderIntegrationRecord = {
      ...existing,
      ...input,
      status: "ACCEPTED",
      createdAt,
      updatedAt: nowIso(),
      lastError: undefined,
    };

    store.set(input.externalRequestId, record);
    return record;
  },

  markConfirmed(externalRequestId: string, omieProductionOrderId?: number) {
    const existing = store.get(externalRequestId);
    if (!existing) return null;

    const record: ProductionOrderIntegrationRecord = {
      ...existing,
      status: "CONFIRMED",
      omieProductionOrderId: omieProductionOrderId ?? existing.omieProductionOrderId,
      updatedAt: nowIso(),
      lastError: undefined,
    };

    store.set(externalRequestId, record);
    return record;
  },

  markFailed(externalRequestId: string, err: { code: string; message: string }) {
    const existing = store.get(externalRequestId);
    if (!existing) return null;

    const record: ProductionOrderIntegrationRecord = {
      ...existing,
      status: "FAILED",
      updatedAt: nowIso(),
      lastError: err,
    };

    store.set(externalRequestId, record);
    return record;
  },

  getByExternalRequestId(externalRequestId: string) {
    return store.get(externalRequestId) ?? null;
  },

  listByProductId(productId: string) {
    return Array.from(store.values()).filter((r) => r.productId === productId);
  },
};