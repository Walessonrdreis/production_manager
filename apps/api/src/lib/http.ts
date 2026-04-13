import type { FastifyRequest } from 'fastify';

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

  if (meta && Object.keys(meta).length > 0) response.meta = meta;
  if (links && Object.keys(links).length > 0) response.links = links;

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
