export type DeleteProductStructureResult = {
  productCode: string;
  deleted: boolean;
  rawPayload?: unknown;
};

export interface ProductStructureDeleteGateway {
  delete(productCode: string): Promise<DeleteProductStructureResult>;
}