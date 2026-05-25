import { Client } from '../dtos/client.dto';

export type ListClientsParams = {
  page: number;
  pageSize: number;
  q?: string;
};

export type ListClientsResult = {
  data: Client[];
  total: number;
};

export interface ClientRepository {
  upsert(client: Client): Promise<void>;
  findByOmieClientCode(
    omieClientCode: bigint
  ): Promise<Client | null>;

 list(params: ListClientsParams): Promise<ListClientsResult>;
}