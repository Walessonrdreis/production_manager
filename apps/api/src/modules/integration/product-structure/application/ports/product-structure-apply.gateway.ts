export type ApplyProductStructureItem = {
  componentCode: string;
  quantity: string | number;
  unit?: string;
  loss?: string | number;
};

export type ApplyProductStructureResult = {
  productCode: string;
  applied: boolean;
  rawPayload?: unknown;
};

export interface ProductStructureApplyGateway {
  apply(productCode: string, items: ApplyProductStructureItem[]): Promise<ApplyProductStructureResult>;
}