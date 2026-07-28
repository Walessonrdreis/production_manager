import type { FastifyReply, FastifyRequest } from "fastify";

export type HttpLinks = Record<string, string>;

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
} & Record<string, unknown>;

// ---------------------------------------------------------------------------
// Response format helpers
// ---------------------------------------------------------------------------
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

  if (links && Object.keys(links).length > 0) {
    response.links = links;
  }

  return response;
}

// ---------------------------------------------------------------------------
// Client preferences
// ---------------------------------------------------------------------------
export function wantsLegacyResponse(request: FastifyRequest): boolean {
  const headerValue = request.headers["x-response-format"];

  const normalized =
    typeof headerValue === "string"
      ? headerValue
      : Array.isArray(headerValue)
      ? headerValue[0]
      : undefined;

  return normalized?.trim().toLowerCase() === "legacy";
}

export function wantsPrettyResponse(request: FastifyRequest): boolean {
  const q = (request.query as any)?.pretty;
  if (String(q ?? "").trim().toLowerCase() === "true") return true;

  const headerValue = request.headers["x-pretty"];
  const normalized =
    typeof headerValue === "string"
      ? headerValue
      : Array.isArray(headerValue)
      ? headerValue[0]
      : undefined;

  return normalized?.trim().toLowerCase() === "true";
}

// ---------------------------------------------------------------------------
// Send helpers (HTTP)
// ---------------------------------------------------------------------------
export function sendOk<T>(
  request: FastifyRequest,
  reply: FastifyReply,
  data: T,
  meta?: Record<string, unknown>,
  links?: HttpLinks
) {
  const payload = ok(data, meta, links);

  if (wantsPrettyResponse(request)) {
    reply.type("application/json; charset=utf-8");
    return reply.send(JSON.stringify(payload, null, 2));
  }

  return reply.send(payload);
}

export function sendPaginated<T>(
  request: FastifyRequest,
  reply: FastifyReply,
  data: T[],
  meta: PaginationMeta,
  links?: HttpLinks
) {
  const payload = paginated(data, meta, links);

  if (wantsPrettyResponse(request)) {
    reply.type("application/json; charset=utf-8");
    return reply.send(JSON.stringify(payload, null, 2));
  }

  return reply.send(payload);
}

// ---------------------------------------------------------------------------
// Deprecation helpers
// ---------------------------------------------------------------------------
export function markDeprecated(
  request: FastifyRequest & { requestId?: string },
  reply: FastifyReply,
  legacyPath: string,
  replacementPath: string,
  sunsetIso?: string
) {
  reply.header("Deprecation", "true");

  const resolvedSunset =
    sunsetIso ??
    process.env.DEPRECATION_SUNSET ??
    "2026-12-31T00:00:00.000Z";

  reply.header("Sunset", resolvedSunset);

  if (process.env.NODE_ENV === "test") return;

  (request as any).log?.warn?.(
    {
      legacyPath,
      replacementPath,
      requestId: (request as any).requestId,
    },
    `deprecated endpoint used: ${legacyPath}`
  );
}