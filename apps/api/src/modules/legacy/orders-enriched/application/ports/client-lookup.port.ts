// File: apps/api/src/modules/orders-enriched/application/ports/client-lookup.port.ts

export type ClientSnapshot = {
  omieClientCode: bigint;
  legalName: string;
  tradeName: string | null;
  document: string;
};

export interface ClientLookup {
  findManyByOmieClientCodes(codes: bigint[]): Promise<ClientSnapshot[]>;
}