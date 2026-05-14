export interface ProductCatalogInfo {
  productDescription: string | null
  stockQuantity: number | null
  minimumStock: number | null
}

export interface ProductsCatalogPort {
  findByOmieCode(omieCode: string): Promise<ProductCatalogInfo | null>
}
