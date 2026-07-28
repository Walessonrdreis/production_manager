import { prisma } from "@/shared/db/prisma";

export type ProductCatalogProductionReadyRecord = {
  productCode: string;
  omieCode: string | null;
  description: string;
  sku: string | null;
  active: boolean;
  family: string | null;
  unit: string | null;
  salePrice: number | null;
  cost: number | null;
  margin: number | null;
  stock: number;
  minimumStock: number;
  available: boolean;
  belowMinimumStock: boolean;
  hasStructure: boolean;
  structureItemsCount: number;
  structureItemsBelowMinStock: number;
  hasOpenProductionOrder: boolean;
  openProductionOrderCount: number;
  hasOpenSalesOrderStage20: boolean;
  openSalesOrderStage20Count: number;
  lastSyncAt: Date | null;
};

export type ListProductionReadyParams = {
  q?: string | null;
  onlyActive?: boolean;
  onlyInStock?: boolean;
  minStock?: number;
  limit?: number;
  offset?: number;
  sort?: "description" | "productCode" | "stock" | "lastSyncAt";
  order?: "asc" | "desc";
  withAvailability?: boolean;
  onlyWithOpenOrders?: boolean;
};

export class ProductCatalogProductionReadyReadModelStore {
  async replaceAll(records: ProductCatalogProductionReadyRecord[]) {
    await prisma.$transaction(async (tx) => {
      await tx.productCatalogProductionReadyReadModel.deleteMany({});

      if (records.length === 0) {
        return;
      }

      await tx.productCatalogProductionReadyReadModel.createMany({
        data: records.map((record) => ({
          productCode: record.productCode,
          omieCode: record.omieCode,
          description: record.description,
          sku: record.sku,
          active: record.active,
          family: record.family,
          unit: record.unit,
          salePrice: record.salePrice,
          cost: record.cost,
          margin: record.margin,
          stock: record.stock,
          minimumStock: record.minimumStock,
          available: record.available,
          belowMinimumStock: record.belowMinimumStock,
          hasStructure: record.hasStructure,
          structureItemsCount: record.structureItemsCount,
          structureItemsBelowMinStock: record.structureItemsBelowMinStock,
          hasOpenProductionOrder: record.hasOpenProductionOrder,
          openProductionOrderCount: record.openProductionOrderCount,
          hasOpenSalesOrderStage20: record.hasOpenSalesOrderStage20,
          openSalesOrderStage20Count: record.openSalesOrderStage20Count,
          lastSyncAt: record.lastSyncAt,
        })),
      });
    });
  }

  async list(params: ListProductionReadyParams) {
    const {
      q = null,
      onlyActive = true,
      onlyInStock = false,
      minStock = 0,
      limit = 100,
      offset = 0,
      sort = "description",
      order = "asc",
      withAvailability = true,
      onlyWithOpenOrders = false,
    } = params;

    const safeLimit = Math.max(1, Math.min(Number(limit || 100), 500));
    const safeOffset = Math.max(0, Number(offset || 0));
    const safeMinStock = Math.max(0, Number(minStock || 0));

    const stockWhere =
      onlyInStock || withAvailability || safeMinStock > 0
        ? {
          gte: onlyInStock || withAvailability || safeMinStock > 0
            ? Math.max(onlyInStock ? 1 : 0, safeMinStock)
            : undefined,
        }
        : undefined;

    const where = {
      ...(onlyActive ? { active: true } : {}),
      ...(q
        ? {
          OR: [
            { description: { contains: q, mode: "insensitive" as const } },
            { productCode: { contains: q, mode: "insensitive" as const } },
            { sku: { contains: q, mode: "insensitive" as const } },
            { family: { contains: q, mode: "insensitive" as const } },
          ],
        }
        : {}),
      ...(stockWhere ? { stock: stockWhere } : {}),
      ...(withAvailability ? { available: true } : {}),
      ...(onlyWithOpenOrders ? { hasOpenSalesOrderStage20: true } : {}),
    };

    const orderBy =
      sort === "productCode"
        ? { productCode: order }
        : sort === "stock"
          ? { stock: order }
          : sort === "lastSyncAt"
            ? { lastSyncAt: order }
            : { description: order };

    const [total, availableCount, rows] = await Promise.all([
      prisma.productCatalogProductionReadyReadModel.count({ where }),
      prisma.productCatalogProductionReadyReadModel.count({
        where: {
          ...where,
          available: true,
        },
      }),
      prisma.productCatalogProductionReadyReadModel.findMany({
        where,
        orderBy,
        take: safeLimit,
        skip: safeOffset,
      }),
    ]);

    return {
      summary: {
        total,
        available: availableCount,
        unavailable: total - availableCount,
      },
      meta: {
        pageSize: safeLimit,
        pageCount: rows.length,
        offset: safeOffset,
      },
      data: rows,
    };
  }
}