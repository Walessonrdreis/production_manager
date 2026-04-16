import type { FastifyReply, FastifyRequest } from 'fastify';

export type HttpLinks = Record<string, string>;

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
} & Record<string, unknown>;

export function wantsLegacyResponse(request: FastifyRequest): boolean {
  const headerValue = request.headers['x-response-format'];

  const normalized =
    typeof headerValue === 'string'
      ? headerValue
      : Array.isArray(headerValue)
        ? headerValue[0]
        : undefined;

  return normalized?.trim().toLowerCase() === 'legacy';
}

export function ok<T>(
  data: T,
  meta?: Record<string, unknown>,
  links?: HttpLinks
) {
  const response: {
    data: T;
    meta?: Record<string, unknown>;
    links?: HttpLinks;
  } = { data };

  if (meta !== undefined) response.meta = meta;
  if (links !== undefined) response.links = links;

  return response;
}

export function paginated<T>(
  data: T[],
  meta: PaginationMeta,
  links?: HttpLinks
) {
  const response: {
    data: T[];
    meta: PaginationMeta;
    links?: HttpLinks;
  } = { data, meta };

  if (links && Object.keys(links).length > 0) response.links = links;

  return response;
}

export function markDeprecated(
  request: FastifyRequest & { requestId?: string },
  reply: FastifyReply,
  legacyPath: string,
  replacementPath: string,
  sunsetIso?: string
) {
  reply.header('Deprecation', 'true');

  const resolvedSunset =
    sunsetIso !== undefined ? sunsetIso : (process.env.DEPRECATION_SUNSET ?? '2026-12-31T00:00:00.000Z');

  if (resolvedSunset) {
    reply.header('Sunset', resolvedSunset);
  }

  if (process.env.NODE_ENV === 'test') return;

  (request as any).log?.warn?.(
    { legacyPath, replacementPath, requestId: (request as any).requestId },
    `deprecated endpoint used: ${legacyPath}`
  );
}
