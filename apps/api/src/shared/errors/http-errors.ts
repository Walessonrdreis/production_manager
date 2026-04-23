import { FastifyReply } from 'fastify';

export const ErrorCodes = {
  MISSING_DEFAULT_SECTOR: 'MISSING_DEFAULT_SECTOR',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  OMIE_ERROR: 'OMIE_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export interface ApiErrorPayload {
  code: ErrorCode;
  message: string;
  details?: any;
}

/**
 * Utilitário para enviar respostas de erro padronizadas.
 * 
 * @param reply FastifyReply instance
 * @param status HTTP Status Code (ex: 400, 404, 500)
 * @param code Código do erro do enum ErrorCodes
 * @param message Mensagem legível para o usuário ou log
 * @param details Detalhes adicionais opcionais (ex: campos de validação)
 */
export function sendError(
  reply: FastifyReply,
  status: number,
  code: ErrorCode,
  message: string,
  details?: any
) {
  const payload: ApiErrorPayload = {
    code,
    message,
    ...(details && { details }),
  };

  return reply.status(status).send(payload);
}