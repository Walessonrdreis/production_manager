import { AppError } from "@/shared/errors/AppError";
import { OmieAdapter } from "@/shared/integrations/omie";

function toNumber(value: any): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value.trim().replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  const asString = typeof value?.toString === "function" ? value.toString() : String(value);
  const parsed = Number(String(asString).trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function createGetOmieProductStockUseCase(deps: { prisma: any }) {
  async function latestStockByCode(omieCode: string) {
    const rows = await deps.prisma.productStock.findMany({
      where: { omieCode },
      orderBy: { capturedAt: "desc" },
      take: 1,
      select: { stockQuantity: true, minimumStock: true, capturedAt: true },
    });

    const latest = rows?.[0];
    if (!latest) throw new AppError("STOCK_NOT_FOUND", 404, "Stock not found");

    const rawQty = toNumber(latest.stockQuantity);
    const rawMin = toNumber(latest.minimumStock);
    const reported = rawQty != null || rawMin != null;

    return {
      omieCode,
      quantity: (rawQty ?? 0).toFixed(4),
      minimum: (rawMin ?? 0).toFixed(4),
      reported,
      rawQuantity: rawQty == null ? null : rawQty.toFixed(4),
      rawMinimum: rawMin == null ? null : rawMin.toFixed(4),
      stockQuantity: (rawQty ?? 0).toFixed(4),
      minimumStock: (rawMin ?? 0).toFixed(4),
      capturedAt: latest.capturedAt,
      stockCacheUpdatedAt: latest.capturedAt.toISOString(),
    };
  }

  return {
    async byOmieProductId(input: { id: string }) {
      const omieProduct = await deps.prisma.omieProduct.findUnique({
        where: { id: input.id },
        select: { id: true, omieCode: true, omieId: true, rawPayload: true },
      });

      if (!omieProduct) {
        throw new AppError("OMIE_PRODUCT_NOT_FOUND", 404, "Omie product not found");
      }

      const extracted = OmieAdapter.extractProductCode(omieProduct.rawPayload)?.trim();
      const omieCode = extracted || omieProduct.omieCode?.trim() || omieProduct.omieId?.trim();

      if (!omieCode) throw new AppError("OMIE_CODE_NOT_FOUND", 422, "Omie code not found");

      const data = await latestStockByCode(omieCode);
      return { omieProductId: omieProduct.id, ...data };
    },

    async byOmieCode(input: { omieCode: string }) {
      const data = await latestStockByCode(input.omieCode);
      return data;
    },
  };
}