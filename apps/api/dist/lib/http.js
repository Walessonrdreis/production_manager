"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wantsLegacyResponse = wantsLegacyResponse;
exports.ok = ok;
exports.paginated = paginated;
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
    if (meta && Object.keys(meta).length > 0)
        response.meta = meta;
    if (links && Object.keys(links).length > 0)
        response.links = links;
    return response;
}
function paginated(data, meta, links) {
    const response = { data, meta };
    if (links && Object.keys(links).length > 0)
        response.links = links;
    return response;
}
