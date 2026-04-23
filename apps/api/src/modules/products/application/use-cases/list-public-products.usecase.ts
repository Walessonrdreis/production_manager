// src/modules/products/application/use-cases/list-public-products.usecase.ts

import type {
  ListPublicProductsParams,
  ListPublicProductsResult,
} from "@/modules/products/application/dtos/public-product.dto";

export function createListPublicProductsUseCase(deps: {
  publicProductsRepo: {
    list: (params: {
      normalizedQ: string | null;
      activeOnly: boolean;
      page: number;
      pageSize: number;
      offset: number;
    }) => Promise<{ rows: any[]; total: number }>;
    toPublicProduct: (row: any) => any;
  };
}) {
  return {
    async execute(params: ListPublicProductsParams): Promise<ListPublicProductsResult> {
      const page = Number.isFinite(params.page as number) ? Math.max(1, Number(params.page)) : 1;
      const pageSizeRaw = Number.isFinite(params.pageSize as number) ? Number(params.pageSize) : 50;
      const pageSize = Math.min(Math.max(1, pageSizeRaw), 200);
      const activeOnly = params.activeOnly === false ? false : true;

      const normalizedQ = params.q?.trim() ? params.q.trim() : null;
      const offset = (page - 1) * pageSize;

      const { rows, total } = await deps.publicProductsRepo.list({
        normalizedQ,
        activeOnly,
        page,
        pageSize,
        offset,
      });

      const data = rows.map(deps.publicProductsRepo.toPublicProduct);

      return {
        data,
        meta: { page, pageSize, total },
      };
    },
  };
}