// src/modules/products/application/dtos/public-product.dto.ts

export type PublicProduct = {
  omieCode: string;
  description: string;
  sku?: string | null;
  family?: string | null;
  active: boolean;
  stockQuantity: string;
  minimumStock: string;
  stockUpdatedAt: string | null;
};

export type ListPublicProductsParams = {
  q?: string | null;
  page?: number;
  pageSize?: number;
  activeOnly?: boolean;
};

export type PublicProductsMeta = {
  page: number;
  pageSize: number;
  total: number;
};

export type ListPublicProductsResult = {
  data: PublicProduct[];
  meta: PublicProductsMeta;
};