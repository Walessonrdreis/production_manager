// File: apps/api/src/modules/client/application/use-cases/sync-omie-clients.usecase.ts

import { ClientRepository } from '../ports/client-repository.port';
import {
  OmieClientGateway,
  OmieClientRaw,
} from '../ports/omie-client-gateway.port';
import { Client } from '../dtos/client.dto';

function parseOmieDate(
  date?: string,
  time?: string
): Date | null {
  if (!date) return null;

  // Omie format: dd/MM/yyyy
  const [day, month, year] = date.split('/').map(Number);

  if (!day || !month || !year) return null;

  if (time) {
    const [hour, minute, second] = time.split(':').map(Number);
    return new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
  }

  return new Date(year, month - 1, day);
}

export class SyncOmieClientsUseCase {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly omieGateway: OmieClientGateway
  ) {}

  async execute(): Promise<void> {
    let page = 1;

    while (true) {
      const rawClients: OmieClientRaw[] =
        await this.omieGateway.listClients(page);

      if (rawClients.length === 0) {
        break;
      }

      for (const raw of rawClients) {
        const client: Client = {
          omieClientCode: BigInt(raw.codigo_cliente_omie),

          legalName: raw.razao_social,
          tradeName: raw.nome_fantasia ?? null,
          document: raw.cnpj_cpf,

          personType:
            raw.pessoa_fisica === 'S'
              ? 'INDIVIDUAL'
              : 'COMPANY',

          email: raw.email ?? null,

          phone:
            raw.telefone1_ddd && raw.telefone1_numero
              ? `${raw.telefone1_ddd}${raw.telefone1_numero}`
              : null,

          isActive: raw.inativo !== 'S',
          isBlocked: raw.bloqueado === 'S',
          isBillingBlocked: raw.bloquear_faturamento === 'S',

          createdAtOmie: parseOmieDate(
            raw.info?.dInc,
            raw.info?.hInc
          ),

          updatedAtOmie: parseOmieDate(
            raw.info?.dAlt,
            raw.info?.hAlt
          ),
        };

        await this.clientRepository.upsert(client);
      }

      page++;
    }
  }
}