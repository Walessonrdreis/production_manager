import { getLogger } from "@/shared/logger";
import { RefreshProductCatalogProductionReadyUseCase } from "../../application/use-cases/refresh-product-catalog-production-ready.usecase";
import { ProductCatalogProductionReadyReadModelStore } from "../db/product-catalog-production-ready-read-model.store";

export class RefreshProductCatalogProductionReadyJob {
  private readonly logger = getLogger(
    "RefreshProductCatalogProductionReadyJob"
  );

  constructor(
    private readonly useCase = new RefreshProductCatalogProductionReadyUseCase(
      new ProductCatalogProductionReadyReadModelStore()
    )
  ) {}

  async execute() {
    this.logger.info("Starting production-ready job");

    const result = await this.useCase.execute();

    this.logger.info("Production-ready job completed", result);

    return result;
  }
}