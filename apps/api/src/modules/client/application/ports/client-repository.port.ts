import { Client } from '../dtos/client.dto';

export interface ClientRepository {
  upsert(client: Client): Promise<void>;
  findByOmieClientCode(
    omieClientCode: bigint
  ): Promise<Client | null>;
}