"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wantsLegacyResponse = wantsLegacyResponse;
exports.ok = ok;
exports.paginated = paginated;
exports.markDeprecated = markDeprecated;
function wantsLegacyResponse(request) {
    const headerValue = request.headers['x-response-format'];
    const normalized = typeof headerValue === 'string'
        ? headerValue
        : Array.isArray(headerValue)
            ? headerValue[0]
            : undefined;
    return normalized?.trim().toLowerCase() === 'legacy';
}
function ok(data, meta, links) {
    const response = { data };
    if (meta !== undefined)
        response.meta = meta;
    if (links !== undefined)
        response.links = links;
    return response;
}
function paginated(data, meta, links) {
    const response = { data, meta };
    if (links && Object.keys(links).length > 0)
        response.links = links;
    return response;
}
function markDeprecated(request, reply, legacyPath, replacementPath, sunsetIso) {
    reply.header('Deprecation', 'true');
    const resolvedSunset = sunsetIso !== undefined ? sunsetIso : (process.env.DEPRECATION_SUNSET ?? '2026-12-31T00:00:00.000Z');
    if (resolvedSunset) {
        reply.header('Sunset', resolvedSunset);
    }
    if (process.env.NODE_ENV === 'test')
        return;
    request.log?.warn?.({ legacyPath, replacementPath, requestId: request.requestId }, `deprecated endpoint used: ${legacyPath}`);
}
