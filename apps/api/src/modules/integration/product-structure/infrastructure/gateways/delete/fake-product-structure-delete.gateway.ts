import type {
  ProductStructureDeleteGateway,
  DeleteProductStructureResult,
} from "../../../application/ports/product-structure-delete.gateway";

export class FakeProductStructureDeleteGateway implements ProductStructureDeleteGateway {
  async delete(productCode: string): Promise<DeleteProductStructureResult> {
    return {
      productCode,
      deleted: true,
      rawPayload: { fake: true, reason: "Fake delete ativo (no-write)" },
    };
  }
}