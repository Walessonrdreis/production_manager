// File: apps/api/src/modules/client/infrastructure/integrations/omie/omie-client.gateway.ts

import {
  OmieClientGateway,
  OmieClientRaw,
} from '../../../application/ports/omie-client-gateway.port';

import { OmieClient } from '../../../../../shared/integrations/omie/omie.client';

interface OmieListClientsResponse {
  clientes?: OmieClientRaw[];
  total_de_registros?: number;
  total_de_paginas?: number;
}

export class OmieClientGatewayImpl implements OmieClientGateway {
  constructor(private readonly omieClient: OmieClient) {}

  async listClients(page: number): Promise<OmieClientRaw[]> {
    const response = await this.omieClient.post<OmieListClientsResponse>(
      '/geral/clientes/',
      {
        pagina: page,
        registros_por_pagina: 50,
      }
    );

    return response.clientes ?? [];
  }
}
``