// File: apps/api/src/modules/client/presentation/http/client.schemas.ts

export const getClientByOmieClientCodeSchema = {
  tags: ['client'],
  summary: 'Get client by Omie client code (local DB)',
  params: {
    type: 'object',
    required: ['omieClientCode'],
    properties: {
      omieClientCode: { type: 'string', pattern: '^\\d+$' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        omieClientCode: { type: 'string' }, // bigint -> string (JSON-safe)
        legalName: { type: 'string' },
        tradeName: { type: ['string', 'null'] },
        document: { type: 'string' },
        personType: { type: 'string', enum: ['INDIVIDUAL', 'COMPANY'] },
        email: { type: ['string', 'null'] },
        phone: { type: ['string', 'null'] },
        isActive: { type: 'boolean' },
        isBlocked: { type: 'boolean' },
        isBillingBlocked: { type: 'boolean' },
        createdAtOmie: { type: ['string', 'null'] },
        updatedAtOmie: { type: ['string', 'null'] },
      },
    },
    400: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    404: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
} as const;