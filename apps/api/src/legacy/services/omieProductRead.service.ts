import { prisma } from '../../infra/db';
import { OmieAdapter } from '../integrations/omie/OmieAdapter';

function toStringOrNull(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = typeof value === 'string' ? value : typeof (value as any)?.toString === 'function' ? (value as any).toString() : String(value);
  const trimmed = String(s).trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function listOmieProductsWithCurrentStock(): Promise<{
  items: Array<Record<string, any>>;
  stockUpdatedAt: string | null;
}> {
  const items = await prisma.omieProduct.findMany({
    orderBy: { description: 'asc' },
  });

  const codes = Array.from(
    new Set(items.map((item: any) => String(item.omieCode).trim()).filter(Boolean))
  );

  if (codes.length === 0) {
    return { items: [], stockUpdatedAt: null };
  }

  const stockRows = await (prisma as any).productStock.findMany({
    where: { omieCode: { in: codes } },
    select: {
      omieCode: true,
      stockQuantity: true,
      minimumStock: true,
      updatedAt: true,
      capturedAt: true,
    },
  });

  const stockByCode = new Map<string, any>();
  let latestUpdatedAt: Date | null = null;

  for (const row of stockRows) {
    const code = String(row.omieCode).trim();
    stockByCode.set(code, row);

    const candidate: Date | null = (row.updatedAt ?? row.capturedAt) ?? null;
    if (candidate && (!latestUpdatedAt || candidate.getTime() > latestUpdatedAt.getTime())) {
      latestUpdatedAt = candidate;
    }
  }

  const enriched = items.map((item: any) => {
    const code = String(item.omieCode).trim();
    const stock = stockByCode.get(code);

    const stockQuantity = toStringOrNull(stock?.stockQuantity) ?? '0';
    const minimumStock = toStringOrNull(stock?.minimumStock) ?? '0';

    return {
      ...item,
      code,
      familyDescription: item.familyDescription ?? OmieAdapter.extractFamilyDescription(item.rawPayload),
      stockQuantity,
      minimumStock,
    };
  });

  return {
    items: enriched,
    stockUpdatedAt: latestUpdatedAt ? latestUpdatedAt.toISOString() : null,
  };
}

