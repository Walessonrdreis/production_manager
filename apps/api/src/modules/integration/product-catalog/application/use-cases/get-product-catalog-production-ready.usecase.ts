import type {
  GetProductCatalogProductionReadyResponseDTO,
  ProductCatalogProductionReadyStatus,
} from "../dto/get-product-catalog-production-ready.dto";

import type {
  ListProductionReadyParams,
  ProductCatalogProductionReadyRecord,
} from "../../infrastructure/db/product-catalog-production-ready-read-model.store";

import { ProductCatalogProductionReadyReadModelStore } from "../../infrastructure/db/product-catalog-production-ready-read-model.store";

function resolveProductStatus(
  record: ProductCatalogProductionReadyRecord
): ProductCatalogProductionReadyStatus {
  if (!record.active) return "INACTIVE";

  if (!record.hasStructure) return "NO_STRUCTURE";

  const hasDemand =
    record.hasOpenSalesOrderStage20 ||
    record.openSalesOrderStage20Count > 0;

  if (!record.available) {
    if (hasDemand) return "NO_STOCK_WITH_DEMAND";
    return "NO_STOCK";
  }

  if (hasDemand) return "READY_WITH_DEMAND";

  return "READY";
}

export class GetProductCatalogProductionReadyUseCase {
  constructor(
    private readonly store = new ProductCatalogProductionReadyReadModelStore()
  ) {}

  async execute(
    params: ListProductionReadyParams = {}
  ): Promise<GetProductCatalogProductionReadyResponseDTO> {
    const result = await this.store.list(params);

    return {
      summary: result.summary,
      meta: result.meta,

      isDataFullyReady: result.summary.total > 0,

      // ✅🔥 CORREÇÃO AQUI
      data: result.data.map((record) => ({
        productCode: record.productCode,
        omieCode: record.omieCode ?? null,
        description: record.description,
        sku: record.sku ?? null,
        active: record.active,
        family: record.family ?? null,
        unit: record.unit ?? null,
        lastSyncAt: record.lastSyncAt,

        salePrice:
          record.salePrice != null ? Number(record.salePrice) : null,
        cost:
          record.cost != null ? Number(record.cost) : null,
        margin:
          record.margin != null ? Number(record.margin) : null,

        stock: Number(record.stock),
        minimumStock: Number(record.minimumStock),
        available: record.available,
        belowMinimumStock: record.belowMinimumStock,

        hasStructure: record.hasStructure,
        structureItemsCount: record.structureItemsCount,
        structureItemsBelowMinStock: record.structureItemsBelowMinStock,

        hasOpenProductionOrder: record.hasOpenProductionOrder,
        openProductionOrderCount: record.openProductionOrderCount,

        hasOpenSalesOrderStage20:
          record.hasOpenSalesOrderStage20,

        openSalesOrderStage20Count:
          record.openSalesOrderStage20Count,

        status: resolveProductStatus(record),
      })),
    };
  }
}