"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.paginated = paginated;
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
