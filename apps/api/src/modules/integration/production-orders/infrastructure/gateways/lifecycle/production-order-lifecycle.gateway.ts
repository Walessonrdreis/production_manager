export type ProductionOrderLifecycleGateway = {
  confirm(externalRequestId: string): Promise<any | null>;
  fail(
    externalRequestId: string,
    err: { code: string; message: string }
  ): Promise<any | null>;
};