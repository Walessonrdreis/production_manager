export type ProductionOrderQueryGateway = {
  getByExternalRequestId(externalRequestId: string): Promise<any | null>;
  listByProductId?(productId: string): Promise<any[]>;
}