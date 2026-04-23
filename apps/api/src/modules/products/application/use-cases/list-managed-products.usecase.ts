// src/modules/products/application/use-cases/list-managed-products.usecase.ts
export function createListManagedProductsUseCase(deps: {
  productRepo: { listManaged: () => Promise<any[]> };
}) {
  return {
    async execute() {
      return deps.productRepo.listManaged();
    },
  };
}
``