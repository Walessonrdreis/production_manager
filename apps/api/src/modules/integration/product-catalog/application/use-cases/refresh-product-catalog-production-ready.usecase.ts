import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import { OmieAdapter } from "@/shared/integrations/omie/omie.adapter";
import {
  ProductCatalogProductionReadyReadModelStore,
  type ProductCatalogProductionReadyRecord,
} from "../../infrastructure/db/product-catalog-production-ready-read-model.store";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function getNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function extractUnit(rawPayload: unknown): string | null {
  const raw = asRecord(rawPayload);
  return getString(raw?.unidade);
}

function extractSalePrice(rawPayload: unknown): number | null {
  const raw = asRecord(rawPayload);
  return getNumber(raw?.valor_unitario);
}

function extractCost(rawPayload: unknown): number | null {
  const raw = asRecord(rawPayload);

  return (
    getNumber(raw?.custo_medio) ??
    getNumber(raw?.custoMedio) ??
    getNumber(raw?.cmc)
  );
}

export class RefreshProductCatalogProductionReadyUseCase {
  private readonly logger = getLogger(
    "RefreshProductCatalogProductionReadyUseCase"
  );

  constructor(
    private readonly readModelStore: ProductCatalogProductionReadyReadModelStore
  ) { }

  async execute() {
    this.logger.info("Starting production-ready read-model refresh");

    const [products, stocks, structures, productionOrders, stage20OrderItems, structureItems] =
      await Promise.all([
        prisma.omieProduct.findMany({
          select: {
            omieCode: true,
            omieId: true,
            description: true,
            sku: true,
            familyDescription: true,
            active: true,
            rawPayload: true,
            lastSyncAt: true,
          },
        }),

        prisma.productStock.findMany({
          select: {
            productOmieId: true,
            stockQuantity: true,
            minimumStock: true,
          },
        }),

        prisma.productStructure.findMany({
          select: {
            codProduto: true,
            hasStructure: true,
            _count: {
              select: {
                items: true,
              },
            },
          },
        }),

        prisma.omieProductionOrder.groupBy({
          by: ["productOmieId"],
          where: {
            active: true,
            completed: false,
            productOmieId: {
              not: null,
            },
          },
          _count: {
            _all: true,
          },
        }),

        prisma.salesOrderItem.findMany({
          where: {
            order: {
              stage: {
                in: ["20"],
              },
              isCanceled: false,
              isClosed: false,
            },
          },
          select: {
            productCode: true,
            quantity: true,
            order: {
              select: {
                stage: true,
              },
            },
          },
        }),

        prisma.productStructureItem.findMany({
          select: {
            codProdutoPai: true,
            codProdutoComponente: true,
          },
        }),
      ]);

    type ProductRow = (typeof products)[number];
    type StockRow = (typeof stocks)[number];
    type StructureRow = (typeof structures)[number];
    type ProductionOrderRow = (typeof productionOrders)[number];
    type Stage20OrderItemRow = (typeof stage20OrderItems)[number];

    this.logger.info("Stage20 sales-order items loaded", {
      totalItems: stage20OrderItems.length,
      etapas: [
        ...new Set(
          stage20OrderItems.map((item: Stage20OrderItemRow) => item.order.stage)
        ),
      ].slice(0, 10),
    });

    const stockMap = new Map<
      string,
      {
        stock: number;
        minimumStock: number;
      }
    >(
      stocks.map((stock: StockRow) => [
        stock.productOmieId,
        {
          stock: Number(stock.stockQuantity),
          minimumStock: Number(stock.minimumStock),
        },
      ])
    );

    const structureMap = new Map<
      string,
      {
        hasStructure: boolean;
        structureItemsCount: number;
      }
    >(
      structures.map((structure: StructureRow) => [
        structure.codProduto,
        {
          hasStructure: structure.hasStructure,
          structureItemsCount: structure._count.items,
        },
      ])
    );

    // Mapa: display code (omieCode) → internal ID (omieId) para lookup de estoque de componentes
    const displayCodeToOmieCodeMap = new Map<string, string>(
      products
        .filter((p): p is typeof p & { omieId: string } => !!p.omieId)
        .map((p) => [p.omieCode, p.omieId])
    );

    // Mapa de estoque dos componentes (por código do componente — internal ID)
    const componentStockMap = new Map<string, { stock: number; minimumStock: number }>(
      stocks.map((stock: StockRow) => [
        stock.productOmieId,
        {
          stock: Number(stock.stockQuantity),
          minimumStock: Number(stock.minimumStock),
        },
      ])
    );

    // Mapa: código do produto pai → lista de códigos dos componentes
    const structureComponentsMap = new Map<string, string[]>();
    for (const item of structureItems) {
      const components = structureComponentsMap.get(item.codProdutoPai) ?? [];
      components.push(item.codProdutoComponente);
      structureComponentsMap.set(item.codProdutoPai, components);
    }

    const openProductionOrderMap = new Map<string, number>(
      productionOrders
        .filter(
          (row: ProductionOrderRow): row is ProductionOrderRow & {
            productOmieId: string;
          } => typeof row.productOmieId === "string" && row.productOmieId.length > 0
        )
        .map((row) => [row.productOmieId, row._count._all])
    );

    const openSalesOrderStage20Map = new Map<string, number>();

    for (const item of stage20OrderItems) {
      if (!item.productCode) {
        continue;
      }

      const qty = Number(item.quantity ?? 0); // ✅ NOVO

      openSalesOrderStage20Map.set(
        item.productCode,
        (openSalesOrderStage20Map.get(item.productCode) ?? 0) + qty // ✅ soma quantidade
      );
    }


    const records: ProductCatalogProductionReadyRecord[] = products.map(
      (product: ProductRow) => {
        const raw = asRecord(product.rawPayload);

        const stockKey = product.omieId ?? product.omieCode;
        const stockEntry = stockMap.get(stockKey);
        const structureEntry = structureMap.get(product.omieCode);

        const stock = stockEntry?.stock ?? 0;
        const minimumStock = stockEntry?.minimumStock ?? 0;

        const salePrice = extractSalePrice(raw);
        const cost = extractCost(raw);
        const margin =
          salePrice != null && cost != null ? salePrice - cost : null;

        const hasStructure = structureEntry?.hasStructure ?? false;
        const structureItemsCount =
          structureEntry?.structureItemsCount ?? 0;

        let structureItemsBelowMinStock = 0;
        if (hasStructure) {
          const componentCodes = structureComponentsMap.get(product.omieCode) ?? [];
          for (const compCode of componentCodes) {
            const compInternalId = displayCodeToOmieCodeMap.get(compCode) ?? compCode;
            const compStock = componentStockMap.get(compInternalId);
            if (!compStock || compStock.stock < compStock.minimumStock) {
              structureItemsBelowMinStock++;
            }
          }
        }

        // Lookup robusta: tenta omieCode → rawPayload → omieId como fallback
        const openProductionOrderCount = (() => {
          const direct = openProductionOrderMap.get(product.omieCode ?? "");
          if (direct !== undefined) return direct;

          // Fallback 1: extrair código do rawPayload
          const raw = product.rawPayload
            ? asRecord(product.rawPayload)
            : null;
          if (raw) {
            const rawCode = OmieAdapter.extractProductCode(raw);
            if (rawCode) {
              const fromRaw = openProductionOrderMap.get(String(rawCode));
              if (fromRaw !== undefined) return fromRaw;
            }
          }

          // Fallback 2: testar com omieId
          if (product.omieId) {
            const fromId = openProductionOrderMap.get(product.omieId);
            if (fromId !== undefined) return fromId;
          }

          return 0;
        })();

        const openSalesOrderStage20Count =
          openSalesOrderStage20Map.get(product.omieCode) ?? 0;

        const belowMinimumStock = stock < minimumStock;
        const available = stock > 0 && stock >= minimumStock;

        return {
          productCode: product.omieCode,
          omieCode: stockKey,
          description: product.description,
          sku: product.sku ?? null,
          active: product.active,
          family: product.familyDescription ?? null,
          unit: extractUnit(raw),
          salePrice,
          cost,
          margin,
          stock,
          minimumStock,
          available,
          belowMinimumStock,
          hasStructure,
          structureItemsCount,
          structureItemsBelowMinStock,
          hasOpenProductionOrder: openProductionOrderCount > 0,
          openProductionOrderCount,
          hasOpenSalesOrderStage20: openSalesOrderStage20Count > 0,
          openSalesOrderStage20Count,
          lastSyncAt: product.lastSyncAt ?? null,
        };
      }
    );

    await this.readModelStore.replaceAll(records);

    this.logger.info("Production-ready read-model refresh completed", {
      records: records.length,
      withStage20Demand: records.filter(
        (record) => record.hasOpenSalesOrderStage20
      ).length,
    });

    return {
      ok: true,
      refreshedRecords: records.length,
    };
  }
}