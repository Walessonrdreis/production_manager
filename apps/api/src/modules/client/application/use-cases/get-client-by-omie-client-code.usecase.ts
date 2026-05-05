// File: apps/api/src/modules/client/application/use-cases/get-client-by-omie-client-code.usecase.ts

import { ClientRepository } from '../ports/client-repository.port';
import { Client } from '../dtos/client.dto';

export class GetClientByOmieClientCodeUseCase {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(omieClientCode: bigint): Promise<Client | null> {
    return this.clientRepository.findByOmieClientCode(omieClientCode);
  }
}

