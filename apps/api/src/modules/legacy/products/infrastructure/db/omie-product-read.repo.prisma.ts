import { OmieAdapter } from "@/shared/integrations/omie";

type OmieProductRow = {
  omieCode: string;
  familyDescription?: string | null;
  rawPayload: unknown;
};

type ProductStockRow = {
  omieCode: string;
  stockQuantity: string | null;
  minimumStock: string | null;
  updatedAt?: Date | null;
  capturedAt?: Date | null;
};

export function createOmieProductReadRepoPrisma(prisma: any) {
  const productStock = (prisma as any).productStock ?? prisma.productStock;

  return {
    async listProducts() {
      return prisma.omieProduct.findMany({
        orderBy: { description: "asc" },
      });
    },

    async listStockByCodes(codes: string[]) {
      if (!codes.length) return [];

      return productStock.findMany({
        where: { omieCode: { in: codes } },
        select: {
          omieCode: true,
          stockQuantity: true,
          minimumStock: true,
          updatedAt: true,
          capturedAt: true,
        },
      });
    },

    enrichProduct(item: any, stockByCode: Map<string, ProductStockRow>) {
      const code = String(item.omieCode).trim();
      const stock = stockByCode.get(code);

      const stockQuantity = toStringOrNull(stock?.stockQuantity) ?? "0";
      const minimumStock = toStringOrNull(stock?.minimumStock) ?? "0";

      return {
        ...item,
        code,
        familyDescription:
          item.familyDescription ??
          OmieAdapter.extractFamilyDescription(item.rawPayload),
        stockQuantity,
        minimumStock,
      };
    },
  };
}

// helper local (não é shared)
function toStringOrNull(value: unknown): string | null {
  if (value === undefined || value === null) return null;

  const s =
    typeof value === "string"
      ? value
      : typeof (value as any)?.toString === "function"
      ? (value as any).toString()
      : String(value);

  const trimmed = String(s).trim();
  return trimmed.length > 0 ? trimmed : null;
}