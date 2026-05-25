// File: apps/api/src/modules/client/infrastructure/integrations/omie/omie-client.gateway.ts

import {
  OmieClientGateway,
  OmieClientRaw,
} from "../../../application/ports/omie-client-gateway.port";

import { OmieClient } from "../../../../../../shared/integrations/omie/omie.client";

// Omie costuma retornar "clientes_cadastro" em listagens (e não "clientes").
// Vamos suportar ambos para não ficar frágil.
interface OmieListClientsResponse {
  clientes?: OmieClientRaw[];
  clientes_cadastro?: OmieClientRaw[];
  total_de_registros?: number;
  total_de_paginas?: number;
}

export class OmieClientGatewayImpl implements OmieClientGateway {
  constructor(private readonly omieClient: OmieClient) {}

  async listClients(page: number): Promise<OmieClientRaw[]> {
    const response = await this.omieClient.post<OmieListClientsResponse>(
      "/api/v1/geral/clientes/",
      {
        // ✅ Envelope padrão Omie v1
        call: "ListarClientes",
        param: [
          {
            pagina: page,
            registros_por_pagina: 50,
          },
        ],
      }
    );

    return response.clientes ?? response.clientes_cadastro ?? [];
  }
}