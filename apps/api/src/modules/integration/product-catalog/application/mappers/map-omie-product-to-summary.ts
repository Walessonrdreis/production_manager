type RawPayload = {
  unidade?: string;
};

function extractUnit(raw: unknown): string | null {
  if (
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw)
  ) {
    const payload = raw as RawPayload;

    if (typeof payload.unidade === "string") {
      return payload.unidade;
    }
  }

  return null;
}

export type ProductCatalogSummary = {
  productCode: string;
  description: string;
  sku: string | null;
  active: boolean;
  family: string | null;
  unit: string | null;
  lastSyncAt: Date;
};

export function mapOmieProductToSummary(record: {
  omieCode: string;
  description: string;
  sku: string | null;
  familyDescription: string | null;
  active: boolean;
  lastSyncAt: Date;
  rawPayload: unknown;
}): ProductCatalogSummary {
  return {
    productCode: record.omieCode,
    description: record.description,
    sku: record.sku || null,
    active: record.active,
    family: record.familyDescription || null,
    unit: extractUnit(record.rawPayload),
    lastSyncAt: record.lastSyncAt,
  };
}