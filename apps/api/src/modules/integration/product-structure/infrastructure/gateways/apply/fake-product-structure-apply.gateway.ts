import type {
  ProductStructureApplyGateway,
  ApplyProductStructureItem,
  ApplyProductStructureResult,
} from "../../../application/ports/product-structure-apply.gateway";

export class FakeProductStructureApplyGateway implements ProductStructureApplyGateway {
  async apply(productCode: string, items: ApplyProductStructureItem[]): Promise<ApplyProductStructureResult> {
    return {
      productCode,
      applied: true,
      rawPayload: {
        fake: true,
        reason: "Fake apply ativo (no-write)",
        itemsCount: items.length,
      },
    };
  }
}